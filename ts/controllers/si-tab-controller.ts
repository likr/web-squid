/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../si-manager.ts"/>
/// <reference path="../views/correlation-view.ts"/>
/// <reference path="../views/distribution-view.ts"/>
/// <reference path="../views/map-view.ts"/>

module squid {
export interface SITabControllerScope extends ng.IScope {
  currentSI : SI;
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
}


export function SITabController(
    $scope : SITabControllerScope,
    SIManager : SIManager,
    CorrelationRenderer : CorrelationRendererClass,
    DistributionRenderer : DistributionRendererClass,
    variableMapRenderer : MapRenderer,
    SIMapRenderer : MapRenderer) {
  $scope.currentSI = SIManager.createSI('s', 0, 0.5);
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
    {value: 'hmgrad', name: 'Sea Surface Height (grad)'},
    {value: 'mld', name: 'MLD'},
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

  variableMapRenderer.appendTo('#variable-map');
  variableMapRenderer.setSize(
      $('.col-xs-4').width() - 5, // XXX
      $('.col-xs-3').width());
  variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
  variableMapRenderer.drawParticles();

  SIMapRenderer.appendTo('#si-map');
  SIMapRenderer.setSize(
      $('.col-xs-4').width() - 5, // XXX
      $('.col-xs-3').width());
  SIMapRenderer.drawSI($scope.currentSI);
  SIMapRenderer.drawParticles();

  var correlationRenderer = new CorrelationRenderer(
      '#correlation-graph',
      $('.col-xs-3').width(),
      $('.col-xs-3').width());
  correlationRenderer.depthSelected = (d : number) => {
    $scope.$apply(() => {
      $scope.currentSI.depthIndex = d;
    });
  };
  correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
  correlationRenderer.activate($scope.currentSI.depthIndex);

  var distributionRenderer = new DistributionRenderer(
      '#scatter-plot-graph',
      $('.col-xs-3').width(),
      $('.col-xs-3').width());
  distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);

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

  $scope.$watch('DataManager.selectedDate', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
      variableMapRenderer.drawParticles();
      SIMapRenderer.drawSI($scope.currentSI);
      SIMapRenderer.drawParticles();
    }
  });
}
SITabController.$inject = [
  '$scope',
  'SIManager',
  'CorrelationRenderer',
  'DistributionRenderer',
  'variableMapRenderer',
  'SIMapRenderer',
];
}
