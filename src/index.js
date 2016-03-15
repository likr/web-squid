import angular from 'angular'
import uiRouterModule from 'angular-ui-router'
import uiBootstrapModule from 'angular-ui-bootstrap'
import controllers from './controllers/index'
import services from './services/index'

angular.module('squid-hsi', [uiRouterModule, uiBootstrapModule, controllers, services])
  .factory('d3get', ['$q', function($q) {
    return function(xhr) {
      var deferred = $q.defer();
      xhr
        .on('load', function(data) {
          deferred.resolve(data);
        })
        .on('error', function(status) {
          deferred.reject(status);
        })
        .get()
        ;
      return deferred.promise;
    };
  }])
  .config(['$compileProvider', $compileProvider => {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|data):/);
  }])
  .config(['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) => {
    $stateProvider
      .state('setting', {
        controller: 'SettingController as settings',
        templateUrl: 'partials/setting.html',
        url: '/setting',
      })
      .state('main', {
        controller: 'MainController',
        templateUrl: 'partials/main.html',
        url: '/main',
        onEnter: ['$state', 'DataManager', ($state, DataManager) => {
          if (!DataManager.initialized()) {
            $state.go('setting');
          }
        }],
      })
      .state('main.si', {
        controller: 'SITabController',
        templateUrl: 'partials/si-tab.html',
        url: '/si',
      })
      .state('main.hsi', {
        controller: 'HSITabController',
        templateUrl: 'partials/hsi-tab.html',
        url: '/hsi',
      })
      ;
    $urlRouterProvider
      .otherwise('/setting');
  }])
  .run(['$rootScope', $rootScope => {
    $rootScope.alerts = [];

    $rootScope.addAlert = a => {
      $rootScope.alerts.push(a);
    };

    $rootScope.closeAlert = i => {
      $rootScope.alerts.splice(i, 1);
    };

    $rootScope.datepickerOptions = {
      formatMonth: 'MM',
      formatDayTitle: 'yyyy/MM',
      showWeeks: false,
    }
  }]);
