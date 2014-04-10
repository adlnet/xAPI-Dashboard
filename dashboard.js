"use strict";

var ADL = ADL || {};
ADL.XAPIDashboard = new (function(){
	
	var self = this;
	
	self.context;
	self.rawStatements = [];
	self.chart;
	
	self.init = function(context){		
		self.context = context;
		self.chart = new Chart(self.context);
	};
	
	self.clearSavedStatements = function(){
		self.rawStatements = [];
	};
	
	self.addStatements = function(statementsArr){
		if(statementsArr.response){
			try{
				statementsArr = JSON.parse(statementsArr.response).statements;
			}
			catch(e){
				console.error("Error parsing JSON data", data.response);
				return;
			}
		}
		
		self.rawStatements.push.apply(self.rawStatements, statementsArr);
	};
	
	self.distinct = function(xAPIFieldA, xAPIFieldB, limit){
		var	keyA, keyB;
		var tempRelations = {};
		
		var obj = {
			originalKey: xAPIFieldA + ', ' + xAPIFieldB, 
			labels: [],
			datasets: [
				{
					fillColor : "rgba(151,187,205,0.5)",
					strokeColor : "rgba(151,187,205,1)",
					data: [] 
				}
			]
		};		
		

		return obj;
	};
	
	self.count = function(xAPIField, limit){
		
		var	statementKey;
		var obj = {
			originalKey: xAPIField, 
			labels: [],
			datasets: [
				{
					fillColor : "rgba(151,187,205,0.5)",
					strokeColor : "rgba(151,187,205,1)",
					data: [] 
				}
			]
		};

		return obj;
	}
	
	var getProperty = function(obj, str){
		var tempArr = str.split('.'),
			returnObj = obj;
		
		for(var i = 0; i < tempArr.length; i++){
			returnObj = returnObj[tempArr[i]];
		}
		
		return returnObj;
	}
	
})();
