<template>
  <div class="daily-billing-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <YearMonthPicker v-model="selectedMonth" />
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
        <button class="btn query-btn" :disabled="isLoading" @click="handleQuery">
          查询
        </button>
        <button class="btn download-btn">下载</button>
      </div>
    </div>

    <div class="content-scroll">
      <div v-show="showChart" class="chart-wrap">
        <div class="chart-title">每日收费情况趋势图</div>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <div v-show="showTable" class="table-wrap">
        <table ref="reportTableRef" class="report-table">
          <thead>
            <tr ref="headerRow1Ref">
              <th rowspan="2">日期</th>
              <th colspan="3">车次（辆）</th>
            </tr>
            <tr>
              <th>入口</th>
              <th>出口</th>
              <th>合计</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in pagedRows"
              :key="`${row.shiftdate || 'row'}-${index}`"
            >
              <td>{{ formatCell(row.shiftdate) }}</td>
              <td>{{ formatCell(row.en_cnt) }}</td>
              <td>{{ formatCell(row.ex_cnt) }}</td>
              <td>{{ formatCell(row.o_cnt) }}</td>
            </tr>
            <tr v-if="isNoData" class="no-data-row">
              <td colspan="4">暂无数据</td>
            </tr>
          </tbody>
        </table>
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
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import http from '@/utils/http';
import { API_URLS } from '@/utils/apiUrls';
import YearMonthPicker from './datePicker/YearMonthPicker.vue';

const getDefaultMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const selectedMonth = ref(getDefaultMonth());
const trendChartRef = ref(null);
const reportTableRef = ref(null);
const headerRow1Ref = ref(null);
let trendChart = null;
let tableResizeObserver = null;
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const isLoading = ref(false);
const tableRows = ref([]);
const showChart = ref(true);
const showTable = ref(false);

const normalizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildNowTime = (monthValue) => {
  const [year, month] = String(monthValue || '').split('-');
  if (!year || !month) return '';
  return `${year}-${month}-01 00:00:00`;
};

const normalizeRows = (response) => {
  let rows = [];
  if (Array.isArray(response)) {
    rows = response;
  } else if (response && Array.isArray(response.data)) {
    rows = response.data;
  } else if (response && Array.isArray(response.rows)) {
    rows = response.rows;
  } else if (response && response.data && Array.isArray(response.data.rows)) {
    rows = response.data.rows;
  }
  return rows.map((item) => ({
    shiftdate: item.shiftdate ?? '',
    en_cnt: normalizeNumber(item.en_cnt),
    ex_cnt: normalizeNumber(item.ex_cnt),
    o_cnt: normalizeNumber(item.o_cnt),
  }))
    .filter((item) => {
      const dateText = String(item.shiftdate || '').trim();
      return dateText && !dateText.includes('合计');
    });
};

const totalPages = computed(
  () => Math.max(1, Math.ceil(tableRows.value.length / pageSize.value))
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableRows.value.slice(start, start + pageSize.value);
});
const isNoData = computed(() => tableRows.value.length === 0);

watch(pageSize, () => {
  currentPage.value = 1;
});

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const updateTrendChart = (rows = []) => {
  if (!trendChart) return;
  const chartXAxis = rows.map((item) => item.shiftdate || '--');
  const chartEntry = rows.map((item) => normalizeNumber(item.en_cnt));
  const chartExit = rows.map((item) => normalizeNumber(item.ex_cnt));
  const chartTotal = rows.map((item) => normalizeNumber(item.o_cnt));
  const maxValue = Math.max(0, ...chartEntry, ...chartExit, ...chartTotal);
  const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;
  trendChart.setOption({
    xAxis: { data: chartXAxis },
    yAxis: { max: yMax },
    series: [
      { name: '入口流量', data: chartEntry },
      { name: '出口流量', data: chartExit },
      { name: '总流量', data: chartTotal },
    ],
  });
};

const fetchDailyStationFlow = async () => {
  const nowTime = buildNowTime(selectedMonth.value);
  if (!nowTime) {
    tableRows.value = [];
    updateTrendChart([]);
    return;
  }
  isLoading.value = true;
  try {
    const response = await http.get(API_URLS.putian_highway.getDailyStationFlow, {
      nowTime,
    });
    tableRows.value = normalizeRows(response);
    currentPage.value = 1;
    updateTrendChart(tableRows.value);
  } catch (error) {
    console.error('获取每日收费流量失败:', error);
    tableRows.value = [];
    updateTrendChart([]);
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchDailyStationFlow();
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 46, right: 20, top: 24, bottom: 52 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8, 24, 56, 0.94)',
      borderColor: 'rgba(93, 156, 255, 0.65)',
      borderWidth: 1,
      textStyle: { color: '#e8f2ff' },
      formatter(params) {
        if (!Array.isArray(params) || !params.length) return '';
        const title = params[0]?.axisValueLabel || params[0]?.name || '';
        const lines = params.map(
          (item) => `${item.marker}${item.seriesName}：${item.value ?? '--'}`
        );
        return [title, ...lines].join('<br/>');
      },
    },
    legend: {
      bottom: 6,
      icon: 'roundRect',
      itemWidth: 18,
      itemHeight: 10,
      textStyle: { color: '#d2e3ff', fontSize: 12, fontWeight: 600 },
      data: ['入口流量', '出口流量', '总流量'],
    },
    xAxis: {
      type: 'category',
      data: [],
      axisTick: { alignWithLabel: true },
      axisLabel: { color: '#b9d2ff', fontSize: 12 },
      axisLine: { lineStyle: { color: 'rgba(107, 158, 255, 0.55)' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitNumber: 5,
      axisLabel: { color: '#c3d8ff' },
      splitLine: { lineStyle: { color: 'rgba(83, 126, 206, 0.42)', type: 'dashed' } },
    },
    series: [
      {
        name: '入口流量',
        type: 'bar',
        data: [],
        barWidth: 12,
        itemStyle: { color: '#f2d261' },
        label: { show: false },
      },
      {
        name: '出口流量',
        type: 'bar',
        data: [],
        barWidth: 12,
        itemStyle: { color: '#6f8dff' },
        label: { show: false },
      },
      {
        name: '总流量',
        type: 'line',
        data: [],
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#f09152', width: 3 },
        itemStyle: { color: '#f09152', borderColor: '#f09152', borderWidth: 2 },
      },
    ],
    animation: false,
  });
};

const syncStickyHeaderOffsets = () => {
  if (!reportTableRef.value || !headerRow1Ref.value) return;
  const row1Height = headerRow1Ref.value.offsetHeight || 0;
  reportTableRef.value.style.setProperty(
    '--header-row-2-top',
    `${row1Height}px`
  );
};

const resizeChart = () => trendChart?.resize();

watch([showChart, showTable], async ([chartVisible]) => {
  if (!chartVisible) return;
  await nextTick();
  requestAnimationFrame(resizeChart);
});

watch(showTable, async (visible) => {
  if (!visible) return;
  await nextTick();
  syncStickyHeaderOffsets();
});

onMounted(async () => {
  await nextTick();
  initTrendChart();
  await fetchDailyStationFlow();
  syncStickyHeaderOffsets();
  if (typeof ResizeObserver !== 'undefined' && reportTableRef.value) {
    tableResizeObserver = new ResizeObserver(() => {
      syncStickyHeaderOffsets();
    });
    tableResizeObserver.observe(reportTableRef.value);
  }
  window.addEventListener('resize', resizeChart);
  window.addEventListener('resize', syncStickyHeaderOffsets);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  window.removeEventListener('resize', syncStickyHeaderOffsets);
  trendChart?.dispose();
  tableResizeObserver?.disconnect();
  tableResizeObserver = null;
  trendChart = null;
});
</script>

<style lang="less" scoped>
.daily-billing-page {
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

.content-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.table-wrap {
  margin-top: 12px;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
}

.report-table {
  --sticky-top: 0px;
  --header-row-2-top: 48px;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.report-table th,
.report-table td {
  border-right: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 12px 6px;
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
  font-size: 16px;
  font-weight: 600;
}

.report-table thead th {
  position: sticky;
  background: #efefef;
  background-clip: padding-box;
}

.report-table thead tr:nth-child(1) th {
  top: var(--sticky-top);
  z-index: 6;
}

.report-table thead tr:nth-child(2) th {
  top: calc(var(--header-row-2-top) + var(--sticky-top));
  z-index: 5;
}

.report-table td {
  font-size: 14px;
}

.no-data-row td {
  color: #888;
}

.summary-row td {
  background: #f3f4f6;
  color: #1f3347;
  font-weight: 600;
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

.chart-wrap {
  position: relative;
  border: 1px solid rgba(71, 129, 231, 0.72);
  background: linear-gradient(180deg, rgba(8, 36, 88, 0.95) 0%, rgba(5, 25, 69, 0.97) 100%);
  box-shadow: inset 0 0 0 1px rgba(114, 175, 255, 0.22), 0 0 24px rgba(25, 87, 211, 0.28);
  border-radius: 10px;
  padding: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #f2f7ff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(128, 184, 255, 0.32);
  border-bottom: 1px solid rgba(74, 133, 234, 0.35);
  background: linear-gradient(90deg, rgba(18, 53, 116, 0.86) 0%, rgba(18, 53, 116, 0.2) 72%, rgba(18, 53, 116, 0) 100%);
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
  height: 320px;
  background:
    radial-gradient(circle at 50% 32%, rgba(55, 117, 255, 0.16) 0%, rgba(55, 117, 255, 0) 55%),
    linear-gradient(180deg, rgba(24, 62, 128, 0.18) 0%, rgba(7, 33, 87, 0) 100%);
}
</style>
