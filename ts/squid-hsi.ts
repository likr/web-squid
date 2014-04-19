/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>
/// <reference path="lib/jsdap.d.ts"/>
/// <reference path="controllers/main-controller.ts"/>
/// <reference path="controllers/setting-controller.ts"/>
/// <reference path="views/correlation-view.ts"/>
/// <reference path="views/distribution-view.ts"/>
/// <reference path="views/map-view.ts"/>
/// <reference path="data-manager.ts"/>
/// <reference path="si-manager.ts"/>


module squid {
export var app = angular.module('squid-hsi', ['ui.router', 'ui.bootstrap'])
  .factory('d3get', ['$q', function($q) {
    return function(xhr) {
      var deferred = $q.defer();
      xhr
        .on('load', function(data) {
          deferred.resolve(data);
        })
        .on('error', function(ststus) {
          deferred.reject(status);
        })
        .get()
        ;
      return deferred.promise;
    };
  }])
  .factory('CorrelationRenderer', CorrelationRendererFactory)
  .factory('DistributionRenderer', DistributionRendererFactory)
  .factory('MapRenderer', MapRendererFactory)
  .filter('variableName', [() => {
    return (variable : string) : string => {
      switch (variable) {
        case 'S':
          return 'Salinity';
        case 'T':
          return 'Temperature';
        case 'U':
          return 'Horizontal Velocity (Lat.)';
        case 'V':
          return 'Horizontal Velocity (Lon.)';
        case 'W':
          return 'Vertical Velocity';
        case 'HM':
          return 'Sea Surface Height';
        default:
          return '';
      }
    }
  }])
  .service('DataManager', DataManager)
  .service('SIManager', SIManager)
  .controller('MainController', MainController)
  .controller('SettingController', SettingController)
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
      })
      ;
    $urlRouterProvider
      .otherwise('/setting');
  }])
  .config(['datepickerConfig', datepickerConfig => {
    datepickerConfig.monthFormat = 'MM';
    datepickerConfig.dayTitleFormat = 'yyyy/MM';
    datepickerConfig.showWeeks = false;
  }])
  .run(['$rootScope', $rootScope => {
    $rootScope.alerts = [];

    $rootScope.addAlert = a => {
      $rootScope.alerts.push(a);
    };

    $rootScope.closeAlert = i => {
      $rootScope.alerts.splice(i, 1);
    };
  }])
  ;
}
