
onmessage = function(event)
{
	postMessage('Did you say '+event.data+'?');
};
