
import * as d3 from 'd3';

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

const appendBubbleCluster = (data, svg, color, width, height) => {
  const domains = getUniqueDomains(data);

  const arr = domains.map((domain) => {
    return {
      name: domain,
      children: data.filter((item) => (item.domain === domain)),
    };
  });

  const bubble = d3.pack().size([width, height]).padding(1.5);
  const root = d3.hierarchy({children: arr}).sum((d) => d.value);
  const leaves = bubble(root).leaves();
  const className = 'node';

  const bubbles = svg.selectAll(`.${className}`)
    .data(leaves)
    .enter().append('g')
    .attr('class', className)
    .attr('transform', (d) => `translate(${d.x},${d.y})`);

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

const getUniqueDomains = (data) => {
  const domains = {};

  data.forEach((item) => {
    domains[item.domain] = null;
  });

  return Object.keys(domains).map((item) => item);
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
  appendBubbleCluster(data, svg, color, width, height);
};

export default getBubbleChart;
