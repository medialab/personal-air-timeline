'use strict';

angular.module('saveourair.view_focus', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/focus', {
    templateUrl: 'view_focus/focus.html',
    controller: 'FocusCtrl'
  });
}])

.controller('FocusCtrl', function($scope, $timeout, $location, store, dataprocess) {
  	$scope.loading = true
  	
  	if (store.get('reconciledData')) {
  		renderData(store.get('reconciledData'))
  	} else {
      var centralTimestamp = 1518909277000 + 60*60*1000;
      $scope.start = centralTimestamp - 300*60*1000
      $scope.end = centralTimestamp + 300*60*1000
      $scope.startDate = shortFormatDate(new Date($scope.start))
      $scope.endDate = shortFormatDate(new Date($scope.end))
  		
      // DEV MODE: load test data
			d3.csv('data/test.csv', renderData)

			// PROD MODE: redirect to upload page
			/*$timeout(function(){
      $location.url('/upload')
    }, 0)*/
  	}

  	function renderData(data){
      data = data.filter(function(d){
        return $scope.start <= d.timestamp
          && d.timestamp < $scope.end
      })
      dataprocess.consolidate(data)

  		$timeout(function(){
  			$scope.loading = false
  			
  			console.log('data', data)
  			window.data = data

  			$scope.timelineData = data
  		})
  	}

    //
    function shortFormatDate(date) {
      var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
      ];

      var day = date.getDate();
      var monthIndex = date.getMonth();
      var year = date.getFullYear();

      return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }

});
