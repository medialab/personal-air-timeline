/**
 * QuadTree
 * =========
 *
 * Custom QuadTree data structure aiming at grouping the given point based
 * on some value.
 */
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
  this.dimension = 1;
  this.depth = 0;
  this.min = Infinity;
  this.max = -Infinity;
  this.root = new Quad();
}

QuadTree.prototype.toCSV = function() {
  var lines = new Array(this.dimension + 1),
      stack = [[this.root, 0]],
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

  while (stack.length) {
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

function last(array) {
  return array[array.length - 1];
}

function getStringMask(number) {
  return ('0000' + number.toString(2)).slice(-4);
}

QuadTree.fromCSV = function(lines) {
  var boundaries = lines[0];

  var tree = new QuadTree(),
      quad = tree.root,
      stack = [quad];

  quad.x = +boundaries[0];
  quad.y = +boundaries[1];
  quad.width = +boundaries[2];
  quad.height = +boundaries[3];

  tree.size = +boundaries[4];
  tree.depth = +boundaries[5],
  tree.dimension = lines.length - 1;

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

    parent = last(stack);

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

      if (mu < tree.min)
        tree.min = mu;

      if (mu > tree.max)
        tree.max = mu;

      // Should we bubble up?
      while (stack.length && parent.quads[parent.lastChild] instanceof Quad) {
        delete parent.lastChild;
        stack.pop();
        parent = last(stack);
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

QuadTree.fromPoints = function(points, threshold, boundaries) {
  var tree = new QuadTree(),
      stack = [[points, tree.root, 0]];

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

  while (stack.length) {
    [points, parent, depth] = stack.pop();

    if (depth > tree.depth)
      tree.depth = depth;

    minValue = Infinity;
    maxValue = -Infinity;
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;
    mu = 0;

    for (i = 0, l = points.length; i < l; i++) {
      point = points[i];

      if (point.value < minValue)
        minValue = point.value;
      if (point.value > maxValue)
        maxValue = point.value;

      if (point.x < minX)
        minX = point.x;
      if (point.x > maxX)
        maxX = point.x;

      if (point.y < minY)
        minY = point.y;
      if (point.y > maxY)
        maxY = point.y;

      mu += point.value;
    }

    mu /= points.length;
    span = maxValue - minValue;

    halfWidth = parent.width / 2;
    halfHeight = parent.height / 2;

    parent.mu = mu;
    parent.count = points.length;

    if (span < threshold) {
      parent.leaf = true;

      if (mu < tree.min)
        tree.min = mu;

      if (mu > tree.max)
        tree.max = mu;

      continue;
    }

    // If span is too wide, we need to subdivide into quadrants
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
      tree.dimension++;
      quad = new Quad(parent.x, parent.y, halfWidth, halfHeight);
      parent.quads[0] = quad;
      stack.push([subpoints[0], quad, depth + 1]);
    }

    if (subpoints[1].length) {
      tree.dimension++;
      quad = new Quad(parent.x + halfWidth, parent.y, halfWidth, halfHeight);
      parent.quads[1] = quad;
      stack.push([subpoints[1], quad, depth + 1]);
    }

    if (subpoints[2].length) {
      tree.dimension++;
      quad = new Quad(parent.x, parent.y + halfHeight, halfWidth, halfHeight);
      parent.quads[2] = quad;
      stack.push([subpoints[2], quad, depth + 1]);
    }

    if (subpoints[3].length) {
      tree.dimension++;
      quad = new Quad(parent.x + halfWidth, parent.y + halfHeight, halfWidth, halfHeight);
      parent.quads[3] = quad;
      stack.push([subpoints[3], quad, depth + 1]);
    }
  }

  return tree;
};

module.exports = QuadTree;
