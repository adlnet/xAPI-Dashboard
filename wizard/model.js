var wrapper = ADL.XAPIWrapper,
	dash = new ADL.XAPIDashboard({}),
	set = ADL.Collection,
	wizardModel,
	currentChart,
	currentTable;
	
//localStorage.lrs
	
$(document).ready(function(){

	wizardModel = localStorage.wizard ? ko.mapping.fromJSON(localStorage.wizard) : {};
	
	wizardModel.isFooterToggled = ko.observable(false);
	wizardModel.toggleFooterHeight = function(obj){
		
		if(!wizardModel.isFooterToggled()){
			$('.chart-footer').animate({'height': '50%'}, 750, 'swing', wizardModel.generateChart);
			$('#graphContainer').animate({'height': '50%'}, 750, 'swing', wizardModel.generateChart);
		}
		else{
			$('.chart-footer').animate({'height': '20%'}, 750, 'swing', wizardModel.generateChart);
			$('#graphContainer').animate({'height': '80%'}, 750, 'swing', wizardModel.generateChart);
		}
		
		wizardModel.isFooterToggled(!wizardModel.isFooterToggled());
	};
		
	wizardModel.setMainObject = function(obj){

		wizardModel.mainObject(obj);
		var lrsList = ko.toJS(wizardModel.lrsList),
		plainObj = ko.toJS(obj);

		for(var i = 0; i < lrsList.length; i++){
			if(lrsList[i].endpoint == plainObj.lrs){
				
				if(localStorage.statements){
					wizardModel.hasData = true;
					
					dash.data = new ADL.Collection(JSON.parse(localStorage.statements));
					wizardModel.internalStatement = dash.data.contents[0];
					
					wizardModel.generateChart();
				}
				else{
					wizardModel.fetchAllStatements(lrsList[i]);
				}
				break;
			}
		}
	};
	
	wizardModel.fetchAllStatements = function(lrsConfig){
		if(dash.data.contents.length == 0){
				
			wrapper.changeConfig(lrsConfig);
			dash.fetchAllStatements({since: (new Date(Date.now()-1000*7*24*60*60)).toISOString()}, function(){
				console.log("Done");
				wizardModel.hasData = true;
				wizardModel.internalStatement = dash.data.contents[0];
				wizardModel.generateChart();
			});
		}
		else
			wizardModel.generateChart();
	};
	
	//functions to handle clicking within modal
	wizardModel.setModalType = function(type){
		return function(){
			wizardModel.currentModalType(type);
			console.log(wizardModel.currentModalType());
			
			if(type == "Sample Statement"){
				Prism.highlightElement(document.getElementById("statement-code"), false, function(){

					var statementKeys = $('.token.key, .token.punctuation');
					
					statementKeys.click(function(){
						var saveThis = $(this),
							saveIndex = -1,
							level = 0,
							outStr = saveThis.text();
						
						for(var i = 0; i < statementKeys.length; i++){
							if(this == statementKeys[i]){
								saveIndex = i;
							}
						}
						
						for(var i = saveIndex - 1; i >= 0; i--){
							
							var currStr = $(statementKeys[i]).text();
							if(currStr == "{"){
								if(i > 0 && level >= 0){
									outStr = $(statementKeys[i - 1]).text() + "." +  outStr;
									i--;
								}
								level = level >= 0 ? 0 : level + 1;
							}
							
							else if(currStr == "}"){
								level--;
							}
						}
						
						wizardModel.mainObject().groupBy(outStr);
						$('#myModal').modal('hide');
						
					});
				});
			}
		};
	};
	
	wizardModel.modalSaveClick = function(){
		if(wizardModel.currentModalType() === "Add LRS" && wizardModel.addLRS()){
			$('#myModal').modal('hide');
		}
		else if(wizardModel.currentModalType() === "Add Chart" && wizardModel.addChart()){
			$('#myModal').modal('hide');
		}
		
		console.log("save click");
	};
	
	wizardModel.addChart = function(){
	
		var chartObj = ko.toJS(wizardModel.chartAddOpts);
		
		for(var i in chartObj){
		
			if(i == "aggregationList"){
				chartObj[i] = ko.observableArray([{aggregationType: ko.observable('count'), aggregationField: ko.observable('')}]);
				chartObj[i]()[0].aggregationType.subscribe(wizardModel.generateChart);
				chartObj[i]()[0].aggregationField.subscribe(wizardModel.generateChart);
			}
			else{
				chartObj[i] = ko.observable(chartObj[i]);
			}

			chartObj[i].subscribe(wizardModel.generateChart);
		}
		
		if(chartObj.title && chartObj.title().length > 0){
			//chartObj = ko.observable(chartObj);
			wizardModel.chartList.push(chartObj);
			wizardModel.setMainObject(chartObj);
			return true;
		}
		
		else return false;
	};	
	
	wizardModel.addLRS = function(){
	
		var lrsObj = ko.toJS(wizardModel.lrsAddOpts);
		for(var key in lrsObj){
			lrsObj[key] = ko.observable(lrsObj[key]);
		}
		
		if(lrsObj.endpoint && lrsObj.endpoint().length > 0){
			wizardModel.lrsList.push(lrsObj);
			return true;
		}
		
		else return false;
	};
	
	//Chart configuration stuff
	wizardModel.addAggregationClick = function(obj){
		console.log(obj);
		var aggListLength = obj.aggregationList().length;
		obj.aggregationList.push({aggregationType: ko.observable('count'), aggregationField: ko.observable('')});
		obj.aggregationList()[aggListLength].aggregationType.subscribe(wizardModel.generateChart);
		obj.aggregationList()[aggListLength].aggregationField.subscribe(wizardModel.generateChart);
		
		return false;
	};
			
	wizardModel.generateChart = function(){
		wizardModel.saveToLocalStorage();
		var chart = ko.toJS(wizardModel.mainObject);
		if(wizardModel.hasData && chart.groupBy && wizardModel.lrsList().length > 0 && wizardModel.chartList().length > 0){
			if(chart.type == "bar"){				
				currentChart = dash.createBarChart({
					container: '#graphContainer svg',
					groupBy: chart.groupBy,
					pre: chart.where,
					customize: function(chart){
						chart.margin({'bottom': 100}).staggerLabels(false);
						chart.xAxis.rotateLabels(45);
						chart.xAxis.tickFormat(function(d){ return /[^\/]+$/.exec(d)[0]; });
					}
				});
				
				currentChart.draw();
				window.setTimeout(wizardModel.saveSVG, 1000);
			}
			else if(chart.type == "table"){
				currentTable = dash.createTable({
					container: '#tableDiv',
					groupBy: chart.groupBy,
					pre: chart.where,
					aggregate: generateAggregation(chart),
					customize: function(table){
						//table.vertical = false;
					}
				});
				currentTable.draw();
			}
			
			window.setTimeout(wizardModel.saveCSV, 1000);
		}
		
		function generateAggregation(chart){
		
			if(chart.aggregationList.length > 1){
				
				var tempArr = [chart.groupBy];
				for(var i = 0; i < chart.aggregationList.length; i++){
					if(chart.aggregationList[i].aggregationType == "count")
						tempArr.push(ADL.count(chart.aggregationList[i].aggregationField || chart.groupBy));
						
					else if(chart.aggregationList[i].aggregationType == "select")
						tempArr.push(ADL.select(chart.aggregationList[i].aggregationField || chart.groupBy));
						
					else if(chart.aggregationList[i].aggregationType == "count")
						tempArr.push(ADL.count(chart.aggregationList[i].aggregationField || chart.groupBy));
				}
				
				return ADL.multiAggregate.apply(ADL.multiAggregate, tempArr);
			}
			else{
			
			}
		}
	};
	
	//iterates over lrsList, pushes the name of each endpoint to a new array and returns it
	wizardModel.getEndpointNames = function(){
		var arr = [];
		for(var i = 0; i < wizardModel.lrsList().length; i++){
			arr.push(wizardModel.lrsList()[i].endpoint);
		}
		return arr;
	};	
	
	wizardModel.csvReady = ko.observable(false);
	wizardModel.saveCSV = function(){
		var obj = ko.toJS(wizardModel.mainObject);
		if(obj.type == "bar"){
			$('#csvDownload').attr('href', currentChart.getCSVDataURI());
		}
		else if(obj.type == "table"){
			$('#csvDownload').attr('href', currentTable.getCSVDataURI());
		}
		wizardModel.csvReady(true);
	};		
	wizardModel.svgReady = ko.observable(false);
	wizardModel.saveSVG = function(){
		var obj = ko.toJS(wizardModel.mainObject);
		if(obj.type == "bar"){
			$('#svgDownload').attr('href', currentChart.getSVGDataURI());
		}
		wizardModel.svgReady(true);
	};	
	wizardModel.saveToLocalStorage = function(){
		localStorage.wizard = ko.mapping.toJSON(wizardModel);
	};
	
	wizardModel.sampleStatement = ko.computed(function(){
		if(wizardModel.internalStatement){
			return JSON.stringify(ko.toJS(wizardModel.internalStatement), null, "    ").replace(/\"([a-zA-z\-]+)\":/gi, "$1:");
		}
		
		else return 'Sample xAPI statement not found';
	});
	
	if(!localStorage.wizard){
		//Configuration options displayed in modal for adding an lrs or chart
		wizardModel.lrsAddOpts = {
			endpoint: ko.observable(""),
			user: ko.observable(""),
			password: ko.observable("")
		};	
		
		wizardModel.chartAddOpts = {
			title: ko.observable(""),
			type: ko.observable(""),
			lrs: ko.observable(""),
			groupBy: 'verb.display.en-US',
			where: '',
			aggregationList: []
		};
		
		//Chart options
		wizardModel.hasData = false;
		
		//Chart and lrs lists
		wizardModel.chartList = ko.observableArray();
		wizardModel.lrsList = ko.observableArray();
		
		wizardModel.currentModalType = ko.observable('');
		wizardModel.internalStatement = '';
	}
	
	wizardModel.mainObject = ko.observable("");
	wizardModel.chartList.subscribe(wizardModel.generateChart);
	wizardModel.lrsList.subscribe(wizardModel.generateChart);
	
	//debugger;
	for(var i = 0; i < wizardModel.chartList().length; i++){
		for(var key in wizardModel.chartList()[i]){
			wizardModel.chartList()[i][key].subscribe(wizardModel.generateChart);
			console.log(key);
		}
	}
	//wizardModel.internalStatement.subscribe(wizardModel.generateChart);

	ko.applyBindings(wizardModel);
});