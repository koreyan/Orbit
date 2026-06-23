import { createChart } from "@orrery/core";
const chart = createChart(1990, 5, 15, 12, 30, true);
console.log(Object.keys(chart));
console.log("shenGongZhi:", chart.shenGongZhi);
console.log("shenGong:", chart.shenGong);
console.log("bodyPalace:", chart.bodyPalace);
