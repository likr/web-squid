/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>


module squid {
app.controller('MainController', ['$scope', 'cpueVar', function($scope, cpueVar) {
  function createSIFunction() {
    var key = $scope.selectedVariable + $scope.selectedDepth;
    var interpolator = spline.interpolator(
      $scope.cpueVar,
      d => +d[key],
      d => +d['cpue'],
      $scope.lambda);
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

  $scope.cpueVar = cpueVar;
  $scope.selectedVariable = 'S';
  $scope.selectedDepth = 0;
  $scope.selectedDate = new Date(2006, 1, 10);
  $scope.lambda = 0.5;
  $scope.SIs = [];
  $scope.SIFunction = createSIFunction();

  $scope.saveSI = () => {
    var dateIndex = (() => {
      var date = $scope.selectedDate;
      var startDate : any = new Date(2006, 1, 10);
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

  $scope.$watch('selectedVariable', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.SIFunction = createSIFunction();
    }
  });

  $scope.$watch('selectedDepth', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.SIFunction = createSIFunction();
    }
  });

  $scope.$watch('lambda', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.SIFunction = createSIFunction();
    }
  });
}]);
}
