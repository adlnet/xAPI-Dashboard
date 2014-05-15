# xAPI Dashboard API Reference

## ADL.XAPIDashboard

Used to query the LRS and generate visualizations from the returned xAPI data.

### Properties

<a id='statements'></a>
#### statements

Type: `ADL.Collection`

Stores the statements retrieved by the [fetchAllStatements](#fetchAllStatements) and [addStatements](#addStatements) methods. Is also used as the database for generated graphs.



### Methods

<a id='addStatements'></a>
#### addStatements(statementArray)

Adds new statements to the `statements` object.

##### Arguments:

`statementArray` (`Array`)  
An array of statements to be added

##### Returns:

*(nothing)*



<a id='clearSavedStatements'></a>
#### clearSavedStatements()

Empties the `statements` object.

##### Arguments:

*(none)*

##### Returns:

*(nothing)*



<a id='fetchAllStatements'></a>
#### fetchAllStatements(query, [wrapper], [callback])

Fetches statements from an LRS until no `more` are returned, and stores them in the `statements` object.

##### Arguments:

`query` (`Object`)  
An object containing [xAPI query arguments](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#stmtapiget)

`wrapper` (`XAPIWrapper`)(optional)  
The instance of the XAPIWrapper to use for querying.
Defaults to the global `ADL.XAPIWrapper` if omitted.

`callback` (`function(statements)`)(optional)  
A function that is called once all statements have been fetched from the LRS.
Is passed the array of fetched statements.

##### Returns:

*(nothing)*



<a id='genBarGraph'></a>
#### genBarGraph(container, options)

Generates an SVG chart in the given `container` using the `options` specified.

##### Arguments:

`container` (`string`)  
A selector string indicating where in the DOM the chart should be placed.

`options` (`Object`)
An object containing some/all of the following properties:

* `pre` (`function(data)`)(optional)  
	Preprocesses the raw xAPI data however the user chooses. Takes in [statements](#statements), and must output another dataset, usually some filtered subset of the input.
* `aggregate` (`function(data)`)(optional)  
	Groups the data in preparation for chart generation. Takes in the preprocessed data, and should output a `Collection` of objects with an `in` and an `out` property, which map to the *x* and *y* axes on the graph. If omitted, a sensible default will be substituted for the graph type.

##### Returns:

*(nothing)*



