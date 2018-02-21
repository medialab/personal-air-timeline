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
  $scope.uploadStatusMessage = 'PLEASE UPLOAD YOUR DATA\n> Multiple files allowed'

  $scope.sensorFiles = {}
  $scope.timelineFiles = {}

  $scope.$watch('sensorFiles', updateUploads, true)
  $scope.$watch('timelineFiles', updateUploads, true)

  function updateUploads() {
    var someTimelineFiles = Object.keys($scope.timelineFiles).length > 0
    var someSensorFiles = Object.keys($scope.sensorFiles).length > 0
    var data = {}
    if (someSensorFiles && someTimelineFiles) {
      $scope.uploadStatusMessage = 'Sensor data .............. OK\nTimeline data ............ OK\n>>>>>>>>>>>>>>>>>> DATA READY\n\nNote: You may upload\n      additional files'
      $scope.reconciledData = reconcileFiles($scope.sensorFiles, $scope.timelineFiles)
      store.set('reconciledData', $scope.reconciledData)
      window.D = $scope.reconciledData
    } else if (someSensorFiles && !someTimelineFiles) {
      $scope.uploadStatusMessage = 'Sensor data .............. OK\nTimeline data > PLEASE UPLOAD'
    } else if (!someSensorFiles && someTimelineFiles) {
      $scope.uploadStatusMessage = 'Sensor data >>> PLEASE UPLOAD\nTimeline data ............ OK'
    }

    store.set('data', data)
  }

  $scope.download = function() {
    var blob = new Blob([d3.csvFormat(D)], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, "Personal Air Timeline.csv");
  }

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

    return datapoints
  }

  function reconcileFiles(sensorfiles, timelinefiles) {
    var fileName

    /// Build spatial index
    // Order and clean original intervals
    var intervalsIndex = {}
    var eventsList = []
    for (fileName in timelinefiles) {
      var data = timelinefiles[fileName]
      data.forEach(function(d, i){
        var intervalId = fileName + '_' + i
        var interval = d
        interval.id = intervalId
        interval.beginTimestamp = Date.parse(d.begin)
        interval.endTimestamp = Date.parse(d.end)
        intervalsIndex[intervalId] = interval
        eventsList.push({type:'begin', ts:interval.beginTimestamp, interval:intervalId})
        eventsList.push({type:'end', ts:interval.endTimestamp, interval:intervalId})
      })
      eventsList.sort(function(a, b){ return (a.ts==b.ts) ? ( (a.type > b.type)?(-1):(1) ) : (a.ts - b.ts) })
      // Filter to ensure a strict order event
      var ignoredIntervals = {}
      var lastEvent
      eventsList.forEach(function(e){
        if (ignoredIntervals[e.interval]) { return }
        if (lastEvent !== undefined) {
          if (e.type=='begin') {
            if (lastEvent.type == 'end' && lastEvent.ts <= e.ts) {
              // All is well
              lastEvent = e
              return
            } else {
              // Ignore
              ignoredIntervals[e.interval] = true
              console.error('[error] Timeline interval', e.interval, 'ignored for discrepancy reasons')
              return
            }
          } else {
            if (e.type=='end' && lastEvent.type=='begin' && e.interval==lastEvent.interval) {
              // All is well
              lastEvent = e
              return
            } else {
              // Ignore
              ignoredIntervals[e.interval] = true
              console.error('[error] Timeline interval', e.interval, 'ignored for discrepancy reasons')
              return
            }
          }
        }
      })
      eventsList = eventsList.filter(function(e){
        return ignoredIntervals[e.interval] == undefined
      })
      // console.log(eventsList)
      // Build timestamps list
      var timestampsIndex = {}
      // Now we compute the path points of the intervals
      eventsList.forEach(function(e){
        // We get the intervals by looking only at the "begin" events
        if (e.type == 'begin') {
          var interval = intervalsIndex[e.interval]

          if (interval.type == 'point') {
            // Interval is a point
            timestampsIndex[interval.beginTimestamp] = timestampsIndex[interval.beginTimestamp] || {ts:interval.beginTimestamp}
            timestampsIndex[interval.beginTimestamp].after = interval.path.split(',').map(function(d){return +d})
            
            timestampsIndex[interval.endTimestamp] = timestampsIndex[interval.endTimestamp] || {ts:interval.endTimestamp}
            timestampsIndex[interval.endTimestamp].before = interval.path.split(',').map(function(d){return +d})
          } else {
            // Interval is a linestring
            // console.log(interval)
            var coordinatesList = interval.path.split(' ')
              .map(function(path){ return path.split(',').map(function(d){return +d}) })
              .filter(function(path){ return path.length >= 2 })
            var cumulativeDistances = [0]
            var i
            for (i=1; i<coordinatesList.length; i++) {
              var d = Math.sqrt(Math.pow(coordinatesList[i][0] - coordinatesList[i-1][0], 2) + Math.pow(coordinatesList[i][1] - coordinatesList[i-1][1], 2))
              if (isNaN(d)) {
                console.error('[error] A distance for interval', interval.id, 'is not a number')
                cumulativeDistances.push(cumulativeDistances[i-1])
              } else {
                cumulativeDistances.push(cumulativeDistances[i-1] + d)
              }
            }
            var totalDistance = cumulativeDistances[cumulativeDistances.length-1]

            if (totalDistance == 0) {
              // It's actually a point!
              timestampsIndex[interval.beginTimestamp] = timestampsIndex[interval.beginTimestamp] || {ts:interval.beginTimestamp}
              timestampsIndex[interval.beginTimestamp].after = interval.path.split(',').map(function(d){return +d})
              
              timestampsIndex[interval.endTimestamp] = timestampsIndex[interval.endTimestamp] || {ts:interval.endTimestamp}
              timestampsIndex[interval.endTimestamp].before = interval.path.split(',').map(function(d){return +d})
            } else {
              var ratios = cumulativeDistances.map(function(d){ return d/totalDistance })

              timestampsIndex[interval.beginTimestamp] = timestampsIndex[interval.beginTimestamp] || {ts:interval.beginTimestamp}
              timestampsIndex[interval.beginTimestamp].after = interval.path.split(',').map(function(d){return +d})
              
              coordinatesList.forEach(function(c, i){
                var ratio = ratios[i]
                var ts = interval.beginTimestamp + ratio * (interval.endTimestamp - interval.beginTimestamp)

                timestampsIndex[ts] = timestampsIndex[ts] || {ts:ts}
                timestampsIndex[ts].before = c
                timestampsIndex[ts].after = c
              })

              timestampsIndex[interval.endTimestamp] = timestampsIndex[interval.endTimestamp] || {ts:interval.endTimestamp}
              timestampsIndex[interval.endTimestamp].before = interval.path.split(',').map(function(d){return +d})
            }

          }

        }
      })

      var timestamps = Object.values(timestampsIndex).sort(function(a, b) {return a.ts-b.ts})
      var whereWasIAt = function(ts) {
        if (ts < timestamps[0].ts || ts>timestamps[timestamps.length - 1].ts) {
          return undefined
        } else {
          var i=0
          for (i=0; i<timestamps.length; i++) {
            if (timestamps[i].ts >= ts) {
              break
            }
          }
          if (timestamps[i-1].after && timestamps[i].before) {
            var ratio = (ts - timestamps[i-1].ts) / (timestamps[i].ts - timestamps[i-1].ts)
            var x1 = timestamps[i-1].after[0]
            var y1 = timestamps[i-1].after[1]
            var x2 = timestamps[i].before[0]
            var y2 = timestamps[i].before[1]
            return [x1 + ratio * (x2-x1), y1 + ratio * (y2-y1)]
          } else if (timestamps[i-1].after) {
            console.warn('Discrepancy',timestamps[i-1].after, timestamps[i].before)
            return timestamps[i-1].after
          } else if (timestamps[i].before) {
            console.warn('Discrepancy',timestamps[i-1].after, timestamps[i].before)
            return timestamps[i].before
          } else {
            return undefined
          }
        }
      }
    }

    // Build data points after sensor data
    var datapoints = {}
    for (fileName in sensorfiles) {
      var data = sensorfiles[fileName]
      var dateFormatRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/
      data.forEach(function(d){

        // Parse date
        var dateArray = dateFormatRegex.exec(d[0] + ' ' + d[1])
        var dateObject = new Date(
            (+dateArray[3]),
            (+dateArray[2])-1, // Careful, month starts at 0!
            (+dateArray[1]),
            (+dateArray[4]),
            (+dateArray[5]),
            (+dateArray[6])
        )

        var datestring = dateObject.toString()
        var timestamp = dateObject.getTime()

        var coordinates = whereWasIAt(timestamp)
        datapoints[timestamp] = {
          timestamp: timestamp,
          datestring: datestring,
          T: d[2],
          RH: d[3],
          P: d[4],
          PM25: d[5],
          PM10: d[6],
          coordinates: coordinates
        }
      })
    }
    return Object.values(datapoints).map(function(d){
      var coordinates = d.coordinates
      delete d.coordinates
      if (coordinates) {
        d.x = coordinates[0]
        d.y = coordinates[1]
      }
      return d
    })
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