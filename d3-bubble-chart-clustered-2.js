
import * as d3 from 'd3';

const getUniqueDomains = (data) => {
  const domains = {};

  data.forEach((item) => {
    domains[item.domain] = null;
  });

  return Object.keys(domains).map((item) => item);
};

const getClustersAspectRatio = (width, height, length) => {
  const aspectRatio = width / height;

  const h = Math.ceil(Math.sqrt(length / aspectRatio));
  const w = Math.ceil(length / h);

  return { w, h };
};

const appendGrid = (svg, width, height) => {
  const xAxisLength = width + 2;
  const yAxisLength = height + 2;

  const scaleX = d3.scaleLinear().domain([0, 8]).range([0, xAxisLength]);
  const scaleY = d3.scaleLinear().domain([14, 0]).range([0, yAxisLength]);

  const xAxis = d3.axisBottom(scaleX).ticks(8);
  const yAxis = d3.axisLeft(scaleY).ticks(14);

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(${0},${height})`)
    .call(xAxis)
    .style('stroke', 'none');

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${-1},${-1})`)
    .call(yAxis)
    .style('stroke', 'none');

  d3.selectAll('g.x-axis g.tick')
    .append('line')
    .classed('grid-line', true)
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', - (yAxisLength))
    .style('stroke', '#e0e0e0');

  d3.selectAll('g.y-axis g.tick')
    .append('line')
    .classed('grid-line', true)
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', xAxisLength)
    .attr('y2', 0)
    .style('stroke', '#e0e0e0');
};

const appendBubbleCluster = (leaves, svg, color, offsetX = 0, offsetY = 0, clusterIndex = 0) => {
  const className = `cluster-${clusterIndex}`;

  const bubbles = svg.selectAll(`.${className}`)
    .data(leaves)
    .enter().append('g')
    .attr('class', className)
    .attr('transform', (d) => `translate(${d.x + offsetX},${d.y + offsetY})`);

  bubbles.append('title')
    .text((d) => `${d.data.name}\n${d.data.domain}`);

  bubbles.append('circle')
    .attr('id', (d) => d.data.id)
    .attr('r', (d) => d.r)
    .style('fill', (d) => color(d.data.domain));

  bubbles.append('text')
    .attr('dy', '.2em')
    .style('text-anchor', 'middle')
    .text((d) => d.data.name.substring(0, d.r / 3))
    .attr('font-size', () => (12));
};

const appendBubbleClustersByDomains = (data, svg, color, width, height) => {
  const domains = getUniqueDomains(data);

  const children = domains.map((domain) => {
    return {
      name: domain,
      children: data.filter((item) => (item.domain === domain)),
    };
  });

  const padding = 8;
  const bubble = d3.pack().size([width, height * 1.3]).padding(padding);
  const root = d3.hierarchy({ children }).sum((d) => d.value);
  const leaves = bubble(root).leaves();

  const aspectRatio = getClustersAspectRatio(width, height, domains.length);
  const clusterWidth = Math.floor(width / aspectRatio.w);
  const clusterHeight = Math.floor(height / aspectRatio.h);
  const clusterSize = aspectRatio.w * aspectRatio.h;

  let clusterIndex = 0;
  for (let h = 0; h < aspectRatio.h; h++) {
    const shiftEven = (h % 2 === 0) ? -Math.floor(clusterWidth / 8) : Math.floor(clusterWidth / 8);
    const shiftLast = ((domains.length < clusterSize) && (h === aspectRatio.h - 1)) ? Math.floor(clusterWidth / 2) : 0;

    for (let w = 0; w < aspectRatio.w; w++) {
      if (clusterIndex >= domains.length) {
        break;
      }

      const domain = domains[clusterIndex];
      const arr = leaves.filter((item) => (item.data.domain === domain));

      if (arr.length > 0) {
        const minX = Math.min(...arr.map((item) => item.x));
        const minY = Math.min(...arr.map((item) => item.y));
        const maxR = Math.max(...arr.map((item) => item.r));

        const offsetX = w * clusterWidth + clusterWidth / 2 - minX + shiftLast + shiftEven;
        const offsetY = h * clusterHeight + maxR - minY + padding;

        appendBubbleCluster(arr, svg, color, offsetX, offsetY, clusterIndex);
      }

      clusterIndex++;
    }
  }
};

const getBubbleChart = (intents) => {
  d3.selectAll('.training-details-intents-chart svg').remove();

  const wrapper = document.querySelector('.training-details-intents-chart-wrapper');
  const clientRect = wrapper.getBoundingClientRect();
  const width = clientRect.width;
  const height = clientRect.height;

  const svg = d3.select('.training-details-intents-chart').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'bubble');
  const color = d3.scaleOrdinal(d3.schemeCategory20c);

  // grid
  appendGrid(svg, width, height);

  // chart
  const data = intents.filter((item) => (item.value > 0));
  appendBubbleClustersByDomains(data, svg, color, width, height);
};

export default getBubbleChart;
