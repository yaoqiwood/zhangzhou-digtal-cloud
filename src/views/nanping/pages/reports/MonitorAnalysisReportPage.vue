<template>
  <div
    class="monitor-analysis-page"
    :class="{
      'monitor-analysis-page--chart-visible': showChart,
      'monitor-analysis-page--table-visible': showTable,
    }"
  >
    <section v-show="showChart" class="panel chart-panel">
      <div class="panel-header">
        <div class="panel-title">监控备注情况饼图</div>
        <div class="panel-actions">
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
          <button class="btn download-btn">下载</button>
        </div>
      </div>
      <div class="chart-wrap">
        <div ref="pieChartRef" class="pie-chart"></div>
      </div>
    </section>

    <div v-show="showChart && showTable" class="panel-divider"></div>

    <section v-show="showTable" class="panel table-panel">
      <div class="panel-header table-header">
        <div class="panel-title">数据列表</div>
        <div class="panel-actions">
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
        </div>
      </div>
      <div class="table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>收费站</th>
              <th>备注情况</th>
              <th>占比</th>
              <th>同比</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in pagedRows"
              :key="`${row.station}-${index}`"
            >
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.station }}</td>
              <td>{{ row.remark }}</td>
              <td>{{ row.percent }}</td>
              <td>{{ row.yoy }}</td>
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
    </section>
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

const pieChartRef = ref(null);
let pieChart = null;
const showChart = ref(true);
const showTable = ref(false);

const pieData = [
  { name: '莆田西所', value: 1111 },
  { name: '秀屿所', value: 487 },
  { name: '湄洲岛所', value: 269 },
  { name: '忠门所', value: 257 },
  { name: '华亭所', value: 249 },
  { name: '盖尾所', value: 230 },
  { name: '城区所', value: 393 },
  { name: '大济所', value: 210 },
  { name: '西乡所', value: 85 },
  { name: '菜溪所', value: 323 },
  { name: '榜头所', value: 164 },
  { name: '龙华所', value: 501 },
  { name: '埭头所', value: 354 },
  { name: '北高所', value: 395 },
  { name: '江口所', value: 750 },
  { name: '枫亭所', value: 610 },
  { name: '白沙所', value: 81 },
  { name: '游洋所', value: 79 },
];

const tableRows = [
  { station: '莆田西所', remark: '设备巡检正常', percent: '10%', yoy: '10%' },
  { station: '秀屿所', remark: '摄像头维护中', percent: '10%', yoy: '10%' },
  { station: '湄洲岛所', remark: '网络波动', percent: '10%', yoy: '10%' },
  { station: '忠门所', remark: '巡检完成', percent: '10%', yoy: '10%' },
  { station: '华亭所', remark: '巡检完成', percent: '10%', yoy: '10%' },
  { station: '盖尾所', remark: '值班交接', percent: '10%', yoy: '10%' },
  { station: '城区所', remark: '电源检查', percent: '10%', yoy: '10%' },
  { station: '大济所', remark: '巡检完成', percent: '10%', yoy: '10%' },
  { station: '西乡所', remark: '设备巡检正常', percent: '10%', yoy: '10%' },
  { station: '菜溪所', remark: '巡检完成', percent: '10%', yoy: '10%' },
  { station: '榜头所', remark: '网络恢复', percent: '10%', yoy: '10%' },
  { station: '龙华所', remark: '巡检完成', percent: '10%', yoy: '10%' },
];
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(tableRows.length / pageSize.value))
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableRows.slice(start, start + pageSize.value);
});

watch(pageSize, () => {
  currentPage.value = 1;
});

const initPieChart = () => {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  pieChart.setOption({
    backgroundColor: 'transparent',
    color: [
      '#6f8dff',
      '#4ec8ff',
      '#f2d261',
      '#f09152',
      '#67d7b3',
      '#8aa9ff',
      '#64a6ff',
      '#86d2ff',
      '#9c89ff',
      '#ffd37d',
      '#60e0cf',
      '#83b7ff',
      '#4c90ff',
      '#6ecaff',
      '#f7c970',
      '#5ed4ab',
      '#b198ff',
      '#79c6ff',
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 24, 56, 0.94)',
      borderColor: 'rgba(93, 156, 255, 0.65)',
      borderWidth: 1,
      textStyle: { color: '#e8f2ff' },
      formatter: '{b}<br/>数量：{c}<br/>占比：{d}%',
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '42%'],
        center: ['50%', '54%'],
        startAngle: 90,
        minAngle: 2,
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'outside',
          color: '#d7e8ff',
          fontSize: 12,
          fontWeight: 600,
          formatter: (params) => {
            const percent = total
              ? ((params.value / total) * 100).toFixed(2)
              : '0.00';
            return `${params.name}, ${params.value}\n${percent}%`;
          },
        },
        labelLine: {
          show: true,
          length: 14,
          length2: 16,
          lineStyle: { color: 'rgba(137, 180, 255, 0.72)', width: 1.5 },
        },
        itemStyle: {
          borderColor: 'rgba(184, 214, 255, 0.35)',
          borderWidth: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(41, 112, 255, 0.25)',
        },
        data: pieData,
        animation: false,
      },
    ],
  });
};

const resizeChart = () => pieChart?.resize();

onMounted(() => {
  initPieChart();
  window.addEventListener('resize', resizeChart);
});

watch([showChart, showTable], async ([chartVisible, tableVisible]) => {
  if (!chartVisible && !tableVisible) {
    showTable.value = true;
    return;
  }
  if (!chartVisible) return;
  await nextTick();
  requestAnimationFrame(resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  pieChart?.dispose();
  pieChart = null;
});
</script>

<style lang="less" scoped>
.monitor-analysis-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel {
  background: #f3f4f6;
  border: 1px solid #d7d9dc;
  min-height: 0;
}

.chart-panel {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(71, 129, 231, 0.72);
  background: linear-gradient(
    180deg,
    rgba(8, 36, 88, 0.95) 0%,
    rgba(5, 25, 69, 0.97) 100%
  );
  box-shadow:
    inset 0 0 0 1px rgba(114, 175, 255, 0.22),
    0 0 24px rgba(25, 87, 211, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.monitor-analysis-page--chart-visible.monitor-analysis-page--table-visible
  .chart-panel,
.monitor-analysis-page--chart-visible.monitor-analysis-page--table-visible
  .table-panel {
  flex: 1 1 0;
}

.monitor-analysis-page--chart-visible:not(.monitor-analysis-page--table-visible)
  .chart-panel {
  flex: 1 1 0;
}

.panel-header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d7d9dc;
  padding: 0 14px;
  background: #f1f2f4;
}

.chart-panel .panel-header {
  border-bottom: 1px solid rgba(74, 133, 234, 0.35);
  background: linear-gradient(
    90deg,
    rgba(18, 53, 116, 0.86) 0%,
    rgba(18, 53, 116, 0.2) 72%,
    rgba(18, 53, 116, 0) 100%
  );
}

.chart-panel .panel-title {
  color: #f2f7ff;
  text-shadow: 0 0 10px rgba(128, 184, 255, 0.32);
}

.chart-panel .chart-toggle {
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

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title {
  color: #323a44;
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
}

.btn {
  width: 132px;
  height: 40px;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0 14px;
  box-sizing: border-box;
}

.download-btn {
  border: 1px solid rgba(133, 183, 255, 0.65);
  background: linear-gradient(180deg, #2d64c5 0%, #2456ae 100%);
  box-shadow: 0 0 6px rgba(65, 132, 255, 0.15);
}

.chart-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  color: #4a4a4a;
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

.chart-wrap {
  flex: 1 1 0;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px 10px;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 32%,
      rgba(55, 117, 255, 0.16) 0%,
      rgba(55, 117, 255, 0) 55%
    ),
    linear-gradient(180deg, rgba(24, 62, 128, 0.18) 0%, rgba(7, 33, 87, 0) 100%);
}

.pie-chart {
  width: min(100%, 980px);
  height: 100%;
  min-height: 250px;
  background: transparent;
  border: none;
}

.monitor-analysis-page--table-visible .pie-chart {
  min-height: 0;
}

.panel-divider {
  height: 10px;
  background: #032a5a;
  flex-shrink: 0;
}

.table-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-header {
  justify-content: flex-start;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.table-pagination {
  height: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 14px;
  border-top: 1px solid #d0d3d8;
  background: #f3f4f6;
}

.page-btn {
  min-width: 68px;
  height: 30px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.page-btn:disabled {
  color: #999;
  background: #f2f2f2;
  border-color: #dddddd;
  cursor: not-allowed;
}

.page-info {
  height: 30px;
  color: #666;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  white-space: nowrap;
}

.page-size-control {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.page-size-select {
  width: 72px;
  height: 30px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  font-size: 14px;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
}

.report-table {
  width: 100%;
  min-width: 0;
  border-collapse: collapse;
  table-layout: fixed;
}

.report-table th,
.report-table td {
  border: 1px solid #d0d3d8;
  text-align: center;
  color: #454c55;
  padding: 9px 8px;
}

.report-table th {
  background: #eceef1;
  font-size: 14px;
  font-weight: 600;
}

.report-table td {
  background: #f4f5f7;
  font-size: 14px;
}
</style>
