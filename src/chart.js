"use strict";
(function(ADL){
	
	//Base chart class
	function Chart(set, container, opts)
	{
		if(typeof container == "string"){
			this.container = container;
			this.opts = opts || {};
		}
		else{
			this.opts = container || {};
		}
		
		this.statements = set;
	}
	
	Chart.prototype.draw = function(container){
		var data = this.statements,
			opts = this.opts,
			container = container ? container : this.container;
			
		if(!opts.aggregate || !opts.chartType || !container){
			console.error("Must specify aggregate function, chartType, and container before drawing chart", opts);
			return;
		}
		
		if(opts.pre)
			data = opts.pre(data);

		data = opts.aggregate(data, opts);

		if(opts.post)
			data = opts.post(data);

		nv.addGraph(function(){
			var chart = nv.models[opts.chartType]()
				.options(opts.nvd3Opts);

			if( opts.customize )
				opts.customize(chart);

			d3.select(container)
				.datum([{'values': data.contents}])
				.call(chart);
			
			nv.utils.windowResize(chart.update);
			return chart;
		});
	};
	
	Chart.prototype.addOptions = function(obj){
		for(var key in obj){
			if(obj.hasOwnProperty(key)){
				this.opts[key] = obj[key];
			}
		}
	};
	
	//BarChart class extends Chart
	function BarChart(set, container, opts){

		Chart.call(this, set, container, opts);
		
		this.opts.chartType = 'discreteBarChart';
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
