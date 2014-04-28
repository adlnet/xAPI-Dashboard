/********************************************************
 * 'where' helper functions
 * Rather lengthy, so moved to own file for readability
 ********************************************************/

function xpath(xpath, obj){
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

	function evaluate(obj){
		var curElem = elem;
		for(var i=0; i<parts.length; i++){
			if(curElem[parts[i]] !== undefined)
				curElem = curElem[parts[i]];
			else
				return null;
		}
		return curElem;
	}

	if(obj)
		return evaluate(obj);
	else
		return evaluate;
}


/*
 * Query format example
 *   stmts.where('verb.id = passed or verb.id = failed and result.score.raw >= 50');
 * 
 * Query grammar:
 *   value := parseInt | parseFloat | "(.*)"
 *   xpath := [A-Za-z0-9_]+(\.[A-za-z0-9_]+)*
 *   cond := <xpath> (=|!=|>|<|>=|<=) <value> | 'isdistinct(' <xpath> ')'
 *   andGrp := <expr> 'and' <expr> | <cond>
 *   orGrp := <expr> 'or' <expr> | <andGrp>
 *   expr := '(' <expr> ')' | <orGrp>
 */

function parseWhere(str)
{
	function expr(str)
	{
		// check for parens
		var match = /^\s*\((.*)\)\s*$/.exec(str);
		if(match){
			return expr(match[1]);
		}
		else {
			return orGrp(str);
		}
	}

	function matchedParens(str){
		var level = 0;
		for(var i=0; i<str.length; i++){
			if(str[i] === '('){
				level++;
			}
			else if(str[i] === ')'){
				level--;
			}
		}
		return level === 0;
	}

	function orGrp(str)
	{
		var parts = str.split(/\bor\b/);
		var expr1 = '', expr2 = '';
		for(var i=1; i<parts.length; i++)
		{
			var tempexpr1 = parts.slice(0,i).join('or');
			var tempexpr2 = parts.slice(i).join('or');
			if( tempexpr1 != '' && matchedParens(tempexpr1)
				&& tempexpr2 != '' && matchedParens(tempexpr2)
			){
				expr1 = tempexpr1;
				expr2 = tempexpr2;
				break;
			}
		}

		if( expr1 && expr2 )
		{
			var part1 = expr(expr1);
			var part2 = expr(expr2);

			if( part1 && part2 )
				return {or: [part1, part2]};
			else
				return null;
		}
		else {
			var ret = andGrp(str);
			if(ret) return ret;
			else return null;
		}
	}

	function andGrp(str)
	{
		var parts = str.split(/\band\b/);
		var expr1 = '', expr2 = '';
		for(var i=1; i<parts.length; i++)
		{
			var tempexpr1 = parts.slice(0,i).join('and');
			var tempexpr2 = parts.slice(i).join('and');
			if( tempexpr1 != '' && matchedParens(tempexpr1)
				&& tempexpr2 != '' && matchedParens(tempexpr2)
			){
				expr1 = tempexpr1;
				expr2 = tempexpr2;
				break;
			}
		}

		if( expr1 && expr2 )
		{
			var part1 = expr(expr1);
			var part2 = expr(expr2);

			if( part1 && part2 )
				return {and: [part1, part2]};
			else
				return null;
		}
		else {
			var ret = cond(str);
			if(ret) return ret;
			else return null;
		}
	}

	function cond(str){
		var match = /^\s*(.*?)\s*(!=|>=|<=|=|>|<)\s*(.*)\s*$/.exec(str);
		if(match)
		{
			var part1 = xpath(match[1]);
			var part2 = value(match[3]);
			if( part1 && part2 !== null ){
				switch(match[2]){
					case  '=':  return {op: 'eq',xpath:part1,value:part2};
					case '!=':  return {op:'neq',xpath:part1,value:part2};
					case  '<':  return {op: 'lt',xpath:part1,value:part2};
					case '<=':  return {op:'leq',xpath:part1,value:part2};
					case  '>':  return {op: 'gt',xpath:part1,value:part2};
					case '>=':  return {op:'geq',xpath:part1,value:part2};
					default: return null;
				}
			}
			else return null;
		}
		else return null;
	}

	function xpath(str){
		var match = /^\s*(\w+(?:\.\w+)*)\s*$/.exec(str);
		if(match)
			return match[1];
		else return null;
	}

	function value(str){
		var val = null;
		if(val = parseInt(str,10)){
			return val;
		}
		else if(val = parseFloat(str)){
			return val;
		}
		else if(val = /^\s*"(.*)"\s*$/.exec(str)){
			return val[1];
		}
		else {
			return null;
		}
	}

	return expr(str);
}


function evalConditions(parse, stmt)
{
	return true;
}

