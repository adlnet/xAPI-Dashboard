"use strict";

// guarantee window.ADL, even in a worker
try {
	window.ADL = window.ADL || {};
}
catch(e){
	var window = {'ADL': {}};
}

// figure out script path if available
try {
	var workerScript = document.querySelector('script[src$="collection-unified.js"]').src;
}
catch(e){}


(function(ADL){

	function CollectionSync(){
		
	}

	function Collection(){
		var w = this.worker = new Worker(workerScript);
		w.postMessage(Collection.serialize('syn'));
		w.onmessage = function(evt){
			var data = Collection.deserialize(evt.data);
			console.log(data);
		}
	}

	Collection.serialize = function(obj){
		var json = JSON.stringify(obj);
		var buf = new ArrayBuffer(2*json.length);
		var view = new Uint16Array(buf);
		for(var offset=0; offset<json.length; offset++){
			view[offset] = json.charCodeAt(offset);
		}
		return buf;
	};

	Collection.deserialize = function(buffer){
		var json = '';
		var intBuffer = new Uint16Array(buffer);
		for(var i=0; i<intBuffer.length; i+=1000)
			json += String.fromCharCode.apply(null, intBuffer.subarray(i,i+1000));
		return JSON.parse(json);
	}

	function proxyFactory(name){
		return function(){
			var args = Array.prototype.slice.call(arguments);
			this.worker.postMessage(Collection.serialize([name].concat(args)));
			return this;
		}
	}

	Collection.prototype.where   = proxyFactory('where');
	Collection.prototype.select  = proxyFactory('select');
	Collection.prototype.slice   = proxyFactory('slice');
	Collection.prototype.orderBy = proxyFactory('orderBy');
	Collection.prototype.groupBy = proxyFactory('groupBy');
	Collection.prototype.count   = proxyFactory('count');
	Collection.prototype.sum     = proxyFactory('sum');
	Collection.prototype.average = proxyFactory('average');
	Collection.prototype.min     = proxyFactory('min');
	Collection.prototype.max     = proxyFactory('max');

	ADL.CollectionSync = CollectionSync;
	ADL.Collection = Collection;

}(window.ADL));


/*
 * Thread-specific scope
 */
try {
	onmessage = function(evt){
		var data = window.ADL.Collection.deserialize(evt.data);
		console.log(JSON.stringify(data));
		postMessage(window.ADL.Collection.serialize('ack'));
	};
}
catch(e){
	if( e.message !== 'onmessage is not defined' ){
		throw e;
	}
}
