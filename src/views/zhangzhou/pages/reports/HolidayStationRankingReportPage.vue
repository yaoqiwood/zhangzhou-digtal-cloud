<template>
  <div class="holiday-station-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <div ref="yearPickerRef" class="year-picker">
          <button class="select-control year-trigger" @click="toggleYearCard">
            <span>{{ selectedYear }}年</span>
            <span class="picker-arrow" :class="{ open: showYearCard }">▾</span>
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

        <!-- <div class="range-wrap">
          <input
            v-model.number="startRank"
            type="number"
            min="1"
            max="9999"
            class="range-input"
          />
          <span class="range-sep">—</span>
          <input
            v-model.number="endRank"
            type="number"
            min="1"
            max="9999"
            class="range-input"
          />
        </div> -->

        <label class="chart-toggle">
          <input v-model="showChart" type="checkbox" class="chart-toggle-input" />
          <span class="chart-toggle-slider"></span>
          <span class="chart-toggle-text">显示图表</span>
        </label>
        <label class="chart-toggle">
          <input v-model="showTable" type="checkbox" class="chart-toggle-input" />
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

    <div class="report-scroll">
      <div v-show="showChart" ref="chartWrapRef" class="chart-wrap">
        <div class="chart-title">前四收费站流量变化折线图</div>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <div v-show="showTable" class="table-wrap">
        <div class="table-scroll">
          <table ref="reportTableRef" class="report-table">
            <thead>
              <tr ref="headerRow1Ref">
                <th rowspan="2">序号</th>
                <th rowspan="2">收费站名称</th>
                <th :colspan="dayHeaders.length">每日流量明细</th>
                <th colspan="2">总量统计</th>
              </tr>
              <tr>
                <th v-for="day in dayHeaders" :key="day">{{ day }}</th>
                <th>总流量</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.index">
                <td>{{ row.index }}</td>
                <td>{{ row.stationName }}</td>
                <td
                  v-for="(flow, idx) in row.dailyFlows"
                  :key="`${row.index}-${idx}`"
                >
                  {{ flow }}
                </td>
                <td>{{ row.totalFlow }}</td>
                <td>{{ row.ratio }}</td>
              </tr>
              <tr v-if="!pagedRows.length">
                <td :colspan="dayHeaders.length + 4">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-pagination">
          <label class="page-size-control">
            <span>每页最多</span>
            <select v-model.number="pageSize" class="page-size-select">
              <option
                v-for="option in pageSizeOptions"
                :key="option"
                :value="option"
              >
                {{ option }} 条
              </option>
            </select>
          </label>
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage = currentPage - 1"
          >
            上一页
          </button>
          <span class="page-info"
            >第 {{ currentPage }} / {{ totalPages }} 页</span
          >
          <button
            class="page-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage = currentPage + 1"
          >
            下一页
          </button>
        </div>
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

const selectedYear = ref(new Date().getFullYear());
const selectedHoliday = ref('国庆');
const startRank = ref(1);
const endRank = ref(100);

const yearOptions = Array.from({ length: 131 }, (_, i) => 1970 + i).reverse();
const holidayOptions = ['春节', '清明', '五一', '国庆'];
const showYearCard = ref(false);
const showHolidayCard = ref(false);
const showChart = ref(true);
const showTable = ref(false);
const yearPickerRef = ref(null);
const holidayPickerRef = ref(null);

const dayHeaders = ref([
  '第1天',
  '第2天',
  '第3天',
  '第4天',
  '第5天',
  '第6天',
  '第7天',
  '第8天',
]);

const reportTableRef = ref(null);
const headerRow1Ref = ref(null);
const trendChartRef = ref(null);
const chartWrapRef = ref(null);
let tableResizeObserver = null;
let chartResizeObserver = null;
let trendChart = null;
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const tableRows = ref([]);
const isLoading = ref(false);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(tableRows.value.length / pageSize.value))
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableRows.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => {
  currentPage.value = 1;
});

const toggleYearCard = () => {
  showHolidayCard.value = false;
  showYearCard.value = !showYearCard.value;
};

const selectYear = (year) => {
  selectedYear.value = year;
  showYearCard.value = false;
};

const toggleHolidayCard = () => {
  showYearCard.value = false;
  showHolidayCard.value = !showHolidayCard.value;
};

const selectHoliday = (holiday) => {
  selectedHoliday.value = holiday;
  showHolidayCard.value = false;
};

const normalizeHolidayName = (holiday) => {
  return String(holiday || '');
};

const getSpringFestivalStartDate = (year) => {
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const start = new Date(year, 0, 1);
    const end = new Date(year, 2, 15);
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const lunar = formatter.format(date);
      if (lunar.includes(`${year}年正月1`)) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
    }
  } catch (error) {
    console.warn('春节日期计算失败，使用默认日期', error);
  }
  return new Date(year, 0, 28);
};

const getHolidayStartDate = (year, holidayName) => {
  if (holidayName === '国庆') return new Date(year, 9, 1);
  if (holidayName === '五一') return new Date(year, 4, 1);
  if (holidayName === '清明') return new Date(year, 3, 4);
  if (holidayName === '春节') return getSpringFestivalStartDate(year);
  return new Date(year, 0, 1);
};

const buildDateHeaders = (year, holidayName, dayCount) => {
  const count = dayCount > 0 ? dayCount : 8;
  const startDate = getHolidayStartDate(year, holidayName);
  return Array.from({ length: count }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    return `${current.getMonth() + 1}.${current.getDate()}`;
  });
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const sortDayKeys = (record) =>
  Object.keys(record)
    .filter((key) => /^day\d+$/.test(key))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const updateTrendChart = (rows) => {
  if (!trendChart) return;
  const topFourStations = rows.slice(0, 4);
  const maxValue = Math.max(
    0,
    ...topFourStations.flatMap((station) => station._dailyNumberFlows)
  );
  const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;

  trendChart.setOption({
    xAxis: {
      data: dayHeaders.value,
    },
    yAxis: {
      max: yMax,
    },
    series: topFourStations.map((station) => ({
      name: station.stationName,
      type: 'line',
      data: station._dailyNumberFlows,
      smooth: false,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2 },
    })),
  });
};

const normalizeRows = (response) => {
  let list = [];
  if (Array.isArray(response)) {
    list = response;
  } else if (response && Array.isArray(response.data)) {
    list = response.data;
  } else if (response && Array.isArray(response.rows)) {
    list = response.rows;
  } else if (response && response.data && Array.isArray(response.data.rows)) {
    list = response.data.rows;
  }

  if (!list.length) {
    dayHeaders.value = buildDateHeaders(
      selectedYear.value,
      selectedHoliday.value,
      8
    );
    return [];
  }

  const dayKeys = sortDayKeys(list[0]);
  dayHeaders.value =
    dayKeys.length > 0
      ? buildDateHeaders(
          selectedYear.value,
          selectedHoliday.value,
          dayKeys.length
        )
      : dayHeaders.value;

  const rankStart = Math.max(1, Number(startRank.value) || 1);
  const rankEnd = Math.max(rankStart, Number(endRank.value) || rankStart);

  return list
    .map((item, idx) => {
      const dailyNumberFlows = dayKeys.map((key) => toNumber(item[key]));
      const dailyFlows = dailyNumberFlows.map((value) => formatCell(value));
      const totalFlowNum = toNumber(item.sum_cnt);
      const totalFlow =
        totalFlowNum > 0
          ? String(totalFlowNum)
          : String(dailyNumberFlows.reduce((sum, value) => sum + value, 0));
      return {
        index: idx + 1,
        stationName: formatCell(item.stationname),
        dailyFlows,
        totalFlow: formatCell(totalFlow),
        ratio: formatCell(item.percentage),
        _dailyNumberFlows: dailyNumberFlows,
      };
    })
    .slice(rankStart - 1, rankEnd)
    .map((item, idx) => ({
      ...item,
      index: rankStart + idx,
    }));
};

const fetchDailyStationToll = async () => {
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getDailyStationToll,
      {
        year: selectedYear.value,
        holidayName: normalizeHolidayName(selectedHoliday.value),
      }
    );
    tableRows.value = normalizeRows(response);
    currentPage.value = 1;
    updateTrendChart(tableRows.value);
  } catch (error) {
    console.error('获取收费站每日流量排名失败:', error);
    tableRows.value = [];
    updateTrendChart([]);
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchDailyStationToll();
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

const syncStickyHeaderOffsets = () => {
  if (!reportTableRef.value || !headerRow1Ref.value) return;
  const row1Height = headerRow1Ref.value.offsetHeight || 0;
  reportTableRef.value.style.setProperty(
    '--header-row-2-top',
    `${row1Height}px`
  );
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    backgroundColor: 'transparent',
    color: ['#f2d261', '#6f8dff', '#4ec8ff', '#f09152'],
    grid: { top: 10, left: 36, right: 20, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8, 24, 56, 0.94)',
      borderColor: 'rgba(93, 156, 255, 0.65)',
      borderWidth: 1,
      textStyle: { color: '#e8f2ff' },
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 18,
      itemHeight: 10,
      textStyle: { color: '#d2e3ff', fontSize: 14, fontWeight: 600 },
    },
    xAxis: {
      type: 'category',
      data: dayHeaders.value,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(107, 158, 255, 0.55)' } },
      axisTick: { show: false },
      axisLabel: { color: '#b9d2ff', fontSize: 14 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(83, 126, 206, 0.42)', type: 'dashed' } },
      axisLabel: { color: '#c3d8ff', fontSize: 14 },
    },
    series: [],
    animation: false,
  });
};

const resizeTrendChart = () => {
  trendChart?.resize();
};

onMounted(async () => {
  await nextTick();
  syncStickyHeaderOffsets();
  initTrendChart();
  await fetchDailyStationToll();
  document.addEventListener('click', handleDocumentClick);
  if (typeof ResizeObserver !== 'undefined' && reportTableRef.value) {
    tableResizeObserver = new ResizeObserver(() => {
      syncStickyHeaderOffsets();
    });
    tableResizeObserver.observe(reportTableRef.value);
  }
  if (typeof ResizeObserver !== 'undefined' && chartWrapRef.value) {
    chartResizeObserver = new ResizeObserver(() => {
      resizeTrendChart();
    });
    chartResizeObserver.observe(chartWrapRef.value);
  }
  window.addEventListener('resize', syncStickyHeaderOffsets);
  window.addEventListener('resize', resizeTrendChart);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', syncStickyHeaderOffsets);
  window.removeEventListener('resize', resizeTrendChart);
  tableResizeObserver?.disconnect();
  chartResizeObserver?.disconnect();
  tableResizeObserver = null;
  chartResizeObserver = null;
  trendChart?.dispose();
  trendChart = null;
});

watch(showYearCard, async (visible) => {
  if (!visible) return;
  await nextTick();
  const selectedBtn = yearPickerRef.value?.querySelector('.year-item.active');
  selectedBtn?.scrollIntoView({ block: 'center' });
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});

watch([showChart, showTable], async ([chartVisible]) => {
  if (!chartVisible) return;
  await nextTick();
  requestAnimationFrame(resizeTrendChart);
});

watch(showTable, async (visible) => {
  if (!visible) return;
  await nextTick();
  syncStickyHeaderOffsets();
});
</script>

<style scoped lang="less">
.holiday-station-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.toolbar {
  position: relative;
  z-index: 3;
  min-height: 56px;
  border: 1px solid rgba(71, 129, 231, 0.65);
  background: linear-gradient(180deg, rgba(9, 34, 81, 0.94) 0%, rgba(8, 27, 65, 0.96) 100%);
  box-shadow: 0 0 8px rgba(41, 116, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  border-radius: 8px;
  overflow: visible;
}

.toolbar::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(89, 148, 255, 0) 0%, rgba(89, 148, 255, 0.95) 50%, rgba(89, 148, 255, 0) 100%);
}

.toolbar-title {
  color: #f4f8ff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-shadow: 0 0 8px rgba(129, 187, 255, 0.35);
}

.toolbar-actions {
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

.select-control {
  height: 42px;
  border: 1px solid rgba(121, 176, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(21, 56, 122, 0.92) 0%, rgba(16, 45, 99, 0.94) 100%);
  color: #e4efff;
  font-size: 14px;
  font-weight: 600;
  padding: 0 10px;
  box-shadow: inset 0 0 0 1px rgba(156, 203, 255, 0.16), 0 0 10px rgba(61, 128, 236, 0.28);
}

.year-picker {
  position: relative;
}

.year-trigger {
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
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
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

.year-item {
  height: 32px;
  border: 1px solid rgba(104, 162, 246, 0.44);
  background: linear-gradient(180deg, rgba(20, 49, 105, 0.9) 0%, rgba(13, 36, 79, 0.95) 100%);
  color: #d2e6ff;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.year-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
}

.holiday-picker {
  position: relative;
}

.holiday-trigger {
  width: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.holiday-card {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 120px;
  padding: 8px;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  z-index: 2000;
  display: grid;
  gap: 6px;
}

.holiday-item {
  height: 32px;
  border: 1px solid rgba(104, 162, 246, 0.44);
  background: linear-gradient(180deg, rgba(20, 49, 105, 0.9) 0%, rgba(13, 36, 79, 0.95) 100%);
  color: #d2e6ff;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.holiday-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
}

.range-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.range-input {
  width: 74px;
  height: 42px;
  border: 1px solid rgba(121, 176, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(21, 56, 122, 0.92) 0%, rgba(16, 45, 99, 0.94) 100%);
  color: #e4efff;
  font-size: 14px;
  padding: 0 8px;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(156, 203, 255, 0.16), 0 0 10px rgba(61, 128, 236, 0.28);
}

.range-input::-webkit-outer-spin-button,
.range-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.range-input[type='number'] {
  -moz-appearance: textfield;
}

.range-sep {
  color: #a8a8a8;
  font-size: 18px;
  line-height: 1;
}

.btn {
  width: 54px;
  height: 42px;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.report-table {
  --header-row-2-top: 44px;
  width: 100%;
  min-width: 1200px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.report-table th,
.report-table td {
  border-right: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  font-size: 14px;
  padding: 10px 8px;
  box-sizing: border-box;
}

.report-table th:first-child,
.report-table td:first-child {
  border-left: 1px solid #d6d6d6;
}

.report-table thead tr:first-child th {
  border-top: 1px solid #d6d6d6;
}

.report-table th {
  background: #efefef;
  font-weight: 600;
}

.report-table thead th {
  position: sticky;
  background: #efefef;
  background-clip: padding-box;
  line-height: 1.35;
}

.report-table thead tr:nth-child(1) th {
  top: 0;
  z-index: 5;
}

.report-table thead tr:nth-child(2) th {
  top: var(--header-row-2-top);
  z-index: 4;
}

.report-table td {
  background: #f7f7f7;
}

.chart-wrap {
  flex: 0 0 34%;
  position: relative;
  min-height: 0;
  border: 1px solid rgba(71, 129, 231, 0.72);
  background: linear-gradient(180deg, rgba(8, 36, 88, 0.95) 0%, rgba(5, 25, 69, 0.97) 100%);
  box-shadow: inset 0 0 0 1px rgba(114, 175, 255, 0.22), 0 0 24px rgba(25, 87, 211, 0.28);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-wrap::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(130, 181, 255, 0) 0%, rgba(130, 181, 255, 0.95) 50%, rgba(130, 181, 255, 0) 100%);
  box-shadow: 0 0 14px rgba(130, 181, 255, 0.65);
}

.chart-title {
  position: relative;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  color: #f2f7ff;
  font-size: 32px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(128, 184, 255, 0.32);
  border-bottom: 1px solid rgba(74, 133, 234, 0.35);
  background: linear-gradient(90deg, rgba(18, 53, 116, 0.86) 0%, rgba(18, 53, 116, 0.2) 72%, rgba(18, 53, 116, 0) 100%);
  flex-shrink: 0;
}

.chart-title::after {
  content: '';
  position: absolute;
  left: 16px;
  bottom: -1px;
  width: 280px;
  height: 2px;
  background: linear-gradient(90deg, rgba(144, 197, 255, 0.95) 0%, rgba(144, 197, 255, 0) 100%);
  box-shadow: 0 0 10px rgba(132, 187, 255, 0.5);
}

.trend-chart {
  position: relative;
  flex: 1;
  min-height: 0;
  background:
    radial-gradient(circle at 50% 32%, rgba(55, 117, 255, 0.16) 0%, rgba(55, 117, 255, 0) 55%),
    linear-gradient(180deg, rgba(24, 62, 128, 0.18) 0%, rgba(7, 33, 87, 0) 100%);
}

.table-pagination {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 14px;
  border-top: 1px solid #d8d8d8;
}

.page-btn {
  min-width: 68px;
  height: 32px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:disabled {
  color: #999;
  background: #f2f2f2;
  border-color: #dddddd;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.page-size-control {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.page-size-select {
  width: 72px;
  height: 32px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  font-size: 14px;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
}
</style>
