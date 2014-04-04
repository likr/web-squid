/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>
/// <reference path="controllers/depth-relation-controller.ts"/>
/// <reference path="controllers/distribution-controller.ts"/>
/// <reference path="controllers/setting-controller.ts"/>
/// <reference path="controllers/si-controller.ts"/>
/// <reference path="controllers/main-controller.ts"/>
/// <reference path="controllers/map-controller.ts"/>
/// <reference path="data-manager.ts"/>


module squid {
export var app = angular.module('squid-hsi', ['ngRoute', 'ui.date', 'ui.bootstrap'])
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
  .controller('MainController', MainController)
  .controller('MapController', MapController)
  .controller('SettingController', SettingController)
  .controller('SIController', SIController)
  .controller('DepthRelationController', DepthRelationController)
  .controller('DistributionController', DistributionController)
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'MainController',
        templateUrl: 'partials/main.html',
        resolve: {
          cpueVar: ['d3get', function(d3get) {
            return d3get(d3.csv('cpue-var.csv').row(parseRow));
          }]
        }
      })
      ;
  }])
  ;
}
