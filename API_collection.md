# xAPI Collection API Reference

## ADL.Collection

The `Collection` Class is designed to run advanced SQL-like queries over a body of [Experience API](http://www.adlnet.gov/tla/experience-api/faq/)-formatted activity statements. Simply load statements into the class by passing an array into the constructor or using the `append` method, and use the API documented below to map and filter through the statements.

There are two implementations of this class, `CollectionSync` and `CollectionAsync`. Their APIs are the same, but the Async class runs the queries in a worker thread. The downside of this is that the statements must be serialized and passed into the worker, which can be slow. On the other hand, the UI does not lock up for heavy queries like the synchronous version will. If you don't care which one you use, or are worried that worker threads won't be supported on your target audience browsers, use the generic `Collection` class. It will detect whether or not workers are supported, and fall back on the Sync class if they are not.

### Properties

<a id='contents'></a>
#### contents (CollectionSync only)

Type: `Array`

The contents of the current dataset. This is the same data as would be passed into the callback of [exec](#exec), but may be more convenient than `exec` for `CollectionSync` users.


### Methods

<a id='constructor'></a>
#### new Collection([statements])

##### Arguments

`statements` (`Array`) (optional)  
An array of xAPI statements to be processed.

##### Returns

An instantiated Collection class (either sync or async, see [introduction](#)).


<a id='append'></a>
#### append(statements)

##### Arguments

`statements` (`Array`)  
An array of xAPI statements to be added to the collection.

##### Returns

A reference to the collection with the new data appended to the end of the old dataset.


<a id='save'></a>
#### save()

Takes a snapshot of the current data in the collection, and stores it for use after the next [exec](#exec).

##### Arguments

*(none)*

##### Returns

A reference to the collection containing the latest data.


<a id='exec'></a>
#### exec(callback)

Calls the provided callback with the results of the query.

##### Arguments

`callback` (`Function`)  
A function that is passed the results of the query (an array of objects).

##### Returns

A reference to the collection containing the previous set of data.


<a id='where'></a>
#### where(query)

Filter the contents of the collection by some query, and return the filtered results collection. `where` queries use a similar syntax to the SQL SELECT WHERE clause. You can use `and`, `or`, and parentheses to combine different search terms in any way you wish. `where` supports only the basic comparison operators (`>,>=,<,<=,=,!=`), plus regular expressions to replace the SQL LIKE operator.

Selecting fields inside of an xAPI statement is similarly simple. The selector is patterned after the Javascript object notation for property access: a dot-delineated list of property names. The property names can contain any non-whitespace character, though if you need to use a dot you'll need to escape it with a backslash (e.g. `adlnet\\.gov`). If the given field or any of its parent objects do not exist, then its value is considered `null`.

For example:
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


##### Arguments

`query` (`String`)  
The query expression used to filter the data.

##### Returns

A reference to the collection containing the latest data.


<a id='select'></a>
#### select(fields)

For each item in the dataset, pick out the requested fields and return them.

##### Arguments

`fields` (`String`)  
The comma-delineated list of selection fields. Each field can also use an alias via the `as` keyword. For example:

```javascript
stmts.select('group, count as value');
>>> [{group: 'someGroupId', value: 42}, ...]
```

##### Returns

A reference to the collection containing the newly reduced datasets.


<a id='slice'></a>
#### slice(start, [end])

Description

##### Arguments

##### Returns


<a id='orderBy'></a>
#### orderBy(field, [direction])

Description

##### Arguments

##### Returns


<a id='groupBy'></a>
#### groupBy(field, [intervals])

Description

##### Arguments

##### Returns


<a id='count'></a>
#### count()

Description

##### Arguments

##### Returns


<a id='sum'></a>
#### sum(field)

Description

##### Arguments

##### Returns


<a id='average'></a>
#### average(field)

Description

##### Arguments

##### Returns


<a id='min'></a>
#### min(field)

Description

##### Arguments

##### Returns


<a id='max'></a>
#### max(field)

Description

##### Arguments

##### Returns