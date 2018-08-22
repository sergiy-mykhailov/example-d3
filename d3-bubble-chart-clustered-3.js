
import * as d3 from 'd3';

const getUniqueDomains = (data) => {
  const domains = {};

  data.forEach((item) => {
    domains[item.domain] = null;
  });

  return Object.keys(domains).map((item) => item);
};

const getMaxRadius = (width, height, data, padding = 0) => {
  const sumOfValues = data.reduce((prev, item) => (prev + item.value), 0);

  const squareOfContainer = width * height;
  const squareOfValue = squareOfContainer / sumOfValues;

  const maxValue = Math.max(...data.map((item) => item.value));
  const maxSquare = maxValue * squareOfValue;

  const maxRadius = Math.sqrt(maxSquare / Math.PI) - padding;
  const heightK = height / 4;

  return (maxRadius > heightK) ? heightK : maxRadius;
};

const tick = (bubbles) => {
  return () => {
    bubbles.attr('transform', (d) => `translate(${d.x},${d.y})`)
  }
};

const forceCluster = (nodes, clusters) => {
  return (alpha) => {
    for (let i = 0; i < nodes.length; ++i) {
      const k = alpha * 1;
      const node = nodes[i];

      node.vx -=  k;
      node.vy -=  k;
    }
  }
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

const appendBubbleCluster = (data, svg, width, height) => {
  const domains = getUniqueDomains(data);

  const aspectRatio =  width / height;
  const padding = Math.floor((aspectRatio > 2.5) ? aspectRatio * 2 : aspectRatio);
  const maxRadius = getMaxRadius(width, height, data, padding);
  const maxValue = Math.max(...data.map((item) => item.value));
  const color = d3.scaleOrdinal(d3.schemeCategory20c);

  const clusters = new Array(domains.length);

  const nodes = data.sort((a, b) => (b.value - a.value)).map((item) => {
    const i = domains.indexOf(item.domain);

    const k = item.value / maxValue;
    const s = Math.PI * Math.pow(maxRadius, 2) * k;
    const r = Math.sqrt(s / Math.PI);

    const d = { cluster: i, radius: r, data: item };

    if (!clusters[i] || (r > clusters[i].radius)) {
      clusters[i] = d;
    }

    return d;
  });

  const center = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  const forceCollide = d3.forceCollide()
    .radius((d) => (d.radius + padding))
    .iterations(1);

  const bubbles = center.selectAll('circle')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'circle');

  bubbles.append('title')
    .text((d) => `${d.data.name}\n${d.data.domain}`);

  bubbles.append('circle')
    .attr('id', (d) => d.data.id)
    .attr('r', (d) => d.radius)
    .style('fill', (d) => color(d.cluster));

  bubbles.append('text')
    .attr('dy', '.2em')
    .style('text-anchor', 'middle')
    .text((d) => {
      const text = d.data.name.substring(0, d.radius / 4);
      return d.radius < 13 ? '' : text;
    })
    .attr('font-size', () => (12));

  d3.forceSimulation()
    .nodes(nodes)
    .force('center', d3.forceCenter())
    .force('collide', forceCollide)
    .force('cluster', forceCluster(nodes, clusters))
    .force('gravity', d3.forceManyBody(30))
    .force('x', d3.forceX().strength(0.9 - Math.floor(aspectRatio * 10) / 100))
    .force('y', d3.forceY().strength(6))
    .on('tick', tick(bubbles))
  ;
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

  // grid
  appendGrid(svg, width, height);

  // chart
  const data = intents.filter((item) => (item.value > 0));
  appendBubbleCluster(data, svg, width, height);
};

export default getBubbleChart;
