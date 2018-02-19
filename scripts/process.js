/**
 * Processing script
 * ==================
 *
 * Script reading the shape files and indexing the data.
 */
var csv = require('fast-csv'),
    fs = require('fs'),
    QuadTree = require('./quad-tree.js');

/**
 * Constants.
 */
var DATA_PATH = './scripts/DATA/ADR_KMS2010_OSPM_UBM_2371624_strip_Mar2015_OSPM_UBM_THOB.csv';
var THRESHOLD = 0.08;

/**
 * State.
 */
var POINTS = [],
    MIN_X = Infinity,
    MAX_X = -Infinity,
    MIN_Y = Infinity,
    MAX_Y = -Infinity;

/**
 * Process.
 */
function Point(x, y, value) {
  this.x = x;
  this.y = y;
  this.value = value;
}

console.log('Reading points from CSV file...');
csv.fromPath(DATA_PATH, {headers: true})
  .on('data', line => {
    var point = new Point(+line.X, +line.Y, +line.PM25Gade);

    POINTS.push(point);

    if (point.x < MIN_X)
      MIN_X = point.x;
    if (point.x > MAX_X)
      MAX_X = point.x;

    if (point.y < MIN_Y)
      MIN_Y = point.y;
    if (point.y > MAX_Y)
      MAX_Y = point.y;
  })
  .on('end', () => {
    console.log(`Collected ${POINTS.length} points.`);
    console.log(POINTS.slice(0, 10));
    console.log();
    console.log('Building QuadTree...');

    var tree = QuadTree.fromPoints(POINTS, THRESHOLD, {
      x: MIN_X,
      y: MIN_Y,
      width: MAX_X - MIN_X,
      height: MAX_Y - MIN_Y
    });

    console.log(tree);

    var treeCsv = tree.toCSV();

    fs.writeFileSync('./scripts/quadtree.csv', treeCsv, 'utf-8');
  });
