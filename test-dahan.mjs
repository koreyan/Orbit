import { createChart } from '@orrery/core/ziwei';

const chart = createChart('1990-05-15', 4, 'Male', false);
console.log(chart.palaces[0].decadal);
