/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../data-manager.ts"/>
/// <reference path="../si-manager.ts"/>


module squid {
export interface MainControllerScope extends ng.IScope {
  SIs : SI[];
  DataManager : DataManager;
}


export function MainController(
    $scope : MainControllerScope,
    DataManager : DataManager,
    SIManager : SIManager) {
  $scope.SIs = SIManager.SIs;
  $scope.DataManager = DataManager;
};
MainController.$inject = [
  '$scope',
  'DataManager',
  'SIManager',
];
}
