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
		
		for(var i = 0; i < self.rawStatements.length; i++){
			
			keyA = getProperty(self.rawStatements[i], xAPIFieldA);
			keyB = getProperty(self.rawStatements[i], xAPIFieldB);
			
			if(obj.labels.indexOf(keyA) >= 0){
				if(tempRelations[keyA].indexOf(keyB) < 0){
					tempRelations[keyA].push(keyB);
					obj.datasets[0].data[obj.labels.indexOf(keyA)]++;
				}
			}
			
			else{
				tempRelations[keyA] = [keyB];
				
				obj.labels.push(keyA);
				obj.datasets[0].data.push(1);
			}
		}

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

		for(var i = 0; i < self.rawStatements.length; i++){
			
			statementKey = getProperty(self.rawStatements[i], xAPIField);
			if(obj.labels.indexOf(statementKey) >= 0){
				obj.datasets[0].data[obj.labels.indexOf(statementKey)]++;
			}
			
			else{
				obj.labels.push(statementKey);
				obj.datasets[0].data.push(1);
			}
		}

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
