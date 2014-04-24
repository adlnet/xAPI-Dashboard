"use strict";

(function(ADL){

	var XAPIDashboard = function(container){
		this.statements = new ADL.Collection();
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

		// pre-transform timestamps
		var newStatements = new ADL.Collection(statementsArr).transform(function(e){
			e.timestamp = new Date(Date.parse(e.timestamp));
			e.stored = new Date(Date.parse(e.stored));
			return e;
		});
		this.statements = this.statements.union( newStatements );
	};
	
	// default aggregator requires opts.xField
	// opts.aggregate, opts.pre, opts.post, opts.customize are optional functions
	XAPIDashboard.prototype.createChart = function(type, opts){
	
		switch(type){
			case "barChart": return new ADL.BarChart(this.statements, this.container, opts); break;
			case "lineChart": return new ADL.LineChart(this.statements, this.container, opts); break;
			default: return new ADL.Chart(this.statements, this.container, opts);
		}
	}; 
	XAPIDashboard.prototype.createBarChart = function(opts){
		return new ADL.BarChart(this.statements, this.container, opts);
	}; 
	XAPIDashboard.prototype.createLineChart = function(opts){
		return new ADL.LineChart(this.statements, this.container, opts);
	}; 
	
	/*
	 * Class methods to perform graph "formatting" operations
	 */
	 
	XAPIDashboard.count = function(statements, opts){
		return statements.groupBy(opts.groupField, function(groupSet){ return groupSet.count(); });
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
		var rangeArr = ADL.Collection.genRange(opts.range.start, opts.range.end, opts.range.increment);
		return statements.groupByRange(opts.groupField || opts.xField, rangeArr, function(groupSet, start, end){ 
			return groupSet.count()
		});
	};	 	
	
	XAPIDashboard.average = function(statements, opts){
		var rangeArr = ADL.Collection.genRange(opts.range.start, opts.range.end, opts.range.increment);
		return statements.groupByRange(opts.groupField || opts.xField, rangeArr, function(groupSet, start, end){ 
			return groupSet.count() / opts.range.unit;
		});
	};	 
	
	
	
	ADL.XAPIDashboard = XAPIDashboard;

})(window.ADL = window.ADL || {});
