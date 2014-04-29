/******************************************************
 * The hard worker of the Collection class
 * Processes the statements given to it by the synchronous wrapper
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
	//var data = event.data;

	switch(data[0]){

	// receive data from the API
	case 'datapush':
		if( data[1] )
			dataStack.push(data[1]);
		else
			dataStack.push( dataStack[dataStack.length-1].slice() );
		break;

	// request to send result data back
	case 'exec':
		//try {
			processCommandQueue();
			var result = serialize(['exec', dataStack.pop()]);
			postMessage(result, [result]);
		/*}
		catch(e){
			postMessage(serialize(['exec', 'error']));
			throw e;
		}*/

		break;

	case 'save':
		processCommandQueue();
		dataStack.push( dataStack[dataStack.length-1].slice() );
		break;

	case 'where':
	case 'select':
	case 'slice':
	case 'orderBy':
	case 'groupBy':
		commandQueue.push( data );
		break;
	
	default:
		console.error('Command not understood: '+data[0]);
	}
};


/*
 * The core operator pops from the command queue until there aren't any more
 */

function processCommandQueue()
{
	while( commandQueue.length > 0 )
	{
		var command = commandQueue.pop();

		if( command[0] === 'where' )
			where(command[1]);
		else if( command[0] === 'select' )
			select(command[1]);
		else if( command[0] === 'slice' )
			slice(command[1],command[2]);
		else if( command[0] === 'orderBy' )
			orderBy(command[1],command[2]);
		else if( command[0] === 'groupBy' )
			groupBy(command[1],command[2]);
	}
}

function where(query)
{
	// no-op if no query
	if( !query ) return;

	var t = Date.now();
	var parse = parseWhere(query);
	console.log(JSON.stringify(parse));
	if( !parse ){
		console.error('Invalid where expression: '+query);
		return;
	}

	var data = dataStack.pop();
	for(var i=0; i<data.length; i++)
	{
		if( !evalConditions(parse, data[i]) ){
			data.splice(i--,1);
		}
	}

	dataStack.push(data);
	console.log('Where evaluated in '+(Date.now()-t)+'ms');
}

function select(selector)
{
	var cols = [];
	var xpaths = selector.split(',');
	for( var i=0; i<xpaths.length; i++ )
	{
		var parts = xpaths[i].split(' as ');
		cols.push({
			'xpath': parts[0].trim(),
			'alias': parts[1] ? parts[1].trim() : null
		});
	}

	var data = dataStack.pop();
	var ret = [];
	for(var i=0; i<data.length; i++)
	{
		var row = {};
		for(var j=0; j<cols.length; j++){
			if(cols[j].alias)
				row[cols[j].alias] = xpath(cols[j].xpath, data[i]);
			else
				row[cols[j].xpath] = xpath(cols[j].xpath, data[i]);
		}
		ret.push(row);
	}

	dataStack.push(ret);
}


function slice(start,end)
{
	if(end === null)
		end = undefined;
	dataStack.push( dataStack.pop().slice(start,end) );
}

function orderBy(path, direction)
{
	var data = dataStack.pop();

	if(direction === 'descending')
		direction = -1;
	else
		direction = 1;

	data.sort(function(a,b){
		var aVal = xpath(path,a), bVal = xpath(path,b);
		if(aVal && !bVal)
			return 1 * direction;
		else if(!aVal && bVal)
			return -1 * direction;
		else if(aVal == bVal)
			return 0;
		else
			return (aVal<bVal ? -1 : 1) * direction;
	});

	dataStack.push(data);
}


function genRange(start, end, i)
{
	var increment = function(x,i){ 
		i = i > 0 ? i : 1;
		return x+i; 
	},
	test = function(cur, end){ return cur < end; };

	if( start instanceof Date ){
		i = i > 0 ? i : Collection.day;
		increment = function(x,i){ return new Date( x.getTime()+i ); };
	}
	else if( typeof(start) === 'string' ){
		start = start.charAt(0).toLowerCase();

		if( !end || end.charAt(0).toLowerCase() === 'z' )
			end = '{';
		else
			end = end.charAt(0).toLowerCase();

		i = i > 0 ? i : 1;
		increment = function(x,i){ return String.fromCharCode( x.charCodeAt(0)+i ); };
	}

	var groupArr = [];
	while( test(start, end) ){
		groupArr.push(start);
		start = increment(start,i);
	}
	groupArr.push(end);
	return groupArr;
};


function groupBy(path, range)
{
	if( !range )
		range = undefined;
	else
		range = genRange.apply(null,range);

	var data = dataStack.pop();
	var ret = [];
	if(!range)
	{
		var groups = {};
		for(var i=0; i<data.length; i++)
		{
			var groupVal = xpath(path,data[i]);
			if( !groups[groupVal] )
				groups[groupVal] = [data[i]];
			else
				groups[groupVal].push(data[i]);
		}

		for(var i in groups){
			ret.push({
				'group': i,
				'data': groups[i]
			});
		}
	}
	else
	{
		for(var i=0; i<range.length-1; i++){
			ret.push({
				'groupStart': range[i],
				'groupEnd': range[i+1],
				'data': []
			});
		}

		for(var i=0; i<data.length; i++)
		{
			var groupVal = xpath(path,data[i]);
			if( groupVal.toLowerCase )
				groupVal = groupVal.toLowerCase();

			for(var j=0; j<ret.length; j++){
				if( ret[j].groupStart <= groupVal && groupVal < ret[j].groupEnd )
					ret[j].data.push(data[i]);
			}
		}
	}

	dataStack.push(ret);
}

