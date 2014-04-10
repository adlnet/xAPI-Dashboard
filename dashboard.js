"use strict";

var ADL = ADL || {};
ADL.XAPIDashboard = new (function(){
	
	var self = this;
	
	self.chartType;
	self.raphael;
	self.set;
	
	self.x;
	self.y;	
	self.width;
	self.height;

	self.init = function(type, x, y, width, height){		
		
		self.x = x ? x : 0;
		self.y = y ? y : 0;
		self.height = height ? height : 0;
		self.width = width ? width : 0;
		
		// Creates canvas 640 × 480 at 10, 50
		self.raphael = Raphael(self.x, self.y, self.width, self.height);
		self.chartType = /^(piechart|dotchart|linechart|barchart)$/.test(type) ? type : 'barchart';
		self.set = new Set();
	};
	
	self.getAllStatements = function(query, cb){
	
		ADL.XAPIWrapper.getStatements(null, null, function getMore(r){
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
	self.clearSavedStatements = function(){};
	
	self.addStatements = function(statementsArr){
		if(statementsArr.response){
			try{
				statementsArr = JSON.parse(statementsArr.response).statements;
			}
			catch(e){
				console.error("Error parsing JSON data", statementsArr.response);
				return;
			}
		}

		self.set = self.set.union(new Set(statementsArr));
	};
	
	self.sum = function(xAPIFieldA, xAPIFieldB){
	
		return [];
	};
	
	self.count = function(xAPIField){
		
		var b = self.set.groupBy(xAPIField, function(groupSet){ return groupSet.count(); });
		var data = [b.contents.map(function(element){
			return element.result;
		})];

		self.raphael[self.chartType](self.x, self.y, self.width, self.height, data);
	}	
})();
