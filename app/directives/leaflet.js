var Leaflet = require('leaflet');

angular.module('saveourair.directives.leaflet', []).directive('leaflet', [function() {
  return {
    restrict: 'E',
    templateUrl: '',
    scope: {

    },
    link: function($scope, el, attrs) {
      console.log('ici');
      // $scope.map = Leaflet.map(el, {
      //   center: [51.505, -0.09],
      //   zoom: 13
      // });
    }
  };
}]);
