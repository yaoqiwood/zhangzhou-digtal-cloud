<template>
  <div class="gantry-flow-page">
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
        <button
          class="btn query-btn"
          :disabled="isLoading"
          @click="handleQuery"
        >
          查询
        </button>
        <button
          class="btn download-btn"
          :disabled="isExporting"
          @click="handleDownload"
        >
          {{ isExporting ? '下载中' : '下载' }}
        </button>
      </div>
    </div>

    <div class="report-scroll">
      <div v-show="showChart" class="chart-wrap">
        <div class="chart-title">收费站流量情况趋势图</div>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <div v-show="showTable" class="table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="3">序号</th>
              <th rowspan="3">路段</th>
              <th rowspan="3">方向</th>
              <th rowspan="3">门架名称</th>
              <th rowspan="3">前两者间距(公里)</th>
              <th colspan="4" rowspan="2">去年({{ previousYear }}年)</th>
              <th colspan="11">{{ currentYear }}年</th>
            </tr>
            <tr>
              <th colspan="4">当月</th>
              <th colspan="3">上月({{ previousMonth }}月)</th>
              <th colspan="2">交通量</th>
              <th colspan="2">里程加权平均车流量</th>
            </tr>
            <tr>
              <th>去年月交通量</th>
              <th>去年日交通量</th>
              <th>去年里程加权平均车流量(日均)</th>
              <th>去年里程加权平均车流量(月总量)</th>
              <th>当月月交通量</th>
              <th>当月日交通量</th>
              <th>当月里程加权平均车流量(日均)</th>
              <th>当月里程加权平均车流量(月总量)</th>
              <th>上月日均交通量</th>
              <th>上月里程加权平均车流量(日均)</th>
              <th>上月里程加权平均车流量(月总量)</th>
              <th>交通量环比(日均)</th>
              <th>交通量同比(日均)</th>
              <th>里程加权平均车流量环比</th>
              <th>里程加权平均车流量同比</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in pagedRows"
              :key="`${row.nodename || row.roadfield || 'row'}-${index}`"
            >
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ formatCell(row.roadfield) }}</td>
              <td>{{ formatCell(row.road_way) }}</td>
              <td>{{ formatCell(row.nodename) }}</td>
              <td>{{ formatCell(row.distance) }}</td>
              <td>{{ formatCell(row.last_year_cnt) }}</td>
              <td>{{ formatCell(row.last_year_cnt_avg) }}</td>
              <td>{{ formatCell(row.cnt_avg_dis) }}</td>
              <td>{{ formatCell(row.last_year_cnt_dis) }}</td>
              <td>{{ formatCell(row.this_month_cnt) }}</td>
              <td>{{ formatCell(row.this_month_cnt_avg) }}</td>
              <td>{{ formatCell(row.this_month_cnt_avg_dis) }}</td>
              <td>{{ formatCell(row.this_month_cnt_dis) }}</td>
              <td>{{ formatCell(row.last_month_cnt_avg) }}</td>
              <td>{{ formatCell(row.last_month_cnt_avg_dis) }}</td>
              <td>{{ formatCell(row.last_month_cnt_dis) }}</td>
              <td>{{ formatCell(row.month_over_month_cnt_avg) }}</td>
              <td>{{ formatCell(row.year_over_year_cnt_avg) }}</td>
              <td>{{ formatCell(row.month_over_month_cnt_dis) }}</td>
              <td>{{ formatCell(row.year_over_year_cnt_dis) }}</td>
            </tr>
            <tr v-if="!pagedRows.length">
              <td :colspan="tableColspan">暂无数据</td>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import JSZip from 'jszip';
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
let trendChart = null;
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const tableRows = ref([]);
const isLoading = ref(false);
const isExporting = ref(false);
const showChart = ref(true);
const showTable = ref(false);
const tableColspan = 20;

const currentYear = computed(() => {
  const [year] = String(selectedMonth.value || '').split('-');
  return Number(year) || new Date().getFullYear();
});

const previousYear = computed(() => currentYear.value - 1);

const previousMonth = computed(() => {
  const [yearPart, monthPart] = String(selectedMonth.value || '').split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!year || !month) {
    return new Date().getMonth() || 12;
  }
  return month === 1 ? 12 : month - 1;
});

const buildNowTime = (monthValue) => {
  const [year, month] = String(monthValue || '').split('-');
  if (!year || !month) return '';
  return `${year}-${month}-01 00:00:00`;
};

const formatTimestamp = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const triggerDownload = (data, fileName) => {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.download = fileName;
  link.style.display = 'none';
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(objectUrl);
  document.body.removeChild(link);
};

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const captureTrendChartBlob = async () => {
  if (!trendChart) return null;
  const shouldRestoreChartVisibility = !showChart.value;
  try {
    if (shouldRestoreChartVisibility) {
      showChart.value = true;
    }
    await nextTick();
    resizeChart();
    updateTrendChart(tableRows.value);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const dataUrl = trendChart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#06183f',
    });
    return dataUrlToBlob(dataUrl);
  } finally {
    if (shouldRestoreChartVisibility) {
      showChart.value = false;
    }
  }
};

const normalizeReportRows = (response) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && Array.isArray(response.rows)) return response.rows;
  if (response && response.data && Array.isArray(response.data.rows)) {
    return response.data.rows;
  }
  return [];
};

const normalizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getTrendChartData = (rows = []) => {
  const labels = rows.map((item) => item.nodename || '--');
  const thisMonthSeries = rows.map((item) =>
    normalizeNumber(item.this_month_cnt)
  );
  const lastYearSeries = rows.map((item) =>
    normalizeNumber(item.last_year_cnt)
  );
  const lastMonthSeries = rows.map((item) =>
    normalizeNumber(item.last_month_cnt_dis)
  );
  return {
    labels,
    thisMonthSeries,
    lastYearSeries,
    lastMonthSeries,
  };
};

const updateTrendChart = (rows = []) => {
  if (!trendChart) return;
  const { labels, thisMonthSeries, lastYearSeries, lastMonthSeries } =
    getTrendChartData(rows);
  const stackedBarSeries = thisMonthSeries.map(
    (value, index) => value + (lastYearSeries[index] || 0)
  );
  const maxValue = Math.max(
    0,
    ...stackedBarSeries,
    ...lastMonthSeries
  );
  const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(8, 24, 56, 0.94)',
      borderColor: 'rgba(93, 156, 255, 0.65)',
      borderWidth: 1,
      textStyle: { color: '#e8f2ff' },
      formatter: (params) => {
        if (!Array.isArray(params) || !params.length) return '';
        const axisName = params[0]?.axisValueLabel ?? params[0]?.name ?? '';
        let barTotal = 0;
        const lines = params.map((item) => {
          const value = Number(item.value) || 0;
          if (item.seriesType === 'bar') {
            barTotal += value;
          }
          return `${item.marker}${item.seriesName}: ${value}`;
        });
        return [`${axisName}`, ...lines, `堆叠合计: ${barTotal}`].join('<br/>');
      },
    },
    xAxis: {
      data: labels,
    },
    yAxis: {
      max: yMax,
    },
    series: [
      {
        name: '当月月交通量',
        data: thisMonthSeries,
      },
      {
        name: '去年月交通量',
        data: lastYearSeries,
      },
      {
        name: '上月里程加权平均车流量(月总量)',
        data: lastMonthSeries,
      },
    ],
  });
};

const fetchMonthGantryFlow = async () => {
  const nowTime = buildNowTime(selectedMonth.value);
  if (!nowTime) {
    tableRows.value = [];
    updateTrendChart([]);
    return;
  }
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getMonthGantryFlow,
      {
        nowTime,
      }
    );
    tableRows.value = normalizeReportRows(response);
    currentPage.value = 1;
    updateTrendChart(tableRows.value);
  } catch (error) {
    console.error('获取门架月报数据失败:', error);
    tableRows.value = [];
    updateTrendChart([]);
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchMonthGantryFlow();
};

const handleDownload = async () => {
  const nowTime = buildNowTime(selectedMonth.value);
  if (!nowTime || isExporting.value) return;
  isExporting.value = true;
  try {
    const timestamp = formatTimestamp();
    const [excelResponse, chartBlob] = await Promise.all([
      axios.get(API_URLS.putian_highway.exportGantryFlowExcel, {
        params: { nowTime },
        responseType: 'blob',
      }),
      captureTrendChartBlob(),
    ]);
    const zip = new JSZip();
    zip.file(`${timestamp}.xls`, excelResponse.data);
    if (chartBlob) {
      zip.file(`${timestamp}-图表截图.png`, chartBlob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `${timestamp}-门架流量报表.zip`);
  } catch (error) {
    console.error('导出门架月报数据失败:', error);
  } finally {
    isExporting.value = false;
  }
};

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

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') {
    return '--';
  }
  return value;
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    backgroundColor: 'transparent',
    grid: { top: 48, left: 46, right: 24, bottom: 44 },
    legend: {
      top: 10,
      right: 20,
      itemWidth: 18,
      itemHeight: 8,
      textStyle: { color: '#d2e3ff', fontSize: 12, fontWeight: 600 },
      data: ['当月月交通量', '去年月交通量', '上月里程加权平均车流量(月总量)'],
    },
    tooltip: {
      backgroundColor: 'rgba(8, 24, 56, 0.94)',
      borderColor: 'rgba(93, 156, 255, 0.65)',
      borderWidth: 1,
      textStyle: { color: '#e8f2ff' },
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        color: '#b9d2ff',
        fontSize: 11,
        interval: 0,
        rotate: 45,
        margin: 12,
      },
      axisLine: { lineStyle: { color: 'rgba(107, 158, 255, 0.55)' } },
    },
    yAxis: {
      type: 'value',
      max: 100000,
      axisLabel: { color: '#c3d8ff' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(83, 126, 206, 0.42)', type: 'dashed' } },
      name: '流量',
      nameLocation: 'end',
      nameRotate: 0,
      nameGap: 42,
      nameTextStyle: {
        color: '#f56e5f',
        fontSize: 12,
        fontWeight: 600,
        align: 'left',
        verticalAlign: 'top',
        padding: [10, 0, 0, -20],
      },
    },
    series: [
      {
        name: '当月月交通量',
        type: 'bar',
        stack: 'traffic-flow',
        data: [],
        barWidth: 10,
        itemStyle: {
          color: '#f2d261',
          borderColor: '#f8e293',
          borderWidth: 1,
        },
      },
      {
        name: '去年月交通量',
        type: 'bar',
        stack: 'traffic-flow',
        data: [],
        barWidth: 10,
        itemStyle: {
          color: '#6f8dff',
          borderColor: '#96adff',
          borderWidth: 1,
        },
      },
      {
        name: '上月里程加权平均车流量(月总量)',
        type: 'line',
        data: [],
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#f09152' },
        itemStyle: { color: '#f09152' },
      },
    ],
    animation: false,
  });
};

const resizeChart = () => {
  trendChart?.resize();
};

watch([showChart, showTable], async ([chartVisible]) => {
  if (!chartVisible) return;
  await nextTick();
  requestAnimationFrame(resizeChart);
});

onMounted(async () => {
  await nextTick();
  initTrendChart();
  await fetchMonthGantryFlow();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  trendChart?.dispose();
  trendChart = null;
});
</script>

<style lang="less" scoped>
.gantry-flow-page {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  contain: layout style paint;
  background:
    radial-gradient(circle at 50% -20%, rgba(82, 140, 255, 0.32) 0%, rgba(82, 140, 255, 0) 32%),
    linear-gradient(180deg, #041333 0%, #06183f 48%, #051634 100%);
}

.gantry-flow-page::before {
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

.toolbar,
.report-scroll {
  position: relative;
}

.toolbar {
  z-index: 3;
}

.report-scroll {
  z-index: 1;
}

.toolbar {
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
  content: '';
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

.toolbar-actions :deep(.month-picker-wrap) {
  z-index: 40;
}

.toolbar-actions :deep(.month-picker-trigger) {
  min-width: 172px;
  height: 42px;
  border: 1px solid rgba(106, 166, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(14, 40, 90, 0.95) 0%, rgba(10, 29, 68, 0.98) 100%);
  color: #f1f6ff;
  font-size: 15px;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(163, 208, 255, 0.16), 0 0 8px rgba(46, 112, 230, 0.22);
}

.toolbar-actions :deep(.month-picker-trigger:hover),
.toolbar-actions :deep(.month-picker-trigger:focus),
.toolbar-actions :deep(.month-picker-trigger:focus-visible) {
  border-color: rgba(133, 191, 255, 0.75);
  box-shadow: inset 0 0 0 1px rgba(188, 222, 255, 0.24), 0 0 10px rgba(64, 132, 245, 0.3);
}

.toolbar-actions :deep(.picker-arrow) {
  font-size: 26px;
  color: #d9e9ff;
  transform: translateY(-1px);
}

.toolbar-actions :deep(.picker-arrow.open) {
  color: #9fc9ff;
}

.toolbar-actions :deep(.month-picker-card) {
  top: calc(100% + 8px);
  right: 0;
  z-index: 3000;
  border: 1px solid rgba(100, 162, 255, 0.7);
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
}

.toolbar-actions :deep(.month-picker-head),
.toolbar-actions :deep(.picker-year-text) {
  color: #ffffff;
}

.toolbar-actions :deep(.year-nav-btn) {
  border: 1px solid rgba(112, 171, 255, 0.56);
  background: linear-gradient(180deg, rgba(25, 58, 122, 0.94) 0%, rgba(17, 45, 97, 0.96) 100%);
  color: #deedff;
}

.toolbar-actions :deep(.year-nav-btn:hover),
.toolbar-actions :deep(.year-nav-btn:focus),
.toolbar-actions :deep(.year-nav-btn:focus-visible) {
  border-color: rgba(147, 201, 255, 0.74);
  box-shadow: 0 0 8px rgba(67, 138, 246, 0.32);
}

.toolbar-actions :deep(.month-item) {
  border: 1px solid rgba(104, 162, 246, 0.44);
  background: linear-gradient(180deg, rgba(20, 49, 105, 0.9) 0%, rgba(13, 36, 79, 0.95) 100%);
  color: #d2e6ff;
}

.toolbar-actions :deep(.month-item.active) {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
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

.report-scroll {
  position: relative;
  flex: 1;
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
  background-size: 56px 18px, 56px 18px;
  opacity: 0.55;
  z-index: 0;
}

.table-wrap {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
}

.report-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  min-width: 1200px;
}

.report-table th,
.report-table td {
  border-right: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  font-size: 14px;
  padding: 8px 6px;
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
  line-height: 1.35;
}

.table-pagination {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 14px;
  border-top: 1px solid #d8d8d8;
  user-select: none;
  -webkit-user-select: none;
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
  user-select: none;
  -webkit-user-select: none;
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
  z-index: 1;
  border: 1px solid rgba(71, 129, 231, 0.72);
  background: linear-gradient(180deg, rgba(8, 36, 88, 0.95) 0%, rgba(5, 25, 69, 0.97) 100%);
  box-shadow: 0 0 8px rgba(25, 87, 211, 0.18);
  border-radius: 10px;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  contain: layout style paint;
}

.chart-wrap::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(130, 181, 255, 0) 0%, rgba(130, 181, 255, 0.95) 50%, rgba(130, 181, 255, 0) 100%);
  box-shadow: 0 0 6px rgba(130, 181, 255, 0.3);
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
  text-shadow: 0 0 4px rgba(128, 184, 255, 0.2);
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
  box-shadow: 0 0 4px rgba(132, 187, 255, 0.3);
}

.trend-chart {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 260px;
  background:
    radial-gradient(circle at 50% 32%, rgba(55, 117, 255, 0.16) 0%, rgba(55, 117, 255, 0) 55%),
    linear-gradient(180deg, rgba(24, 62, 128, 0.18) 0%, rgba(7, 33, 87, 0) 100%);
}
</style>
