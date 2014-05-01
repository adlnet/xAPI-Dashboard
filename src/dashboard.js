"use strict";

(function(ADL){

	var XAPIDashboard = function(container, webworkerSrc){
		
		webworkerSrc = webworkerSrc ? 'src/collection-worker.js' : 'src/collection-worker.js';
		
		try{
			this.data = new ADL.CollectionAsync(window.statements, webworkerSrc);
		}
		catch(e){
			this.data = new ADL.Collection();
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
		opts.data = this.data;
		switch(type){
			case "barChart": opts.chart = new ADL.BarChart(this.container, opts); break;
			case "lineChart": opts.chart = new ADL.LineChart(this.container, opts); break;
			default: opts.chart = new ADL.Chart(this.container, opts);
		}
		
		return opts.chart;
	}; 
	XAPIDashboard.prototype.createBarChart = function(opts){
		opts.data = this.data;
		opts.chart = new ADL.BarChart(this.container, opts);
		return opts.chart;
	}; 
	XAPIDashboard.prototype.createMultiBarChart = function(opts){
		opts.data = this.data;
		opts.chart = new ADL.MultiBarChart(this.container, opts);
		return opts.chart;
	}; 
	XAPIDashboard.prototype.createLineChart = function(opts){
		opts.chart = new ADL.LineChart(this.container, opts);
		opts.data = this.data;
		return opts.chart;
	}; 
	
	/*
	 * Class methods to perform graph "formatting" operations
	 */
	 
	ADL.count = function(){
		return function(opts){
			if(opts.range){
				return opts.data.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).count().select("group as in, count as out").exec(opts.cb);
			}
			else return opts.data.groupBy(opts.group).count().select("group as in, count as out").exec(opts.cb);
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
		return function(opts){
			if(opts.range){
				return opts.data.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment]).average(xpath).select("group as in, average as out").exec(opts.cb);
			}
			else return opts.data.groupBy(opts.group).average(xpath).select("group as in, average as out").exec(opts.cb);
		}
	};	
	
	ADL.multiAggregate = function(xpath){
		var saveArgs = arguments,
			opsArr = ["group"],
			saveIndex;
		
		for(var g = 1; g < saveArgs.length; g++){
			opsArr.push(function(data){ 
				saveArgs[saveIndex++].call(data, xpath);
			});
		}
	
		return function(opts){
			saveIndex = 1;
			
			var tempCb = function(data){
				
				var colorRange = d3.scale.category20c().range(),
					aggArr = [],
					g = 0;
				
				for(var i in data[0]){
					if(i != "group" && i != "sample"){
						aggArr.push({key: i, values: [], color: colorRange[g++]});
					}
				}
				
				for(var i = 0; i < data.length; i++){
					for(var g = 0; g < aggArr.length; g++){
						aggArr[g].values.push({in: data[i].group, out: data[i][aggArr[g].key], series: g});
					}
				}
				
				//sort ensuring that min is at the beginning and max is at the end
				aggArr.sort(function(a, b){
					if(a.key == "min") return -1;
					else if(b.key == "min") return 1;				
					else if(a.key == "max") return 1;
					else if(b.key == "max") return -1;
					else return 0;
				});

				opts.cb(aggArr);
			};
			
			if(opts.range) return opts.data
				.groupBy(opts.group, [opts.range.start, opts.range.end, opts.range.increment])
				.join.apply(opts.data, opsArr)
				.exec(tempCb);
			
			else return opts.data
				.groupBy(opts.group)
				.join.apply(opts.data, opsArr)
				.exec(tempCb);
		}
	};	 
	
	ADL.XAPIDashboard = XAPIDashboard;
	ADL.$ = function(query){ return document.querySelector(query); };

})(window.ADL = window.ADL || {});
