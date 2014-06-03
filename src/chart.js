"use strict";
(function(ADL){

	//Base chart class
	function Chart(opts)
	{
		this.opts = opts || {};
		
		if(this.opts.child){
			this.child = opts.child;
			this.opts.child.parent = this;
		}
	}
	
	Chart.prototype.pipeData = function(obj, chart){
		d3.select(this.opts.container)
			.datum([{'values': obj}])
			.call(chart);
	};
	
	Chart.prototype.clear = function(container){
		var myNode = ADL.$(container ? container : this.opts.container);
		while (myNode.firstChild) {
			myNode.removeChild(myNode.firstChild);
		}
		
		if(this.child instanceof Array){
			for(var g = 0; g < this.child.length; g++){
				this.child[g].clear();
			}
		}
		else if(this.child){
			this.child.clear();
		}
	};
	
	Chart.prototype.draw = function(container){
		var	opts = this.opts,
			event = this.event,
			self = this;
		
		container = container ? container : this.opts.container;
			
		if(!opts.aggregate || !opts.chartType || !container){
			console.error("Must specify aggregate function, chartType, and container before drawing chart", opts);
			return;
		}
		
		opts.cb = function(aggregateData){
			if(opts.post)
				aggregateData = opts.post.call(self, aggregateData, event) || aggregateData;	

			nv.addGraph(function(){
				var chart = nv.models[opts.chartType]().options(opts.nvd3Opts);
				
				if(chart.staggerLabels)
					chart.staggerLabels(false);

				if( opts.customize )
					opts.customize(chart, event);
				
				var next = self.child || self.parent;
				if(next && opts.eventChartType){
					
					//Find a way to prevent the addition of click handlers every time this chart is drawn
					chart[opts.eventChartType].dispatch.on("elementClick", function(e) {
						e.in = e.in ? e.in : e.point.in;
						e.out = e.out ? e.out : e.point.out;
						if(next instanceof Array){
							for(var i = 0; i < next.length; i++){
								if(self.opts.container == next[i].opts.container){
									self.clear();
								}
								
								next[i].event = e;
								next[i].draw();
								
								if(next[i].child instanceof Array){
									for(var g = 0; g < next[i].child.length; g++){
										next[i].child[g].clear();
									}
								}
								else if(next[i].child){
									next[i].child.clear();
								}
							}
						}
						else if(next){
							//If the containers are the same, then remove all nodes from the container
							if(self.opts.container == next.opts.container){
								var myNode = ADL.$(next.opts.container);
								while (myNode.firstChild) {
									myNode.removeChild(myNode.firstChild);
								}
							}

							next.event = e;
							next.draw();
						}
					});
				}

				self.pipeData(aggregateData, chart);
				window.onResize = chart.update;
				
				//chart.update();
				return chart;
			});
		};
		opts.data = opts.data.save();

		if(opts.pre){
			if(typeof opts.pre === "string"){
				opts.data.where(opts.pre);
			}
			else{
				opts.pre.call(self, opts.data, event);
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
	function BarChart(opts){

		Chart.call(this, opts);
		
		this.opts.chartType = 'discreteBarChart';
		this.opts.eventChartType = 'discretebar';
		
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count();
		
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
	function LineChart(opts){

		Chart.call(this, opts);
		
		this.opts.chartType = 'lineChart';
		//this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.accumulate;
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in; },
			'y': function(d,i){ return d.out; },
			'showXAxis': true,
			'showYAxis': true,
			'showLegend': false,
			'transitionDuration': 250,
			'margin': {left: 80, bottom: 100}
		};
	}
	
	LineChart.prototype = new Chart();
	LineChart.prototype.constructor = LineChart;		
	
	//PieChart class extends Chart
	function PieChart(opts){

		Chart.call(this, opts);
		
		this.opts.chartType = 'pieChart';
		this.opts.eventChartType = 'pie';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count();

		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in },
			'y': function(d,i){  return d.out },
			'transitionDuration': 250,
			'color': d3.scale.category20().range()
		};
	}
	
	PieChart.prototype = new Chart();
	PieChart.prototype.constructor = PieChart;	
	
	PieChart.prototype.pipeData = function(obj, chart){
		d3.select(this.opts.container)
			.datum(obj)
			.call(chart);
	};
	
	//MultiBarChart class extends Chart
	function MultiBarChart(opts){

		Chart.call(this, opts);
		
		this.opts.chartType = 'multiBarChart';
		this.opts.eventChartType = 'multibar';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count();
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			'x': function(d,i){ return d.in; },
			'y': function(d,i){ return d.out; },
			'showXAxis': true,
			'showYAxis': true,
			'transitionDuration': 250,
			'groupSpacing': 0.25,
			//'stacked': true,
			'showControls': false,
			'margin': {left: 80, bottom: 100}
		};
	}
	
	MultiBarChart.prototype = new Chart();
	MultiBarChart.prototype.constructor = MultiBarChart;
	
	MultiBarChart.prototype.pipeData = function(obj, chart){
		console.log("MultiBar: ", obj);
		
		d3.select(this.opts.container)
			.datum(obj)
			.call(chart);
	};
	
	//LinePlusBarChart class extends Chart
	function LinePlusBarChart(opts){

		Chart.call(this, opts);
		
		this.opts.chartType = 'linePlusBarChart';
		//this.opts.eventChartType = 'multibar';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count();
		
		this.opts.nvd3Opts = this.opts.nvd3Opts ? this.opts.nvd3Opts : {
			x: function(d,i){ console.log(d.in.split('-')[0]); return d.in.split('-')[0]; },
			y: function(d,i){ console.log(d.out ? d.out : 0); return d.out ? d.out : 0; },
			showXAxis: true,
			showYAxis: true,
			transitionDuration: 250,
			margin: {top: 30, right: 60, bottom: 50, left: 70}
		};
	}
	
	LinePlusBarChart.prototype = new Chart();
	LinePlusBarChart.prototype.constructor = LinePlusBarChart;
	
	LinePlusBarChart.prototype.pipeData = function(obj, chart){
		var newArr = [];
		for(var i = 0; i < obj.length; i++){
		
			delete obj[i].series;
			if(obj[i].key != "groupStart" && obj[i].key != "groupEnd")
				newArr.push(obj[i]);
		}
		
		newArr[0].bar = true;
		
		console.log("Line+Bar: ", newArr);
		
		d3.select(this.opts.container)
			.datum(newArr)
			.call(chart);
	};
	
	//LinePlusBarChart class extends Chart
	function Table(opts){

		Chart.call(this, opts);
		
		this.opts.chartType = 'table';
		this.opts.aggregate = this.opts.aggregate ? this.opts.aggregate : ADL.count();
	}
	
	Table.prototype = new Chart();
	Table.prototype.constructor = Table;
	
	Table.prototype.draw = function(container){
		var	opts = this.opts,
			event = this.event,
			self = this;
			
		container = container ? container : this.opts.container;
			
		if(!opts.aggregate || !opts.chartType || !container){
			console.error("Must specify aggregate function, chartType, and container before drawing chart", opts);
			return;
		}
		
		opts.cb = function(aggregateData){
			
			if(opts.post)
				aggregateData = opts.post(aggregateData, event) || aggregateData;	
			
			var markup = '<table>';
			
			if(aggregateData[0] && aggregateData[0].values){
				for(var i = -1; i < aggregateData[0].values.length; i++){
					
					var g = 0;
					markup += i >= 0 ? '<tr><td>' + aggregateData[g].values[i].in + '</td>' : '<tr><th>' + opts.groupBy +'</th>';
					
					for(; g < aggregateData.length; g++){
						if(i >= 0) markup += '<td>'+aggregateData[g].values[i].out+'</td>';
						else markup += '<th>'+aggregateData[g].key+'</th>';
					}
					
					markup += '</tr>';
				}
			}
			
			else{
				markup += '<tr><th>'+opts.groupBy+'</th><th>'+opts.xpath+'</th></tr>';
				for(var i = 0; i < aggregateData.length; i++){
					markup += '<tr><td>'+aggregateData[i].in+'</td><td>'+aggregateData[i].out+'</td></tr>';
				}
			}
			
			markup += '</table>';
			ADL.$(container).innerHTML = markup;
		};
	
		opts.data = opts.data.save();

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

	ADL.Chart = Chart;
	ADL.BarChart = BarChart;
	ADL.LineChart = LineChart;
	ADL.MultiBarChart = MultiBarChart;
	ADL.PieChart = PieChart;
	ADL.LinePlusBarChart = LinePlusBarChart;
	ADL.Table = Table;

})(window.ADL = window.ADL || {});
