module squid {
export var SIController = ['$scope', ($scope) => {
  $scope.loadSI = SI => {
    $scope.$parent.selectedVariable = SI.variable;
    $scope.$parent.selectedDepth = SI.depth;
    $scope.$parent.lambda = SI.lambda;
    $scope.$parent.SIFunction = SI.SIFunction;
  };

  $scope.removeSI = i => {
    $scope.SIs.splice(i, 1);
  };
}];
}
