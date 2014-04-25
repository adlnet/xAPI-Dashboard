/******************************************************
 * The hard worker of the Collection class
 * Processes the statements given to it by the synchronous wrapper
 ******************************************************/


var dataStack = [];
var commandStack = [];



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


onmessage = function(event)
{
	var data = deserialize(event.data);
	console.log('Received '+Date.now());

	switch(data[0]){
	case 'datapush':
		dataStack.push(data[1]);
		break;
	case 'datapop':
		var result = dataStack.pop();
		postMessage(result, []);
		break;
	}
};
