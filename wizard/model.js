var wrapper = ADL.XAPIWrapper,
	dash = new ADL.XAPIDashboard({}),
	set = ADL.Collection,
	wizardModel;
	
$(document).ready(function(){
	wizardModel = new function(){

		var self = this;
		self.ko = ko;
		
		self.setMainObject = function(obj){
		

			self.mainObject(obj);
			var lrsList = ko.toJS(self.lrsList);
			
			for(var i = 0; i < lrsList.length; i++){
				if(lrsList[i].endpoint == obj().lrs){
					
					wrapper.changeConfig(lrsList[i]);
					break;
				}
			}
			
			wrapper.getStatements({limit: 1}, null, function(statements){
				var statement;
				try{
					statement = JSON.parse(statements.response);
				}
				catch(e){
					console.error("Error parsing xAPI statement", e);
				}
				
				self.internalStatement(statement);
			});
			
			//Will need to add a callback here to ensure a graph isn't generated before fetching is complete
			dash.fetchAllStatements();
		};
		
		//functions to handle clicking within modal
		
		self.setModalType = function(type){
			return function(){
				self.currentModalType(type);
				console.log(self.currentModalType());
				
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
							
							self.groupBy(outStr);
							$('#myModal').modal('hide');
							
						});
					});
				}
			};
		};
		
		self.modalSaveClick = function(){
			if(self.currentModalType() === "Add LRS" && self.addLRS()){
				$('#myModal').modal('hide');
			}
			else if(self.currentModalType() === "Add Chart" && self.addChart()){
				$('#myModal').modal('hide');
			}
			
			console.log("save click");
		};
		
		self.addChart = function(){
		
			var chartObj = ko.toJS(self.chartAddOpts);
			if(chartObj.title && chartObj.title.length > 0){
				chartObj = ko.observable(chartObj);
				self.chartList.push(chartObj);
				self.setMainObject(chartObj);
				return true;
			}
			
			else return false;
		};	
		
		self.addLRS = function(){
		
			var lrsObj = ko.toJS(self.lrsAddOpts);
			
			if(lrsObj.endpoint && lrsObj.endpoint.length > 0){
				self.lrsList.push(ko.observable(lrsObj));
				return true;
			}
			
			else return false;
		};
		
		//Chart configuration stuff
				
		self.generateChart = function(){
		
			if(self.groupBy() && self.aggregationType() && self.lrsList().length > 0 && self.chartList().length > 0){
				
				dash.genBarGraph('#graphContainer svg', {
					groupField: self.groupBy(),
					customize: function(chart){
						chart.margin({'bottom': 100}).staggerLabels(false);
						chart.xAxis.rotateLabels(45);
						chart.xAxis.tickFormat(function(d){ return /[^\/]+$/.exec(d)[0]; });
					}
				});
			}		
		};
		
		self.groupBy = ko.observable();
		self.aggregationType = ko.observable();
		self.groupBy.subscribe(self.generateChart);
		self.aggregationType.subscribe(self.generateChart);
		
		//Configuration options displayed modal for adding an lrs or chart
		
		self.lrsAddOpts = {
			endpoint: ko.observable(),
			user: ko.observable(),
			password: ko.observable()
		};	
		
		self.chartAddOpts = {
			title: ko.observable(),
			type: ko.observable(),
			lrs: ko.observable()
		};
		
		//Chart and lrs lists
		
		self.chartList = ko.observableArray();
		self.lrsList = ko.observableArray();
		self.chartList.subscribe(self.generateChart);
		self.lrsList.subscribe(self.generateChart);
		
		self.getEndpointNames = function(){
			var arr = [];
			for(var i = 0; i < self.lrsList().length; i++){
				arr.push(self.lrsList()[i]().endpoint);
			}
			return arr;
		};
		
		self.currentModalType = ko.observable('');
		self.mainObject = ko.observable();
		
		self.internalStatement = ko.observable(JSON.parse('{"statements": [{"verb": {"id": "http://vwf.adlnet.gov/xapi/verbs/logged_in", "display": {"en-US": "logged into"}}, "timestamp": "2014-04-23T10:12:13.636101+00:00",'+
		'"object": {"definition": {"moreInfo": "http://vwf.adlnet.gov/adl/sandbox/world/HqLQRXFNNZwC48nl", "type": "http://vwf.adlnet.gov/xapi/world", "name": {"en-US": "Town Square"}, "description": {"en-US": "This world'+
		'shows many features, included animated meshes, particle systems, and path follow behaviors. There is also some scripting when you click on various objects. Plus, it loads some fairly complex 3D models."}}, "id":'+
		'"http://vwf.adlnet.gov/xapi/HqLQRXFNNZwC48nl", "objectType": "Activity"}, "actor": {"account": {"homePage": "http://vwf.adlnet.gov", "name": "GreenGoosie"}, "name": "GreenGoosie", "objectType": "Agent"}, "stored":'+
		'"2014-04-23T10:12:13.636101+00:00", "version": "1.0.0", "authority": {"mbox": "mailto:steve.vergenz.ctr@adlnet.gov", "name": "lrsuser", "objectType": "Agent"}, "context": {"platform": "virtual world",'+
		'"contextActivities": {"parent": [{"id": "http://vwf.adlnet.gov/xapi/virtual_world_sandbox", "objectType": "Activity"}]}}, "id": "bd6d89d0-cacf-11e3-844c-005056be3417"}], "more":'+
		'"/xapi/statements/more/cde24f7656d1047ab5b5f1b570582ae0"}'));
		
		self.sampleStatement = ko.computed(function(){
			if(self.internalStatement() && self.internalStatement().statements && self.internalStatement().statements[0]){
				return JSON.stringify(self.internalStatement().statements[0], null, "    ").replace(/\"([a-zA-z\-]+)\":/gi, "$1:");
			}
			
			else return 'Sample xAPI statement not found';
		});
	
	}();

	console.log(wizardModel);

	ko.applyBindings(wizardModel);
});