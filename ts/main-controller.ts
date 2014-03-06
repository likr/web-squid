/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>


module squid {
function createSIFunction(cpueVar, selectedVariable, selectedDepth, lambda) {
  var key = selectedVariable + selectedDepth;
  var interpolator = spline.interpolator(
    cpueVar,
    d => +d[key],
    d => +d['cpue'],
    lambda);
  var maxVal = interpolator.max()
  return x => {
    if (x == 0) {
      return NaN;
    } else {
      var v = interpolator.interpolate(x) / maxVal;
      if (v > 1) {
        return 1;
      } else if (v < 0) {
        return 0;
      } else {
        return v;
      }
    }
  };
}


app.controller('MainController', ['$scope', 'cpueVar', function($scope, cpueVar) {
  function createCurrentSIFunction() {
    return createSIFunction($scope.cpueVar, $scope.selectedVariable, $scope.selectedDepth, $scope.lambda);
  }

  $scope.originalCpueVar = cpueVar;
  $scope.cpueVar = cpueVar;
  $scope.selectedVariable = 'S';
  $scope.selectedDepth = 0;
  $scope.selectedDate = new Date(2006, 0, 10);
  $scope.cpueDateFrom = d3.min($scope.cpueVar, (d : any) => d.date);
  $scope.cpueDateTo = d3.max($scope.cpueVar, (d : any) => d.date);
  $scope.lambda = 0.5;
  $scope.SIs = [];
  $scope.SIFunction = createCurrentSIFunction();
  $scope.depthMin = 0;
  $scope.depthMax = 25;
  $scope.lambdaMin = 0.001;
  $scope.lambdaMax = 1;
  $scope.lambdaStep = 0.001;

  $scope.saveSI = () => {
    var dateIndex = (() => {
      var date = $scope.selectedDate;
      var startDate : any = new Date(2006, 0, 10);
      var dateIndex = (date - startDate) / 86400000;
      if (dateIndex < 0) {
        return 0;
      } else if (dateIndex > 9) {
        return 9;
      }
      return dateIndex;
    })();
    $scope.SIs.push({
      variable: $scope.selectedVariable,
      depth: $scope.selectedDepth,
      date: dateIndex,
      lambda: $scope.lambda,
      SIFunction: $scope.SIFunction,
      active: true
    });
  };

  $scope.incrementDepth = () => {
    $scope.selectedDepth = Math.min($scope.depthMax, $scope.selectedDepth + 1);
  };

  $scope.decrementDepth = () => {
    $scope.selectedDepth = Math.max($scope.depthMin, $scope.selectedDepth - 1);
  };

  $scope.incrementLambda = () => {
    $scope.lambda = Math.min($scope.lambdaMax, $scope.lambda + $scope.lambdaStep);
  };

  $scope.decrementLambda = () => {
    $scope.lambda = Math.max($scope.lambdaMin, $scope.lambda - $scope.lambdaStep);
  };

  $scope.$watch('selectedVariable', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.SIFunction = createCurrentSIFunction();
    }
  });

  $scope.$watch('selectedDepth', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.SIFunction = createCurrentSIFunction();
    }
  });

  $scope.$watch('lambda', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.SIFunction = createCurrentSIFunction();
    }
  });

  $scope.$watch('cpueDateFrom', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.cpueVar = $scope.originalCpueVar.filter(d => {
        return $scope.cpueDateFrom <= d.date && d.date <= $scope.cpueDateTo;
      });
      $scope.SIFunction = createCurrentSIFunction();
      $scope.SIs.forEach(SI => {
        SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
      });
    }
  });

  $scope.$watch('cpueDateTo', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.cpueVar = $scope.originalCpueVar.filter(d => {
        return $scope.cpueDateFrom <= d.date && d.date <= $scope.cpueDateTo;
      });
      $scope.SIFunction = createCurrentSIFunction();
      $scope.SIs.forEach(SI => {
        SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
      });
    }
  });
}]);
}
