"use strict";
/*
 * The Set class exposes various set operations in a friendly syntax
 */

function Set(arr)
{
	this._contents = arr ? arr.slice() : [];
}

// simple filter
Set.prototype.select = function(filter)
{
	return new Set(
		this._contents.reduce(
			function(sum,val){
				if( filter(val) )
					sum.push(val);
				return sum;
			}
		, [])
	);
};

// returns intersection of this and argument
Set.prototype.and = function(set)
{
	var ret = new Set();
	for(var i in this._contents){
		var obj = this._contents[i];
		if( set.contains(obj) )
			ret._contents.push(obj);
	}

	return ret;
};

// returns union of this and argument
Set.prototype.or = function(set)
{
	var ret = new Set(this._contents);
	ret._contents.push.apply(ret._contents, set._contents);
	return ret.select(Set.distinct());
};

// returns subtraction of this and argument
Set.prototype.not = function(set)
{
	var ret = new Set();
	for(var i in this._contents){
		var obj = this._contents[i];
		if( !set.contains(obj) )
			ret._contents.push(obj);
	}

	return ret;
}

// order the contents of the set by path
Set.prototype.orderBy = function(xpath, comparator)
{
	var parts = xpath ? xpath.split('.') : [];
	if( !comparator ){
		comparator = function(a,b){
			if(a<b) return -1;
			else if(a>b) return 1;
			else return 0;
		};
	}

	this._contents.sort(function(a,b)
	{
		var curA=a, curB=b;
		for(var i in parts){
			if( curA[parts[i]] && curB[parts[i]] ){
				curA = curA[parts[i]];
				curB = curB[parts[i]];
			}
			else if(curA[parts[i]]){
				return -1;
			}
			else if(curB[parts[i]]){
				return 1;
			}
			else {
				return 0;
			}
		}
		return comparator(curA,curB);
	});
	return this;
};

// the number of elements in the set
Set.prototype.count = function(){
	return this._contents.length;
}

// whether or not a particular item is in the set
Set.prototype.contains = function(item){
	return this._contents.indexOf(item) !== -1;
}



/*
 * Class methods to generate filters
 */

// filters by uniqueness of xpath field
Set.distinct = function(xpath)
{
	var seen = [];
	var parts = xpath ? xpath.split('.') : [];

	return function(elem)
	{
		var curElem = elem;
		for(var i=0; i<parts.length; i++){
			if( curElem[parts[i]] )
				curElem = curElem[parts[i]];
			else
				return false;
		}

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
Set.equals = function(xpath, value)
{
	var parts = xpath ? xpath.split('.') : [];
	return function(elem){
		var curElem = elem;
		for(var i=0; i<parts.length; i++){
			if(curElem[parts[i]])
				curElem = curElem[parts[i]];
			else
				return false;
		}
		return curElem === value;
	}
};
