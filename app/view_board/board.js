'use strict';

angular.module('saveourair.view_board', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/board', {
    templateUrl: 'view_board/board.html',
    controller: 'BoardCtrl'
  });
}])

.controller('BoardCtrl', function($scope, $timeout, $location, store, dataprocess) {
  	$scope.loading = true
  	
  	if (store.get('reconciledData')) {
  		renderData(store.get('reconciledData'))
  	} else {
  		// DEV MODE: load test data
			// d3.csv('data/test.csv', renderData)

			// PROD MODE: redirect to upload page
			$timeout(function(){
        $location.url('/upload')
      }, 0)
  	}

    $scope.download = function() {
      var blob = new Blob([d3.csvFormat($scope.timelineData)], {'type':'text/csv;charset=utf-8'});
      saveAs(blob, "Personal Air Timeline.csv");
    }

  	function renderData(data){
  		
      dataprocess.consolidate(data)

  		$timeout(function(){
  			$scope.loading = false
  			
  			// console.log('data', data)
  			// window.data = data

  			$scope.timelineData = data
  		})
  	}

});
