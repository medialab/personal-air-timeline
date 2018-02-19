/**
 * Processing script
 * ==================
 *
 * Script reading the shape files and indexing the data.
 */
var csv = require('fast-csv');

/**
 * Constants.
 */
var DATA_PATH = './scripts/DATA/ADR_KMS2010_OSPM_UBM_2371624_strip_Mar2015_OSPM_UBM_THOB.csv';

/**
 * State.
 */
var ITEMS = [];

/**
 * Process.
 */
function Point(x, y, value) {
  this.x = x;
  this.y = y;
  this.value = value;
}

csv.fromPath(DATA_PATH, {headers: true})
  .on('data', line => {
    ITEMS.push(new Point(+line.X, +line.Y, +line.PM25Gade));
  })
  .on('end', () => console.log(ITEMS.length, ITEMS.slice(0, 10)));
