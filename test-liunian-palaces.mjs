import { createChart, calculateLiunian } from '@orrery/core/ziwei';

const chart = createChart(1990, 5, 15, 8, 0, true);
const liunian = calculateLiunian(chart, 2026);
console.log(liunian.palaces);
