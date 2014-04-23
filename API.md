# xAPI Dashboard API Reference

## ADL.XAPIDashboard

Used to query the LRS and generate visualizations from the returned xAPI data.

### Properties

<a id='statements'></a>
#### statements

Type: `ADL.Collection`

Stores the statements retrieved by the [fetchAllStatements](#fetchAllStatements) method. Is also used as the database for generated graphs.



### Methods

<a id='fetchAllStatements'></a>
#### fetchAllStatements(query, [wrapper], callback)

Fetches statements from an LRS until no `more` are returned, and stores them in the `statements` object.

##### Arguments:

* `query` (`Object`)
	* An object containing [xAPI query arguments](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#stmtapiget)
* `wrapper` (`XAPIWrapper`)(optional)
	* The instance of the XAPIWrapper to use for querying
	* Defaults to the global `ADL.XAPIWrapper` if omitted
* `callback` (`function`)(optional)
	* A function that is called once all statements have been fetched from the LRS
	* Is passed the array of fetched statements

##### Returns:

*(nothing)*


<a id='clearSavedStatements'></a>
#### clearSavedStatements()

Empties the `statements` object.

##### Arguments:

*(none)*

##### Returns:

*(nothing)*


<a id='addStatements'></a>
#### addStatements(statementArray)

Adds new statements to the `statements` object.

##### Arguments:

* `statementArray` (`Array`)
	* An array of statements to be added

##### Returns:

*(nothing)*

