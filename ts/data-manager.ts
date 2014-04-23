/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="lib/jsdap.d.ts"/>

module squid {
export class DataManager {
  static $inject = ['$q'];
  public selectedDate : Date;
  public cpueDateFrom : Date;
  public cpueDateTo : Date;
  public opendapEndpoint : string;
  public latStart = 192;
  public latStop = 312;
  public latLength = this.latStop - this.latStart;
  public lonStart = 551;
  public lonStop = 671;
  public lonLength = this.lonStop - this.lonStart;
  public CPUEPoints : any[];
  private dataCache = {};
  private dimensions;
  private axes;

  constructor(private $q) {
  }

  loadMOVE(variableName : string, depthIndex : number) {
    var deferred = this.$q.defer();
    var key = this.key(variableName, this.selectedDate, depthIndex);
    if (this.dataCache[key]) {
      deferred.resolve(this.dataCache[key]);
    } else {
      var v = variableName.toLowerCase();
      var dateIndex = this.dateIndex(this.selectedDate);
      var d = depthIndex;
      var lat = this.latStart + ':' + this.latStop;
      var lon = this.lonStart + ':' + this.lonStop;
      var dataUrl = this.opendapEndpoint + variableName.toLowerCase() + '.dods?' + v + '[' + dateIndex + '][' + d + '][' + lat + '][' + lon + ']';
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
      return d.date.getTime() == this.selectedDate.getTime();
    });
  }

  initialize(CPUEPoints, opendapEndpoint : string) {
    return this.loadDataset(this.opendapEndpoint + 's')
      .then(dataset => {
        this.dimensions = {
          time: dataset.time.shape[0],
          lev: dataset.lev.shape[0],
          lat: dataset.lat.shape[0],
          lon: dataset.lon.shape[0],
        };
        return this.$q.all({
          time: this.loadData(this.opendapEndpoint + 's.dods?s[0:' + (this.dimensions.time - 1) + '][0][0][0]'),
          lev: this.loadData(this.opendapEndpoint + 's.dods?s[0][0:' + (this.dimensions.lev - 1) + '][0][0]'),
          lat: this.loadData(this.opendapEndpoint + 's.dods?s[0][0][0:' + (this.dimensions.lat - 1) + '][0]'),
          lon: this.loadData(this.opendapEndpoint + 's.dods?s[0][0][0][0:' + (this.dimensions.lon - 1) + ']'),
        });
      })
      .then(axes => {
        this.axes = {
          time: axes.time[0][1],
          lev: axes.lev[0][2],
          lat: axes.lat[0][3],
          lon: axes.lon[0][4],
        };
      })
      ;
  }

  initialized() : boolean {
    return this.CPUEPoints !== undefined;
  }

  private key(variableName : string, date : Date, depthIndex : number) : string {
    return this.dateIndex(date) + variableName + depthIndex;
  }

  private loadDataset(url : string) {
    var deferred = this.$q.defer();
    loadDataset(url, result => {
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  private loadData(url : string) {
    var deferred = this.$q.defer();
    loadData(url, result => {
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  private dateIndex(date : Date) : number {
    var axis = this.axes.time;
    var baseDate = new Date(1970, 0, 1);
    var x = Math.floor((date.getTime() - baseDate.getTime()) / 86400000) + 719164;
    return Math.min(d3.bisectLeft(axis, x), axis.length - 1);
  }
}
}
