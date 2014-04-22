var request = require('request'),
	fs = require('fs'),
	uglify = require('uglify-js2'),
	lz = require('lz-string');

function getFromLRS(){
	statements = [];
	request.get('https://lrs.adlnet.gov/xAPI/statements?since=2014-03-18T12:44:24.695Z', {headers:{'X-Experience-API-Version':'1.0.0'}}, function more(err,res,body){
		body = JSON.parse(body);
		statements.push.apply(statements, body.statements);
		if(body.more !== ''){
			request.get('https://lrs.adlnet.gov'+body.more, {headers:{'X-Experience-API-Version':'1.0.0'}}, more);
		}
		else {
			pack(statements);
		}
	});
}

function getFromFile(file){
	pack( JSON.parse( fs.readFileSync(file) ) );
}

function pack(statements){
	var lib = uglify.minify('lz-string-1.3.3.js');
	var output = lib.code+'window.statements=JSON.parse(LZString.decompressFromBase64("'+lz.compressToBase64(JSON.stringify(statements))+'"));';
	console.log(output);
}

if( process.argv.length > 2 )
	getFromFile(process.argv[2]);
else
	getFromLRS();
