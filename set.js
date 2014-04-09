/*
 * The Set class exposes various set operations in a friendly syntax
 */

function Set(arr)
{
	this.contents = arr;

	
}

// simple reduce
Set.prototype.select = function(filter)
{
	
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
	var parts = xpath.split('.');

	return function(elem)
	{
		curElem = elem;
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
	
};
