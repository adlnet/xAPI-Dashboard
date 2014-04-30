"use strict";

(function(ADL){

	var XAPIDashboard = function(container, webworkerSrc){
		
		webworkerSrc = webworkerSrc ? 'src/collection-worker.js' : 'src/collection-worker.js';
		
		try{
			this.collection = new ADL.CollectionAsync(window.statements, webworkerSrc);
		}
		catch(e){
			this.collection = new ADL.Collection();
		}
	
		this.container = container;
	}

	XAPIDashboard.prototype.fetchAllStatements = function(query, wrapper, cb){
		var self = this;
		if( !wrapper || typeof(wrapper) === 'function' ){
			if(typeof(wrapper) === 'function' && !cb)
				cb = wrapper;
			wrapper = ADL.XAPIWrapper;
		}

		wrapper.getStatements(query, null, function getMore(r){
			var response = JSON.parse(r.response);
			self.addStatements(response.statements);
			
			if(response.more){
				wrapper.getStatements(null, response.more, getMore);
			}
			
			else if(cb){
				cb(self.statements);
			}
		});
	};
	
	XAPIDashboard.prototype.clearSavedStatements = function(){
		
		//Update to support async collections!
		this.statements = new ADL.Collection();
	};
	
	XAPIDashboard.prototype.addStatements = function(statementsArr){
		if(statementsArr.response){
			try{
				statementsArr = JSON.parse(statementsArr.response).statements;
			}
			catch(e){
				console.error("Error parsing JSON data", statementsArr.response);
				return;
			}
		}
	};
	
	// default aggregator requires opts.xField
	// opts.aggregate, opts.pre, opts.post, opts.customize are optional functions
	XAPIDashboard.prototype.createChart = function(type, opts){
		opts.collection = this.collection;
		switch(type){
			case "barChart": opts.chart = new ADL.BarChart(this.container, opts); break;
			case "lineChart": opts.chart = new ADL.LineChart(this.container, opts); break;
			default: opts.chart = new ADL.Chart(this.container, opts);
		}
		
		return opts.chart;
	}; 
	XAPIDashboard.prototype.createBarChart = function(opts){
		opts.collection = this.collection;
		opts.chart = new ADL.BarChart(this.container, opts);
		return opts.chart;
	}; 
	XAPIDashboard.prototype.createLineChart = function(opts){
		opts.chart = new ADL.LineChart(this.container, opts);
		opts.collection = this.collection;
		return opts.chart;
	}; 
	
	/*
	 * Class methods to perform graph "formatting" operations
	 */
	 
	ADL.count = function(){
		return function(data, opts){
			if(opts.range){
				return opts.collection.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).count().select("group as in, count as out").exec(opts.cb);
			}
			else return opts.collection.groupBy(opts.group).count().select("group as in, count as out").exec(opts.cb);
		}
	};	 

	ADL.accumulate = function(statements, opts){
		return statements.transform(function(elem,index,array){
			return {
				'in': ADL.Collection.getValue(opts.xField)(elem),
				'out': opts.yField ? statements.select(ADL.Collection.first(index+1)).sum(opts.yField) : index+1,
				'sample': elem
			};
		});
	};	
	
	ADL.average = function(xpath){
		return function(data, opts){
			if(opts.range){
				return opts.collection.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).average(xpath).select("group as in, average as out").exec(opts.cb);
			}
			else return opts.collection.groupBy(opts.group).average(xpath).select("group as in, average as out").exec(opts.cb);
		}
	};	
	
	ADL.multiAverage = function(xpath){
		return function(data, opts){
			var tempCb = function(data){
				var outArr = [];
				
				//for(
				
				opts.cb(data);
				console.log(data);
			};
			if(opts.range){
				return opts.collection.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).exec(tempCb);
			}
			else return opts.collection
				.groupBy(opts.group)
				.join(
					'group', 
					function(data){ return data.average(xpath); }, 
					function(data){ return data.min(xpath); },
					function(data){ return data.max(xpath); }
				)
				.exec(tempCb);
			
			

		}
	};	 
	
	ADL.XAPIDashboard = XAPIDashboard;

})(window.ADL = window.ADL || {});
