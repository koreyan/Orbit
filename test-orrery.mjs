import { createChart } from "@orrery/core/ziwei";
const chart = createChart(1990, 5, 5, 12, 30, true);
Object.values(chart.palaces).forEach(p => {
  p.stars.forEach(s => {
    if (s.siHua) console.log(s.name, s.siHua);
  })
})
