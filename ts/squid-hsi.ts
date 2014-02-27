/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>


module squid {
export var app = angular.module('squid-hsi', ['ngRoute', 'ui.date'])
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
        default:
          return '';
      }
    }
  }])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'MainController',
        templateUrl: 'partials/main.html',
        resolve: {
          cpueVar: ['d3get', function(d3get) {
            return d3get(d3.csv('cpue-var.csv'));
          }]
        }
      })
      ;
  }])
  ;
}
