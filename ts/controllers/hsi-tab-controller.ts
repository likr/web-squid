/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../si-manager.ts"/>
/// <reference path="../views/distribution-view.ts"/>
/// <reference path="../views/map-view.ts"/>


module squid {
export interface HSITabControllerScope extends ng.IScope {
  activeSI : SI;
}


export function HSITabController(
    $scope : HSITabControllerScope,
    SIManager : SIManager,
    DistributionRenderer : DistributionRendererClass,
    SIMapRenderer : MapRenderer,
    HSIMapRenderer : MapRenderer) {

  HSIMapRenderer.appendTo('#hsi-map')
  HSIMapRenderer.setSize(
      $('.col-xs-4').width() - 5, // XXX
      $('.col-xs-3').width());

  SIMapRenderer.appendTo('#si-map2');
  SIMapRenderer.setSize(
      $('.col-xs-4').width() - 5, // XXX
      $('.col-xs-3').width());

  var distributionRenderer = new DistributionRenderer('#scatter-plot-graph2');

  if (SIManager.SIs.length > 0) {
    $scope.activeSI = SIManager.SIs[0];
    HSIMapRenderer.drawHSI(SIManager.SIs);
    SIMapRenderer.drawSI($scope.activeSI);
    distributionRenderer.draw(
        $scope.activeSI.variableName + $scope.activeSI.depthIndex,
        $scope.activeSI.lambda);
  }

  $scope.$watch('activeSI', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      SIMapRenderer.drawSI($scope.activeSI);
      distributionRenderer.draw(
          $scope.activeSI.variableName + $scope.activeSI.depthIndex,
          $scope.activeSI.lambda);
    }
  });
}
HSITabController.$inject = [
  '$scope',
  'SIManager',
  'DistributionRenderer',
  'SIMapRenderer2',
  'HSIMapRenderer',
];
}
