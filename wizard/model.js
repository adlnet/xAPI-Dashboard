var wrapper = ADL.XAPIWrapper,
	dash = new ADL.XAPIDashboard({}),
	set = ADL.Collection,
	wizardModel;
	
$(document).ready(function(){
	wizardModel = new function(){

		var self = this;
		self.ko = ko;
		
		//functions to handle clicking within modal
		
		self.setModalType = function(type){
			return function(){
				self.currentModalType(type);
				console.log(self.currentModalType());
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
				self.mainObject(chartObj);
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
		
		//Configuration options displayed modal for adding an lrs or chart
		
		self.lrsAddOpts = {
			endpoint: ko.observable(),
			username: ko.observable(),
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
		
		self.getEndpointNames = function(){
			var arr = [];
			for(var i = 0; i < self.lrsList().length; i++){
				arr.push(self.lrsList()[i]().endpoint);
			}
			return arr;
		};
		
		self.currentModalType = ko.observable('');
		self.mainObject = ko.observable();
		
	}();

	console.log(wizardModel);

	ko.applyBindings(wizardModel);
});