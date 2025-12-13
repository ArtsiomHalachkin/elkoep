let chartInstance;

let dataT1 = [12, 15, 16, 18, 25, 20, 18, 14];
let dataT2 = [14, 17, 18, 20, 21, 22, 20, 16];

function generateData(count, start1, start2, variance) {
    let data1 = [start1];
    let data2 = [start2];
    for (let i = 1; i < count; i++) {
        data1.push(data1[i - 1] + Math.round((Math.random() - 0.5) * variance));
        data2.push(data2[i - 1] + Math.round((Math.random() - 0.5) * variance));
    }
    return [data1, data2];
}

[dataT1, dataT2] = generateData(288, dataT1[0], dataT2[0], 2);

document.addEventListener('DOMContentLoaded', function () {
    const fullCtx = document.getElementById('myChart');

    const currentTime = new Date().getTime();
    const labels = [];
    const numberOfPoints = 288;
    const fiveMinutes = 300000;


    for (let i = 0; i < numberOfPoints; i++) {
        const time = currentTime - (i * fiveMinutes);
        labels.push(time);
    }

    function transparentize(color, opacity) {
        const alpha = opacity === undefined ? 0.5 : 1 - opacity;
        return color + Math.floor(alpha * 255).toString(16);
    }

    chartInstance = new Chart(fullCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'T1',
                    data: dataT1,
                    borderColor: '#0091ea',
                    borderWidth: 3,
                    radius: 0,
                    pointBackgroundColor: '#d5eafc', // Full color for points
                    pointBorderColor: '#0091ea', // Full color for points
                    pointBorderWidth: 0,
                    cubicInterpolationMode: 'monotone',
                    fill: 'start',
                    hitRadius: 10,
                    hoverRadius: 7,
                    // Namísto pevného backgroundColor:
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;

                        if (!chartArea) {
                            return null;
                        }

                        // Vytvoříme gradient zdola nahoru
                        const gradient = ctx.createLinearGradient(
                            0,
                            chartArea.bottom, // dole
                            0,
                            chartArea.top     // nahoře
                        );

                        // Například 20% průhledná bílá dole, 50% průhledná modrá nahoře
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');  // 20% alpha
                        gradient.addColorStop(1, 'rgba(0, 145, 234, 0.5)');    // 50% alpha

                        return gradient;
                    },
                }
            ]
        },
        options: {
            layout: {
                padding: {
                    left: 10,
                    right: 0,
                    bottom: 10
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    type: 'time',
                    time: {
                        unit: 'minute',
                        tooltipFormat: 'HH:mm',
                        displayFormats: {
                            minute: 'HH:mm'
                        }
                    },
                    ticks: {
                        source: 'data',
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0,
                        maxTicksLimit: 8
                    },
                    grid: {
                        display: false
                    },
                    title: {
                        display: false,
                        text: 'Time'
                    },
                },
                y: {
                    display: true,
                    afterDataLimits: axis => {
                        axis.max += 3;
                        axis.min -= 3;
                    },
                    title: {
                        display: false,
                        text: 'Temperature [°C]'
                    },
                    ticks: {
                        callback: function (value) {
                            return value + ' °C'; // Add degrees Celsius to tick values
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            return `${context.dataset.label}: ${value}°C`; // Přidá popisky k tooltipu
                        }
                    }
                }
            },
            adapters: {
                type: 'time',
            },
        }
    });
});