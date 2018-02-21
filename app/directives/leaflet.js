var Leaflet = require('leaflet');

angular.module('saveourair.directives.leaflet', []).directive('leaflet', [function() {
  return {
    restrict: 'E',
    templateUrl: './directives/leaflet.html',
    scope: {

    },
    link: function($scope, el, attrs) {
      var div = el.find('div')[0];

      $scope.map = Leaflet.map(div, {
        center: [56.056695, 9.841720],
        zoom: 6
      });

      Leaflet.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo($scope.map);
    }
  };
}]);
