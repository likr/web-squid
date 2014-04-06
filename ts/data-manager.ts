/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="lib/jsdap.d.ts"/>

module squid {
var id = 0;


export function parseRow(d) {
  var obj = {
    id: id++,
    x: +d.LON,
    y: +d.LAT,
    date: new Date(d.YEAR, d.MONTH, d.DAY),
    cpue: +d.CPUE,
    HM0: +d.HM0,
  };
  ['S', 'T', 'U', 'V', 'W'].forEach(v => {
    var i;
    for (i = 0; i < 54; ++i) {
      var val = +d[v + ('0' + (i + 1)).slice(-2)]
      obj[v + i] = val == -999 ? 0 : val;
    }
  });
  return obj;
}


export class DataManager {
  static $inject = ['$q'];
  public selectedDate : Date;
  public cpueDateFrom : Date;
  public cpueDateTo : Date;
  public opendapEndpoint : string;
  public latStart = 192;
  public latStop = 312;
  public latLength = this.latStop - this.latStart;
  public lonStart = 497;
  public lonStop = 551;
  public lonLength = this.lonStop - this.lonStart;
  private CPUEPoints : any[];
  private dataCache;

  constructor(private $q) {
  }

  loadMOVE(variableName : string, depthIndex : number) {
    var deferred = this.$q.defer();
    var key = this.key(variableName, this.selectedDate, depthIndex);
    if (this.dataCache[key]) {
      deferred.resolve(this.dataCache[key]);
    } else {
      var v = variableName.toLowerCase();
      var dateIndex = 0;
      var d = depthIndex;
      var lat = this.latStart + ':' + this.latStop;
      var lon = this.lonStart + ':' + this.lonStop;
      var dataUrl = this.opendapEndpoint + variableName.toLowerCase + '.dods?' + v + '[' + dateIndex + '][' + d + '][' + lat + '][' + lon + ']';
      loadData(dataUrl, data => {
        deferred.resolve(this.dataCache[key] = data);
      });
    }
    return deferred.promise;
  }

  loadCPUE(file) {
    var deferred = this.$q.defer();

    return deferred.promise;
  }

  getCPUE() {
    return this.CPUEPoints.filter(d => {
      return this.cpueDateFrom <= d.date && d.date <= this.cpueDateTo;
    });
  }

  getExpectedCPUE() {
    return this.CPUEPoints.filter(d => {
      return d.date == this.selectedDate;
    });
  }

  private key(variableName : string, date : Date, depthIndex : number) : string {
    return date + variableName + depthIndex;
  }
}
}
