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


	/********************************************
	 * XPath evaluation functions
	 ********************************************/


	/*
	 * Retrieves some deep value at path from an object
	 */
	function getVal(path,obj)
	{
		// if nothing to search, return null
		if(obj === undefined){
			return null;
		}

		// if no descent, just return object
		else if(path.length === 0){
			return obj;
		}

		else {

			// break xpath into individual keys
			var parts;
			if(Array.isArray(path)){
				parts = path;
			}
			else {
				parts = path.split('.');
				for(var i=0; i<parts.length;){
					if(parts[i].slice(-1) === '\\')
						parts.splice(i, 2, parts[i].slice(0,-1)+'.'+parts[i+1]);
					else
						i++;
				}
			}

			// fetch deep path
			var scoped = parts[0], rest = parts.slice(1);
			if( scoped === '*' )
			{
				var ret = [], keys = [];

				if(Array.isArray(obj)){
					for(var i=0; i<obj.length; i++) keys.push(i);
				}
				else {
					keys = Object.keys(obj);
				}

				for(var i=0; i<keys.length; i++){
					var keyout = getVal(rest, obj[keys[i]]);
					if(Array.isArray(keyout))
						ret.push.apply(ret,keyout);
					else
						ret.push(keyout);
				}
				
				return ret;
			}
			else {
				return getVal(rest, obj[scoped]);
			}
		}
	}

	/*
	 * Set some deep value in an object
	 */
	function setVal(obj,path,value)
	{
		// break xpath into individual keys
		var parts;
		if(Array.isArray(path)){
			parts = path;
		}
		else {
			parts = path.split('.');
			for(var i=0; i<parts.length;){
				if(parts[i].slice(-1) === '\\')
					parts.splice(i, 2, parts[i].slice(0,-1)+'.'+parts[i+1]);
				else
					i++;
			}
		}

		if(!obj){
			obj = {};
		}

		if(parts.length === 1){
			obj[parts[0]] = value;
		}
		else {
			if(obj[parts[0]] !== undefined)
				obj[parts[0]] = setVal(obj[parts[0]], parts.slice(1), value);
			else
				obj[parts[0]] = setVal({}, parts.slice(1), value);
		}

		return obj;
	}


	/****************************************************************
	 * Standard processor factories
	 ****************************************************************/

	// simply print out the input
	// @args
	// 	prefix (str): a string to be prefixed to the console output
	//
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

	// remove unwanted items from input stream
	// @args
	// 	selector (function(data,[index],[array])):
	// 		if selector returns true for item, will be in output
	//
	function Filter(selector)
	{
		return new Processor(function(data)
		{
			if( Array.isArray(data) )
			{
				var ret = [];
				for( var i=0; i<data.length; i++ ){
					if( selector(data[i], i, data) ){
						ret.push( data[i] );
					}
				}
				return ret;
			}
			else
			{
				if( selector(data, null, null) ){
					return data;
				}
			}
		});
	}


	function FilterNotNull(xpath){
		return Filter(function(item){
			return getVal(xpath, item) !== null;
		}
	}

	function FilterEQ(xpath, value){
		return Filter(function(item){
			return getVal(xpath, item) === item;
		}
	}

	function FilterDistinct(xpath){
		
	}
	
	function GroupByDistinct(xpath)
	{
		
	}



	ADL.XAPIStream = {
		'Processor': Processor,
		'ConsoleLogger': ConsoleLogger,
		'Filter': Filter,
		'FilterNotNull': FilterNotNull,
		'FilterEQ': FilterEQ
	};

})(window.ADL = window.ADL || {});
