import angular from 'angular'
import d3 from 'd3'
import vdap from 'vdap'

class DataManager {
  constructor($q) {
    this.$q = $q;
    this.dataCache = {};
  }

  loadMOVE(variableName, depthIndex, region) {
    var deferred = this.$q.defer();
    var key = this.key(variableName, this.selectedDate, depthIndex);
    if (this.dataCache[key]) {
      deferred.resolve(this.dataCache[key]);
    } else {
      var v = variableName.toLowerCase();
      var dateIndex = this.dateIndex(this.selectedDate);
      var d = depthIndex;
      var latRegion = this.region('lat', region.latFrom, region.latTo);
      var lonRegion = this.region('lon', region.lonFrom, region.lonTo);
      var lat = latRegion[0] + ':' + latRegion[1];
      var lon = lonRegion[0] + ':' + lonRegion[1];
      var query = v + '[' + dateIndex + '][' + d + '][' + lat + '][' + lon + ']';
      var file;
      if (/fcst\d{4}/.test(this.opendapEndpoint)) {
        switch (v) {
          case 'u':
          case 'v':
          case 't':
          case 's':
          case 'hm':
            file = 'fcst';
            break;
          default:
            file = v;
        }
      } else {
        file = v;
      }
      var dataUrl = this.opendapEndpoint + file + '.dods?' + query;
      vdap.loadData(dataUrl, {credentials: 'include'})
        .then(data => {
          deferred.resolve(this.dataCache[key] = data);
        });
    }
    return deferred.promise;
  }

  loadCPUE() {
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

  initialize() {
    return this.loadData(this.opendapEndpoint + 'w.dods?lat,lon,lev,time')
      .then(data => {
        this.axes = {
          lon: data[3],
          lat: data[2],
          lev: data[1],
          time: data[0],
        };
      });
  }

  initialized() {
    return this.CPUEPoints !== undefined;
  }

  key(variableName, date, depthIndex) {
    return this.dateIndex(date) + variableName + depthIndex;
  }

  loadDataset(url) {
    var deferred = this.$q.defer();
    vdap.loadDataset(url, {credentials: 'include'})
      .then(result => {
        deferred.resolve(result);
      });
    return deferred.promise;
  }

  loadData(url) {
    var deferred = this.$q.defer();
    vdap.loadData(url, {credentials: 'include'})
      .then(result => {
        deferred.resolve(result);
      });
    return deferred.promise;
  }

  region(name, min, max) {
    var axis = this.axes[name];
    var x0 = axis.length - 1;
    for (let i = 0; i < axis.length; ++i) {
      if (min < axis[i]) {
        x0 = Math.max(0, i - 1);
        break;
      }
    }
    var x1 = 0;
    for (let i = axis.length - 1; i > 0; --i) {
      if (axis[i] < max) {
        x1 = Math.min(axis.length - 1, i + 1);
        break;
      }
    }

    return [x0, x1];
  }

  dateIndex(date) {
    var axis = this.axes.time;
    var baseDate = new Date(1970, 0, 1);
    var x = Math.floor((date.getTime() - baseDate.getTime()) / 86400000) + 719164;
    return Math.min(d3.bisectLeft(axis, x), axis.length - 1);
  }
}

const modName = 'squid-hsi.services.data-manager';

angular.module(modName, []).service('DataManager', DataManager);

export default modName
