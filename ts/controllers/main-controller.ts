/// <reference path="../spline.ts"/>


module squid {
function createSIFunction(cpueVar, selectedVariable, selectedDepth, lambda) {
  var key = selectedVariable + selectedDepth;
  var interpolator = spline.interpolator(
    cpueVar,
    d => +d[key],
    d => +d['cpue'],
    lambda);
  var scale = d3.scale.linear()
    .domain([interpolator.min(), interpolator.max()])
    .range([0, 1]);
  return x => {
    if (x == 0) {
      return NaN;
    } else {
      var v = scale(interpolator.interpolate(x));
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


export function MainController($scope, cpueVar, $modal) {
  function createCurrentSIFunction() {
    return createSIFunction($scope.cpueVar, $scope.selectedVariable, $scope.selectedDepth, $scope.lambda);
  }

  $scope.originalCpueVar = cpueVar;
  $scope.cpueVar = cpueVar;
  $scope.selectedVariable = 'S';
  $scope.selectedDepth = 0;
  $scope.settings = {};
  $scope.settings.selectedDate = new Date(2006, 0, 10);
  $scope.settings.cpueDateFrom = d3.min($scope.cpueVar, (d : any) => d.date);
  $scope.settings.cpueDateTo = d3.max($scope.cpueVar, (d : any) => d.date);
  $scope.lambda = 0.5;
  $scope.SIs = [];
  $scope.minRowCount = 8;
  $scope.SIPaddings = [0, 1, 2, 3, 4, 5, 6, 7];
  $scope.SIFunction = createCurrentSIFunction();
  $scope.depthMin = 0;
  $scope.depthMax = 25;
  $scope.lambdaMin = 0.001;
  $scope.lambdaMax = 1;
  $scope.lambdaStep = 0.001;
  $scope.settings.opendapEndpoint = 'http://priusa.yes.jamstec.go.jp/opendap/';

  $scope.saveSI = () => {
    var dateIndex = (() => {
      var date = $scope.settings.selectedDate;
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
    if ($scope.SIs.length <= $scope.minRowCount) {
      $scope.SIPaddings.pop();
    }
  };

  $scope.incrementDepth = () => {
    $scope.selectedDepth = Math.min($scope.depthMax, +$scope.selectedDepth + 1);
  };

  $scope.decrementDepth = () => {
    $scope.selectedDepth = Math.max($scope.depthMin, $scope.selectedDepth - 1);
  };

  $scope.incrementLambda = () => {
    $scope.lambda = Math.min($scope.lambdaMax, +$scope.lambda + $scope.lambdaStep);
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

  $scope.$watch('settings.cpueDateFrom', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.cpueVar = $scope.originalCpueVar.filter(d => {
        return $scope.settings.cpueDateFrom <= d.date && d.date <= +$scope.settings.cpueDateTo + 86400000;
      });
      $scope.SIFunction = createCurrentSIFunction();
      $scope.SIs.forEach(SI => {
        SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
      });
    }
  });

  $scope.$watch('settings.cpueDateTo', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.cpueVar = $scope.originalCpueVar.filter(d => {
        return $scope.settings.cpueDateFrom <= d.date && d.date <= +$scope.settings.cpueDateTo + 86400000;
      });
      $scope.SIFunction = createCurrentSIFunction();
      $scope.SIs.forEach(SI => {
        SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
      });
    }
  });

  $scope.openSetting = () => {
    var modal = $modal.open({
      templateUrl: 'partials/setting.html',
      scope: $scope,
    });
  };
};


(<any>MainController).$inject = ['$scope', 'cpueVar', '$modal'];
}
