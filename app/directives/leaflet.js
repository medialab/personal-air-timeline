var Leaflet = require('leaflet');

angular.directive('leaflet', [function() {
  return {
    restrict: 'E',
    templateUrl: '',
    scope: {
      markers: '='
    },
    link: function($scope, el, attrs) {
      $scope.map = Leaflet.map(el, {
        center: [51.505, -0.09],
        zoom: 13
      });
    }
  };
}]);
