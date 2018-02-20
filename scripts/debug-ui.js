/**
 * QuadTree Debug UI
 * ==================
 *
 * Very simple webpage using canvas to display a CSV quadtree.
 */
import * as d3 from 'd3';
import QuadTree from './quad-tree';

const canvas = document.getElementById('canvas'),
      context = canvas.getContext('2d');

function render(tree) {
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

  const valueScale = d3.scaleLinear()
    .domain([tree.min, tree.max])
    .range(['yellow', 'black']);

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

    const color = valueScale(quad.mu);

    let [, r, g, b] = color.match(/rgb\((\d+),\s(\d+),\s(\d+)\)/);

    r = +r;
    g = +g;
    b = +b

    for (; x < x2; x++) {
      for (; y > y2; y--) {
        i = y * (img.width * 4) + x * 4;

        data[i]     = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }

      y = y1;
    }
  });

  context.putImageData(img, 0, 0);
}

d3.text('./scripts/quad-tree.csv', csv => {
  const lines = d3.csvParseRows(csv);

  const tree = QuadTree.fromCSV(lines);
  window.tree = tree;

  render(tree);
});
