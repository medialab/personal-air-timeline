/**
 * QuadTree Debug UI
 * ==================
 *
 * Very simple webpage using canvas to display a CSV quadtree.
 */
import * as d3 from 'd3';
import QuadTree from './quad-tree';

const canvasLeft = document.getElementById('canvas-left'),
      canvasRight = document.getElementById('canvas-right');

function render(canvas, tree) {
  const context = canvas.getContext('2d');

  let width = canvas.offsetWidth,
      height = canvas.offsetHeight;

  canvas.width = width * 2;
  canvas.height = height * 2;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  width *= 2;
  height *= 2;

  context.scale(2, 2);

  const img = context.getImageData(0, 0, width, height),
        data = img.data;

  const valueScale = d3.scaleSequential(d3.interpolateInferno)
    .domain([tree.min, tree.max]);

  const ratio = Math.min(
    width / tree.root.width,
    height / tree.root.height
  );

  const xScale = d3.scaleLinear()
    .domain([tree.root.x, tree.root.x + tree.root.width])
    .range([0, tree.root.width * ratio]);

  const yScale = d3.scaleLinear()
    .domain([tree.root.y, tree.root.y + tree.root.height])
    .range([tree.root.height * ratio, 0]);

  // Iterating over leaves
  tree.forEachLeaf(quad => {
    const x1 = Math.floor(xScale(quad.x)),
          y1 = Math.ceil(yScale(quad.y)),
          x2 = Math.ceil(xScale(quad.x + quad.width)),
          y2 = Math.floor(yScale(quad.y + quad.height));

    let x = x1,
        y = y2,
        i;

    const color = d3.rgb(valueScale(quad.mu));

    for (; x < x2; x++) {
      for (; y > y2; y--) {
        i = y * (img.width * 4) + x * 4;

        data[i]     = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = 255;
      }

      y = y1;
    }
  });

  context.putImageData(img, 0, 0);
}

function textPromise(path) {
  return new Promise(function(resolve) {
    d3.text(path, csv => {
      return resolve(d3.csvParseRows(csv));
    });
  });
}

Promise.all([
  textPromise('./scripts/quad-tree-pm25.csv'),
  textPromise('./scripts/quad-tree-pm10.csv')
]).then(([pm25, pm10]) => {

  const treePm25 = QuadTree.fromCSV(pm25),
        treePm10 = QuadTree.fromCSV(pm10);

  render(canvasLeft, treePm25);
  render(canvasRight, treePm10);
});
