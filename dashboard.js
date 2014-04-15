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
	
	XAPIDashboard.prototype.genSumGraph = function(container, xAxisField, yAxisField, pre, post, customize){
	
		var b = this.statements;
		if(pre)
			b = pre(b);

		b = b.orderBy(xAxisField).transform(function(elem, index, array){
			var sum = 0;
			if(yAxisField){
				for(var i=0; i<=index; i++){
					sum += ADL.Collection.getValue(yAxisField)(array[i]);
				}
			}

			return {
				'x': ADL.Collection.getValue(xAxisField)(elem),
				'y': yAxisField ? sum : index
			};
		});

		if(post)
			b = post(b);

		nv.addGraph(function(){
			var chart = nv.models.lineChart()
				.options({
					'x': function(d,i){ return d.x},
					'y': function(d,i){ return d.y; },
					'showXAxis': true,
					'showYAxis': true,
					'transitionDuration': 250
				});

			if(customize)
				customize(chart);

			d3.select(container)
				.datum([{'key': 'Users registered', 'values': b.contents}])
				.call(chart);

  			nv.utils.windowResize(chart.update);
			return chart;
		});
	};
	
	XAPIDashboard.prototype.genCountGraph = function(container, groupField, labelField, pre, post, customize){
		var b = this.statements;
		if(pre)
			b = pre(b);

		b = b.groupBy(groupField, function(groupSet){ return {
			'sample': groupSet.contents[0],
			'count': groupSet.count()
		}});

		if(post)
			b = post(b);

		nv.addGraph(function(){
			var chart = nv.models.discreteBarChart()
				.x(function(d){ return ADL.Collection.getValue('result.sample.'+labelField)(d); })
				.y(function(d){ return d.result.count; })
				.transitionDuration(250);

			if( customize )
				customize(chart);

			d3.select(container)
				.datum([{
					'values': b.contents}])
				.call(chart);

			nv.utils.windowResize(chart.update);
			return chart;
		});
	};

	ADL.XAPIDashboard = XAPIDashboard;

})(window.ADL = window.ADL || {});
