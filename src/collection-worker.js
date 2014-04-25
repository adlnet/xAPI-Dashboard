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

var window = {};
importScripts('collection.js');
var Collection = window.ADL.Collection;


/*
 * De/serializer functions to facilitate efficient message passing
 */

function serialize(obj){
	var json = JSON.stringify(obj);
	console.log('Serializing '+json.length*2+' bytes');

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
	for(var i=0; i<intBuffer.length; i++)
		json += String.fromCharCode(intBuffer[i]);
	
	return JSON.parse(json);
}


/*
 * Core message router figures out whether to process a message immediately or queue it
 */

onmessage = function(event)
{
	var data = deserialize(event.data);
	console.log('Received '+Date.now());

	switch(data[0]){

	// receive data from the API
	case 'datapush':
		if( data[1] )
			dataStack.push(data[1]);
		else
			dataStack.push( dataStack[dataStack.length-1] );
		break;

	// request to send result data back
	case 'exec':
		processCommandQueue();
		var result = serialize(['exec', dataStack.pop()]);
		postMessage(result, [result]);
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

	/*
	 * Parse tree format
	[
		['eq','verb.id','passed'],
		[
			['eq','verb.id','failed'],
			['geq','result.score.raw',50]
		]
	]

	 * Invocation format
	stmts.where('verb.id = passed or verb.id = failed and result.score.raw >= 50');

	 * Query grammar:
	 *   value := \b( [0-9]+(.[0-9]+)? | ("|').*\1 | null )\b
	 *   xpath := [A-Za-z0-9]+(.[A-za-z0-9]+)*
	 *   cond := <xpath> (=|!=|>|<|>=|<=) <value> | 'isdistinct(' <xpath> ')'
	 *   andGrp := <cond> 'and' <expr> | <cond>
	 *   orGrp := <andGrp> 'or' <expr> | <andGrp>
	 *   expr := '(' <expr> ')' | <orGrp>
	 */

function where(query)
{
	// no-op if no query
	if( !query ) return;

	function expr(str){
		var match = /^\s*\((.*)\)\s*$/.exec(str);
		if(match){
			return expr(match[1]);
		}
		else {
			return orGrp(str);
		}
	}

	function orGrp(str){
		
	}

	function andGrp(str){
		
	}

	function cond(str){
		
	}
}
