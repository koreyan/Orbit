const { createChart } = require('@orrery/core/ziwei');
const chart = createChart(1990, 5, 5, 12, 30, true);
console.log(JSON.stringify(chart.palaces['命宮'].stars, null, 2));
