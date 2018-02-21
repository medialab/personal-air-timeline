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

  		// Consolidate
      var fiveminutesms = 5*60*1000
      var d_prev
  		data.forEach(function(d){
  			d.timestamp = +d.timestamp
  			d.T = +d.T
  			d.RH = +d.RH
  			d.P = +d.P
  			d.PM25 = +d.PM25
  			d.PM10 = +d.PM10
  			d.x = +d.x || undefined
  			d.y = +d.y || undefined
        var defined = d_prev && d.timestamp - d_prev.timestamp < fiveminutesms
        d_prev = d
        d.def = defined
  		})

  		$timeout(function(){
  			$scope.loading = false
  			
  			console.log('data', data)
  			window.data = data

  			$scope.timelineData = data
  		})
  	}

  	/*$timeout(function(){
      $location.url('/upload')
    }, 0)*/
}]);
