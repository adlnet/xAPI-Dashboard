"use strict";

(function(ADL){

	var XAPIDashboard = function(){
		this.statements = new ADL.Collection();
	}

	XAPIDashboard.prototype.fetchAllStatements = function(query, cb){
		var self = this;
		ADL.XAPIWrapper.getStatements(query, null, function getMore(r){
			var response = JSON.parse(r.response);
			self.addStatements(response.statements);
			
			if(response.more){
				wrapper.getStatements(null, response.more, getMore);
			}
			
			else if(cb){
				cb();
			}
		});
	};
	
	//To-do
	XAPIDashboard.prototype.clearSavedStatements = function(){};
	
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

		this.statements = this.statements.union(new ADL.Collection(statementsArr));
	};
	
	// opts.xAxisField is a required string
	// opts.yAxisField is an optional string
	// opts.operation, opts.pre, opts.post, opts.customize are optional functions
	XAPIDashboard.prototype.genLineGraph = function(container, opts){
	
		var data = this.statements;
		if(opts.pre)
			data = opts.pre(data);

		data = opts.operation ? opts.operation(data, opts) : XAPIDashboard.sum(data, opts);

		if(opts.post)
			data = opts.post(data);

		nv.addGraph(function(){
			var chart = nv.models.lineChart()
				.options({
					'x': function(d,i){ return d.x},
					'y': function(d,i){ return d.y; },
					'showXAxis': true,
					'showYAxis': true,
					'transitionDuration': 250
				});

			if(opts.customize)
				opts.customize(chart);

			d3.select(container)
				.datum([{'key': 'Users registered', 'values': data.contents}])
				.call(chart);

  			nv.utils.windowResize(chart.update);
			return chart;
		});
	};
	
	// opts.groupField and opts.labelField are required strings
	// opts.operation, opts.pre, opts.post, opts.customize are optional functions
	XAPIDashboard.prototype.genBarGraph = function(container, opts){
		var data = this.statements;
		if(opts.pre)
			data = opts.pre(data);

		data = opts.operation ? opts.operation(data, opts) : XAPIDashboard.count(data, opts);

		if(opts.post)
			data = opts.post(data);

		nv.addGraph(function(){
			var chart = nv.models.discreteBarChart()
				.x(function(d){ return ADL.Collection.getValue('result.sample.'+opts.labelField)(d); })
				.y(function(d){ return d.result.count; })
				.staggerLabels(true)
				.transitionDuration(250);

			if( opts.customize )
				opts.customize(chart);

			d3.select(container)
				.datum([{
					'values': data.contents}])
				.call(chart);
			
			nv.utils.windowResize(chart.update);
			return chart;
		});
	};
	
	/*
	 * Class methods to perform graph "formatting" operations
	 */
	 
	XAPIDashboard.count = function(statements, opts){
		return statements.groupBy(opts.groupField, function(groupSet){ return {
				'sample': groupSet.contents[0],
				'count': groupSet.count()
			}});
	};	 
	
	XAPIDashboard.sum = function(statements, opts){
		return statements.orderBy(opts.xAxisField).transform(function(elem, index, array){
			var sum = 0;
			if(opts.yAxisField){
				for(var i=0; i<=index; i++){
					sum += ADL.Collection.getValue(opts.yAxisField)(array[i]);
				}
			}

			return {
				'x': ADL.Collection.getValue(opts.xAxisField)(elem),
				'y': opts.yAxisField ? sum : index
			};
		});
	};

	ADL.XAPIDashboard = XAPIDashboard;

})(window.ADL = window.ADL || {});
