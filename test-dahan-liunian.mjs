import { createChart, getDaxianList, calculateLiunian } from '@orrery/core/ziwei';

const chart = createChart(1990, 5, 15, 8, 0, true);
const daxianList = getDaxianList(chart);
const liunian = calculateLiunian(chart, 2026);

console.log('Da Han:', daxianList[0]);
console.log('Liu Nian:', Object.keys(liunian));
console.log('Liu Nian 2026 Palace:', liunian.mingGongZhi);
