var Leaflet = require('leaflet');

angular.module('saveourair.directives.leafletCanvas', []).directive('leafletCanvas', [function() {
  return {
    restrict: 'E',
    templateUrl: './directives/leaflet.html',
    scope: {
      data: '='
    },
    link: function($scope, el, attrs) {
      var div = el.find('div')[0];

      // Filtering irrelevant points
      data = $scope.data.filter(function(d) {
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

      // Custom canvas layer
      Leaflet.CanvasLayer = L.Layer.extend({
        onAdd: function(map) {
          var pane = map.getPane(this.options.pane);
          var canvas = L.DomUtil.create('canvas');
          var mapSize = map.getSize();

          var pixelRatio = 2;

          canvas.width = mapSize.x * pixelRatio;
          canvas.height = mapSize.y * pixelRatio;

          canvas.style.width = mapSize.x + 'px';
          canvas.style.height = mapSize.y + 'px';

          pane.appendChild(canvas);

          var pos = function(point) {
            return map.latLngToLayerPoint([point.y, point.x]);
          };
        }
      });

      // Map initialization
      $scope.map = Leaflet.map(div, {
        center: [56.056695, 9.841720],
        zoomSnap: 0.5,
        attributionControl: false,
        zoomControl: false,
        dragging: false,
        boxZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false
      });

      Leaflet.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo($scope.map);

      $scope.map.fitBounds([
        [minY, minX],
        [maxY, maxX]
      ]);

      var canvasLayer = new Leaflet.CanvasLayer();
      canvasLayer.addTo($scope.map);
    }
  };
}]);
