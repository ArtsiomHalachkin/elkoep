(function () {
  'use strict';

  const modalElement = document.getElementById('historyChartModal');
  if (!modalElement || typeof Chart === 'undefined' || typeof bootstrap === 'undefined') return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  const canvas = document.getElementById('historyChartCanvas');
  const title = document.getElementById('historyChartTitle');
  const eyebrow = document.getElementById('historyChartRoom');
  const summary = document.getElementById('historyChartSummary');
  const periodButtons = Array.from(modalElement.querySelectorAll('[data-chart-period]'));
  const downloadButton = document.getElementById('historyChartDownload');

  let chart = null;
  let activeType = 'temperature-history';
  let activePeriod = 'daily';
  let activeRoom = 'Room';
  let currentExport = null;

  const periodLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    yearly: 'Yearly'
  };

  function roomSeed(roomName) {
    return Array.from(roomName).reduce(function (sum, character) {
      return sum + character.charCodeAt(0);
    }, 0);
  }

  function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  function buildLabels(period) {
    if (period === 'daily') {
      return Array.from({ length: 24 }, function (_, index) {
        return String(index).padStart(2, '0') + ':00';
      });
    }

    if (period === 'weekly') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }

    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  function buildTemperatureData(period, roomName) {
    const labels = buildLabels(period);
    const seed = roomSeed(roomName) % 17;
    const isOutdoor = activeType === 'outdoor-temperature';
    const isHouseAverage = activeType === 'house-average-temperature';
    const setTemperature = isOutdoor ? 7 : (period === 'yearly' ? 21 : 21.5);
    const actual = labels.map(function (_, index) {
      const wave = Math.sin((index + seed) * (period === 'daily' ? 0.48 : 0.8));
      const daytime = period === 'daily' && index >= 7 && index <= 21 ? (isOutdoor ? 3.2 : 0.9) : (isOutdoor ? -1.8 : -0.45);
      const seasonal = period === 'yearly' ? Math.cos((index - 1) * Math.PI / 6) * (isOutdoor ? 10 : 1.1) : 0;
      const smoothing = isHouseAverage ? 0.45 : 0.65;
      return round(setTemperature + wave * smoothing + daytime + seasonal, 1);
    });
    const requested = labels.map(function (_, index) {
      if (period === 'daily') return index >= 6 && index < 22 ? 22 : 19;
      if (period === 'weekly') return index < 5 ? 22 : 20;
      return index >= 4 && index <= 8 ? 20 : 22;
    });

    const datasets = [
      {
        label: isOutdoor ? 'Outdoor temperature' : (isHouseAverage ? 'Average indoor temperature' : 'Actual temperature'),
        data: actual,
        borderColor: '#f29c15',
        backgroundColor: 'rgba(242, 156, 21, 0.16)',
        fill: true,
        tension: 0.34,
        pointRadius: period === 'daily' ? 0 : 3,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ];
    if (!isOutdoor) datasets.push({
      label: isHouseAverage ? 'Average set temperature' : 'Set temperature',
      data: requested,
      borderColor: '#15a9f2',
      backgroundColor: 'rgba(21, 169, 242, 0.08)',
      borderDash: [7, 5],
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2
    });

    return {
      labels,
      unit: '°C',
      decimals: 1,
      datasets
    };
  }

  function buildHouseTemperatureData(period, roomName) {
    const labels = buildLabels(period);
    const seed = roomSeed(roomName) % 17;
    const outdoor = labels.map(function (_, index) {
      const wave = Math.sin((index + seed) * (period === 'daily' ? 0.48 : 0.8));
      const daytime = period === 'daily' && index >= 7 && index <= 21 ? 3.2 : -1.8;
      const seasonal = period === 'yearly' ? Math.cos((index - 1) * Math.PI / 6) * 10 : 0;
      return round(7 + wave * 0.65 + daytime + seasonal, 1);
    });
    const houseAverage = labels.map(function (_, index) {
      const wave = Math.sin((index + seed) * (period === 'daily' ? 0.48 : 0.8));
      const daytime = period === 'daily' && index >= 7 && index <= 21 ? 0.9 : -0.45;
      const seasonal = period === 'yearly' ? Math.cos((index - 1) * Math.PI / 6) * 1.1 : 0;
      return round((period === 'yearly' ? 21 : 21.5) + wave * 0.45 + daytime + seasonal, 1);
    });

    return {
      labels,
      unit: '°C',
      decimals: 1,
      datasets: [
        {
          label: 'Outdoor temperature',
          data: outdoor,
          borderColor: '#f29c15',
          backgroundColor: 'rgba(242, 156, 21, 0.1)',
          fill: false,
          tension: 0.34,
          pointRadius: period === 'daily' ? 0 : 3,
          pointHoverRadius: 6,
          borderWidth: 3
        },
        {
          label: 'House average',
          data: houseAverage,
          borderColor: '#15a9f2',
          backgroundColor: 'rgba(21, 169, 242, 0.1)',
          fill: false,
          tension: 0.34,
          pointRadius: period === 'daily' ? 0 : 3,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    };
  }

  function buildCostData(period, roomName) {
    const labels = buildLabels(period);
    const seed = roomSeed(roomName) % 13;
    const houseMultiplier = activeType === 'house-heating-costs' ? 18 : 1;
    const multiplier = (period === 'daily' ? 1.7 : period === 'weekly' ? 21 : 360) * houseMultiplier;
    const costs = labels.map(function (_, index) {
      const seasonal = period === 'yearly' ? 0.35 + Math.abs(Math.cos(index * Math.PI / 6)) : 1;
      const activity = period === 'daily' && (index < 6 || index > 21) ? 0.45 : 1;
      const variation = 0.82 + ((index * 7 + seed) % 9) / 20;
      return round(multiplier * seasonal * activity * variation, 2);
    });

    return {
      labels,
      unit: 'CZK',
      decimals: 2,
      datasets: [
        {
          label: activeType === 'house-heating-costs' ? 'Whole house heating cost' : 'Heating cost',
          data: costs,
          borderColor: '#0f766e',
          backgroundColor: 'rgba(20, 184, 166, 0.17)',
          fill: true,
          tension: 0.34,
          pointRadius: period === 'daily' ? 0 : 3,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    };
  }

  function buildDemoData() {
    if (activeType === 'house-temperatures') {
      return buildHouseTemperatureData(activePeriod, activeRoom);
    }
    return activeType !== 'heating-costs' && activeType !== 'house-heating-costs'
      ? buildTemperatureData(activePeriod, activeRoom)
      : buildCostData(activePeriod, activeRoom);
  }

  function updateSummary(data) {
    if (activeType === 'house-temperatures') {
      summary.innerHTML = data.datasets.map(function (dataset) {
        const average = dataset.data.reduce(function (sum, value) { return sum + value; }, 0) / dataset.data.length;
        return '<span>' + dataset.label + ' average <strong>' + average.toFixed(1) + ' °C</strong></span>';
      }).join('');
      return;
    }

    const values = data.datasets[0].data;
    const minimum = Math.min.apply(null, values);
    const maximum = Math.max.apply(null, values);
    const average = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
    const total = values.reduce(function (sum, value) { return sum + value; }, 0);

    if (activeType !== 'heating-costs' && activeType !== 'house-heating-costs') {
      summary.innerHTML = '<span>Minimum <strong>' + minimum.toFixed(1) + ' °C</strong></span>' +
        '<span>Average <strong>' + average.toFixed(1) + ' °C</strong></span>' +
        '<span>Maximum <strong>' + maximum.toFixed(1) + ' °C</strong></span>';
    } else {
      summary.innerHTML = '<span>Period total <strong>' + total.toFixed(2) + ' CZK</strong></span>' +
        '<span>Average <strong>' + average.toFixed(2) + ' CZK</strong></span>' +
        '<span>Maximum <strong>' + maximum.toFixed(2) + ' CZK</strong></span>';
    }
  }

  function renderChart() {
    const data = buildDemoData();
    currentExport = data;
    if (chart) chart.destroy();

    chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 350 },
        layout: { padding: { top: 8, right: 12, bottom: 4, left: 4 } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: activePeriod === 'daily' ? 12 : 12 }
          },
          y: {
            beginAtZero: activeType === 'heating-costs' || activeType === 'house-heating-costs',
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: {
              color: '#64748b',
              callback: function (value) { return value + ' ' + data.unit; }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: { usePointStyle: true, boxWidth: 8, color: '#334155', padding: 18 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return context.dataset.label + ': ' + Number(context.parsed.y).toFixed(data.decimals) + ' ' + data.unit;
              }
            }
          }
        }
      }
    });

    updateSummary(data);
  }

  function setPeriod(period) {
    activePeriod = period;
    periodButtons.forEach(function (button) {
      const active = button.dataset.chartPeriod === period;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderChart();
  }

  function openHistory(actionButton) {
    const card = actionButton.closest('[data-history-context], .room-card-scaled');
    activeType = actionButton.dataset.action;
    activeRoom = card?.dataset.historyContext || card?.querySelector('.room-card-name')?.textContent.trim() || 'Room';
    activePeriod = 'daily';
    eyebrow.textContent = activeRoom;
    const titles = {
      'temperature-history': 'Temperature history',
      'heating-costs': 'Heating cost history',
      'house-temperatures': 'Outdoor and house average temperatures',
      'outdoor-temperature': 'Outdoor temperature history',
      'house-average-temperature': 'Whole house average temperature',
      'house-heating-costs': 'Whole house heating costs'
    };
    title.textContent = titles[activeType] || 'History';
    modal.show();
  }

  function csvEscape(value) {
    const text = String(value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function downloadCSV() {
    if (!currentExport) return;
    const headers = ['Period'].concat(currentExport.datasets.map(function (dataset) { return dataset.label; }));
    const rows = currentExport.labels.map(function (label, index) {
      return [label].concat(currentExport.datasets.map(function (dataset) { return dataset.data[index]; }));
    });
    const csv = [headers].concat(rows).map(function (row) {
      return row.map(csvEscape).join(',');
    }).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const type = activeType.includes('temperature') ? 'temperature' : 'heating-costs';
    link.href = url;
    link.download = activeRoom.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + type + '-' + activePeriod + '.csv';
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.addEventListener('click', function (event) {
    const actionButton = event.target.closest('.room-heating-action');
    if (actionButton) openHistory(actionButton);
  });

  document.addEventListener('keydown', function (event) {
    const actionButton = event.target.closest('.room-heating-action');
    if (actionButton && actionButton.tagName !== 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openHistory(actionButton);
    }
  });

  periodButtons.forEach(function (button) {
    button.addEventListener('click', function () { setPeriod(button.dataset.chartPeriod); });
  });

  downloadButton.addEventListener('click', downloadCSV);
  modalElement.addEventListener('shown.bs.modal', function () { setPeriod(activePeriod); });
  modalElement.addEventListener('hidden.bs.modal', function () {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });
})();
