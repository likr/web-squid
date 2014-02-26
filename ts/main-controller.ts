/// <reference path="squid-hsi.ts"/>


module squid {
app.controller('MainController', ['$scope', 'cpueVar', function($scope, cpueVar) {
  $scope.cpueVar = cpueVar;
  $scope.selectedVariable = 'S';
  $scope.selectedDepth = 0;
  $scope.selectedDate = new Date(2006, 1, 10);
  $scope.lambda = 0.5;
}])
}
