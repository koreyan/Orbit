import { astrolabe } from 'iztro';
const chart = astrolabe("1990-05-05", 2, 'M', true, 'ko-KR');
console.log(JSON.stringify(chart.palaces[0].stars, null, 2));
