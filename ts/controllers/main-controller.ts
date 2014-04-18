/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../spline.ts"/>
/// <reference path="../views/correlation-view.ts"/>
/// <reference path="../views/distribution-view.ts"/>
/// <reference path="../views/map-view.ts"/>


module squid {
export interface MainControllerScope extends ng.IScope {
  currentSI : SI;
  SIs : SI[];
  depthMin : number;
  depthMax : number;
  lambdaMin : number;
  lambdaMax : number;
  lambdaStep : number;
  variables : any[];
  saveSI : () => void;
  incrementDepth : () => void;
  decrementDepth : () => void;
  incrementLambda : () => void;
  decrementLambda : () => void;
  drawSIViews : () => void;
}

export function MainController(
    $scope : MainControllerScope,
    $state,
    DataManager : DataManager,
    SIManager : SIManager,
    CorrelationRenderer : CorrelationRendererClass,
    DistributionRenderer : DistributionRendererClass,
    MapRenderer : MapRendererClass) {
  var variableMapRenderer : MapRenderer;
  var SIMapRenderer : MapRenderer;
  var correlationRenderer : CorrelationRenderer;
  var distributionRenderer : DistributionRenderer;

  if (!DataManager.initialized()) {
    $state.go('setting');
    return;
  }

  $scope.currentSI = SIManager.createSI('s', 0, 0.5);
  $scope.SIs = SIManager.SIs;
  $scope.depthMin = 0;
  $scope.depthMax = 30;
  $scope.lambdaMin = 0.001;
  $scope.lambdaMax = 0.999;
  $scope.lambdaStep = 0.001;
  $scope.variables = [
    {value: 's', name: 'Salinity'},
    {value: 't', name: 'Temperature'},
    {value: 'u', name: 'Horizontal Velocity (Lon.)'},
    {value: 'v', name: 'Horizontal Velocity (Lat.)'},
    {value: 'w', name: 'Vertical Velocity'},
    {value: 'hm', name: 'Sea Surface Height'},
  ];

  $scope.saveSI = () => {
    SIManager.registerSI($scope.currentSI);
    $scope.currentSI = SIManager.createSI(
        $scope.currentSI.variableName,
        $scope.currentSI.depthIndex,
        $scope.currentSI.lambda);
  };

  $scope.incrementDepth = () => {
    $scope.currentSI.depthIndex = Math.min($scope.depthMax, +$scope.currentSI.depthIndex + 1);
  };

  $scope.decrementDepth = () => {
    $scope.currentSI.depthIndex = Math.max($scope.depthMin, $scope.currentSI.depthIndex - 1);
  };

  $scope.incrementLambda = () => {
    $scope.currentSI.lambda = Math.min($scope.lambdaMax, +$scope.currentSI.lambda + $scope.lambdaStep);
  };

  $scope.decrementLambda = () => {
    $scope.currentSI.lambda = Math.max($scope.lambdaMin, $scope.currentSI.lambda - $scope.lambdaStep);
  };

  $scope.$watch('currentSI.variableName', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
      SIMapRenderer.drawSI($scope.currentSI);
      correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
      distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);
    }
  });

  $scope.$watch('currentSI.depthIndex', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
      SIMapRenderer.drawSI($scope.currentSI);
      correlationRenderer.activate($scope.currentSI.depthIndex);
      distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);
    }
  });

  $scope.$watch('currentSI.lambda', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      SIMapRenderer.drawSI($scope.currentSI);
      correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
      distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);
    }
  });

  var initialized = false;
  $scope.drawSIViews = () => {
    if (!initialized) {
      variableMapRenderer = new MapRenderer('#variable-map');
      variableMapRenderer.setSize(
          $('.col-xs-4').width() - 5, // XXX
          $('.col-xs-3').width());
      variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);

      SIMapRenderer = new MapRenderer('#si-map');
      SIMapRenderer.setSize(
          $('.col-xs-4').width() - 5, // XXX
          $('.col-xs-3').width());
      SIMapRenderer.drawSI($scope.currentSI);

      correlationRenderer = new CorrelationRenderer('#correlation-graph');
      correlationRenderer.depthSelected = (d : number) => {
        $scope.$apply(() => {
          $scope.currentSI.depthIndex = d;
        });
      };
      correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
      correlationRenderer.activate($scope.currentSI.depthIndex);

      distributionRenderer = new DistributionRenderer('#scatter-plot-graph');
      distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);

      initialized = true;
    }
  }
};
MainController.$inject = [
  '$scope',
  '$state',
  'DataManager',
  'SIManager',
  'CorrelationRenderer',
  'DistributionRenderer',
  'MapRenderer'
];
}
