
	/*
	 * Parse tree format
	 * Odd depth is an OR, even depth is an AND
	 * [
	 *  	['eq','verb.id','passed'],
	 *  	[
	 *  		['eq','verb.id','failed'],
	 *  		['geq','result.score.raw',50]
	 *  	]
	 * ]
	 * 
	 * Query format example
	 *   stmts.where('verb.id = passed or verb.id = failed and result.score.raw >= 50');
	 * 
	 * Query grammar:
	 *   value := \b( [0-9]+(.[0-9]+)? | ("|').*\1 | null )\b
	 *   xpath := [A-Za-z0-9]+(.[A-za-z0-9]+)*
	 *   cond := <xpath> (=|!=|>|<|>=|<=) <value> | 'isdistinct(' <xpath> ')'
	 *   andGrp := <expr> 'and' <expr> | <cond>
	 *   orGrp := <expr> 'or' <expr> | <andGrp>
	 *   expr := '(' <expr> ')' | <orGrp>
	 */

function parseWhere(str)
{
	function expr(str)
	{
		console.log('testing for expr: '+str);
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
		console.log('testing for or: '+str);
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
		console.log('testing for and: '+str);
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
		console.log('testing for cond: '+str);
		var match = /^\s*(.*?)\s*(!=|>=|<=|=|>|<)\s*(.*)\s*$/.exec(str);
		if(match)
		{
			var part1 = xpath(match[1]);
			var part2 = value(match[3]);
			if( part1 && part2 !== null ){
				var ret = [];
				if(     match[2] === '=')  ret.push('eq');
				else if(match[2] === '!=') ret.push('neq');
				else if(match[2] === '>')  ret.push('gt');
				else if(match[2] === '>=') ret.push('geq');
				else if(match[2] === '<')  ret.push('lt');
				else if(match[2] === '<=') ret.push('leq');
				ret.push(part1);
				ret.push(part2);
				return ret;
			}
			else return null;
		}
		else return null;
	}

	function xpath(str){
		console.log('testing for xpath: '+str);
		var match = /^\s*(\w+(?:\.\w+)*)\s*$/.exec(str);
		if(match)
			return match[1];
		else return null;
	}

	function value(str){
		console.log('testing for value: '+str);
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

