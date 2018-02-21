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
var OUTPUT_PATH_PM25 = './scripts/quad-tree-pm25.csv';
var OUTPUT_PATH_PM10 = './scripts/quad-tree-pm10.csv';
var THRESHOLD = 0.1;

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
function Point(x, y, pm25, pm10) {
  this.x = x;
  this.y = y;
  this.pm25 = pm25;
  this.pm10 = pm10;
}

console.log('Reading points from CSV file...');
csv.fromPath(DATA_PATH, {headers: true})
  .on('data', line => {
    var point = new Point(+line.X, +line.Y, +line.PM25Gade, +line.PM10Gade);

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
    console.log('Building QuadTrees...');

    var boundaries = {
      x: MIN_X,
      y: MIN_Y,
      width: MAX_X - MIN_X,
      height: MAX_Y - MIN_Y
    };

    var minQuadSize = [
      boundaries.width / Math.pow(2, 12),
      boundaries.height / Math.pow(2, 12)
    ];

    var maxQuadSize = [
      boundaries.width / Math.pow(2, 9),
      boundaries.height / Math.pow(2, 9)
    ];

    var treePm25 = QuadTree.fromPoints(POINTS, {
      value: 'pm25',
      threshold: THRESHOLD,
      boundaries: boundaries,
      minQuadSize: minQuadSize,
      maxQuadSize: maxQuadSize
    });

    var treePm10 = QuadTree.fromPoints(POINTS, {
      value: 'pm10',
      threshold: THRESHOLD,
      boundaries: boundaries,
      minQuadSize: minQuadSize,
      maxQuadSize: maxQuadSize
    });

    console.log(treePm25);
    console.log(treePm10)

    fs.writeFileSync(OUTPUT_PATH_PM25, treePm25.toCSV(), 'utf-8');
    fs.writeFileSync(OUTPUT_PATH_PM10, treePm10.toCSV(), 'utf-8');
  });
