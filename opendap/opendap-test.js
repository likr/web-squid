d3.csv('http://weka.likr-lab.com/opendap/data/csv/temperature.csv?Station[0:1:4],latitude[0:1:4]', function(data) {
    console.log(data);
});

//loadDataset('', function() {
//  console.log(arguments);
//});

loadData('http://weka.likr-lab.com/opendap/data/ocean/s.nc.dods?s[0][0][232:332][202:302]', function(data) {
    console.log(arguments);
});
