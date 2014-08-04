/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="lib/jqdap.d.ts"/>

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
  public username: string;
  public password: string;
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
      var query = v + '[' + dateIndex + '][' + d + '][' + lat + '][' + lon + ']';
      if (/fcst\d{4}/.test(this.opendapEndpoint)) {
        switch (v) {
          case 'u':
          case 'v':
          case 't':
          case 's':
          case 'hm':
            var file = 'fcst';
            break;
          default:
            var file = v;
        }
      } else {
        var file = v;
      }
      var dataUrl = this.opendapEndpoint + file + '.dods?' + query;
      jqdap.loadData(dataUrl, this.jqdapOptions())
        .then(data => {
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
    return this.loadData(this.opendapEndpoint + 'w.dods?lat,lon,lev,time')
      .then(data => {
        this.axes = {
          lat: data[3],
          lon: data[2],
          lev: data[1],
          time: data[0],
        };
      });
  }

  initialized() : boolean {
    return this.CPUEPoints !== undefined;
  }

  private key(variableName : string, date : Date, depthIndex : number) : string {
    return this.dateIndex(date) + variableName + depthIndex;
  }

  private loadDataset(url : string) {
    var deferred = this.$q.defer();
    jqdap.loadDataset(url, this.jqdapOptions())
      .then(result => {
        deferred.resolve(result);
      });
    return deferred.promise;
  }

  private loadData(url : string) {
    var deferred = this.$q.defer();
    jqdap.loadData(url, this.jqdapOptions())
      .then(result => {
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

  private jqdapOptions(): jqdap.AjaxOptions {
    if (this.username || this.password) {
      return {
        withCredentials: true,
        username: this.username,
        password: this.password,
      };
    } else {
      return {};
    }
  }
}
}
