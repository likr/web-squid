/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>
/// <reference path="main-controller.ts"/>
/// <reference path="setting-controller.ts"/>


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
  .controller('SettingController', SettingController)
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'MainController',
        templateUrl: 'partials/main.html',
        resolve: {
          cpueVar: ['d3get', function(d3get) {
            var id = 0;
            return d3get(d3.csv('cpue-var.csv').row(d => {
              var obj = {
                id: id++,
                x: +d.x,
                y: +d.y,
                date: new Date(d.stopDate),
                cpue: +d.cpue,
                HM0: +d.HM0,
              };
              ['S', 'T', 'U', 'V', 'W'].forEach(v => {
                var i;
                for (i = 0; i < 54; ++i) {
                  obj[v + i] = +d[v + i];
                }
              });
              return obj;
            }));
          }]
        }
      })
      ;
  }])
  ;
}
