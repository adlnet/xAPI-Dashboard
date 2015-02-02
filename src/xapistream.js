"use strict";

(function(ADL)
{

	/**
	 * Processor - Receive input, process data, pass along output
	 */

	function Processor(proc, initState)
	{
		// generate a random unique identifier
		this.id = Math.round(Math.random() * 0xfffffff).toString(16);
		while( Processor._procmap[this.id] )
			this.id = Math.round(Math.random() * 0xfffffff).toString(16);
		
		// register instance
		Processor._procmap[this.id] = this;

		// save actual processor function
		this.proc = proc.bind(this);

		this.state = initState || {};
	}

	Processor.prototype.toString = function()
	{
		return 'xapistream_'+this.id;
	}

	Processor.prototype.process = function(evt)
	{
		var data = null;
		if( evt instanceof Event )
			data = evt.detail;
		else {
			data = evt;
			evt = null;
		}

		var procdata = this.proc(data, this.state, evt);
		if(procdata){
			var evt = new CustomEvent(this.toString()+'_data', {detail: procdata});
			window.dispatchEvent(evt);
		}
	}

	Processor.prototype.then = function(consumer)
	{
		for(var i=0; i<arguments.length; i++){
			arguments[i].subscribe(this);
		}
		return consumer;
	}

	Processor.prototype.subscribe = function(producer)
	{
		for(var i=0; i<arguments.length; i++){
			window.addEventListener( arguments[i].toString()+'_data', this.process.bind(this) );
		}
		return arguments[0];
	}


	Processor._procmap = {};




	function ConsoleLogger(prefix)
	{
		return new Processor(function(data)
		{
			var outputString = '';
			if( prefix )
				outputString = prefix + data;
			else
				outputString = data;

			console.log(outputString);

			return outputString;
		});
	}


	ADL.XAPIStream = {
		'Processor': Processor,
		'ConsoleLogger': ConsoleLogger
	};

})(window.ADL = window.ADL || {});
