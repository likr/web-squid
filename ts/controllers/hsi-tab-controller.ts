/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../si-manager.ts"/>
/// <reference path="../views/distribution-view.ts"/>
/// <reference path="../views/map-view.ts"/>


module squid {
export interface HSITabControllerScope extends ng.IScope {
  selectedSI : SI;
  select : (SI : SI) => void;
  check : (SI : SI) => void;
  activeSIcount : () => number;
  export : (SI : SI) => string;
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
  HSIMapRenderer.drawParticles();

  SIMapRenderer.appendTo('#si-map2');
  SIMapRenderer.setSize(
      $('.col-xs-4').width() - 5, // XXX
      $('.col-xs-3').width());
  SIMapRenderer.drawParticles();

  var distributionRenderer = new DistributionRenderer(
      '#scatter-plot-graph2',
      $('.col-xs-3').width(),
      $('.col-xs-3').width());

  if (SIManager.SIs.length > 0) {
    $scope.selectedSI = SIManager.SIs[0];
    HSIMapRenderer.drawHSI(SIManager.SIs);
    SIMapRenderer.drawSI($scope.selectedSI);
    distributionRenderer.draw(
        $scope.selectedSI.variableName + $scope.selectedSI.depthIndex,
        $scope.selectedSI.lambda);
  }

  $scope.select = (SI : SI) => {
    $scope.selectedSI = SI;
  };

  $scope.check = (SI : SI) => {
    SI.active = !SI.active;
  };

  $scope.export = (SI : SI) => {
    var text = SI.interpolator.curve(100).map(xy => {
      var x = ('    ' + xy[0].toFixed(3)).slice(-9);
      var y = ('    ' + xy[1].toFixed(3)).slice(-9);
      return x + ' ' + y;
    }).join('\r\n');
    return 'data:text/plain;base64,' + btoa(text);
  };

  $scope.activeSIcount = () : number => {
    return SIManager.SIs.filter(SI => SI.active).length;
  };

  $scope.$watch('selectedSI', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      SIMapRenderer.drawSI($scope.selectedSI);
      distributionRenderer.draw(
          $scope.selectedSI.variableName + $scope.selectedSI.depthIndex,
          $scope.selectedSI.lambda);
    }
  });

  $scope.$watch('activeSIcount()', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if (SIManager.SIs.length > 0) {
        HSIMapRenderer.drawHSI(SIManager.SIs.filter(SI => SI.active));
      }
    }
  })

  $scope.$watch('DataManager.selectedDate', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      HSIMapRenderer.drawHSI(SIManager.SIs.filter(SI => SI.active));
      HSIMapRenderer.drawParticles();
      SIMapRenderer.drawSI($scope.selectedSI);
      SIMapRenderer.drawParticles();
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
