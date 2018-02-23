'use strict';

angular.module('saveourair.view_overview', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/overview', {
    templateUrl: 'view_overview/overview.html',
    controller: 'OverviewCtrl'
  });
}])

.controller('OverviewCtrl', function($scope, $timeout, $location, store, dataprocess) {
  	$scope.loading = true
  	
  	if (store.get('reconciledData')) {
  		renderData(store.get('reconciledData'))
  	} else {
      // DEV MODE: load test data
			d3.csv('data/test.csv', renderData)

			// PROD MODE: redirect to upload page
			/*$timeout(function(){
      $location.url('/upload')
    }, 0)*/
  	}

  	function renderData(data){

      dataprocess.consolidate(data)
      $scope.staticPositions = dataprocess.staticPositions(data)
      $scope.shortStaticPositions = $scope.staticPositions
        .filter(function(d, i){ return i<5 }) // Max 5 places
      console.log($scope.staticPositions)

  		$timeout(function(){
  			$scope.loading = false
  			
  			// console.log('data', data)
  			// window.data = data

  			$scope.timelineData = data
  		})
  	}

    //
    function titleFormatDate(date) {
      var monthNames = [
        "Jan", "Feb", "March",
        "April", "May", "June", "July",
        "Aug", "Sept", "Oct",
        "Nov", "Dec"
      ];

      var day = date.getDate();
      var monthIndex = date.getMonth();
      var year = date.getFullYear();

      var hours = date.getHours();
      var minutes = date.getMinutes();

      return day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + hours + ':' + minutes;
    }

});
