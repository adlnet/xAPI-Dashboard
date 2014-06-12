
%lex

%%

[0-9]+(\.[0-9]+)?	return 'NUMBER';
[A-Za-z0-9]+		return 'XPATH';
"+"					return 'PLUS';
"-"					return 'MINUS';
"*"					return 'TIMES';
"/"					return 'DIVIDED_BY';
"("					return 'OPEN_PAREN';
")"					return 'CLOSE_PAREN';
<<EOF>>				return 'END';
[ \t\n]				;
.					;

/lex

%left PLUS MINUS
%left TIMES DIVIDED_BY

%start expression

%%

expression:
	expr END						{ console.log($1); return $1; }
	;

expr:
	OPEN_PAREN expr CLOSE_PAREN		{ console.log("paren found"); $$ = $2; }
	| add_op						{ $$ = $1; }
	;

add_op:
	expr PLUS expr					{ console.log("addition found"); $$ = $1 + $3; }
	| mult_op						{ $$ = $1; }
	;

mult_op:
	expr TIMES expr					{ console.log("mult found"); $$ = $1 * $3; }
	| value							{ $$ = $1; }
	;

value:
	NUMBER							{ console.log("number found", yytext); $$ = parseFloat(yytext); }
	| XPATH							{ console.log("xpath found"); }
	;
