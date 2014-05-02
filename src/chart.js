"use strict";
(function(ADL){
	var currentChart;
	
	//Base chart class
	function Chart(container, opts)
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
	}
	
	Chart.prototype.pipeDataToD3 = function(obj, chart){
		d3.select(this.container)
			.datum([{'values': obj}])
			.call(chart);
	};
	
	Chart.prototype.draw = function(container){
		var	opts = this.opts,
			event = this.event,
			self = this;
			
		self.container = container ? container : self.container;
		currentChart = self;
			
		if(!opts.aggregate || !opts.chartType || !self.container){
			console.error("Must specify aggregate function, chartType, and container before drawing chart", opts);
			return;
		}
		
		opts.cb = function(aggregateData){
			if(opts.post)
				aggregateData = opts.post(aggregateData, event);

			nv.addGraph(function(){
				var chart = nv.models[opts.chartType]().options(opts.nvd3Opts);
				
				if(chart.staggerLabels)
					chart.staggerLabels(false);

				if( opts.customize )
					opts.customize(chart, event);
				
				var next = currentChart.child || currentChart.parent;
				
				if(next && opts.eventChartType){
					
					//Find a way to prevent the addition of click handlers every time this chart is drawn
					chart[opts.eventChartType].dispatch.on("elementClick", function(e) {
						next = currentChart.child || currentChart.parent;
						if(next){
							//If the containers are the same, then remove all nodes from the container
							if(currentChart.container == next.container){
								var myNode = ADL.$(next.container);
								while (myNode.firstChild) {
									myNode.removeChild(myNode.firstChild);
								}
							}
							
							currentChart = next;
							currentChart.event = e;
							
							currentChart.draw();
						}
					});
				}

				self.pipeDataToD3.call(self, aggregateData, chart);
				window.onResize = chart.update;
				
				//chart.update();
				
				return chart;
			});
		};
		
		opts.data.save();
		if(opts.pre){
			if(typeof opts.pre === "string"){
				opts.data.where(opts.pre);
			}
			else{
				opts.pre(opts.data, event);
			}
		}

		opts.aggregate(opts, event);
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
	function BarChart(container, opts){

		Chart.call(this, container, opts);
		
		this.opts.chartType = 'discreteBarChart';
		this.opts.eventChartType = 'discretebar';
		
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count;
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d){ return d.in; },
			'y': function(d){ return d.out; },
			'staggerLabels': true,
			'transitionDuration': 250,
			'margin': {left: 80, bottom: 100}
		};
	}
	
	BarChart.prototype = new Chart();
	BarChart.prototype.constructor = BarChart;	
	
	//LineChart class extends Chart
	function LineChart(container, opts){

		Chart.call(this, container, opts);
		
		this.opts.chartType = 'lineChart';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.accumulate;
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in; },
			'y': function(d,i){ return d.out; },
			'showXAxis': true,
			'showYAxis': true,
			'transitionDuration': 250,
			'margin': {left: 80, bottom: 100}
		};
	}
	
	LineChart.prototype = new Chart();
	LineChart.prototype.constructor = LineChart;		
	
	//PieChart class extends Chart
	function PieChart(container, opts){

		Chart.call(this, container, opts);
		
		this.opts.chartType = 'pieChart';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count;

		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in },
			'y': function(d,i){  return d.out },
			'transitionDuration': 250,
			'color': d3.scale.category20().range()
		};
	}
	
	PieChart.prototype = new Chart();
	PieChart.prototype.constructor = PieChart;	
	
	PieChart.prototype.pipeDataToD3 = function(obj, chart){
		d3.select(this.container)
			.datum(obj)
			.call(chart);
	};
	
	//MultiBarChart class extends Chart
	function MultiBarChart(container, opts){

		Chart.call(this, container, opts);
		
		this.opts.chartType = 'multiBarChart';
		this.opts.eventChartType = 'multibar';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count;
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in; },
			'y': function(d,i){ return d.out; },
			'showXAxis': true,
			'showYAxis': true,
			'transitionDuration': 250,
			'groupSpacing': 0.25,
			'stacked': true,
			'showControls': false,
			'margin': {left: 80, bottom: 100}
		};
	}
	
	MultiBarChart.prototype = new Chart();
	MultiBarChart.prototype.constructor = MultiBarChart;
	
	MultiBarChart.prototype.pipeDataToD3 = function(obj, chart){
		d3.select(this.container)
			.datum(obj)
			.call(chart);
	};

	ADL.Chart = Chart;
	ADL.BarChart = BarChart;
	ADL.LineChart = LineChart;
	ADL.MultiBarChart = MultiBarChart;
	ADL.PieChart = PieChart;

})(window.ADL = window.ADL || {});
