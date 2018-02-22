var Leaflet = require('leaflet');

angular.module('saveourair.directives.leaflet', []).directive('leaflet', [function() {
  return {
    restrict: 'E',
    templateUrl: './directives/leaflet.html',
    scope: {
      data: '='
    },
    link: function($scope, el, attrs) {
      var div = el.find('div')[0];

      // Filtering irrelevant points
      $scope.data = $scope.data.filter(function(d) {
        return d.x && d.y;
      });

      // Finding boundaries
      var minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;

      $scope.data.forEach(function(d) {
        if (d.x < minX)
          minX = d.x;
        if (d.x > maxX)
          maxX = d.x;

        if (d.y < minY)
          minY = d.y;
        if (d.y > maxY)
          maxY = d.y;
      });

      $scope.map = Leaflet.map(div, {
        center: [56.056695, 9.841720],
        zoom: 6
      });

      $scope.map.fitBounds([
        [minY, minX],
        [maxY, maxX]
      ]);

      Leaflet.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo($scope.map);

      // Adding points
      $scope.data.forEach(function(d) {
        var marker = Leaflet.circleMarker([d.y, d.x], {
          radius: 5,
          fillOpacity: 1,
          color: '#fff'
        });

        marker.addTo($scope.map);
      });

      $scope.data.forEach(function(d) {
        var marker = Leaflet.circleMarker([d.y, d.x], {
          radius: 3,
          fillOpacity: 1,
          color: 'steelblue'
        });

        marker.addTo($scope.map);
      });
    }
  };
}]);
