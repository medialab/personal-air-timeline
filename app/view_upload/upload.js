'use strict';

var graphology = require('graphology');
var gexf = require('graphology-gexf/browser');

angular.module('saveourair.view_upload', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/upload', {
    templateUrl: 'view_upload/upload.html',
    controller: 'UploadCtrl'
  });
}])

.controller('UploadCtrl', ['droppable', '$scope', 'FileLoader', 'store', '$location', '$timeout', '$http'
, function(                 droppable ,  $scope ,  FileLoader ,  store ,  $location ,  $timeout ,  $http) {
  $scope.sensorDropClass
  $scope.sensorLoadingMessage = ''
  $scope.timelineDropClass
  $scope.timelineLoadingMessage = ''
  $scope.uploadStatusMessage = 'PLEASE UPLOAD YOUR DATA'

  store.set('timelines', [])

  // File loading interactions
  // Sensor
  $scope.loadSensorFile = function(){
    document.querySelector('input#hidden-sensor-file-input').click()
  }

  $scope.setSensorFile = function(element) {
    var file = element.files[0]
    $scope.readSensorFile(file)
  }

  $scope.readSensorFile = function(file){
    var fileName = file.name.replace(/\.[^\.]*$/, '')
    console.log('Parse file', fileName)
    var fileLoader = new FileLoader()
    fileLoader.read(file, {
      onloadstart: function(evt){
        $scope.sensorLoadingMessage = 'UPLOADING...'
        $scope.sensorDropClass = 'loading'
        $scope.$apply()
      }
      ,onprogress: function(evt){
        // evt is a ProgressEvent
        if (evt.lengthComputable) {
          $scope.sensorLoadingMessage = 'UPLOADING ' + Math.round((evt.loaded / evt.total) * 100) + '%'
          $scope.$apply()
        }
      }
      ,onload: function(evt){
        var target = evt.target || evt.srcElement

        if (target.result) {
          var data;

          try {
            data = parseSensor(target.result);
          } catch(e) {
            sensorParsingFail()
          }

          if(data) {
            store.set('sensor', data)
            sensorParsingSuccess()
          } else {
            sensorParsingFail()
          }
        } else {
          sensorParsingFail()
        }
      }
    })
  }

  function sensorParsingSuccess() {
    $scope.sensorLoadingMessage = 'PARSED'
    $scope.sensorDropClass = 'success'
    $scope.$apply()
    $timeout(function(){
      $location.url('/board')
    }, 250)
  }
  function sensorParsingFail() {
    $scope.sensorLoadingMessage = 'CANNOT PARSE'
    $scope.sensorDropClass = 'error'
    $scope.$apply()
  }

    // Timeline
  $scope.loadTimelineFile = function(){
    document.querySelector('input#hidden-timeline-file-input').click()
  }

  $scope.setTimelineFile = function(element) {
    var file = element.files[0]
    $scope.readTimelineFile(file)
  }

  $scope.readTimelineFile = function(file){
    var fileLoader = new FileLoader()
    fileLoader.read(file, {
      onloadstart: function(evt){
        $scope.timelineLoadingMessage = 'UPLOADING...'
        $scope.timelineDropClass = 'loading'
        $scope.$apply()
      }
      ,onprogress: function(evt){
        // evt is a ProgressEvent
        if (evt.lengthComputable) {
          $scope.timelineLoadingMessage = 'UPLOADING ' + Math.round((evt.loaded / evt.total) * 100) + '%'
          $scope.$apply()
        }
      }
      ,onload: function(evt){
        var target = evt.target || evt.srcElement

        if (target.result) {
          var g;

          try {
            // TODO: THE PROPER PARSING
            g = gexf.parse(graphology.Graph, target.result);
          } catch(e) {
            timelineParsingFail()
          }

          if(g) {
            store.set('graph', g)
            timelineParsingSuccess()
          } else {
            timelineParsingFail()
          }
        } else {
          timelineParsingFail()
        }
      }
    })
  }

  function timelineParsingSuccess() {
    $scope.timelineLoadingMessage = 'PARSED'
    $scope.timelineDropClass = 'success'
    $scope.$apply()
    $timeout(function(){
      $location.url('/board')
    }, 250)
  }
  function timelineParsingFail() {
    $scope.timelineLoadingMessage = 'CANNOT PARSE'
    $scope.timelineDropClass = 'error'
    $scope.$apply()
  }

  // Make the text area droppable
  droppable(document.getElementById("sensor-uploader"), 'sensorDropClass', $scope, $scope.readSensorFile)
  droppable(document.getElementById("timeline-uploader"), 'timelineDropClass', $scope, $scope.readTimelineFile)

  // Parsing functions
  function parseSensor(csv) {
    // Columns are: "Date", " Time", " T", " RH", " P", " PM2.5", " PM10"
    var data = d3.csvParseRows(csv)
      .map(function(row){return row.map(function(d){ return d.trim() })})
      .filter(function(row, i){
        if (
          // Check that the data is properly formatted
          row.length == 7
          && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(row[0])
          && /^\d{1,2}:\d{2}:\d{2}$/.test(row[1])
          && /^\d+\.\d{2}$/.test(row[2])
          && /^\d+\.\d{2}$/.test(row[3])
          && /^\d+\.\d{2}$/.test(row[4])
          && /^\d+\.\d{2}$/.test(row[5])
          && /^\d+\.\d{2}$/.test(row[6])
        ) {
          return true
        } else {
          if (row[0] == "Date" || (row.length == 1 && row[0] == "") ){
            // The usual headline and empty row
          } else {
            console.warn('[Error] line', i, 'ignored: ',row)
          }
        }
      })
    return data
  }

  function parseTimeline(xml) {
    var data = parseXml(xml)
    console.log(data)
  }
  function parseXml(xmlStr) {
    return new window.DOMParser().parseFromString(xmlStr, "text/xml");
  }
}])

.factory('FileLoader', ['$window', function(win){
  return function(){
    this.read = function(file, settings){
      this.reader = new FileReader()

      // Settings
      if(settings.onerror === undefined)
        this.reader.onerror = this.errorHandler
      else
        this.reader.onerror = settings.onerror

      if(settings.onprogress === undefined)
        this.reader.onprogress = function(evt) {
          console.log('file loader: progress ', evt)
        }
      else
        this.reader.onprogress = settings.onprogress

      if(settings.onabort === undefined)
        this.reader.onabort = function(e) {
          alert('File read cancelled')
        }
      else
        this.reader.onabort = settings.onabort

      if(settings.onloadstart === undefined)
        this.reader.onloadstart = function(evt) {
          console.log('file loader: Load start ', evt)
        }
      else
        this.reader.onloadstart = settings.onloadstart

      if(settings.onload === undefined)
        this.reader.onload = function(evt) {
          console.log('file loader: Loading complete ', evt)
        }
      else
        this.reader.onload = settings.onload

      this.reader.readAsText(file)
    }

    this.abortRead = function(){
        this.reader.abort()
    }

    this.reader = undefined

    this.errorHandler = function(evt){
      var target = evt.target || evt.srcElement
      switch(target.error.code) {
        case target.error.NOT_FOUND_ERR:
          alert('File Not Found!')
          break
        case target.error.NOT_READABLE_ERR:
          alert('File is not readable')
          break
        case target.error.ABORT_ERR:
          break // noop
        default:
          alert('An error occurred reading this file.');
      }
    }
  }
}])

.factory('store', [function(){
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
}])

.factory('droppable', [function(){
  return function(droppable, classReference, $scope, callback){
    //============== DRAG & DROP =============
    // adapted from http://jsfiddle.net/danielzen/utp7j/

    // init event handlers
    function dragEnterLeave(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      $scope.$apply(function(){
        $scope[classReference] = ''
      })
    }
    droppable.addEventListener("dragenter", dragEnterLeave, false)
    droppable.addEventListener("dragleave", dragEnterLeave, false)
    droppable.addEventListener("dragover", function(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0
      $scope.$apply(function(){
        $scope[classReference] = ok ? 'over' : 'over-error'
      })
    }, false)
    droppable.addEventListener("drop", function(evt) {
      // console.log('drop evt:', JSON.parse(JSON.stringify(evt.dataTransfer)))
      evt.stopPropagation()
      evt.preventDefault()
      $scope.$apply(function(){
        $scope[classReference] = 'over'
      })
      var files = evt.dataTransfer.files
      if (files.length == 1) {
        $scope.$apply(function(){
          callback(files[0])
          $scope[classReference] = ''
        })
      }
    }, false)
  }
}])
