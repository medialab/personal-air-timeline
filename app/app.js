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
require('./view_upload/upload.js');
require('./view_board/board.js');

// Declare app level module which depends on views, and components
angular.module('saveourair', [
  'ngRoute',
  'ngSanitize',
  'ngMaterial',
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

// Service
.factory('cache', function(){
  var ns = {}
  ns.recipes = {}
  return ns
})

