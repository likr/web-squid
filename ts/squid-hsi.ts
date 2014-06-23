/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>
/// <reference path="lib/jqdap.d.ts"/>
/// <reference path="controllers/hsi-tab-controller.ts"/>
/// <reference path="controllers/main-controller.ts"/>
/// <reference path="controllers/setting-controller.ts"/>
/// <reference path="controllers/si-tab-controller.ts"/>
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
  .service('DataManager', DataManager)
  .service('SIManager', SIManager)
  .service('variableMapRenderer', ['MapRenderer', (MapRenderer : MapRendererClass) => {
    return new MapRenderer;
  }])
  .service('SIMapRenderer', ['MapRenderer', (MapRenderer : MapRendererClass) => {
    return new MapRenderer;
  }])
  .service('SIMapRenderer2', ['MapRenderer', (MapRenderer : MapRendererClass) => {
    return new MapRenderer;
  }])
  .service('HSIMapRenderer', ['MapRenderer', (MapRenderer : MapRendererClass) => {
    return new MapRenderer;
  }])
  .controller('HSITabController', HSITabController)
  .controller('MainController', MainController)
  .controller('SettingController', SettingController)
  .controller('SITabController', SITabController)
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
