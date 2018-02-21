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
var numeric = require('numeric');
window.numeric = numeric;

// Requiring some graphology libraries we are going to make global for the user
var randomLayout = require('graphology-layout/random');
var forceAtlas2Layout = require('graphology-layout-forceatlas2');
window.layout = {
  random: randomLayout,
  forceAtlas2: forceAtlas2Layout
};

window.ForceAtlas2Layout = require('graphology-layout-forceatlas2/worker');

window.louvain = require('graphology-communities-louvain');

// Requiring sigma
window.Sigma = require('sigma/endpoint');

// Requiring own modules
require('./directives/leaflet.js');
require('./view_upload/upload.js');
require('./view_board/board.js');

// Declare app level module which depends on views, and components
angular.module('saveourair', [
  'ngRoute',
  'ngSanitize',
  'ngMaterial',
  'saveourair.directives.leaflet',
  'saveourair.view_upload',
  'saveourair.view_board'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/upload'});
}])

// Filters
.filter('number', function() {
  return function(d) {
    return +d
  }
})
.filter('percent', function() {
  return function(d) {
    return Math.round(+d*100)+'%'
  }
})

// Services
.factory('cache', function(){
  var ns = {}
  ns.recipes = {}
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
          var margin = {top: 3, right: 0, bottom: 3, left: 200};
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
              .rangeRound([0, width])

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
                .rangeRound([height, 0])

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
                .attr("color", "steelblue")
            
          }
        })
      }
    }
  }
})
