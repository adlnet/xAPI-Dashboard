/********************************************************
 * 'where' helper functions
 * Rather lengthy, so moved to own file for readability
 ********************************************************/
"use strict";

/*
 * Retrieves some deep value at path from an object
 */
function xpath(path,obj)
{
	// if nothing to search, return null
	if(!obj){
		return null;
	}

	// if no descent, just return object
	else if(!path){
		return obj;
	}

	else {
		var parts = /^([^\.]+)(?:\.(.+))?$/.exec(path);
		var scoped = parts[1], rest = parts[2];
		return xpath(rest, obj[scoped]);
	}
}

/*
 * Query format example
 *   stmts.where('verb.id = passed or verb.id = failed and result.score.raw >= 50');
 * 
 * Query grammar:
 *   value := parseInt | parseFloat | "(.*)"
 *   xpath := [A-Za-z0-9_]+(\.[A-za-z0-9_]+)*
 *   cond := <xpath> (=|!=|>|<|>=|<=) <value>
 *   andGrp := <expr> 'and' <expr> | <cond>
 *   orGrp := <expr> 'or' <expr> | <andGrp>
 *   expr := '(' <expr> ')' | <orGrp>
 */

var PARSE_ERROR = NaN;

function parseWhere(str)
{
	// expr := '(' <expr> ')' | <orGrp>
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

	// check if a string has the same number of left and right parens
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

	// orGrp := <expr> 'or' <expr> | <andGrp>
	function orGrp(str)
	{
		// loop over each possible combo of or arguments
		var parts = str.split(/\bor\b/);
		var expr1 = '', expr2 = '';
		for(var i=1; i<parts.length; i++)
		{
			var tempexpr1 = parts.slice(0,i).join('or');
			var tempexpr2 = parts.slice(i).join('or');

			// if both args have matched parens, continue
			if( tempexpr1 != '' && matchedParens(tempexpr1)
				&& tempexpr2 != '' && matchedParens(tempexpr2)
			){
				expr1 = tempexpr1;
				expr2 = tempexpr2;
				break;
			}
		}

		// parse the two operands
		if( expr1 && expr2 )
		{
			var part1 = expr(expr1);
			var part2 = expr(expr2);

			if( part1 && part2 )
				return {or: [part1, part2]};
			else
				return PARSE_ERROR;
		}
		// or was not found, so try ands
		else {
			var ret = andGrp(str);
			if(ret) return ret;
			else return PARSE_ERROR;
		}
	}

	// andGrp := <expr> 'and' <expr> | <cond>
	function andGrp(str)
	{
		// loop over each possible combo of and arguments
		var parts = str.split(/\band\b/);
		var expr1 = '', expr2 = '';
		for(var i=1; i<parts.length; i++)
		{
			var tempexpr1 = parts.slice(0,i).join('and');
			var tempexpr2 = parts.slice(i).join('and');

			// if both args have matched parens, continue
			if( tempexpr1 != '' && matchedParens(tempexpr1)
				&& tempexpr2 != '' && matchedParens(tempexpr2)
			){
				expr1 = tempexpr1;
				expr2 = tempexpr2;
				break;
			}
		}

		// parse operands
		if( expr1 && expr2 )
		{
			var part1 = expr(expr1);
			var part2 = expr(expr2);

			if( part1 && part2 )
				return {and: [part1, part2]};
			else
				return PARSE_ERROR;
		}
		// no and found, try cond
		else {
			var ret = cond(str);
			if(ret) return ret;
			else return PARSE_ERROR;
		}
	}

	// cond := <xpath> (=|!=|>|<|>=|<=) <value>
	function cond(str)
	{
		// check for an operator
		var match = /^\s*(.*?)\s*(!=|>=|<=|=|>|<)\s*(.*)\s*$/.exec(str);
		if(match)
		{
			// parse operands
			var part1 = xpath(match[1]);
			var part2 = value(match[3]);
			if( part1 ){
				// parse operator
				switch(match[2]){
					case  '=':  return {op: 'eq',xpath:part1,value:part2};
					case '!=':  return {op:'neq',xpath:part1,value:part2};
					case  '<':  return {op: 'lt',xpath:part1,value:part2};
					case '<=':  return {op:'leq',xpath:part1,value:part2};
					case  '>':  return {op: 'gt',xpath:part1,value:part2};
					case '>=':  return {op:'geq',xpath:part1,value:part2};
					default: return PARSE_ERROR;
				}
			}
			// fail if operator or operand doesn't parse
			else return PARSE_ERROR;
		}
		else return PARSE_ERROR;
	}

	// xpath := [A-Za-z0-9_]+(\.[A-za-z0-9_]+)*
	function xpath(str){
		var match = /^\s*([^\.]+(?:\.[^\.]+)*)\s*$/.exec(str);
		if(match)
			return match[1];
		else return PARSE_ERROR;
	}

	// value := parseInt | parseFloat | "(.*)"
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
		else if(str.trim() === 'null'){
			return null;
		}
		else return PARSE_ERROR;
	}

	var ret = expr(str);
	return ret != NaN ? ret : null;
}


function evalConditions(parse, stmt)
{
	// check for missing logical operands
	if(Array.isArray(parse.and) && parse.and.length === 0){
		return true;
	}
	else if(Array.isArray(parse.or) && parse.or.length === 0){
		return false;
	}

	// check for conditions, and if so evaluate
	else if(parse.op){
		switch(parse.op){
			case 'eq': return xpath(parse.xpath,stmt) === parse.value;
			case 'neq': return xpath(parse.xpath,stmt) !== parse.value;
			case 'geq': return xpath(parse.xpath,stmt) >= parse.value;
			case 'leq': return xpath(parse.xpath,stmt) <= parse.value;
			case 'lt': return xpath(parse.xpath,stmt) < parse.value;
			case 'gt': return xpath(parse.xpath,stmt) > parse.value;
			default: return false;
		}
	}
	// check for and, and if so evaluate
	else if(parse.and){
		// evaluate first operand
		if( !evalConditions(parse.and[0], stmt) )
			return false;
		// evaluate remaining operands
		else
			return evalConditions({and: parse.and.slice(1)}, stmt);
	}
	// check for or, and if so evaluate
	else if(parse.or){
		// evaluate first operand
		if( evalConditions(parse.or[0], stmt) )
			return true;
		// evaluate remaining operands
		else
			return evalConditions({or: parse.or.slice(1)}, stmt);
	}
	// fail for any other structures. shouldn't happen
	else {
		return false;
	}
}

