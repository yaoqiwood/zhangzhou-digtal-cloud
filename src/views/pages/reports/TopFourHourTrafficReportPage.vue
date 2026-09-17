<template>
  <div class="top-four-hour-page">
    <div class="query-toolbar">
      <div class="query-toolbar-title">查询条件</div>
      <div class="query-toolbar-actions">
        <div class="station-tabs">
          <button
            v-for="tab in stationTabs"
            :key="tab"
            class="station-tab"
            :class="{ active: activeStation === tab }"
            @click="activeStation = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="query-filters-row">
          <div ref="yearPickerRef" class="year-picker">
            <button class="select-control year-trigger" @click="toggleYearCard">
              <span>{{ selectedYear }}年</span>
              <span class="picker-arrow" :class="{ open: showYearCard }"
                >▾</span
              >
            </button>
            <div v-if="showYearCard" class="year-card">
              <button
                v-for="year in yearOptions"
                :key="year"
                class="year-item"
                :class="{ active: selectedYear === year }"
                @click="selectYear(year)"
              >
                {{ year }}
              </button>
            </div>
          </div>

          <div ref="holidayPickerRef" class="holiday-picker">
            <button
              class="select-control holiday-trigger"
              @click="toggleHolidayCard"
            >
              <span>{{ selectedHoliday }}</span>
              <span class="picker-arrow" :class="{ open: showHolidayCard }"
                >▾</span
              >
            </button>
            <div v-if="showHolidayCard" class="holiday-card">
              <button
                v-for="holiday in holidayOptions"
                :key="holiday"
                class="holiday-item"
                :class="{ active: selectedHoliday === holiday }"
                @click="selectHoliday(holiday)"
              >
                {{ holiday }}
              </button>
            </div>
          </div>

          <label class="chart-toggle">
            <input
              v-model="showChart"
              type="checkbox"
              class="chart-toggle-input"
            />
            <span class="chart-toggle-slider"></span>
            <span class="chart-toggle-text">显示图表</span>
          </label>
          <label class="chart-toggle">
            <input
              v-model="showTable"
              type="checkbox"
              class="chart-toggle-input"
            />
            <span class="chart-toggle-slider"></span>
            <span class="chart-toggle-text">显示表格</span>
          </label>
          <button
            class="btn query-btn"
            :disabled="isLoading"
            @click="handleQuery"
          >
            查询
          </button>
          <button class="btn download-btn">下载</button>
        </div>
      </div>
    </div>

    <div class="report-scroll">
      <div v-show="showChart" class="chart-card">
        <div class="chart-card-head">
          <h3 class="chart-title">收费站峰值日流量变化折线图</h3>
        </div>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <div v-show="showTable" class="table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th colspan="4" class="table-caption">{{ tableCaption }}</th>
            </tr>
            <tr>
              <th class="time-col"></th>
              <th>出口（辆）</th>
              <th>入口（辆）</th>
              <th>合计（辆）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.fullTime">
              <td class="time-col">{{ row.time }}</td>
              <td>{{ row.out }}</td>
              <td>{{ row.in }}</td>
              <td>{{ row.total }}</td>
            </tr>
            <tr v-if="!tableRows.length">
              <td colspan="4">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import * as echarts from 'echarts';
import http from '@/utils/http';
import { API_URLS } from '@/utils/apiUrls';

const stationTabs = ref([]);
const activeStation = ref('');

const selectedYear = ref(new Date().getFullYear());
const selectedHoliday = ref('国庆');

const yearOptions = Array.from({ length: 131 }, (_, i) => 1970 + i).reverse();
const holidayOptions = ['春节', '清明', '五一', '国庆'];

const showYearCard = ref(false);
const showHolidayCard = ref(false);
const showChart = ref(true);
const showTable = ref(false);
const yearPickerRef = ref(null);
const holidayPickerRef = ref(null);
const isLoading = ref(false);

const trendChartRef = ref(null);
let trendChart = null;
const stationRowsMap = ref({});

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const normalizeHolidayName = (holiday) => {
  const source = String(holiday || '');
  if (source === '劳动节') return '五一';
  if (source === '清明节' || source === '端午节') {
    return source.replace('节', '');
  }
  return source;
};

const extractHourLabel = (hoursText) => {
  const source = String(hoursText || '');
  if (!source) return '--';
  if (source.includes(' ')) {
    return source.split(' ')[1].slice(0, 5);
  }
  return source.slice(11, 16) || source;
};

const extractDateLabel = (hoursText) => {
  const source = String(hoursText || '');
  if (!source) return '';
  const datePart = source.includes(' ')
    ? source.split(' ')[0]
    : source.slice(0, 10);
  const [year, month, day] = datePart.split('-').map((item) => Number(item));
  if (!year || !month || !day) return '';
  return `${month}.${day}`;
};

const normalizeRows = (response) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && Array.isArray(response.rows)) return response.rows;
  if (response && response.data && Array.isArray(response.data.rows)) {
    return response.data.rows;
  }
  return [];
};

const updateStationData = (list) => {
  const groupedMap = new Map();
  list.forEach((item) => {
    const stationName = String(item?.nodename || '').trim();
    if (!stationName) return;
    const row = {
      fullTime: formatCell(item?.hours),
      time: extractHourLabel(item?.hours),
      outNum: toNumber(item?.ex_cnt),
      inNum: toNumber(item?.en_cnt),
      totalNum: toNumber(item?.cnt),
    };
    if (!groupedMap.has(stationName)) {
      groupedMap.set(stationName, []);
    }
    groupedMap.get(stationName).push(row);
  });

  const topStations = Array.from(groupedMap.entries())
    .sort((a, b) => {
      const peakA = Math.max(0, ...a[1].map((item) => item.totalNum));
      const peakB = Math.max(0, ...b[1].map((item) => item.totalNum));
      return peakB - peakA;
    })
    .slice(0, 4)
    .map(([stationName, rows]) => {
      const sortedRows = [...rows].sort((a, b) =>
        String(a.fullTime).localeCompare(String(b.fullTime))
      );
      return [stationName, sortedRows];
    });

  const nextMap = {};
  topStations.forEach(([stationName, rows]) => {
    nextMap[stationName] = rows;
  });

  stationRowsMap.value = nextMap;
  stationTabs.value = topStations.map(([stationName]) => stationName);
  if (!stationTabs.value.includes(activeStation.value)) {
    activeStation.value = stationTabs.value[0] || '';
  }
};

const tableCaption = computed(() => {
  const station = activeStation.value || '收费站';
  const dateLabel = currentDateLabel.value ? `${currentDateLabel.value} ` : '';
  return `${station}${dateLabel}峰值日车流量时段明细`;
});

const tableRows = computed(() => {
  const rows = stationRowsMap.value[activeStation.value] || [];
  return rows.map((item) => ({
    fullTime: item.fullTime,
    time: item.time,
    out: formatCell(item.outNum),
    in: formatCell(item.inNum),
    total: formatCell(item.totalNum),
  }));
});

const currentSeries = computed(() => {
  const rows = stationRowsMap.value[activeStation.value] || [];
  return {
    xData: rows.map((item) => item.time),
    outData: rows.map((item) => item.outNum),
    inData: rows.map((item) => item.inNum),
    totalData: rows.map((item) => item.totalNum),
  };
});

const currentDateLabel = computed(() => {
  const rows = stationRowsMap.value[activeStation.value] || [];
  if (!rows.length) return '';
  return extractDateLabel(rows[0].fullTime);
});

const toggleYearCard = () => {
  showHolidayCard.value = false;
  showYearCard.value = !showYearCard.value;
};

const toggleHolidayCard = () => {
  showYearCard.value = false;
  showHolidayCard.value = !showHolidayCard.value;
};

const selectYear = (year) => {
  selectedYear.value = year;
  showYearCard.value = false;
};

const selectHoliday = (holiday) => {
  selectedHoliday.value = holiday;
  showHolidayCard.value = false;
};

const fetchTop4StationHourlyFlow = async () => {
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getTop4StationHourlyFlow,
      {
        year: selectedYear.value,
        holidayName: normalizeHolidayName(selectedHoliday.value),
      }
    );
    const list = normalizeRows(response);
    updateStationData(list);
  } catch (error) {
    console.error('获取4站点逐小时流量失败:', error);
    stationRowsMap.value = {};
    stationTabs.value = [];
    activeStation.value = '';
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchTop4StationHourlyFlow();
};

const handleDocumentClick = (event) => {
  if (yearPickerRef.value && !yearPickerRef.value.contains(event.target)) {
    showYearCard.value = false;
  }
  if (
    holidayPickerRef.value &&
    !holidayPickerRef.value.contains(event.target)
  ) {
    showHolidayCard.value = false;
  }
};

const renderChart = () => {
  if (!trendChartRef.value) return;
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }

  const maxValue = Math.max(
    0,
    ...currentSeries.value.outData,
    ...currentSeries.value.inData,
    ...currentSeries.value.totalData
  );
  const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;

  trendChart.setOption({
    backgroundColor: 'transparent',
    animation: false,
    grid: {
      top: 16,
      left: 40,
      right: 24,
      bottom: 52,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8, 24, 56, 0.94)',
      borderColor: 'rgba(93, 156, 255, 0.65)',
      borderWidth: 1,
      textStyle: { color: '#e8f2ff' },
    },
    legend: {
      bottom: 12,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      textStyle: {
        color: '#d2e3ff',
        fontSize: 13,
        fontWeight: 600,
      },
      data: ['出口', '入口', '合计'],
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: currentSeries.value.xData,
      axisLine: {
        lineStyle: {
          color: 'rgba(107, 158, 255, 0.55)',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#b9d2ff',
        interval: 1,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 6,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#c3d8ff',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(83, 126, 206, 0.42)',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '出口',
        type: 'line',
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: '#6f8dff',
        },
        itemStyle: {
          color: '#6f8dff',
        },
        data: currentSeries.value.outData,
      },
      {
        name: '入口',
        type: 'line',
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: '#4ec8ff',
        },
        itemStyle: {
          color: '#4ec8ff',
        },
        data: currentSeries.value.inData,
      },
      {
        name: '合计',
        type: 'line',
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: '#f09152',
        },
        itemStyle: {
          color: '#f09152',
        },
        data: currentSeries.value.totalData,
      },
    ],
  });
};

const resizeChart = () => {
  trendChart?.resize();
};

onMounted(async () => {
  await nextTick();
  renderChart();
  await fetchTop4StationHourlyFlow();
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', resizeChart);
  trendChart?.dispose();
  trendChart = null;
});

watch(activeStation, () => {
  renderChart();
});

watch(
  stationRowsMap,
  () => {
    renderChart();
  },
  { deep: true }
);

watch(showYearCard, async (visible) => {
  if (!visible) return;
  await nextTick();
  const selectedBtn = yearPickerRef.value?.querySelector('.year-item.active');
  selectedBtn?.scrollIntoView({ block: 'center' });
});

watch([showChart, showTable], async ([chartVisible]) => {
  if (!chartVisible) return;
  await nextTick();
  requestAnimationFrame(() => {
    resizeChart();
    renderChart();
  });
});
</script>

<style scoped lang="less">
.top-four-hour-page {
  position: relative;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  contain: layout style paint;
  background:
    radial-gradient(
      circle at 50% -20%,
      rgba(82, 140, 255, 0.32) 0%,
      rgba(82, 140, 255, 0) 32%
    ),
    linear-gradient(180deg, #041333 0%, #06183f 48%, #051634 100%);
}

.top-four-hour-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(83, 127, 201, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(83, 127, 201, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
  z-index: 0;
}

.query-toolbar,
.report-scroll {
  position: relative;
}

.query-toolbar {
  z-index: 3;
  flex-shrink: 0;
  min-height: 56px;
  border: 1px solid rgba(71, 129, 231, 0.65);
  background: linear-gradient(
    180deg,
    rgba(9, 34, 81, 0.94) 0%,
    rgba(8, 27, 65, 0.96) 100%
  );
  box-shadow: 0 0 8px rgba(41, 116, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  border-radius: 8px;
  overflow: visible;
}

.query-toolbar::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(89, 148, 255, 0) 0%,
    rgba(89, 148, 255, 0.95) 50%,
    rgba(89, 148, 255, 0) 100%
  );
}

.query-toolbar-title {
  color: #f4f8ff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-shadow: 0 0 8px rgba(129, 187, 255, 0.35);
}

.query-toolbar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.station-tabs {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 6px;
}

.station-tab {
  border: 1px solid rgba(112, 171, 255, 0.56);
  background: linear-gradient(
    180deg,
    rgba(25, 58, 122, 0.94) 0%,
    rgba(17, 45, 97, 0.96) 100%
  );
  color: #deedff;
  width: 82px;
  height: 34px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  word-break: keep-all;
}

.station-tab.active {
  border-color: rgba(147, 201, 255, 0.74);
  background: linear-gradient(
    180deg,
    rgba(64, 135, 255, 0.52) 0%,
    rgba(38, 104, 226, 0.58) 100%
  );
  color: #f4f9ff;
  font-weight: 600;
}

.query-filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  order: -1;
  color: #dce9ff;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.chart-toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.chart-toggle-slider {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: #93a7cb;
  position: relative;
  transition: background-color 0.2s ease;
}

.chart-toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.chart-toggle-input:checked + .chart-toggle-slider {
  background: #3e90ff;
}

.chart-toggle-input:checked + .chart-toggle-slider::after {
  transform: translateX(18px);
}

.chart-toggle-text {
  line-height: 1;
}

.year-picker,
.holiday-picker {
  position: relative;
}

.select-control {
  height: 42px;
  border: 1px solid rgba(121, 176, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    rgba(21, 56, 122, 0.92) 0%,
    rgba(16, 45, 99, 0.94) 100%
  );
  color: #e4efff;
  font-size: 14px;
  font-weight: 600;
  padding: 0 10px;
  box-shadow:
    inset 0 0 0 1px rgba(156, 203, 255, 0.16),
    0 0 10px rgba(61, 128, 236, 0.28);
}

.year-trigger,
.holiday-trigger {
  width: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.picker-arrow {
  font-size: 28px;
  color: #d8e9ff;
  transform: translateY(-2px);
  transition: color 0.2s ease;
}

.picker-arrow.open {
  color: #8bc2ff;
}

.year-card {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 220px;
  height: 220px;
  padding: 10px;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(
    180deg,
    rgba(10, 33, 82, 0.98) 0%,
    rgba(7, 24, 60, 0.99) 100%
  );
  box-shadow:
    inset 0 0 0 1px rgba(132, 187, 255, 0.16),
    0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  overflow-y: auto;
  z-index: 2000;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #3e90ff rgba(20, 45, 92, 0.65);
}

.year-card::-webkit-scrollbar {
  width: 8px;
}

.year-card::-webkit-scrollbar-track {
  background: rgba(20, 45, 92, 0.65);
  border-radius: 6px;
}

.year-card::-webkit-scrollbar-thumb {
  background: #3e90ff;
  border-radius: 6px;
}

.year-item,
.holiday-item {
  height: 32px;
  border: 1px solid rgba(104, 162, 246, 0.44);
  background: linear-gradient(
    180deg,
    rgba(20, 49, 105, 0.9) 0%,
    rgba(13, 36, 79, 0.95) 100%
  );
  color: #d2e6ff;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.year-item.active,
.holiday-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(
    180deg,
    rgba(64, 135, 255, 0.52) 0%,
    rgba(38, 104, 226, 0.58) 100%
  );
  color: #f4f9ff;
}

.holiday-card {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 120px;
  padding: 8px;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(
    180deg,
    rgba(10, 33, 82, 0.98) 0%,
    rgba(7, 24, 60, 0.99) 100%
  );
  box-shadow:
    inset 0 0 0 1px rgba(132, 187, 255, 0.16),
    0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  z-index: 2000;
  display: grid;
  gap: 6px;
}

.btn {
  width: 74px;
  height: 42px;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.query-btn {
  border: 1px solid rgba(133, 183, 255, 0.65);
  background: linear-gradient(180deg, #285cb8 0%, #234fa1 100%);
  box-shadow: 0 0 6px rgba(65, 132, 255, 0.15);
}

.download-btn {
  border: 1px solid rgba(133, 183, 255, 0.65);
  background: linear-gradient(180deg, #2d64c5 0%, #2456ae 100%);
  box-shadow: 0 0 6px rgba(65, 132, 255, 0.15);
}

.report-scroll {
  z-index: 1;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px;
}

.report-scroll::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120px;
  pointer-events: none;
  background:
    linear-gradient(rgba(87, 144, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(87, 144, 255, 0.12) 1px, transparent 1px);
  background-size:
    56px 18px,
    56px 18px;
  opacity: 0.55;
  z-index: 0;
}

.chart-card {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  border: 1px solid rgba(71, 129, 231, 0.72);
  background: linear-gradient(
    180deg,
    rgba(8, 36, 88, 0.95) 0%,
    rgba(5, 25, 69, 0.97) 100%
  );
  box-shadow: 0 0 8px rgba(25, 87, 211, 0.18);
  border-radius: 10px;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-card::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(130, 181, 255, 0) 0%,
    rgba(130, 181, 255, 0.95) 50%,
    rgba(130, 181, 255, 0) 100%
  );
  box-shadow: 0 0 6px rgba(130, 181, 255, 0.3);
}

.chart-card-head {
  position: relative;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid rgba(74, 133, 234, 0.35);
  background: linear-gradient(
    90deg,
    rgba(18, 53, 116, 0.86) 0%,
    rgba(18, 53, 116, 0.2) 72%,
    rgba(18, 53, 116, 0) 100%
  );
}

.chart-title {
  position: relative;
  margin: 0;
  color: #f2f7ff;
  font-size: 32px;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(128, 184, 255, 0.2);
}

.chart-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 280px;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(144, 197, 255, 0.95) 0%,
    rgba(144, 197, 255, 0) 100%
  );
  box-shadow: 0 0 4px rgba(132, 187, 255, 0.3);
}

.trend-chart {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  background:
    radial-gradient(
      circle at 50% 32%,
      rgba(55, 117, 255, 0.16) 0%,
      rgba(55, 117, 255, 0) 55%
    ),
    linear-gradient(180deg, rgba(24, 62, 128, 0.18) 0%, rgba(7, 33, 87, 0) 100%);
}

.table-wrap {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
  overflow: auto;
}

.report-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 760px;
  table-layout: fixed;
}

.report-table th,
.report-table td {
  border-right: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  height: 44px;
  font-size: 13px;
  background: #f9f9f9;
}

.report-table th {
  font-weight: 600;
  background: #efefef;
}

.report-table tr > *:first-child {
  border-left: 1px solid #d6d6d6;
}

.report-table thead tr:first-child > * {
  border-top: 1px solid #d6d6d6;
}

.report-table thead tr:nth-child(1) th {
  position: sticky;
  top: 0;
  z-index: 3;
  height: 62px;
  background: #efefef;
}

.report-table thead tr:nth-child(2) th {
  position: sticky;
  top: 62px;
  z-index: 3;
  background: #efefef;
}

.table-caption {
  height: 62px;
}

.time-col {
  width: 110px;
  color: #3e434e;
  font-weight: 600;
}
</style>
