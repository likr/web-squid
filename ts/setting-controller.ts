/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="data-manager.ts"/>

module squid {
export class SettingController {
  static $inject = ['$scope'];
  settings : {};

  constructor(private $scope) {
    this.settings = $scope.settings;
  }

  loadFile() {
    console.log(this);
    var file = (<any>d3.select("#fileInput").node()).files[0];
    var reader = new FileReader();
    reader.onload = (e) => {
      var data = d3.csv.parse(e.target.result).map(parseRow);
      this.$scope.cpueVar.splice(0, this.$scope.cpueVar.length);
      data.forEach(d => {
        this.$scope.cpueVar.push(d);
      });
    };
    reader.readAsText(file);
  }
}
}
