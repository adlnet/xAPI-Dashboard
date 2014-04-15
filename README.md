# xAPI-Dashboard

Provides a powerful SQL-like query language for manipulating sets of xAPI data, as well as the
tools to quickly and easily produce charts and graphs from said data.

## Processing the data

This package includes the *ADL.Collection* object, a powerful statement processor. Its usage is
simple. Just load your statements into it:

```javascript
var ret = ADL.XAPIWrapper.getStatements(...);
var statements = new ADL.Collection(ret.statements);
```

You can then run filters on the statements to produce useful and interesting summaries. For
example, to get the list of activities performed in the set of statements, you could run:

```javascript
var activities = statements
	// remove statements with duplicate object ids
	.selectDistinct('object.id')
	// and then pick out the ids
	.transform(
		ADL.Collection.getValue('object.id')
	);
console.log(activities.contents);
>>> ['objectId1','objectId2']
```

And if you wanted a list of the top 10 highest-scoring actors, you could run:

```javascript
var actors = statements
	// take all the statements for each actor
	.groupBy('actor.name', function(subset){
		// and find the highest score.raw
		return subset.max('score.raw');
	})
	// then sort by those scores, high to low
	.orderBy('result', 'descending')
	// and pick out only the first (highest) 10 scores
	.select(ADL.Collection.first(10));
	
console.log(groups.contents);
>>> 
[{'groupValue': 'James Bond', 'result': 94},
 {'groupValue': 'Dr. No',     'result': 88},
 ...
]
```

Clearly there is some power here, but it gets even better when you can *see* the data.


## Visualizing the data

The *ADL.XAPIDashboard* class abstracts things even more. 