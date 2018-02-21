/**
 * QuadTree
 * =========
 *
 * Custom QuadTree data structure aiming at grouping the given point based
 * on some value.
 */
var Stack = require('mnemonist/stack'),
    coords = require('./coordinates.js');

function Quad(x, y, width, height) {
  this.mu = 0;
  this.quads = new Array(4);
  this.count = 0;
  this.leaf = false;
  this.x = x || 0;
  this.y = y || 0;
  this.width = width || 0;
  this.height = height || 0;
}

function QuadTree() {
  this.size = 0;
  this.quads = 1;
  this.leaves = 0;
  this.depth = 0;
  this.min = Infinity;
  this.max = -Infinity;
  this.root = new Quad();
}

QuadTree.prototype.get = function(lat, lon) {
  var qr = coords.fromLatLonToQuad(lat, lon),
      x = qr[0],
      y = qr[1];

  var quad = this.root;

  while (!quad.leaf) {

    // Finding correct quadrant
    if (x < (quad.x + quad.width / 2)) {
      if (y < (quad.y + quad.height / 2)) {
        quad = quad.quads[0];
      }
      else {
        quad = quad.quads[2];
      }
    }
    else {
      if (y < (quad.y + quad.height / 2)) {
        quad = quad.quads[1];
      }
      else {
        quad = quad.quads[3];
      }
    }

    if (!quad)
      return;
  }

  if (!quad.leaf)
    return;

  return quad.mu;
};

QuadTree.prototype.forEachLeaf = function(callback) {
  var stack = Stack.from([this.root]),
      quad;

  while (stack.size) {
    quad = stack.pop();

    if (quad.leaf) {
      callback(quad);
      continue;
    }

    if (quad.quads[3])
      stack.push(quad.quads[3]);
    if (quad.quads[2])
      stack.push(quad.quads[2]);
    if (quad.quads[1])
      stack.push(quad.quads[1]);
    if (quad.quads[0])
      stack.push(quad.quads[0]);
  }
};

QuadTree.prototype.toCSV = function() {
  var lines = new Array(this.quads + 1),
      stack = Stack.from([[this.root, 0]]),
      i = 0,
      quad,
      quadIndex,
      mask;

  lines[i++] = [
    this.root.x,
    this.root.y,
    this.root.width,
    this.root.height,
    this.size,
    this.depth
  ];

  while (stack.size) {
    [quad, quadIndex] = stack.pop();

    mask = [
      +!!quad.quads[0],
      +!!quad.quads[1],
      +!!quad.quads[2],
      +!!quad.quads[3]
    ].join('');

    lines[i++] = [
      quad.count,
      quad.mu.toFixed(4).length < quad.mu.toString().length ?
        quad.mu.toFixed(4) :
        quad.mu,
      parseInt(mask, 2),
      quadIndex
    ].join(',');

    if (quad.quads[3])
      stack.push([quad.quads[3], 3]);
    if (quad.quads[2])
      stack.push([quad.quads[2], 2]);
    if (quad.quads[1])
      stack.push([quad.quads[1], 1]);
    if (quad.quads[0])
      stack.push([quad.quads[0], 0]);
  }

  return lines.join('\n');
};

function getStringMask(number) {
  return ('0000' + number.toString(2)).slice(-4);
}

// TODO: lighten by dropping quadIndex from CSV

QuadTree.fromCSV = function(lines) {
  var boundaries = lines[0];

  var tree = new QuadTree(),
      quad = tree.root,
      stack = Stack.from([quad]);

  quad.x = +boundaries[0];
  quad.y = +boundaries[1];
  quad.width = +boundaries[2];
  quad.height = +boundaries[3];

  tree.size = +boundaries[4];
  tree.depth = +boundaries[5],
  tree.quads = lines.length - 1;

  var quad,
      quadIndex,
      parent,
      line,
      isLeaf,
      count,
      halfWidth,
      halfHeight,
      mu,
      mask,
      i,
      l;

  line = lines[1];

  // NOTE: will break if root is leaf obviously...
  quad.count = +line[0];
  quad.mu = +line[1];
  quad.lastChild = getStringMask(+line[2]).lastIndexOf('1');

  for (i = 2, l = lines.length; i < l; i++) {
    line = lines[i];
    count = +line[0];
    mu = +line[1];
    mask = +line[2];
    quadIndex = +line[3];
    isLeaf = mask === 0;

    parent = stack.peek();

    halfWidth = parent.width / 2;
    halfHeight = parent.height / 2;

    if (quadIndex === 0)
      quad = new Quad(parent.x, parent.y, halfWidth, halfHeight);
    else if (quadIndex === 1)
      quad = new Quad(parent.x + halfWidth, parent.y, halfWidth, halfHeight);
    else if (quadIndex === 2)
      quad = new Quad(parent.x, parent.y + halfHeight, halfWidth, halfHeight);
    else
      quad = new Quad(parent.x + halfWidth, parent.y + halfHeight, halfWidth, halfHeight);

    parent.quads[quadIndex] = quad;

    quad.count = count;
    quad.mu = mu;

    if (isLeaf) {
      quad.leaf = true;
      tree.leaves++;

      if (mu < tree.min)
        tree.min = mu;

      if (mu > tree.max)
        tree.max = mu;

      // Should we bubble up?
      while (stack.size && parent.quads[parent.lastChild] instanceof Quad) {
        delete parent.lastChild;
        stack.pop();
        parent = stack.peek();
      }
    }
    else {
      quad.lastChild = getStringMask(mask).lastIndexOf('1');
      stack.push(quad);
    }
  }

  delete tree.root.lastChild;

  return tree;
};

QuadTree.fromPoints = function(points, params) {
  var threshold = params.threshold,
      boundaries = params.boundaries,
      minQuadSize = params.minQuadSize,
      maxQuadSize = params.maxQuadSize;

  var tree = new QuadTree(),
      stack = Stack.from([[points, tree.root, 0]]);

  tree.root.x = boundaries.x;
  tree.root.y = boundaries.y;
  tree.root.width = boundaries.width;
  tree.root.height = boundaries.height;

  tree.size = points.length;

  var depth,
      point,
      parent,
      quadIndex,
      quad,
      value,
      minValue,
      maxValue,
      minX,
      maxX,
      minY,
      maxY,
      span,
      halfWidth,
      halfHeight,
      mu,
      i,
      l;

  while (stack.size) {
    [points, parent, depth] = stack.pop();

    minValue = Infinity;
    maxValue = -Infinity;
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;
    mu = 0;

    for (i = 0, l = points.length; i < l; i++) {
      point = points[i];
      value = point[params.value];

      if (value < minValue)
        minValue = value;
      if (value > maxValue)
        maxValue = value;

      if (point.x < minX)
        minX = point.x;
      if (point.x > maxX)
        maxX = point.x;

      if (point.y < minY)
        minY = point.y;
      if (point.y > maxY)
        maxY = point.y;

      mu += value;
    }

    mu /= points.length;
    span = maxValue - minValue;

    parent.mu = mu;
    parent.count = points.length;

    if (
      (
        parent.width <= minQuadSize[0] ||
        parent.height <= minQuadSize[1]
      ) ||
      (
        span < threshold &&
        !(
          parent.width > maxQuadSize[0] ||
          parent.height > maxQuadSize[1]
        )
      )
    ) {
      parent.leaf = true;
      tree.leaves++;

      if (depth > tree.depth)
        tree.depth = depth;

      if (mu < tree.min)
        tree.min = mu;

      if (mu > tree.max)
        tree.max = mu;

      continue;
    }

    // If span is too wide, we need to subdivide into quadrants
    halfWidth = parent.width / 2;
    halfHeight = parent.height / 2;

    var subpoints = Array.from([1, 2, 3, 4], () => []);

    for (i = 0; i < l; i++) {
      point = points[i];

      if (point.x < parent.x + halfWidth) {
        if (point.y < parent.y + halfHeight)
          quadIndex = 0;
        else
          quadIndex = 2;
      }
      else {
        if (point.y < parent.y + halfHeight)
          quadIndex = 1;
        else
          quadIndex = 3;
      }

      subpoints[quadIndex].push(point);
    }

    if (subpoints[0].length) {
      tree.quads++;
      quad = new Quad(parent.x, parent.y, halfWidth, halfHeight);
      parent.quads[0] = quad;
      stack.push([subpoints[0], quad, depth + 1]);
    }

    if (subpoints[1].length) {
      tree.quads++;
      quad = new Quad(parent.x + halfWidth, parent.y, halfWidth, halfHeight);
      parent.quads[1] = quad;
      stack.push([subpoints[1], quad, depth + 1]);
    }

    if (subpoints[2].length) {
      tree.quads++;
      quad = new Quad(parent.x, parent.y + halfHeight, halfWidth, halfHeight);
      parent.quads[2] = quad;
      stack.push([subpoints[2], quad, depth + 1]);
    }

    if (subpoints[3].length) {
      tree.quads++;
      quad = new Quad(parent.x + halfWidth, parent.y + halfHeight, halfWidth, halfHeight);
      parent.quads[3] = quad;
      stack.push([subpoints[3], quad, depth + 1]);
    }
  }

  return tree;
};

module.exports = QuadTree;
