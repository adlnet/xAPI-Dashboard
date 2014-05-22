# xAPI Dashboard API Reference

There are several classes necessary to create charts, and they are documented below. From a high level, the `XAPIDashboard` class retrieves, stores, and distributes your xAPI data, the `Chart` class encapsulates a particular visualization that uses the Dashboard data, and the `ADL` global object contains helper functions necessary for the use of the other two classes.


## XAPIDashboard class

Used to query the LRS and generate visualizations from the returned xAPI data.

### Constructor

#### new ADL.XAPIDashboard(container)

Creates a new instance of the XAPIDashboard. Used to fetch statements from an LRS and generate charts.

**Arguments:**

`container` (`String`)(optional)  
The default container for charts generated for this dashboard. If omitted, the `container` option must be specified per chart.


### Properties

<a id='data'></a>
#### data

Type: `ADL.Collection`

Stores the statements retrieved by the [fetchAllStatements](#fetchAllStatements) and [addStatements](#addStatements) methods. Is also used as the database for generated graphs.



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

<a id='createBarChart'></a>
#### createBarChart(options)

Equivalent to [createChart](#createChart)("barChart", options).


<a id='createChart'></a>
#### createChart(type, options)

Generates an SVG chart of the given `type` using the `options` specified.

**Arguments:**

`type` (`string`)  
Determines what kind of chart is generated. Must be one of `lineChart`, `barChart`, `pieChart`, `multiBarChart`, or `linePlusBarChart`.


`options` (`Object`)  
An object containing some/all of the following properties:

* `container` (`String`)(optional)

	A CSS-style selector indicating where in the DOM the chart should be placed. If omitted, the chart is placed in the default location for this dashboard (from the Dashboard constructor).
	
* `pre` (`function(data,event)` or `String`)(optional)

	Preprocesses the raw xAPI data however the user chooses. Takes in a Collection of statements, and must output another Collection, usually some filtered subset of the input (e.g. `return data.where(...);`). All Collection methods are available, but the system will break if `exec` is called at this stage.
	
	If this chart is a "child" chart, the second argument to the `pre` function (the `event` parameter) will contain a d3 click event object. Use this object to determine what was clicked in the parent chart and filter the data appropriately. Most significantly, `event.in` contains the name of the bar, or the x-value of the point, clicked on.
	
	If the `pre` field is a string, it is assumed to be a query string suitable for passing into `Collection.where()`.
	
	

* `aggregate` (`Function`)

	Processes the xAPI data into a format consumable by the chart backend. Generally provided by an ADL generator function like `ADL.average`. E.g.
	
	```javascript
	"aggregate": ADL.average("result.score.raw")
	```
	
	See [Aggregate functions](#aggregateFunctions) for more about this field.
	
* `groupBy` (`String`)

	Indicates that the aggregate function should be called for each group of statements with the same value for the field specified by this property. You can think of this as the *x* axis on the chart, whereas the result of the aggregate function is the *y* axis.
	
	For example, if you wanted to know how many times each actor is mentioned, you could say `aggregate: ADL.count(), groupBy: "actor.mbox"` or something similar, and would get a chart with a bar for each actor, and the bar's height would correspond to the number of statements that actor had.
	
* `range` (`Object`)

	Modifies the `groupBy` option by allowing similar values to be grouped instead of just equal values. The value of this property must be an object containing `start`, `end`, and `increment` properties. The value space between `start` and `end` will be divided up into groups of size `increment`.
	
	Works for three value types: numbers, strings, and ISO-formatted date strings. The type of `start` and `end` should match the type of the value being compared (the value of the field given by `groupBy`).
	
	For numeric types like test scores, you can group into grade brackets by 10's:
	
	```javascript
	groupBy: "result.score.raw",
	range: {
		start: 60,
		end: 100,
		increment: 10
	}
	```
	
	For string types, this will group by first letter into groups a-h, i-p, q-x, and y-z:
	
	```javascript
	groupBy: "actor.name",
	range: {
		start: "a",
		end: "z",
		increment: 8
	}
	```

	Finally, for date string types, this will group into days, where increment is in milliseconds:
	
	```javascript
	groupBy: "timestamp",
	range: {
		start: "2014-04-21",
		end: "2014-05-21",
		increment: 1000*60*60*24
	}
	```
	
* `post` (`function(data)`)(optional)

	Processes the data after everything has been aggregated and prepared for the chart, where `data` is the array of series to be drawn to the chart. Use this function to operate on the chart data. For example, you could sort the bars of a bar graph by height from here. Should return the processed data.

* `customize` (`function(nvd3chart)`)(optional)

	Change the appearance and behavior of the chart by calling nvd3's format functions. See the [nvd3](http://nvd3.org/index.html) documentation for more details.
	
* `child` (`Array`)(optional)

	Pass click event data from this chart into these "child" charts when a data point is clicked on. Used to "drill into" the data further, and examine derivative relationships.
	
	This property should contain an array of `Chart` objects. They will be redrawn when this chart is clicked on.

**Returns:**

The instance of the [Chart](#chart) class created by the function call. Must call `draw()` or hook it to another chart before the chart will be displayed.


<a id='createLineChart'></a>
#### createLineChart(options)

Equivalent to [createChart](#createChart)("lineChart", options).

<a id='createLinePlusBarChart'></a>
#### createLinePlusBarChart(options)

Equivalent to [createChart](#createChart)("linePlusBarChart", options).

<a id='createMultiBarChart'></a>
#### createMultiBarChart(options)

Equivalent to [createChart](#createChart)("multiBarChart", options).

<a id='createPieChart'></a>
#### createPieChart(options)

Equivalent to [createChart](#createChart)("pieChart", options).



<a id='chart'></a>
## Chart class

### Constructors

Do not construct this class directly. Instead, use the Dashboard methods.

### Properties

`event` (NVD3 Event)  
If this chart is a child chart, this contains the event that caused the `draw()` call.

`parent` (`Chart`)  
If this chart is a child chart, this contains a reference to the parent chart.

`child` (`Array`)  
If this chart has children, then this contains an Array containing references to the child charts.

### Methods

#### clear()

Erases the chart from its container.

**Arguments:**

*(none)*

**Returns:**

*(nothing)*

#### draw()

Perform all requisite data processing, generate the chart, and place it in its container.

**Arguments:**

*(none)*

**Returns:**

*(nothing)*


<a id='aggregateFunctions'></a>
## Aggregate functions

These functions are all found under the `ADL` namespace, and perform different calculations over xAPI data. These compose a key component of the charting infrastructure.

### ADL.average(xpath)

Will group the data based on the `groupBy` and `range` options to the chart, and map the average value of the members' `xpath` fields to the y-axis of the resulting chart.

**Arguments:**

`xpath` (`String`)  
The field to average. 

### ADL.count()

Will group the data based on the `groupBy` and `range` options to the chart, and map the sizes of the groups to the y-axis of the resulting chart.

**Arguments:**

*(none)*


### ADL.max(xpath)

Will group the data based on the `groupBy` and `range` options to the chart, and map the maximum value of the members' `xpath` fields to the y-axis of the resulting chart.

**Arguments:**

`xpath` (`String`)  
The field to find the maximum of. 



### ADL.min(xpath)

Will group the data based on the `groupBy` and `range` options to the chart, and map the minimum value of the members' `xpath` fields to the y-axis of the resulting chart.

**Arguments:**

`xpath` (`String`)  
The field to find the minimum of. 

### ADL.sum(xpath)

Will group the data based on the `groupBy` and `range` options to the chart, and map the total value of the members' `xpath` fields to the y-axis of the resulting chart.

**Arguments:**

`xpath` (`String`)  
The field to total. 
