/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../spline.ts"/>
/// <reference path="../views/map-view.ts"/>


module squid {
export function MainController($scope, $state, DataManager, SIManager, MapRenderer) {
  if (!DataManager.initialized()) {
    $state.go('setting');
    return;
  }

  $scope.currentSI = SIManager.createSI('S', 0, 0.5);
  $scope.SIs = [];
  $scope.minRowCount = 8;
  $scope.SIPaddings = [0, 1, 2, 3, 4, 5, 6, 7];
  $scope.depthMin = 0;
  $scope.depthMax = 30;
  $scope.lambdaMin = 0.001;
  $scope.lambdaMax = 0.999;
  $scope.lambdaStep = 0.001;

  $scope.saveSI = () => {
    SIManager.registerSI($scope.currentSI);
    if ($scope.SIs.length <= $scope.minRowCount) {
      $scope.SIPaddings.pop();
    }
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

  //$scope.$watch('selectedVariable', (newValue, oldValue) => {
  //  if (newValue !== oldValue) {
  //    $scope.SIFunction = createCurrentSIFunction();
  //  }
  //});

  //$scope.$watch('selectedDepth', (newValue, oldValue) => {
  //  if (newValue !== oldValue) {
  //    $scope.SIFunction = createCurrentSIFunction();
  //  }
  //});

  //$scope.$watch('lambda', (newValue, oldValue) => {
  //  if (newValue !== oldValue) {
  //    $scope.SIFunction = createCurrentSIFunction();
  //  }
  //});

  //$scope.$watch('settings.cpueDateFrom', (newValue, oldValue) => {
  //  if (newValue !== oldValue) {
  //    $scope.cpueVar = $scope.originalCpueVar.filter(d => {
  //      return $scope.settings.cpueDateFrom <= d.date && d.date <= +$scope.settings.cpueDateTo + 86400000;
  //    });
  //    $scope.SIFunction = createCurrentSIFunction();
  //    $scope.SIs.forEach(SI => {
  //      SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
  //    });
  //  }
  //});

  //$scope.$watch('settings.cpueDateTo', (newValue, oldValue) => {
  //  if (newValue !== oldValue) {
  //    $scope.cpueVar = $scope.originalCpueVar.filter(d => {
  //      return $scope.settings.cpueDateFrom <= d.date && d.date <= +$scope.settings.cpueDateTo + 86400000;
  //    });
  //    $scope.SIFunction = createCurrentSIFunction();
  //    $scope.SIs.forEach(SI => {
  //      SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
  //    });
  //  }
  //});

  var initialized = false;
  $scope.drawSIViews = () => {
    if (!initialized) {
      var variableMapRenderer : MapRenderer = new MapRenderer('#variable-map');
      variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);

      var SIMapRenderer : MapRenderer = new MapRenderer('#si-map');
      SIMapRenderer.drawSI($scope.currentSI);

      initialized = true;
    }
  }
};
MainController.$inject = ['$scope', '$state', 'DataManager', 'SIManager', 'MapRenderer'];
}
