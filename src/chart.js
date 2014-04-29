"use strict";
(function(ADL){
	var currentChart;
	
	//Base chart class
	function Chart(set, container, opts)
	{
		if(typeof container == "string"){
			this.container = container;
			this.opts = opts || {};
		}
		else{
			//else, container is actually the options object
			this.opts = container || {};
		}
		
		if(this.opts.child){
			this.child = opts.child;
			this.opts.child.parent = this;
		}
		
		this.statements = set;
	}
	
	Chart.prototype.draw = function(container){
		var data = this.statements,
			opts = this.opts,
			container = container ? container : this.container,
			event = this.event,
			self = this;
		
		currentChart = this;
			
		if(!opts.aggregate || !opts.chartType || !container){
			console.error("Must specify aggregate function, chartType, and container before drawing chart", opts);
			return;
		}
		
		if(opts.pre)
			data = opts.pre(data, event);

		data = opts.aggregate(data, opts, event);

		if(opts.post)
			data = opts.post(data, event);

		nv.addGraph(function(){
			var chart = nv.models[opts.chartType]().options(opts.nvd3Opts);
			chart.staggerLabels(false);

			if( opts.customize )
				opts.customize(chart, event);
			
			var next = currentChart.child || currentChart.parent;
			
			if(next && opts.eventChartType){
				
				//Find a way to prevent the addition of click handlers every time this chart is drawn
				chart[opts.eventChartType].dispatch.on("elementClick", function(e) {
					next = currentChart.child || currentChart.parent;
					if(next){
						currentChart = next;
						currentChart.event = e;
						currentChart.draw();
					}
				});
			}
			
			d3.select(container)
				.datum([{'values': data.contents}])
				.call(chart);
			
			nv.utils.windowResize(chart.update);
			
			return chart;
		});
	};
	
	Chart.prototype.addOptions = function(obj){
		for(var key in obj){
			this.opts[key] = obj[key];
		}
	};	
	Chart.prototype.addParent = function(obj){
		this.parent = obj;
		obj.child = this;
	};	
	Chart.prototype.addChild = function(obj){
		this.child = obj;
		obj.parent = this;
	};
	
	//BarChart class extends Chart
	function BarChart(set, container, opts){

		Chart.call(this, set, container, opts);
		
		this.opts.chartType = 'discreteBarChart';
		this.opts.eventChartType = 'discretebar';
		
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.XAPIDashboard.count;
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d){ return d.in; },
			'y': function(d){ return d.out; },
			'staggerLabels': true,
			'transitionDuration': 250
		};
	}
	
	BarChart.prototype = new Chart();
	BarChart.prototype.constructor = BarChart;	
	
	//LineChart class extends Chart
	function LineChart(set, container, opts){

		Chart.call(this, set, container, opts);
		
		this.opts.chartType = 'lineChart';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.XAPIDashboard.accumulate;
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in; },
			'y': function(d,i){ return d.out; },
			'showXAxis': true,
			'showYAxis': true,
			'transitionDuration': 250
		};
	}
	
	LineChart.prototype = new Chart();
	LineChart.prototype.constructor = LineChart;

	ADL.Chart = Chart;
	ADL.BarChart = BarChart;
	ADL.LineChart = LineChart;

})(window.ADL = window.ADL || {});
