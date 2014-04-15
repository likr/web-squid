/// <reference path="../typings/d3/d3.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../data-manager.ts"/>

module squid {
export class SettingController {
  static $inject = ['$scope', '$state', 'DataManager'];
  opendapEndpoint = 'http://priusa.yes.jamstec.go.jp/opendap/';
  predictionDate = new Date(2013, 6, 1);
  cpueFrom = new Date(1999, 0, 1);
  cpueTo = new Date(2012, 11, 31);
  latFrom = 34;
  latTo = 46;
  lonFrom = 180;
  lonTo = 189;
  depthMax = 30;

  constructor(private $scope, private $state, private DataManager) {
  }

  start() {
    var file = (<any>$('#fileInput')[0]).files[0];
    if (file === undefined) {
      this.$scope.addAlert({
        type: 'danger',
        msg: 'Select CPUE file.'
      });
      return;
    }
    var reader = new FileReader();
    reader.onload = e => {
      var data = d3.csv.parse(e.target.result).map(d => {
        var id = 0;
        var obj = {
          id: id++,
          x: +d.LON,
          y: +d.LAT,
          date: new Date(d.YEAR, d.MONTH - 1, d.DAY),
          cpue: +d.CPUE,
          HM0: +d.HM,
          HMg0: +d.HMg,
        };
        ['S', 'T', 'U', 'V', 'W'].forEach(v => {
          var i;
          for (i = 0; i < 54; ++i) {
            var val = +d[v + ('0' + (i + 1)).slice(-2)]
            obj[v + i] = val == -999 ? 0 : val;
          }
        });
        return obj;
      });
      this.DataManager.CPUEPoints = data;
      this.DataManager.selectedDate = this.predictionDate;
      this.DataManager.opendapEndpoint = this.opendapEndpoint;
      this.DataManager
        .initialize(data, this.opendapEndpoint)
        .then(() => {
          this.$state.go('main');
        });
    };
    reader.readAsText(file);
  }
}
}
