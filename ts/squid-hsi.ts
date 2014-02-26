/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>


module squid {
export var app = angular.module('squid-hsi', ['ngRoute'])
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
