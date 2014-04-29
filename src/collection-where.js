/********************************************************
 * 'where' helper functions
 * Rather lengthy, so moved to own file for readability
 ********************************************************/
"use strict";

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
		var curElem = obj;
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

var PARSE_ERROR = NaN;

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
				return PARSE_ERROR;
		}
		else {
			var ret = andGrp(str);
			if(ret) return ret;
			else return PARSE_ERROR;
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
				return PARSE_ERROR;
		}
		else {
			var ret = cond(str);
			if(ret) return ret;
			else return PARSE_ERROR;
		}
	}

	function cond(str){
		var match = /^\s*(.*?)\s*(!=|>=|<=|=|>|<)\s*(.*)\s*$/.exec(str);
		if(match)
		{
			var part1 = xpath(match[1]);
			var part2 = value(match[3]);
			if( part1 ){
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
			else return PARSE_ERROR;
		}
		else return PARSE_ERROR;
	}

	function xpath(str){
		var match = /^\s*(\w+(?:\.\w+)*)\s*$/.exec(str);
		if(match)
			return match[1];
		else return PARSE_ERROR;
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
		else if(str.trim() === 'null'){
			return null;
		}
		else return PARSE_ERROR;
	}

	var ret = expr(str);
	return ret != NaN ? ret : null;
}


function evalConditions(parse, stmt, debug)
{
	if(debug) console.log(JSON.stringify(parse));
	if(Array.isArray(parse.and) && parse.and.length === 0){
		if(debug) console.log('0-length and');
		return true;
	}
	else if(Array.isArray(parse.or) && parse.or.length === 0){
		if(debug) console.log('0-length or');
		return false;
	}
	else if(parse.op){
		if(debug) console.log('Eval cond with val '+xpath(parse.xpath,stmt));
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
	else if(parse.and){
		if(debug) console.log('Eval and');
		if( !evalConditions(parse.and[0], stmt, debug) )
			return false;
		else
			return evalConditions({and: parse.and.slice(1)}, stmt, debug);
	}
	else if(parse.or){
		if(debug) console.log('Eval or');
		if( evalConditions(parse.or[0], stmt, debug) )
			return true;
		else
			return evalConditions({or: parse.or.slice(1)}, stmt, debug);
	}
	else {
		if(debug) console.log('Type not recognized');
		return false;
	}
}

