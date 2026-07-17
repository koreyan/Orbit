import { createChart, calculateLiunian } from "@orrery/core";

const generatedChart = createChart(1990, 1, 1, 12, 0, true);
const currentYear = new Date().getFullYear();
const liunian = calculateLiunian(generatedChart, currentYear);

console.log("Current Year:", currentYear);
console.log("Liunian Year:", liunian.year);
console.log("Liuyue array:", liunian.liuyue.map(ly => ({ month: ly.month, natalPalaceName: ly.natalPalaceName })));
