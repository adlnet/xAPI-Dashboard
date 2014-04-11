"use strict";

(function(ADL){

	var XAPIDashboard = function(){
		this.set = new Set();
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

		this.set = this.set.union(new Set(statementsArr));
	};
	
	XAPIDashboard.prototype.sum = function(xAPIFieldA, xAPIFieldB){
	
		return [];
	};
	
	XAPIDashboard.prototype.genCountGraph = function(container, groupField, labelField, pre, post, customize){
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
