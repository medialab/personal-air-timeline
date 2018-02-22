/**
 * Script testing CSV format
 * ==========================
 *
 * Script reading the QuadTree in CSV format to check its validity.
 */
var fs = require('fs'),
    csv = require('fast-csv'),
    QuadTree = require('./quad-tree.js');

// Reading CSV file
var LINES = [];

console.log('Reading CSV quad...');
csv.fromStream(fs.createReadStream('./scripts/quad-tree-pm10.csv'))
  .on('data', line => {
    LINES.push(line);
  })
  .on('end', () => {

    console.log('Building QuadTree...');
    var tree = QuadTree.fromCSV(LINES);

    console.log(tree);
  });
