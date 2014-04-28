/******************************************************
 * The hard worker of the Collection class
 * Processes the statements given to it by the synchronous wrapper
 ******************************************************/

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
		console.log('Rcvd '+Date.now());
		if( data[1] )
			dataStack.push(data[1]);
		else
			dataStack.push( dataStack[dataStack.length-1].slice() );
		break;

	// request to send result data back
	case 'exec':
		processCommandQueue();
		var result = serialize(['exec', dataStack.pop()]);
		postMessage(result, [result]);
		break;

	case 'save':
		processCommandQueue();
		dataStack.push( dataStack[dataStack.length-1].slice() );
		break;

	case 'where':
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
	}
}

function where(query)
{
	// no-op if no query
	if( !query ) return;

	var parse = parseWhere(query);
	console.log(JSON.stringify(parse));
	if( !parse ){
		console.error('Invalid where expression');
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
}
