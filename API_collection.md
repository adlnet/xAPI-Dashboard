# xAPI Collection API Reference

## ADL.Collection

The `Collection` Class is designed to run advanced SQL-like queries over a body of [Experience API](http://www.adlnet.gov/tla/experience-api/faq/)-formatted activity statements. Simply load statements into the class by passing an array into the constructor or using the `append` method, and use the API documented below to map and filter through the statements.

There are two implementations of this class, `CollectionSync` and `CollectionAsync`. Their APIs are the same, but the Async class runs the queries in a worker thread. The downside of this is that the statements must be serialized and passed into the worker, which can be slow. On the other hand, the UI does not lock up for heavy queries like the synchronous version will. However, since in most cases the serialization of the data is an order of magnitude slower than the actual processing, we generally recommend using the synchronous version.

### A Word About XPaths

Many parts of this class use what are called xpaths. These are strings that indicate a path into the data structure to find a particular value. They are composed of a period-delineated list of object keys. The syntax will be familiar for anyone that has used a C-like language like Javascript. Literal periods can be in the keys, but you will need to escape them with a literal backslash, e.g. `"adlnet\\.gov"`. 

For example, if you had an object like this:

```javascript
{
	"level1": {
		"level2": {
			"level3": [
				{
					"level5": some_value
}]}}}
```

You could reference the value of `some_value` using the xpath `"level1.level2.level3.0.level5"`. Each dot indicates a nested object with the given key. Notice that the object under level 3 is an array. In this case, the key is an integer instead of a string, but the pattern holds otherwise.

If any part of the xpath is not found in the object, then `null` is returned.

Collections hold arrays of objects, so all operations implicitly apply xpaths for all top-level items. This means that you must not put an initial array index onto any xpaths.


### Constructors

<a id='constructor'></a>
#### new Collection([statements])

**Arguments:**

`statements` (`Array`) (optional)  
An array of xAPI statements to be processed.

**Returns:**

An instantiated Collection class (either sync or async, see [introduction](#)).



### Properties

<a id='contents'></a>
#### contents (CollectionSync only)

Type: `Array`

The contents of the current dataset. This is the same data as would be passed into the callback of [exec](#exec), but may be more convenient than `exec` for `CollectionSync` users.


### Methods


<a id='append'></a>
#### append(statements)

**Arguments:**

`statements` (`Array`)  
An array of xAPI statements to be added to the collection.

**Returns:**

A reference to the collection with the new data appended to the end of the old dataset.


<a id='save'></a>
#### save()

Takes a snapshot of the current data in the collection, and stores it for use after the next [exec](#exec).

**Arguments:**

*(none)*

**Returns:**

A reference to the collection containing the latest data.


<a id='exec'></a>
#### exec(callback)

Calls the provided callback with the results of the query.

**Arguments:**

`callback` (`Function`)  
A function that is passed the results of the query (an array of objects).

**Returns:**

A reference to the collection containing the previous set of data.


<a id='where'></a>
#### where(query)

Filter the contents of the collection by some query, and return the filtered results collection.

`where` queries use a similar syntax to the SQL SELECT WHERE clause. You specify one or more conditions that, if met by a datum, will cause that datum to be in the result set.

Each condition consists of a field, a comparator, and a value. The field must be an xpath. The comparator can only be one of `>,>=,<,<=,=,!=`, where they have the same meaning as in Javascript. The value can be either a literal string (anything between two double quotes), a number (in base 8, 10, or 16), a regular expression (anything between two forward slashes), or one of the special tokens `true`, `false`, or `null`. Note that the operators are strongly typed, so `"5" != 5`. Also note that only `=` and `!=` are valid comparisons against a regular expression.

You can use `and`, `or`, and parentheses to combine different conditions in any way you wish. For example:

```javascript
stmts.where(
	'actor.name = "Steven" and ('+
		'verb.id = "http://adlnet.gov/expapi/verbs/passed"'+
		' or '+
		'verb.id = "http://adlnet.gov/expapi/verbs/failed"'+
	')'
)
```

Or more compactly, using a regular expression:

```javascript
stmts.where('actor.name = "Steven" and verb.id = /(passed|failed)$/')
```

`where` also supports a special xpath syntax: the wildcard `"*"`. Use it to match all objects at a given depth. For example, if you wanted to match statements who had a given activity in the context regardless of its relationship or position, you could use:

```javascript
stmts.where('context.contextActivities.*.*.id = "some_activity"')
```

instead of:

```javascript
stmts.where('context.contextActivities.parent.0.id = "some_activity"'+
	' or context.contextActivities.grouping.0.id = "some_activity"'+
	' or context.contextActivities.grouping.1.id = "some_activity"'+
	...
```

**Arguments:**

`query` (`String`)  
The query expression used to filter the data.

**Returns:**

A reference to the collection containing the latest data.


<a id='select'></a>
#### select(fields)

For each item in the dataset, pick out the requested fields and return them.

**Arguments:**

`fields` (`String`)  
The comma-delineated list of selection field xpaths. Each field can also use an alias via the `as` keyword. For example:

```javascript
stmts.select('group, count as value');
>>> [{group: 'someGroupId', value: 42}, ...]
```

**Returns:**

A reference to the collection containing the newly reduced datasets.


<a id='slice'></a>
#### slice(start, [end])

Just like the `Array` function of the same name, throw out all data except for those whose position in the dataset falls between `start` and `end`.

**Arguments:**

`start` (integer)  
The beginning of the selection. Data at this index will be included in the result.

`end` (integer)(optional)  
The end of the selection. Data at this index will NOT be included in the result. If omitted, all data after `start` will be included.

**Returns:**

A reference to the collection containing the newly reduced data.

<a id='orderBy'></a>
#### orderBy(field, [direction])

Sort the data by the given field, in the given direction.

**Arguments:**

`field` (`String`)  
The xpath of the field to be sorted by. E.g. `object.id`.

`direction` (`String`)(optional)  
If equal to "descending" or "desc", will sort the data from high to low. Otherwise will sort from low to high.

**Returns:**

A reference to the collection containing the newly sorted data.

<a id='groupBy'></a>
#### groupBy(field, [intervals])

Divide the contents of the collection into groups based on the value of each datum's `field`. If `intervals` is supplied, the grouping is based on if the value falls within a range, otherwise the data will be grouped by simple equality.

For example:

```javascript
var stmts = new ADL.Collection([
	{name: "Alice", age: 14},
	{name: "Bob", age: 34},
	{name: "Bob", age: 50}
]);

stmts.groupBy('name')
>>> [{
	group: "Alice",
	data: [{name: "Alice", age: 14}]
},{
	group: "Bob",
	data: [{name: "Bob", age: 34},{name: "Bob", age: 50}]
}]

stmts.groupBy('age', [0,40,20])
>>> [{
	group: "0-20",
	groupStart: 0,
	groupEnd: 20,
	data: [{name: "Alice", age: 14}]
},{
	group: "20-40",
	groupStart: 20,
	groupEnd: 40,
	data: [{name: "Bob", age: 34}]
}]
	
```

Notice that in the second example using `intervals`, the datum that fell outside the bounds was not included in the result at all.

**Arguments:**

`field` (`String`)  
The xpath to the field on which the data will be grouped. E.g. `"actor.mbox"`.

`intervals` (`Array`)(optional)  
A 3-length array describing how the data should be divided. `intervals` must contain these exact three elements: a `start` value, an `end` value, and the `increment`. The value space between `start` and `end` is divided into groups of size `increment`, and each item in the collection is assigned a group based on if its `field` value is within the bounds of the group.

If `start` and `end` are numeric, then groups are determined by simple addition (e.g. `[1,4,1]` -> 1-2,2-3,3-4). If they are strings, then the first letter will be used and incremented by `increment` letters (e.g. `["a","z",13]` -> a-n,n-z ). If `start` and `end` are ISO Date strings, then `increment` represents a length of time in milliseconds.

**Returns:**

A reference to the collection containing the newly created groups.


<a id='count'></a>
#### count()

Determine the number of items in each group, or in the whole collection if not grouped.

**Arguments:**

*None*

**Returns:**

A reference to the resulting collection.


<a id='sum'></a>
#### sum(field)

Determine the total value of each group's data, or all data if not grouped.

**Arguments:**

`field` (`String`)  
An xpath indicating a field in each piece of data to be added to the total.

**Returns:**

A reference to the collection.

<a id='average'></a>
#### average(field)

Determine the average value of each group's data, or all data if not grouped.

**Arguments:**

`field` (`String`)  
An xpath indicating a field in each piece of data to be averaged.

**Returns:**

A reference to the resulting collection.

<a id='min'></a>
#### min(field)

Determine the minimum value of each group's data, or all data if not grouped.

**Arguments:**

`field` (`String`)  
An xpath indicating a field in each piece of data to be compared against the minimum.

**Returns:**

A reference to the resulting collection.


<a id='max'></a>
#### max(field)

Determine the minimum value of each group's data, or all data if not grouped.

**Arguments:**

`field` (`String`)  
An xpath indicating a field in each piece of data to be compared against the maximum.

**Returns:**

A reference to the resulting collection.
