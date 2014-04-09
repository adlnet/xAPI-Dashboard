var ADL = ADL || {};
ADL.xAPIDashboard = new (function(){
	
	var self = this;
	
	self.context;
	self.rawStatements;
	self.chart;
	
	self.init = function(conf, context, cb){
		ADL.XAPIWrapper.changeConfig(conf);
		ADL.XAPIWrapper.getStatements(null, null, function(data){
			
			try{
				data = JSON.parse(data.response);
			}
			catch(e){
				console.error("Error parsing JSON data", data.response);
				return;
			}
			
			self.rawStatements = data.statements;
			console.log(self.rawStatements);
			
			self.context = context;
			self.chart = new Chart(self.context);
			
			if(cb){
				cb();
			}
		});
	};
	
	self.aggregate = function(xAPIField){
		
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
			]};

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
