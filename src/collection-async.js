/***************************************************************
 * Promise wrapper around the collection-worker functionality
 ***************************************************************/

(function(ADL){
	function Collection(array){
		this.contents = array.slice();
		this.worker = new Worker('src/collection-worker.js');
	}

	Collection.prototype.signal = function(message){
		this.worker.postMessage(message);
		return this;
	};

	Collection.prototype.eval = function(cb){
		this.worker.onmessage = function(event){
			cb(event.data);
		};
	};

	ADL.Collection = Collection;

})(window.ADL=window.ADL||{});
