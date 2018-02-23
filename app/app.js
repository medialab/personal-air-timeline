'use strict';

// Requiring module's CSS
require('angular-material/angular-material.min.css');

// Requiring angular-related modules that will spit things in the global scope
require('angular');
require('angular-animate');
require('angular-aria');
require('angular-sanitize');
require('angular-material');
require('angular-route');

// Making some modules global for the custom scripts to consume
var d3 = require('d3');
window.d3 = d3;

// Requiring own modules
require('./directives/leaflet.js');
require('./directives/leafletCanvas.js');
require('./view_upload/upload.js');
require('./view_board/board.js');
require('./view_overview/overview.js');
require('./view_focus/focus.js');

// Helpers
// TODO: we should rely on a proper dep rather than copying this each time
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// Declare app level module which depends on views, and components
angular.module('saveourair', [
  'ngRoute',
  'ngSanitize',
  'ngMaterial',
  'saveourair.directives.leaflet',
  'saveourair.directives.leafletCanvas',
  'saveourair.view_upload',
  'saveourair.view_board',
  'saveourair.view_overview',
  'saveourair.view_focus'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/upload'});
}])

// Filters
/*.filter('number', function() {
  return function(d) {
    return +d
  }
})*/
.filter('percent', function() {
  return function(d) {
    return Math.round(+d*100)+'%'
  }
})

// Services
.factory('store', function(){
  var savedData = {}

  function set(key, data){
    savedData[key] = data
  }
  function get(key){
    return savedData[key]
  }
  function remove(key){
    return delete savedData[key]
  }

  return {
    set: set
    ,get: get
    ,remove: remove
  }
})

.factory('dataprocess', function(){
  var ns = {}
  ns.consolidate = function(data) {
    var fiveminutesms = 5*60*1000
    var d_prev
    data.forEach(function(d){
      d.timestamp = +d.timestamp
      d.T = +d.T
      d.RH = +d.RH
      d.P = +d.P
      d.PM25 = +d.PM25
      d.PM10 = +d.PM10
      d.DCE_PM25 = +d.DCE_PM25 || undefined
      d.DCE_PM10 = +d.DCE_PM10 || undefined
      d.x = +d.x || undefined
      d.y = +d.y || undefined
      d.instantspeed = +d.instantspeed || undefined
      d.smoothedspeed = +d.smoothedspeed || undefined
      var defined = d_prev && d.timestamp - d_prev.timestamp < fiveminutesms
      d_prev = d
      d.def = defined
    })

    // Compute when static
    var lastStaticPosition
    var lastStaticPositionThreshold = 100
    var idleTimeInterval = 5*60*1000
    data.forEach(function(d, i){

      // Distance to last static position
      if (lastStaticPosition) {
        var dist = ns.haversine(d, lastStaticPosition)
        if (dist < lastStaticPositionThreshold && i>0 && Math.abs(d.timestamp - data[i-1].timestamp) < idleTimeInterval) {
          // Still at the same place
          d.timestatic = d.timestamp - lastStaticPosition.timestamp
        } else {
          // On the move!
          lastStaticPosition = undefined
          d.timestatic = 0
        }
      }

      // Look at last static position
      if (lastStaticPosition === undefined) {
        lastStaticPosition = {x:d.x, y:d.y, timestamp:d.timestamp}
      }
    })
  }

  ns.staticPositions = function(data) {
    // Compute when ego stayed at the same place for a time
    var stays = []
    var currentStaticPosition
    var staticThreshold = 10 * 60 * 1000 // Ten minutes to stay at the same place
    data.forEach(function(d){
      if (d.timestatic > staticThreshold && d.x && d.y) {
        if (currentStaticPosition == undefined) {
          currentStaticPosition = {x:d.x, y:d.y, begin:d.timestamp, end:d.timestamp}
        } else {
          currentStaticPosition.end = d.timestamp
        }
      } else {
        if (currentStaticPosition) {
          stays.push(currentStaticPosition)
          currentStaticPosition = undefined
        }
      }
    })

    // Get places from the stays
    var places = []
    var samePlaceThreshold = 100
    stays.forEach(function(stay){
      // Search for an existing place
      var existing = places.some(function(place){
        if (ns.haversine(place, stay) < samePlaceThreshold) {
          place.stays.push(stay)
          return true
        }
      })
      if (!existing) {
        places.push({x:stay.x, y:stay.y, stays:[stay]})
      }
    })

    // Consolidate places
    places.forEach(function(place){
      place.duration = d3.sum(place.stays, function(stay){ return stay.end - stay.begin })
      place.stays.forEach(function(stay){
        place.begin = Math.min(place.begin || stay.begin, stay.begin)
        place.end = Math.max(place.end || stay.end, stay.end)
      })
    })
    places.sort(function(a, b){ return a.begin - b.begin })
    var alphabet = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('')
    places.forEach(function(place, i){
      place.name = alphabet[i%alphabet.length]
    })
    places.sort(function(a, b){ return b.duration - a.duration })

    return places
  }

  // Distance in meters between two lat long points as {x, y}
  ns.haversine = function(a, b) {
    if (a.x === b.x && a.y === b.y)
      return 0;

    var R = Math.PI / 180;

    var lon1 = a.y * R,
        lat1 = a.x * R,
        lon2 = b.y * R,
        lat2 = b.x * R;

    var dlon = lon2 - lon1,
        dlat = lat2 - lat1,
        a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2),
        c = 2 * Math.asin(Math.sqrt(a)),
        km = 6371 * c;

    return km * 1000;
  }
  return ns
})

// Directives (cards)
.directive('timelineSummaryCard', function($timeout){
  return {
    restrict: 'E',
    templateUrl: 'directives/timelineSummaryCard.html',
    scope: {
      timelineData: '='
    }
  }
})

.directive('leafletCard', function($timeout){
  return {
    restrict: 'E',
    templateUrl: 'directives/leafletCard.html',
    scope: {
      timelineData: '='
    }
  }
})

.directive('condensedCurve', function($timeout){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">{{title}} loading...</small>',
    scope: {
      timelineData: '=',
      accessor: '=',
      title: '=',
      scale: '='
    },
    link: function($scope, el, attrs) {
      $scope.$watch('timelineData', redraw, true)
      // $scope.$watch('accessor', redraw, true)
      // $scope.$watch('scale', redraw, true)
      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var container = el

      function redraw(){
        $timeout(function(){
          container.html('');

          // Setup: dimensions
          var margin = {top: 6, right: 0, bottom: 6, left: 200};
          var width = container[0].offsetWidth - margin.left - margin.right;
          var height = container[0].offsetHeight - margin.top - margin.bottom;

          // // While loading redraw may trigger before element being properly sized
          if (width <= 0 || height <= 0) {
            $timeout(redraw, 250)
            return
          }

          var svg = d3.select(container[0])
            .append('svg')
            .attr('width', container[0].offsetWidth)
            .attr('height', container[0].offsetHeight)

          var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

          var parseTime = d3.timeParse("%L")

          var x = d3.scaleTime()
              .range([0, width])

          if ($scope.scale) {

            // Only display the axis
            g.append("g")
                // .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
              // .select(".domain")
              //   .remove();

          } else {

            // Only display the data
            var y = d3.scaleLinear()
                .range([height, 0])

            var line = d3.line()
                .defined(function(d) { return y(d[$scope.accessor]) && d.def})
                .x(function(d) { return x(d.timestamp); })
                .y(function(d) { return y(d[$scope.accessor]); })

            x.domain(d3.extent($scope.timelineData, function(d) { return d.timestamp; }));
            y.domain(d3.extent($scope.timelineData, function(d) { return d[$scope.accessor]; }));

            g.append("path")
                .datum($scope.timelineData)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("d", line);

            g.append("text")
                .attr('x', -6)
                .attr('y', 18)
                .text($scope.title)
                .attr("text-anchor", "end")
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", "steelblue")

          }
        })
      }
    }
  }
})

.directive('bwCurve', function($timeout){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">{{title}} loading...</small>',
    scope: {
      timelineData: '=',
      accessor: '=',
      secondaryAccessor: '=',
      title: '=',
      noscale: '='
    },
    link: function($scope, el, attrs) {
      $scope.$watch('timelineData', redraw, true)
      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var container = el

      function redraw(){
        $timeout(function(){
          container.html('');

          // Setup: dimensions
          var margin = {top: 6, right: 0, bottom: $scope.noscale?6:24, left: 60};
          var width = container[0].offsetWidth - margin.left - margin.right;
          var height = container[0].offsetHeight - margin.top - margin.bottom;

          // // While loading redraw may trigger before element being properly sized
          if (width <= 0 || height <= 0) {
            $timeout(redraw, 250)
            return
          }

          var svg = d3.select(container[0])
            .append('svg')
            .attr('width', container[0].offsetWidth)
            .attr('height', container[0].offsetHeight)

          var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

          var parseTime = d3.timeParse("%L")

          var x = d3.scaleTime()
              .range([0, width])

          // Only display the data
          var y = d3.scaleLinear()
              .range([height, 0])

          var line = d3.line()
              .defined(function(d) { return y(d[$scope.accessor]) && d.def})
              .x(function(d) { return x(d.timestamp); })
              .y(function(d) { return y(d[$scope.accessor]); })

          x.domain(d3.extent($scope.timelineData, function(d) { return d.timestamp; }));
          y.domain([0, d3.max($scope.timelineData.map(function(d) { return d[$scope.accessor]; }))]);

          if ($scope.secondaryAccessor) {
            var line2 = d3.line()
                .defined(function(d) { return y(d[$scope.secondaryAccessor]) && d.def})
                .x(function(d) { return x(d.timestamp); })
                .y(function(d) { return y(d[$scope.secondaryAccessor]); })

            g.append("path")
                .datum($scope.timelineData)
                .attr("fill", "none")
                .attr("stroke-dasharray", "0.3, 1.2")
                .attr("stroke", "#777")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 0.5)
                .attr("d", line2);
          }

          g.append("path")
              .datum($scope.timelineData)
              .attr("fill", "none")
              .attr("stroke", "black")
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 0.5)
              .attr("d", line);

          if (!$scope.noscale) {
            g.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .attr("class", "bwAxis")

            g.append("g")
                .call(d3.axisLeft(y))
                .attr("class", "bwAxis")
            }

          g.append("text")
              .attr('x', 0)
              .attr('y', -40)
              .attr("transform", "rotate(-90)")
              .text($scope.title)
              .attr("text-anchor", "end")
              .attr("font-family", "Roboto Slab")
              .attr("font-size", "14px")
              .attr("fill", "black")
        })
      }
    }
  }
})

.directive('placesLine', function($timeout){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">{{title}} loading...</small>',
    scope: {
      places: '=',
      timelineData: '='
    },
    link: function($scope, el, attrs) {
      $scope.$watch('places', redraw, true)
      $scope.$watch('timelineData', redraw, true)
      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var container = el

      function redraw(){
        $timeout(function(){
          container.html('');

          // Setup: dimensions
          var margin = {top: 6, right: 0, bottom: 6, left: 60};
          var width = container[0].offsetWidth - margin.left - margin.right;
          var height = container[0].offsetHeight - margin.top - margin.bottom;

          // While loading redraw may trigger before element being properly sized
          if (width <= 0 || height <= 0) {
            $timeout(redraw, 250)
            return
          }

          var svg = d3.select(container[0])
            .append('svg')
            .attr('width', container[0].offsetWidth)
            .attr('height', container[0].offsetHeight)

          var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

          var parseTime = d3.timeParse("%L")

          var x = d3.scaleTime()
              .range([0, width])

          x.domain(d3.extent($scope.timelineData, function(d) { return d.timestamp; }));

          // Background line
          g.append("line")
              .attr("x1", 0)
              .attr("y1", height/2)
              .attr("x2", width)
              .attr("y2", height/2)
              .attr("stroke", "black")
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 1)

          var thickness = 20
          // Black outline
          $scope.places.forEach(function(place){
            place.stays.forEach(function(stay){
              g.append("line")
                  .attr("x1", x(stay.begin) + Math.min(x(stay.end) - x(stay.begin), thickness)/2)
                  .attr("y1", height/2)
                  .attr("x2", x(stay.end) - Math.min(x(stay.end) - x(stay.begin), thickness)/2)
                  .attr("y2", height/2)
                  .attr("stroke", "black")
                  .attr("stroke-linejoin", "round")
                  .attr("stroke-linecap", "round")
                  .attr("stroke-width", thickness)
            })
          })
          // White
          $scope.places.forEach(function(place){
            place.stays.forEach(function(stay){
              g.append("line")
                  .attr("x1", x(stay.begin) + Math.min(x(stay.end) - x(stay.begin), thickness)/2)
                  .attr("y1", height/2)
                  .attr("x2", x(stay.end) - Math.min(x(stay.end) - x(stay.begin), thickness)/2)
                  .attr("y2", height/2)
                  .attr("stroke", "white")
                  .attr("stroke-linejoin", "round")
                  .attr("stroke-linecap", "round")
                  .attr("stroke-width", thickness-3.5)
            })
          })

          $scope.places.forEach(function(place){
            place.stays.forEach(function(stay){
              g.append("text")
                  .attr('x', (Math.max(-margin.left, x(stay.begin)) + Math.min(width+margin.right, x(stay.end))) / 2)
                  .attr('y', 6 + height/2)
                  .text(place.name)
                  .attr("text-anchor", "middle")
                  .attr("font-family", "Roboto Slab")
                  .attr("font-size", "16px")
                  .attr("fill", "black")
            })
          })


          /*

          g.append("path")
              .datum($scope.timelineData)
              .attr("fill", "none")
              .attr("stroke", "black")
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 0.5)
              .attr("d", line);

          g.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x))
              .attr("class", "bwAxis")

          g.append("g")
              .call(d3.axisLeft(y))
              .attr("class", "bwAxis")

          g.append("text")
              .attr('x', 0)
              .attr('y', -40)
              .attr("transform", "rotate(-90)")
              .text($scope.title)
              .attr("text-anchor", "end")
              .attr("font-family", "Roboto Slab")
              .attr("font-size", "14px")
              .attr("fill", "black")*/
        })
      }
    }
  }
})

.directive('overBrush', function($timeout, $location, $route){
  return {
    restrict: 'E',
    template: '<div style="position:absolute; top:0; width:170mm; height:80px"></div>',
    scope: {
      timelineData: '=',
      begin:'=',
      end:'='
    },
    link: function($scope, el, attrs) {
      $scope.$watch('timelineData', init, true)
      $scope.$watch('begin', redraw, true)
      $scope.$watch('end', redraw, true)
      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var container = el.find('div')

      var brush, x, width, height

      function redraw() {
        if (brush) {
          brush.extent([x($scope.begin), x($scope.end), height])
          // brush(d3.select(".brush").transition())
          // brush.event(d3.select(".brush").transition().delay(1000))
        }
      }

      function init(){
        $timeout(function(){
          container.html('');

          // Setup: dimensions
          var margin = {top: 3, right: 0, bottom: 3, left: 60};
          width = container[0].offsetWidth - margin.left - margin.right;
          height = container[0].offsetHeight - margin.top - margin.bottom;

          var svg = d3.select(container[0])
            .append('svg')
            .attr('width', container[0].offsetWidth)
            .attr('height', container[0].offsetHeight)

          var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

          var parseTime = d3.timeParse("%L")

          var extent = d3.extent($scope.timelineData, function(d) { return d.timestamp; })

          x = d3.scaleTime()
              .range([0, width])
              .domain(extent);

          var brushed = function() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
            var s = d3.event.selection || x.range();
            update(s);
          }

          var update = debounce(function(s) {
            var startDate = x.invert(s[0])
            var endDate = x.invert(s[1])

            if (+startDate === extent[0] && +endDate === extent[1])
              return;

            $timeout(function(){
              $scope.begin = startDate.getTime()
              $scope.end = endDate.getTime()
            })

          }, 300);

          brush = d3.brushX()
              .extent([[0, 0], [width, height]])
              .on('end', brushed)

          g.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

          redraw()
        })
      }
    }
  }
})
