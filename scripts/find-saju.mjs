import { createChart } from "@orrery/core/ziwei";

const MAJOR_STARS = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
  '天府', '太陰', '貪狼', '巨門', '天相', '天梁',
  '七殺', '破軍'
];

let normalFound = null;
let emptyFound = null;

for (let d = 1; d <= 30; d++) {
  try {
    const chartData = createChart(1990, 5, d, 12, 30, true);
    const lifePalace = chartData.palaces['命宮'];
    const primaryStars = lifePalace.stars.filter(s => MAJOR_STARS.includes(s.name));
    
    if (primaryStars.length > 0 && !normalFound) {
      normalFound = { year: 1990, month: 5, day: d, hour: 12, minute: 30, gender: 'M' };
    } else if (primaryStars.length === 0 && !emptyFound) {
      emptyFound = { year: 1990, month: 5, day: d, hour: 12, minute: 30, gender: 'M' };
    }

    if (normalFound && emptyFound) break;
  } catch(e) {}
}

console.log("Normal:", normalFound);
console.log("Empty (명궁무주성):", emptyFound);
