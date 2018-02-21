/**
 * Coordinates Helper
 * ===================
 *
 * Helpers dealing with coordinates.
 */
var proj4 = require('proj4');

if (proj4.default)
  proj4 = proj4.default;

var SOURCE_PROJECTION = 'PROJCS["ETRS_1989_UTM_Zone_32N",GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",9.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]';
var TARGET_PROJECTION = 'WGS84';

exports.fromLatLonToQuad = function(lat, lon) {
  var coords = proj4(TARGET_PROJECTION, SOURCE_PROJECTION, [lon, lat]);

  return coords;
};
