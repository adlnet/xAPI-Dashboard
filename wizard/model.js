window.onload = function(){
	var wizardModel = new (function(){

		var self = this;
		
		
		self.addLRS = function(){
		
			console.log("test");
			self.lrsConfigs.push(ko.observable({endpoint: '', user: '', password: ''}));
			
		};
		
		self.setModalType = function(type){
			return function(){
				self.currentModalType(type);
				console.log(self.currentModalType());
			};
		}
		
		self.lrsConfigs = ko.observableArray();
		self.currentModalType = ko.observable('');
		
	})();

	console.log(wizardModel);

	ko.applyBindings(wizardModel);
}