"use strict";

(function(ADL){

	var XAPIGraph = function(type, container){
		this.set = new Set();
	}

	XAPIGraph.prototype.fetchAllStatements = function(query, cb){
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
	XAPIGraph.prototype.clearSavedStatements = function(){};
	
	XAPIGraph.prototype.addStatements = function(statementsArr){
		if(statementsArr.response){
			try{
				statementsArr = JSON.parse(statementsArr.response).statements;
			}
			catch(e){
				console.error("Error parsing JSON data", statementsArr.response);
				return;
			}
		}

		this.set = this.set.union(new Set(statementsArr));
	};
	
	XAPIGraph.prototype.sum = function(xAPIFieldA, xAPIFieldB){
	
		return [];
	};
	
	XAPIGraph.prototype.count = function(groupField, labelField, pre, post){
		var b = this.set;
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
				.x(function(d){ return new Set([d.result.sample]).transform(Set.getValue(labelField)).contents[0]; })
				.y(function(d){ return d.result.count; })
				.showXAxis(false)
				.staggerLabels(true)
				.tooltips(true)
				.showValues(false)
				.transitionDuration(250);

			d3.select('#graphContainer svg')
				.datum([{
					'values': b.contents}])
				.call(chart);

			nv.utils.windowResize(chart.update);
			return chart;
		});
	}

	ADL.XAPIGraph = XAPIGraph;

})(window.ADL = window.ADL || {});
