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
	 
	XAPIDashboard.count = function(){
		return function(data, opts){
			console.log(opts);
			if(opts.range){
				return opts.collection.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).count().select("group as in, count as out").exec(opts.cb);
			}
			else return opts.collection.groupBy(opts.group).count().select("group as in, count as out").exec(opts.cb);
		}
	};	 

	XAPIDashboard.accumulate = function(statements, opts){
		return statements.transform(function(elem,index,array){
			return {
				'in': ADL.Collection.getValue(opts.xField)(elem),
				'out': opts.yField ? statements.select(ADL.Collection.first(index+1)).sum(opts.yField) : index+1,
				'sample': elem
			};
		});
	};
	
	XAPIDashboard.countRange = function(statements, opts){
		var rangeArr = ADL.Collection.genRange(opts.range.start || statements.min(opts.groupField || opts.xField), opts.range.end || statements.max(opts.groupField || opts.xField), opts.range.increment || 1);
		return statements.groupByRange(opts.groupField || opts.xField, rangeArr, function(groupSet, start, end){ 
			return groupSet.count()
		});
	};	 	
	
	XAPIDashboard.average = function(xpath){
		return function(data, opts){
			if(opts.range){
				return opts.collection.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).average(xpath).select("group as in, average as out").exec(opts.cb);
			}
			else return opts.collection.groupBy(opts.group).average(xpath).select("group as in, average as out").exec(opts.cb);
		}
	};	 
	
	ADL.XAPIDashboard = XAPIDashboard;

})(window.ADL = window.ADL || {});
