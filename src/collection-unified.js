"use strict";

// guarantee window.ADL, even without a window object
try {
	window.ADL = window.ADL || {};
}
catch(e){
	var window = {'ADL': {}};
}

// figure out script path
try {
	var workerScript = document.querySelector('script[src$="collection-unified.js"]').src;
}
catch(e){}


(function(ADL){

	function CollectionSync(){
		
	}

	function Collection(){
		var w = this.worker = new Worker(workerScript);
		console.log('Sending syn');
		w.postMessage('syn');
		w.onmessage = function(evt){
			console.log(evt.data);
		}
	}

	ADL.CollectionSync = CollectionSync;
	ADL.Collection = Collection;

}(window.ADL));


/*
 * Thread-specific scope
 */
try {
	onmessage = function(evt){
		console.log(evt.data);
		console.log('Sending ack');
		postMessage('ack');
	};
}
catch(e){
	if( e.message !== 'onmessage is not defined' ){
		throw e;
	}
}
