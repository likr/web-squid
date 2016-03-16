import angular from 'angular'
import d3 from 'd3'

const modName = 'squid-hsi.controllers.setting-controller';

angular.module(modName, []).controller('SettingController', class SettingController {
  constructor($scope, $state, MapRenderer, DataManager) {
    this.predictionDate = new Date(2006, 1, 1);
    this.cpueFrom = new Date(1999, 0, 1);
    this.cpueTo = new Date(2013, 11, 31);
    this.latFrom = 34;
    this.latTo = 46;
    this.lonFrom = 140;
    this.lonTo = 160;
    this.depthMax = 30;
    this.opendapEndpoint = localStorage.getItem('opendapEndpoint') || 'http://priusa.yes.jamstec.go.jp/opendap/';

    this.$scope = $scope;
    this.$state = $state;
    this.MapRenderer = MapRenderer;
    this.DataManager = DataManager;

  }

  start() {
    var file = ($('#fileInput')[0]).files[0];
    if (file === undefined) {
      this.$scope.addAlert({
        type: 'danger',
        msg: 'Select CPUE file.',
      });
      return;
    }
    var reader = new FileReader();
    reader.onload = (e) => {
      function ignore(v) {
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
      this.MapRenderer.lonW = this.lonFrom;
      this.MapRenderer.lonE = this.lonTo;
      this.MapRenderer.latS = this.latFrom;
      this.MapRenderer.latN = this.latTo;
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
    localStorage.setItem('username', this.username);
  }
});

export default modName
