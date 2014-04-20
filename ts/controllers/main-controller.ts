/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../data-manager.ts"/>
/// <reference path="../si-manager.ts"/>


module squid {
export interface MainControllerScope extends ng.IScope {
  SIs : SI[];
}


export function MainController(
    $scope : MainControllerScope,
    SIManager : SIManager) {
  $scope.SIs = SIManager.SIs;
};
MainController.$inject = [
  '$scope',
  'SIManager'
];
}
