/// <reference path="../views/map-view.ts"/>

module squid {
export class MapController {
  static $inject = ['$scope', 'MapView'];

  constructor($scope, MapView) {
    $scope.$watch('selectedVariable', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if ($scope.view != 'hsi') {
          MapView.draw();
        }
      }
    });

    $scope.$watch('selectedDepth', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if ($scope.view != 'hsi') {
          MapView.draw();
        }
      }
    });

    $scope.$watch('settings.selectedDate', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        MapView.draw();
      }
      //markPoints();
    });

    $scope.$watch('lambda', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if ($scope.view == 'si') {
          MapView.draw();
        }
      }
    });

    $scope.$watch('cpueVar', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if ($scope.view != 'variable') {
          MapView.draw();
        }
        //markPoints();
      }
    });

    $scope.$watch('view', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        MapView.draw();
      }
    });

    //$scope.$watch('showWholeCPUE', (newValue, oldValue) => {
    //  if (newValue !== oldValue) {
    //    markPoints();
    //  }
    //});

    //$scope.$watch('showExpectedCPUE', (newValue, oldValue) => {
    //  if (newValue !== oldValue) {
    //    markPoints();
    //  }
    //});

    $scope.$watch('SIs.length', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if ($scope.view == 'hsi') {
          MapView.draw();
        }
      }
    });

    $scope.activeSICount = () => {
      return $scope.SIs.filter(SI => SI.active).length;
    };

    $scope.$watch('activeSICount()', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if ($scope.view == 'hsi') {
          MapView.draw();
        }
      }
    });
  }
}
}
