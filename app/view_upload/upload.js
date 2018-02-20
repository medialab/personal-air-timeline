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

.controller('UploadCtrl', ['droppable', '$scope', 'FileLoader', 'store', '$location', '$timeout', '$http', '$mdToast'
, function(                 droppable ,  $scope ,  FileLoader ,  store ,  $location ,  $timeout ,  $http ,  $mdToast) {
  $scope.sensorDropClass
  $scope.sensorLoadingMessage = ''
  $scope.timelineDropClass
  $scope.timelineLoadingMessage = ''
  $scope.uploadStatusMessage = 'PLEASE UPLOAD YOUR DATA\nmultiple files allowed'

  $scope.sensorFiles = {}
  $scope.timelineFiles = {}

  // store.set('timelines', [])

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
            data = parseSensor(target.result, fileName);
          } catch(e) {
            sensorParsingFail(fileName)
          }

          if(data) {
            $scope.sensorFiles[fileName] = data
            sensorParsingSuccess()
          } else {
            sensorParsingFail(fileName)
          }
        } else {
          sensorParsingFail(fileName)
        }
      }
    })
  }

  function sensorParsingSuccess() {
    $scope.sensorLoadingMessage = ''
    $scope.sensorDropClass = ''
    $scope.$apply()
  }
  function sensorParsingFail(fileName) {
    $scope.sensorLoadingMessage = ''
    $scope.sensorDropClass = ''
    $scope.$apply()
    showSimpleToast('/!\\ ' + fileName + ' PARSING FAILED')
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
    var fileName = file.name.replace(/\.[^\.]*$/, '')
    console.log('Parse file', fileName)
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
          var data;

          try {
            data = parseTimeline(target.result, fileName);
          } catch(e) {
            timelineParsingFail(fileName)
          }

          if(data) {
            $scope.timelineFiles[fileName] = data
            timelineParsingSuccess()
          } else {
            timelineParsingFail(fileName)
          }
        } else {
          timelineParsingFail(fileName)
        }
      }
    })
  }

  function timelineParsingSuccess() {
    $scope.timelineLoadingMessage = ''
    $scope.timelineDropClass = ''
    $scope.$apply()
  }
  function timelineParsingFail(fileName) {
    $scope.timelineLoadingMessage = ''
    $scope.timelineDropClass = ''
    $scope.$apply()
    showSimpleToast('/!\\ ' + fileName + ' PARSING FAILED')
  }

  // Make the text area droppable
  droppable(document.getElementById("sensor-uploader"), 'sensorDropClass', $scope, $scope.readSensorFile)
  droppable(document.getElementById("timeline-uploader"), 'timelineDropClass', $scope, $scope.readTimelineFile)

  // Parsing functions
  function parseSensor(csv, fileName) {
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
            console.warn('[Error]', fileName, 'line', i, 'ignored: ',row)
          }
        }
      })
    return data
  }

  function parseTimeline(xml) {
    var domdata = parseXml(xml)
    console.log(domdata)
    window.td = domdata

    var datapoints = []
    td.querySelectorAll('Placemark').forEach(function(d){
      var point = d.querySelector('Point')
      var line = d.querySelector('LineString')
      if (point) {
        datapoints.push({
          type:'point',
          path:d.querySelector('Point coordinates').textContent,
          begin:d.querySelector('TimeSpan begin').textContent,
          end:d.querySelector('TimeSpan end').textContent
        })
      } else if (line) {
        datapoints.push({
          type:'linestring',
          path:d.querySelector('LineString coordinates').textContent,
          begin:d.querySelector('TimeSpan begin').textContent,
          end:d.querySelector('TimeSpan end').textContent
        })
      } else {
        console.warn('[issue] Placemark has neither Point nor LineString', d)
      }
    })

    console.log(datapoints)

    return datapoints
  }
  function parseXml(xmlStr) {
    return new window.DOMParser().parseFromString(xmlStr, "text/xml");
  }

  // Notifications
  function showSimpleToast(message) {

    $mdToast.show(
      $mdToast.simple()
        .textContent(message)
        .hideDelay(3000)
    );
  };

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
      $scope.$apply(function(){
        Array.from(files).forEach(function(file){
          callback(file)
        })
        $scope[classReference] = ''
      })
    }, false)
  }
}])

.filter('keylength', function(){
  return function(input){
    if(!angular.isObject(input)){
      throw Error("Usage of non-objects with keylength filter!!")
    }
    return Object.keys(input).length;
  }
})