# xAPI Dashboard API Reference

There are several classes necessary to create charts, and they are documented below. From a high level, the `XAPIDashboard` class retrieves, stores, and distributes your xAPI data, the `Chart` class encapsulates a particular visualization that uses the Dashboard data, and the `ADL` global object contains helper functions necessary for the use of the other two classes.


## ADL.XAPIDashboard

Used to query the LRS and generate visualizations from the returned xAPI data.

### Properties

<a id='data'></a>
#### data

Type: `ADL.Collection`

Stores the statements retrieved by the [fetchAllStatements](#fetchAllStatements) and [addStatements](#addStatements) methods. Is also used as the database for generated graphs.


### Constructor

#### new ADL.XAPIDashboard(container)

Creates a new instance of the XAPIDashboard. Used to fetch statements from an LRS and generate charts.

**Arguments:**

`container` (`String`)(optional)  
The default container for charts generated for this dashboard. If omitted, the `container` option must be specified per chart.


### Methods

<a id='addStatements'></a>
#### addStatements(statementArray)

Adds new statements to the `data` object.

**Arguments:**

`statementArray` (`Array`)  
An array of statements to be added

**Returns:**

*(nothing)*



<a id='clearSavedStatements'></a>
#### clearSavedStatements()

Empties the `data` object.

**Arguments:**

*(none)*

**Returns:**

*(nothing)*



<a id='fetchAllStatements'></a>
#### fetchAllStatements(query, [wrapper], [callback])

Fetches statements from an LRS until no `more` are returned, and stores them in the `data` object.

**Arguments:**

`query` (`Object`)  
An object containing [xAPI query arguments](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#stmtapiget)

`wrapper` (`XAPIWrapper`)(optional)  
The instance of the XAPIWrapper to use for querying.
Defaults to the global `ADL.XAPIWrapper` if omitted.

`callback` (`function(data)`)(optional)  
A function that is called once all statements have been fetched from the LRS.
Is passed the Collection of fetched statements (i.e. [data](#data)).

**Returns:**

*(nothing)*



<a id='createChart'></a>
#### createChart(type, options)

Generates an SVG chart of the given `type` using the `options` specified.

**Arguments:**

`type` (`string`)  
Determines what kind of chart is generated. Must be one of `lineChart`, `barChart`, `pieChart`, `multiBarChart`, or `linePlusBarChart`.


`options` (`Object`)
An object containing some/all of the following properties:

* `pre` (`function(data)` or `String`)(optional)

	Preprocesses the raw xAPI data however the user chooses. Takes in a Collection of statements, and must output another dataset, usually some filtered subset of the input (e.g. `return data.where(...);`). All `Collection` methods are available, but the system will break if `exec` is called at this stage.
	
	If the `pre` field is a string, it is assumed to be a query string suitable for passing into `Collection.where()`.

* `aggregate` (ADL aggregate function)

	Groups the data in preparation for chart generation. Takes in the preprocessed data, and should output a `Collection` of objects with an `in` and an `out` property, which map to the *x* and *y* axes on the graph. If omitted, a sensible default will be substituted for the graph type.

**Returns:**

*(nothing)*


<a id='createBarChart'></a>
#### createBarChart(options)

Equivalent to [createChart](#createChart)("barChart", options).


<a id='createLineChart'></a>
#### createLineChart(options)

Equivalent to [createChart](#createChart)("lineChart", options).


<a id='createPieChart'></a>
#### createPieChart(options)

Equivalent to [createChart](#createChart)("pieChart", options).


<a id='createMultiBarChart'></a>
#### createMultiBarChart(options)

Equivalent to [createChart](#createChart)("multiBarChart", options).


<a id='createLinePlusBarChart'></a>
#### createLinePlusBarChart(options)

Equivalent to [createChart](#createChart)("linePlusBarChart", options).
