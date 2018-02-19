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
  this.root = new Quad();
}

QuadTree.fromPoints = function(points, threshold, boundaries) {
  var tree = new QuadTree(),
      stack = [[points, tree.root, 0]];

  tree.root.x = boundaries.x;
  tree.root.y = boundaries.y;
  tree.root.width = boundaries.width;
  tree.root.height = boundaries.height;

  tree.size = points.length;

  var point,
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

  tree.depth = depth;

  return tree;
};

module.exports = QuadTree;
