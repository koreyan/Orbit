import { createChart } from "@orrery/core/ziwei";
const generatedChart = createChart(1998, 1, 16, 0, 38, true);
console.log(JSON.stringify(generatedChart.palaces, null, 2));
