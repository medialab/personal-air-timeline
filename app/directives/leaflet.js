var Leaflet = require('leaflet');

console.log('leaflet.js')

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
      var data = $scope.data.filter(function(d) {
        return d.x && d.y;
      });

      // Finding boundaries
      var minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;

      data.forEach(function(d) {
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
      //Leaflet.tileLayer('https://api.mapbox.com/styles/v1/mikima/cjdyiowio2v2c2sn31jhs4g9e/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg', {
        attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo($scope.map);

      // Adding points
      data.forEach(function(d) {
        var marker = Leaflet.circleMarker([d.y, d.x], {
          radius: 5,
          fillOpacity: 1,
          color: '#fff'
        });

        marker.addTo($scope.map);
      });

      data.forEach(function(d) {
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
