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

.controller('BoardCtrl', ['$scope', '$timeout', '$location'
  ,function(               $scope ,  $timeout ,  $location) {
  	$scope.loading = true
		d3.csv('data/test.csv', renderData)

  	function renderData(data){
  		$timeout(function(){
  			$scope.loading = false
  			console.log(data)
  		})
  	}

  	/*$timeout(function(){
      $location.url('/upload')
    }, 0)*/
}]);
