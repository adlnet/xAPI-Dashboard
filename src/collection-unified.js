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


/*
 * Client scope
 */

(function(ADL){
	
	/*************************************************************
	 * CollectionSync - the core processor of statements
	 *
	 * This is where the magic happens. CollectionSync is initialized
	 * with an array of statements, processes those statements
	 * based on the method called, and returns a new CollectionSync
	 * object containing the results of the query.
	 *************************************************************/

	function CollectionSync(data, parent){
		this.contents = data.slice();
		this.parent = parent;
	}

	CollectionSync.prototype.exec = function(cb){
		cb(this);
		return this.parent;
	}

	CollectionSync.prototype.save = function(){
		return new CollectionSync(this.contents, this);
	}

	CollectionSync.prototype.append = function(data){
		return new CollectionSync( this.contents.concat(data) );
	}


	CollectionSync.prototype.where = function(query){
		return this;
	}

	CollectionSync.prototype.select = function(selectors){
		
		return this;
	}

	CollectionSync.prototype.slice = function(start,end){

		return this;
	}
	
	CollectionSync.prototype.orderBy = function(xpath, direction){
		
		return this;
	}

	CollectionSync.prototype.groupBy = function(xpath, range){
		
		return this;
	}

	CollectionSync.prototype.count = function(){
		
		return this;
	}

	CollectionSync.prototype.sum = function(xpath){
		
		return this;
	}

	CollectionSync.prototype.average = function(xpath){
		
		return this;
	}

	CollectionSync.prototype.min = function(xpath){
		
		return this;
	}

	CollectionSync.prototype.max = function(xpath){
		
		return this;
	}


	/*****************************************************************
	 * Collection class - asynchronous version of CollectionSync
	 *
	 * For any decently-sized dataset, CollectionSync will lock up the
	 * UI for an unnecessary amount of time. The Collection class
	 * exposes the same API, but wraps that functionality in a thread
	 * so the UI remains responsive.
	 *****************************************************************/


	function Collection(data)
	{
		if( !window.Worker ){
			throw new Error('Your browser does not support WebWorkers, and cannot use the Collection class. Use CollectionSync instead.');
		}

		this.worker = new Worker(workerScript);
		var payload = Collection.serialize(['push',data]);
		try {
			this.worker.postMessage(payload, [payload]);
		}
		catch(e){
			this.worker.postMessage(payload);
		}

		if( payload.byteLength > 0 ){
			console.log('Warning: Your browser does not support WebWorker transfers. Performance of this site may suffer as a result.');
		}
	}

	Collection.serialize = function(obj){
		var json = JSON.stringify(obj);
		var buf = new ArrayBuffer(2*json.length);
		var view = new Uint16Array(buf);
		for(var offset=0; offset<json.length; offset++){
			view[offset] = json.charCodeAt(offset);
		}
		console.log('Sending '+buf.byteLength+' bytes');
		return buf;
	};

	Collection.deserialize = function(buffer){
		var json = '';
		var intBuffer = new Uint16Array(buffer);
		for(var i=0; i<intBuffer.length; i+=1000)
			json += String.fromCharCode.apply(null, intBuffer.subarray(i,i+1000));
		return JSON.parse(json);
	}

	Collection.prototype.exec = function(cb){
		this.worker.postMessage(Collection.serialize(['exec']));
		this.worker.onmessage = function(evt){
			var result = new CollectionSync(Collection.deserialize(evt.data));
			cb(result);
			evt.target.onmessage = undefined;
		};
		return this;
	}

	Collection.prototype.append = function(data){
		var payload = Collection.serialize(['append',data]);
		try {
			this.worker.postMessage(payload, [payload]);
		}
		catch(e){
			this.worker.postMessage(payload);
		}

		return this;
	}

	function proxyFactory(name){
		return function(){
			var args = Array.prototype.slice.call(arguments);
			this.worker.postMessage(Collection.serialize([name].concat(args)));
			return this;
		}
	}

	Collection.prototype.save    = proxyFactory('save');
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
(function(Collection, CollectionSync){

	var db = null;

	try {
		onmessage = function(evt)
		{
			var data = Collection.deserialize(evt.data);

			if( data[0] === 'exec' ){
				console.log('Message received: '+JSON.stringify(data));
				if(db){
					db = db.exec(function(data){
						var payload = Collection.serialize(data.contents);
						try {
							postMessage(payload, [payload]);
						}
						catch(e){
							postMessage(payload);
						}
					});
				}
				else {
					postMessage(Collection.serialize(['error','nodata']));
				}
			}
			else if( data[0] === 'push' ){
				console.log('Message received: ["push", ...]');
				var newdb = new CollectionSync(data[1], db);
				db = newdb;
			}
			else {
				console.log('Message received: '+JSON.stringify(data));
				// execute the function at [0] with [1-n] as args
				db = db[data[0]].apply(db, data.slice(1));
			}
		};
	}
	catch(e){
		if( e.message !== 'onmessage is not defined' ){
			throw e;
		}
	}

}(window.ADL.Collection, window.ADL.CollectionSync));

