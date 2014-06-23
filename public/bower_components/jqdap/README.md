jqdap
=====

jQuery.ajax based OPeNDAP client


Insall
------

```
bower install jqdap
```

Usage
-----

```
jqdap.loadData(url)
	.then(function(data) {
		// process data
    });

jqdap.loadDataset(url)
	.then(function(dataset) {
		// process dataset
	});
```