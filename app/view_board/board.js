'use strict';

var gexf = require('graphology-gexf');
var isNumeric = require('../utils.js').isNumeric;

angular.module('saveourair.view_board', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/board', {
    templateUrl: 'view_board/board.html',
    controller: 'BoardCtrl'
  });
}])

.controller('BoardCtrl', ['$scope', '$timeout'
  ,function(               $scope ,  $timeout ) {

}]);
