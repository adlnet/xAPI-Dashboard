"use strict";
/*
 * The Collection class exposes various set operations in a friendly syntax
 */
(function(ADL){

	function Collection(arr)
	{
		this.contents = [];
		for(var i in arr){
			if( this.contents.indexOf(arr[i]) === -1 ){
				this.contents.push(arr[i]);
			}
		}
	}

	// simple filter
	Collection.prototype.select = function(filter)
	{
		return new Collection(
			this.contents.reduce(
				function(sum,val,index,array){
					if( filter(val,index,array) )
						sum.push(val);
					return sum;
				}
			, [])
		);
	};

	// returns intersection of this and argument
	Collection.prototype.intersect = function(set)
	{
		var ret = new Collection();
		for(var i in this.contents){
			var obj = this.contents[i];
			if( set.contains(obj) )
				ret.contents.push(obj);
		}

		return ret;
	};

	// returns union of this and argument
	Collection.prototype.union = function(set)
	{
		var ret = new Collection(this.contents);
		ret.contents.push.apply(ret.contents, set.contents);
		return ret.selectDistinct();
	};

	// returns subtraction of this and argument
	Collection.prototype.without = function(set)
	{
		var ret = new Collection();
		for(var i in this.contents){
			var obj = this.contents[i];
			if( !set.contains(obj) )
				ret.contents.push(obj);
		}

		return ret;
	}

	// aggregate and run callback
	Collection.prototype.groupBy = function(xpath, cb)
	{
		var pathVals = this.selectDistinct(xpath).transform(Collection.getValue(xpath)).contents;
		var ret = new Collection();
		for( var i in pathVals )
		{
			var val = pathVals[i];
			var group = this.selectEqual(xpath,val);
			ret.contents.push({
				'in': val,
				'out': cb(group),
				'sample': group.contents[0]
			});
		}

		return ret;
	};
	
	// aggregate and run callback
	Collection.prototype.groupByRange = function(xpath, start, end, interval, cb)
	{
		//Will assume only date for now
		//add logic to support other types
		var start = Date.parse(start),
			end = Date.parse(end);
			
		var startObj, nextIntObj;
		var ret = new Collection();

		while( start < end )
		{
			startObj = new Date(start);
			nextIntObj = new Date(start + interval);

			ret.contents.push({
				'groupValue': startObj.toISOString() + ", " + nextIntObj.toISOString(),
				'result': cb(this.selectRange(xpath, startObj.toISOString(), nextIntObj.toISOString()))
			});
			
			start += interval;
		}
		
		return ret;
	};

	// order the contents of the set by path
	Collection.prototype.orderBy = function(xpath, comparator)
	{
		var sortFn;
		if( typeof(comparator) === 'function' )
			sortFn = comparator;
		else {
			sortFn = function(a,b){
				if( !a || a<b )
					return comparator === 'descending' ? 1 : -1;
				else if( !b || a>b )
					return comparator === 'descending' ? -1 : 1;
				else return 0;
			};
		}

		var path = Collection.getValue(xpath);
		var ret = new Collection(this.contents);
		ret.contents.sort(function(a,b){
			return sortFn(path(a), path(b));
		});
		return ret;
	};

	// the number of elements in the set (or subset)
	Collection.prototype.count = function(xpath)
	{
		if(xpath){
			return this.selectDistinct(xpath).count();
		}
		else {
			return this.contents.length;
		}
	}

	// the total of a particular field
	Collection.prototype.sum = function(xpath)
	{
		var sum = 0;
		for( var i in this.contents ){
			sum += Collection.getValue(xpath)(this.contents[i]);
		}

		return sum;
	}

	// the largest value of field in the set
	Collection.prototype.max = function(xpath)
	{
		var max = -Infinity;
		for( var i in this.contents ){
			var val = Collection.getValue(xpath)(this.contents[i]);
			if( val > max )
				max = val;
		}
		return max;
	}

	// the smallest value of field in the set
	Collection.prototype.min = function(xpath)
	{
		var min = Infinity;
		for( var i in this.contents ){
			var val = Collection.getValue(xpath)(this.contents[i]);
			if( val < min )
				min = val;
		}
		return min;
	}

	// the average of a particular field
	Collection.prototype.average = function(xpath)
	{
		return this.sum(xpath)/this.count();
	};

	// whether or not a particular item is in the set
	Collection.prototype.contains = function(item){
		return this.contents.indexOf(item) !== -1;
	}

	// returns a new set with xfrm applied to each element
	// xfrm takes (element, index, origArray)
	Collection.prototype.transform = function(xfrm){
		return new Collection( this.contents.map(xfrm) );
	};

	Collection.prototype.selectDistinct = function(xpath){
		return this.select(Collection.distinct(xpath));
	};

	Collection.prototype.selectEqual = function(xpath, value){
		return this.select(Collection.equals(xpath,value));
	};
	Collection.prototype.selectRange = function(xpath, startValue, endValue){
		return this.select(Collection.range(xpath,startValue, endValue));
	};



	/*
	 * Class methods to generate filters
	 */

	// filters by uniqueness of xpath field
	Collection.distinct = function(xpath)
	{
		var seen = [];

		return function(elem)
		{
			var curElem = Collection.getValue(xpath)(elem);
			
			if( seen.indexOf(curElem) === -1 ){
				seen.push(curElem);
				return true;
			}
			else {
				return false;
			}
		};
	};

	// filters by elem[xpath] == value
	Collection.equals = function(xpath, value)
	{
		return function(elem){
			return Collection.getValue(xpath)(elem) === value;
		}
	};
	
	// filter to get first n elements
	Collection.first = function(n)
	{
		return function(elem, index){
			return index < n;
		};
	};	
	
	// filter to get last n elements
	Collection.last = function(n)
	{
		return function(elem, index, array){
			return index >= array.length - n;
		};
	};

	// return elem s.t. startVal <= elem < endVal
	Collection.range = function(xpath, startVal, endVal)
	{
		return function(elem, index, array){
			var val = Collection.getValue(xpath)(elem);
			return startVal <= val && val < endVal;
		}
	};


	// transform to get xpath values out of a set
	Collection.getValue = function(xpath)
	{
		var parts = [];
		if(xpath){	
			parts = xpath.split('.');
			var i=0; while(i<parts.length){
				if(/\\$/.test(parts[i]) && parts[i+1])
					parts.splice(i, 2, /(.*)\\$/.exec(parts[i])[1]+'.'+parts[i+1]);
				else
					i++;
			}
		}

		return function(elem){
			var curElem = elem;
			for(var i=0; i<parts.length; i++){
				if(curElem[parts[i]])
					curElem = curElem[parts[i]];
				else
					return null;
			}
			return curElem;
		};
	};

	ADL.Collection = Collection;

})(window.ADL = window.ADL || {});
