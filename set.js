"use strict";
/*
 * The Set class exposes various set operations in a friendly syntax
 */

function Set(arr)
{
	this._contents = [];
	for(var i in arr)
		this._contents.push(arr[i]);
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
	
};

// returns union of this and argument
Set.prototype.or = function(set)
{
	
};

// returns subtraction of this and argument
Set.prototype.not = function(set)
{
	
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
