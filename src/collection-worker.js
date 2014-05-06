/******************************************************
 * The hard worker of the Collection class
 * Processes the statements given to it by the
 * synchronous wrapper
 *
 * The worker is essentially a state machine. It queues
 * commands given to it until it receives the 'exec'
 * message. Each command operates on a data stack,
 * popping an entry off, applying its operation, and
 * pushing a new entry back.
 *
 * Once the command queue is empty, 'exec' sends back
 * the top of the stack. (probably the only data on the
 * stack)
 ******************************************************/
"use strict";

// stores the data frames
var dataStack = [];

// stores the commands
var commandQueue = [];
// it's a queue not a stack, so pop from the front
commandQueue.pop = function(){
	return this.splice(0,1)[0];
}

/*var window = {};
importScripts('collection.js');
var Collection = window.ADL.Collection;*/

importScripts('collection-where.js');

// poly-fill array checking
if(!Array.isArray){
	Array.isArray = function(obj){
		return obj.length >= 0 && !obj['length'];
	}
}


/*
 * De/serializer functions to facilitate efficient message passing
 */

function serialize(obj){
	var json = JSON.stringify(obj);
	var buf = new ArrayBuffer(2*json.length);
	var view = new Uint16Array(buf);
	for(var offset=0; offset<json.length; offset++){
		view[offset] = json.charCodeAt(offset);
	}
	return buf;
}

function deserialize(buffer){
	var json = '';
	var intBuffer = new Uint16Array(buffer);
	for(var i=0; i<intBuffer.length; i+=1000)
		json += String.fromCharCode.apply(null, intBuffer.subarray(i,i+1000));
	return JSON.parse(json);
}


/*
 * Core message router figures out whether to process a message immediately or queue it
 */

onmessage = function(event)
{
	var data = deserialize(event.data);

	switch(data[0]){

	// receive data from the API
	case 'datapush':
		if( data[1] )
			dataStack.push(data[1]);
		else
			dataStack.push( dataStack[dataStack.length-1].slice() );
		break;

	// receive data from API, but append to top of stack
	case 'append':
		var topElem = dataStack.pop();
		topElem.push.apply(topElem, data[1]);
		dataStack.push(topElem);
		break;

	// request to send result data back
	case 'exec':
		//try {
			processCommandQueue();
			var result = serialize([dataStack.pop()]);
			postMessage(result, [result]);
		/*}
		catch(e){
			postMessage(serialize(['exec', 'error']));
			throw e;
		}*/

		break;

	// all other commands are deferred until 'exec' or 'save' runs
	case 'save':
	case 'newbranch':
	case 'join':
	case 'where':
	case 'select':
	case 'slice':
	case 'orderBy':
	case 'groupBy':
	case 'count':
	case 'sum':
	case 'average':
	case 'min':
	case 'max':
		commandQueue.push( data );
		break;
	
	default:
		console.error('Command not understood: '+data[0]);
	}
};


/*
 * The core operator pops from the command queue until there aren't any more
 */

// used to indicate a branch
var branchRoot = null;

function processCommandQueue()
{
	while( commandQueue.length > 0 )
	{
		var command = commandQueue.pop();

		switch(command[0]){

			// save data state for joining later
			case 'newbranch':

				// save root data location on first branch
				if( branchRoot === null ){
					branchRoot = dataStack.length-1;
				}
				// duplicate root data to top of stack for branch to process
				dataStack.push( dataStack[branchRoot].slice() );
				break;

			// performs a left join on all data entries after root data
			// with the first branch being left-most
			case 'join':

				// ignore join command if not preceeded by a 'newbranch'
				if(branchRoot === null || !command[1]){
					console.warn('Cannot JOIN without an ON field, or before a BRANCH');
					continue;
				}

				// merge top of stack with index until root data reached
				var index = {};
				while(dataStack.length > branchRoot+1){
					merge(index, dataStack.pop(), command[1]);
				}

				// flatten index
				var ret = [];
				for(var i in index){
					ret.push( index[i] );
				}

				// return merged branches
				dataStack[branchRoot] = ret;
				branchRoot = null;
				break;

			// duplicate top of data stack for later retrieval
			case 'save':
				dataStack.push( dataStack[dataStack.length-1].slice() );
				break;

			// filters do not change the format of the data (except for select)
			case 'where':
				where(command[1]); break;
			case 'slice':
				slice(command[1],command[2]); break;
			case 'orderBy':
				orderBy(command[1],command[2]); break;

			// select particular fields from data entries
			case 'select':
				select(command[1]); break;

			// group statements by value or range
			case 'groupBy':
				if( command[2] )
					groupByRange(command[1],command[2]);
				else
					groupBy(command[1]);
				break;
	

			// consume grouped data and produce aggregations
			// DISCARDS LOTS OF DATA!
			case 'count':
				count(); break;
			case 'sum':
				sum(command[1]); break;
			case 'average':
				average(command[1]); break;
			case 'min':
				min(command[1]); break;
			case 'max':
				max(command[1]); break;
		}
	}
}

/*
 * Used for 'join', adds a dataset to an index
 */
function merge(index, set, on)
{
	// loop over all entries in dataset
	for(var i=0; i<set.length; i++)
	{
		var key = xpath(on, set[i]);

		// do not add to index if the entry doesn't have the 'on' field
		if(!key){
			continue;
		}

		// add a new entry if the index doesn't have that value
		else if( !index[key] ){
			index[key] = set[i];
		}

		// a similar dataset is already in the index
		else
		{
			// merge data; loop over properties of set data
			for(var j in set[i]){
				// and add properties not in the index yet
				if( !index[key][j] ){
					index[key][j] = set[i][j];
				}
			}
		}
	}
}

/*
 * Filter out data entries not matching the query expression
 * uses an sql-like syntax. see collection-where.js for full grammar
 */
function where(query)
{
	// no-op if no query
	if( !query ) return;

	// parse the query, abort filter if query didn't parse
	var parse = parseWhere(query);
	if( !parse ){
		console.error('Invalid where expression: '+query);
		return;
	}

	// for each entry in the dataset
	var data = dataStack.pop();
	for(var i=0; i<data.length; i++)
	{
		// remove from dataset if it doesn't match the conditions
		if( !evalConditions(parse, data[i]) ){
			data.splice(i--,1);
		}
	}

	// return the filtered data
	dataStack.push(data);
}

/*
 * Pick out certain fields from each entry in the dataset
 * syntax of selector := xpath ['as' alias] [',' xpath ['as' alias]]*
 */
function select(selector)
{
	// parse selector

	// for each field to be selected
	var cols = [];
	var xpaths = selector.split(',');
	for( var i=0; i<xpaths.length; i++ )
	{
		// break into an xpath and an optional alias
		var parts = xpaths[i].split(' as ');
		cols.push({
			'xpath': parts[0].trim(),
			'alias': parts[1] ? parts[1].trim() : null
		});
	}

	// pick out selected fields

	// loop over entries in dataset
	var data = dataStack.pop();
	var ret = [];
	for(var i=0; i<data.length; i++)
	{
		var row = {};
		// for each selection field
		for(var j=0; j<cols.length; j++){
			// save as old name, or alias if provided
			if(cols[j].alias)
				row[cols[j].alias] = xpath(cols[j].xpath, data[i]);
			else
				row[cols[j].xpath] = xpath(cols[j].xpath, data[i]);
		}
		ret.push(row);
	}

	// return the selection
	dataStack.push(ret);
}

/*
 * Exactly what it sounds like
 * Return some continuous subset of the data
 */
function slice(start,end)
{
	if(end === null)
		end = undefined;
	dataStack.push( dataStack.pop().slice(start,end) );
}

/*
 * Sort dataset by given path
 */
function orderBy(path, direction)
{
	var data = dataStack.pop();

	// figure out ascending or descending
	if(direction === 'descending' || direction === 'desc')
		direction = -1;
	else
		direction = 1;

	data.sort(function(a,b){
		var aVal = xpath(path,a), bVal = xpath(path,b);

		// any value is greater than null
		if(aVal!=null && bVal==null)
			return 1 * direction;
		else if(aVal==null && bVal!=null)
			return -1 * direction;

		// check equivalence
		else if(aVal == bVal)
			return 0;

		// all else fails, do a simple comparison
		else
			return (aVal<bVal ? -1 : 1) * direction;
	});

	dataStack.push(data);
}

/*
 * Group with continuous values
 */
function groupByRange(path, range)
{
	/*
	 * Generate range dividers
	 */

	// determine type of values
	var start = range[0], end = range[1], increment = range[2];
	var value, next;
	// values are date strings
	if( typeof(start) === 'string' && typeof(end) === 'string' && Date.parse(start) && Date.parse(end) ){
		value = function(x){
			return Date.parse(x);
		};
		next = function(x,i){
			var d = new Date(Date.parse(x)+i);
			return d.toISOString();
		};
	}
	// values are generic strings
	else if( typeof(start) === 'string' && typeof(end) === 'string' ){
		value = function(x){
			return x.charAt(0).toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
		};
		next = function(x,i){
			return String.fromCharCode(x.charAt(0).toLowerCase().charCodeAt(0) + i);
		};
	}
	// all other types
	else {
		value = function(x){
			return x;
		};
		next = function(x,i){
			return x+i;
		};
	}

	// make sure bounds are reachable
	var bounds = [];
	if( (value(end)-value(start))*increment <= 0 ){
		console.error('Group range is open, cannot generate groups!');
		console.log(JSON.stringify(range));
		bounds = [start,end];
	}
	// flip bounds if end < start
	else if( value(start) > value(end) ){
		groupByRange(path, [end,start,-increment]);
		dataStack.push( dataStack.pop().reverse() );
		return;
	}
	else {
		// create boundary array
		for(var i=start; value(i)<value(end); i=next(i,increment)){
			bounds.push(i);
		}
		bounds.push(end);
	}

	/*
	 * Group by range
	 */

	// create groups by boundary
	var ret = [];
	for(var i=0; i<bounds.length-1; i++){
		ret.push({
			'group': bounds[i]+'-'+bounds[i+1],
			'groupStart': bounds[i],
			'groupEnd': bounds[i+1],
			'data': []
		});
	}

	// divide up data by group
	var data = dataStack.pop();
	for(var i=0; i<data.length; i++)
	{
		var groupVal = value(xpath(path,data[i]));
		for(var j=0; j<ret.length; j++){
			if( value(ret[j].groupStart) <= groupVal && (
				groupVal < value(ret[j].groupEnd) || j==ret.length-1 && groupVal==value(ret[j].groupEnd)
			) )
				ret[j].data.push(data[i]);
		}
	}

	dataStack.push(ret);
}

/*
 * Group with discrete values
 */
function groupBy(path)
{
	// add each data entry to its respective group
	var data = dataStack.pop();
	var groups = {};
	for(var i=0; i<data.length; i++)
	{
		var groupVal = xpath(path,data[i]);
		if( !groups[groupVal] )
			groups[groupVal] = [data[i]];
		else
			groups[groupVal].push(data[i]);
	}

	// flatten groups
	var ret = [];
	for(var i in groups){
		ret.push({
			'group': i,
			'data': groups[i]
		});
	}

	dataStack.push(ret);
}

/*
 * Take grouped data and return number of entries in each group
 */
function count()
{
	var data = dataStack.pop();
	if( !data ) return;

	// if the data isn't grouped, treat as one large group
	var ret = [];
	if(!data[0] || !data[0].group || !data[0].data){
		data = [{
			'group': 'all',
			'data': data
		}];
	}

	// loop over each group
	for(var i=0; i<data.length; i++)
	{
		// copy group id fields to new object, add count and sample
		ret.push({
			group: data[i].group,
			groupStart: data[i].groupStart,
			groupEnd: data[i].groupEnd,
			count: data[i].data.length,
			sample: data[i].data[0]
		});
	}
		
	dataStack.push(ret);
}

/*
 * Take grouped data and return total of values of entries in each group
 */
function sum(path)
{
	var data = dataStack.pop();
	if( !data || !path ) return;

	// 
	// if the data isn't grouped, treat as one large group
	var ret = [];
	if(!data[0] || !data[0].group || !data[0].data){
		data = [{
			'group': 'all',
			'data': data
		}];
	}

	// loop over each group
	for(var i=0; i<data.length; i++)
	{
		var sum = 0;
		for(var j=0; j<data[i].data.length; j++){
			sum += xpath(path, data[i].data[j]);
		}

		// copy group id fields to new object, add sum and sample
		ret.push({
			group: data[i].group,
			groupStart: data[i].groupStart,
			groupEnd: data[i].groupEnd,
			sum: sum,
			sample: data[i].data[0]
		});
	}

	dataStack.push(ret);
}

/*
 * Take grouped data and return average of values of entries in each group
 */
function average(path)
{
	var data = dataStack.pop();
	if( !data || !path ) return;

	// if the data isn't grouped, treat as one large group
	var ret = [];
	if(!data[0] || !data[0].group || !data[0].data){
		data = [{
			'group': 'all',
			'data': data
		}];
	}

	// loop over each group
	for(var i=0; i<data.length; i++)
	{
		var sum = 0;
		for(var j=0; j<data[i].data.length; j++){
			sum += xpath(path, data[i].data[j]);
		}

		// copy group id fields to new object, add average and sample
		ret.push({
			group: data[i].group,
			groupStart: data[i].groupStart,
			groupEnd: data[i].groupEnd,
			average: sum/data[i].data.length,
			sample: data[i].data[0]
		});
	}

	dataStack.push(ret);
}

/*
 * Take grouped data and return minimum of values of entries in each group
 */
function min(path)
{
	var data = dataStack.pop();
	if( !data || !path ) return;

	// if the data isn't grouped, treat as one large group
	var ret = [];
	if(!data[0] || !data[0].group || !data[0].data){
		data = [{
			'group': 'all',
			'data': data
		}];
	}

	// loop over each group
	for(var i=0; i<data.length; i++)
	{
		var min = Infinity;
		for(var j=0; j<data[i].data.length; j++){
			min = Math.min(min, xpath(path, data[i].data[j]));
		}

		// copy group id fields to new object, add min and sample
		ret.push({
			group: data[i].group,
			groupStart: data[i].groupStart,
			groupEnd: data[i].groupEnd,
			min: min,
			sample: data[i].data[0]
		});
	}

	dataStack.push(ret);
}

/*
 * Take grouped data and return maximum of values of entries in each group
 */
function max(path)
{
	var data = dataStack.pop();
	if( !data || !path ) return;

	// if the data isn't grouped, treat as one large group
	var ret = [];
	if(!data[0] || !data[0].group || !data[0].data){
		data = [{
			'group': 'all',
			'data': data
		}];
	}

	// loop over each group
	for(var i=0; i<data.length; i++)
	{
		var max = -Infinity;
		for(var j=0; j<data[i].data.length; j++){
			max = Math.max(max, xpath(path, data[i].data[j]));
		}

		// copy group id fields to new object, add max and sample
		ret.push({
			group: data[i].group,
			groupStart: data[i].groupStart,
			groupEnd: data[i].groupEnd,
			max: max,
			sample: data[i].data[0]
		});
	}

	dataStack.push(ret);
}

