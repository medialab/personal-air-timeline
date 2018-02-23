'use strict';

angular.module('saveourair.view_focus', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/focus/:start?/:end?', {
    templateUrl: 'view_focus/focus.html',
    controller: 'FocusCtrl'
  });
}])

.controller('FocusCtrl', function($scope, $timeout, $location, $routeParams, store, dataprocess) {
  	$scope.loading = true

    var dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

  	if (store.get('reconciledData')) {
  		renderData(store.get('reconciledData'))
  	} else {
      if ($routeParams.start && $routeParams.end) {

        if (!dateRegex.test($routeParams.start) || !dateRegex.test($routeParams.end))
          alert('Invalid date. Format is YYYY-MM-DDTmm:ss');

        $scope.start = +parseDate($routeParams.start)
        $scope.end = +parseDate($routeParams.end)
      }
      else {
        var centralTimestamp = 1518909277000 + 60*60*1000;
        $scope.start = centralTimestamp - 300*60*1000
        $scope.end = centralTimestamp + 300*60*1000
      }

      $scope.startDate = titleFormatDate(new Date($scope.start))
      $scope.endDate = titleFormatDate(new Date($scope.end))

      // DEV MODE: load test data
			d3.csv('data/test.csv', renderData)

			// PROD MODE: redirect to upload page
			/*$timeout(function(){
      $location.url('/upload')
    }, 0)*/
  	}

    function parseDate(string) {
      var split = string.split('T')
      var date = split[0].split('-')
      var time = split[1].split(':')

      return new Date(
        (+date[0]),
        (+date[1])-1, // Careful, month starts at 0!
        (+date[2]),
        (+time[0]),
        (+time[1])
      )
    }

  	function renderData(data){
      dataprocess.consolidate(data)

      $scope.staticPositions = dataprocess.staticPositions(data)
      $scope.shortStaticPositions = $scope.staticPositions
        .filter(function(d, i){ return i<5 }) // Max 5 places

  		data = data.filter(function(d){
        return $scope.start <= d.timestamp
          && d.timestamp < $scope.end
      })

      $timeout(function(){
  			$scope.loading = false

  			console.log('data', data)
  			window.data = data

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
