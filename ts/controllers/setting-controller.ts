/// <reference path="../typings/d3/d3.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../data-manager.ts"/>

module squid {
export class SettingController {
  static $inject = ['$scope', '$state', 'DataManager'];
  private opendapEndpoint = 'http://priusa.yes.jamstec.go.jp/opendap/';
  private predictionDate = new Date(2013, 6, 1);
  private cpueFrom = new Date(1999, 0, 1);
  private cpueTo = new Date(2013, 11, 31);
  private latFrom = 34;
  private latTo = 46;
  private lonFrom = 180;
  private lonTo = 200;
  private depthMax = 30;

  constructor(private $scope, private $state, private DataManager) {
    this.opendapEndpoint = localStorage.getItem('opendapEndpoint') || 'http://priusa.yes.jamstec.go.jp/opendap/';
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
      function ignore(v : number) : number {
        return v == -999 ? 0 : v;
      }
      var id = 0;
      var data = d3.csv.parse(e.target.result).map(d => {
        var obj = {
          id: id++,
          x: +d.LON,
          y: +d.LAT,
          date: new Date(d.YEAR, d.MONTH - 1, d.DAY),
          cpue: +d.CPUE,
          hm0: ignore(+d.HM),
          hmgrad0: ignore(+d.HMg),
          mld0: ignore(+d.MLD),
        };
        ['S', 'T', 'U', 'V', 'W'].forEach(v => {
          var i;
          for (i = 0; i < 54; ++i) {
            var val = +d[v + ('0' + (i + 1)).slice(-2)]
            obj[v.toLowerCase() + i] = ignore(val);
          }
        });
        return obj;
      });
      this.DataManager.CPUEPoints = data;
      this.DataManager.selectedDate = this.predictionDate;
      this.DataManager.cpueDateFrom = this.cpueFrom;
      this.DataManager.cpueDateTo = this.cpueTo;
      this.DataManager.opendapEndpoint = this.opendapEndpoint;
      this.DataManager
        .initialize(data, this.opendapEndpoint)
        .then(() => {
          this.$state.go('main.si');
        });
    };
    reader.readAsText(file);
    localStorage.setItem('opendapEndpoint', this.opendapEndpoint);
  }
}
}
