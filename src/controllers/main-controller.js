import angular from 'angular'

const modName = 'squid-hsi.controllers.main-controller';

angular.module(modName, []).controller('MainController', ($scope, DataManager, SIManager) => {
  $scope.SIs = SIManager.SIs;
  $scope.DataManager = DataManager;
});

export default modName
