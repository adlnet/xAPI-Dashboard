/***************************************************************
 * Promise wrapper around the collection-worker functionality
 ***************************************************************/

(function(ADL){

	function serialize(obj){
		var json = JSON.stringify(obj);
		var jsonChars = json.split('');
		var buf = new ArrayBuffer(2*json.length);
		var view = new Uint16Array(buf);
		for(var i=0, offset=0; i<jsonChars.length; i++, offset++){
			view[offset] = jsonChars[i].charCodeAt(0);
			if( jsonChars[i].charCodeAt(1) !== NaN )
				view[++offset] = jsonChars[i].charCodeAt(1);
		}
		return buf;
	}

	function Collection(array){
		this.worker = new Worker('src/collection-worker.js');
		this.worker.postMessage(null,[serialize(array)]);
	}

	Collection.prototype.select = function(filter){
		this.worker.postMessage(['select','distinct']);
		return this;
	};

	Collection.prototype.eval = function(cb){
		this.worker.onmessage = function(event){
			cb(event.data);
		};
	};

	ADL.Collection = Collection;

})(window.ADL=window.ADL||{});
