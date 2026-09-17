<template>
  <div class="ptd-wrapper">
    <div class="ptd-chart-section">
      <!-- <div class="ptd-header">
        <span class="ptd-title">流量预测对比</span>
      </div> -->
      <div class="ptd-chart-box" ref="lineChartRef"></div>
    </div>

    <div class="ptd-chart-section">
      <div class="ptd-header">
        <div class="ptd-title-box">
          <span class="ptd-title">流量柱状图</span>
        </div>

        <div class="ptd-toggle-right-box">
          <div class="ptd-toggle-group">
            <div v-if="false">
              <div
                v-for="item in ['实时', '日', '月']"
                :key="item"
                :class="[
                  'ptd-toggle-btn',
                  { 'ptd-is-active': activeTab === item },
                ]"
                @click="activeTab = item"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ptd-chart-box" ref="barChartRef"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import http from '@/utils/http.js';
import { REGION_IDS } from '@/utils/constants.js';

// 注册必要组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

// 图表实例引用
const lineChartRef = ref(null);
const barChartRef = ref(null);
let lineChart = null;
let barChart = null;

// 窗口大小变化监听
const handleResize = () => {
  lineChart?.resize();
  barChart?.resize();
};

defineOptions({
  name: 'PopTrafficDashboard',
});

const props = defineProps({
  chartData: { type: Object, default: () => ({}) },
});

const activeTab = ref('月');

// --- 折线图配置 ---
const lineOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(13, 27, 62, 0.9)',
    borderColor: '#54d1f3',
    textStyle: { color: '#fff' },
  },
  legend: {
    // '预测流量',
    data: ['历史流量'],
    right: 'center',
    top: -5,
    textStyle: { color: '#8fb1d9' },
    icon: 'circle',
  },
  grid: { left: '3%', right: '4%', bottom: '0', top: '20', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [
      '00:00',
      '01:00',
      '02:00',
      '03:00',
      '04:00',
      '05:00',
      '06:00',
      '07:00',
      '08:00',
      '09:00',
      '10:00',
      '11:00',
    ],
    axisLabel: { color: '#8fb1d9' },
    axisLine: { lineStyle: { color: '#2a466b' } },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#1a2b4a', type: 'dashed' } },
    axisLabel: { color: '#8fb1d9' },
  },
  series: [
    {
      name: '预测流量',
      type: 'line',
      smooth: true,
      showSymbol: true,
      symbolSize: 6,
      itemStyle: { color: '#54d1f3' },
      label: { show: true, color: '#fff', position: 'top' },
      data: [82, 142, 142, 142, 132, 142, 142, 134, 88, 118, 129, 247],
    },
    {
      name: '历史流量',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: '#f3a033' },
      label: { show: true, color: '#f3a033', position: 'top' },
      data: [143, 68, 82, 123, 160, 163],
    },
  ],
}));

// --- 柱状图配置 ---
const barOption = computed(() => ({
  backgroundColor: 'transparent',
  legend: {
    data: ['客车流量', '货车流量'],
    left: '19%',
    top: '-2',
    // right: '2%',
    itemWidth: 10, // 图标宽度 (默认 25)
    itemHeight: 10, // 图标高度 (默认 14)
    itemGap: 20, // 两个图例之间的间距
    textStyle: { color: '#8fb1d9' },
  },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: {
    top: 30, // 留给 legend
    bottom: 20, // 留给 x 轴
    left: 15,
    right: 15,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    axisLabel: { color: '#8fb1d9' },
    axisLine: { lineStyle: { color: '#2a466b' } },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#1a2b4a' } },
    axisLabel: { color: '#8fb1d9' },
  },
  series: [
    {
      name: '客车流量',
      type: 'bar',
      stack: 'total',
      barWidth: 26,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3a7bd5' },
          { offset: 1, color: '#00d2ff' },
        ]),
      },
      label: { show: true, position: 'inside', color: '#fff' },
      data: [],
    },
    {
      name: '货车流量',
      type: 'bar',
      stack: 'total',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#f3a033' },
          { offset: 1, color: '#a35d00' },
        ]),
      },
      label: { show: true, position: 'inside', color: '#fff' },
      data: [],
    },
  ],
}));

// 生命周期钩子
onMounted(() => {
  // 使用nextTick确保DOM完全渲染
  nextTick(() => {
    initCharts();
    // 初始化后获取数据
    // fetchGantryFlowData();
  });

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 初始化图表函数
const initCharts = () => {
  // 检查DOM元素是否存在且有尺寸
  if (lineChartRef.value && lineChartRef.value.clientWidth > 0) {
    lineChart = echarts.init(lineChartRef.value);
    lineChart.setOption(lineOption.value);
  } else {
    console.warn('Line chart DOM element not ready or has zero size');
  }

  if (barChartRef.value && barChartRef.value.clientWidth > 0) {
    barChart = echarts.init(barChartRef.value);
    barChart.setOption(barOption.value);
  } else {
    console.warn('Bar chart DOM element not ready or has zero size');
  }
};

// 确保图表容器有明确的尺寸
const ensureChartSize = () => {
  if (lineChartRef.value && lineChartRef.value.clientWidth === 0) {
    // 如果尺寸为0，强制设置默认尺寸
    lineChartRef.value.style.width = '100%';
    lineChartRef.value.style.height = '100%';
  }

  if (barChartRef.value && barChartRef.value.clientWidth === 0) {
    barChartRef.value.style.width = '100%';
    barChartRef.value.style.height = '100%';
  }
};

onUnmounted(() => {
  // 销毁图表实例
  lineChart?.dispose();
  barChart?.dispose();

  // 移除事件监听
  window.removeEventListener('resize', handleResize);
});

// 监听图表配置变化
watch(
  [lineOption, barOption],
  ([newLineOption, newBarOption]) => {
    lineChart?.setOption(newLineOption);
    barChart?.setOption(newBarOption);
  },
  { deep: true }
);

// 监听activeTab变化，这里可以根据需要更新柱状图数据
watch(activeTab, () => {
  // 可以根据activeTab的值切换不同的数据源
  barChart?.setOption(barOption.value);
});

// 获取门架流量数据
const fetchGantryFlowData = async (data) => {
  try {
    // 从props中获取门架ID或其他必要参数
    // console.log(data);
    const gantryId = data.gantry_hex || '';

    const response = await http.get(
      FUZHOU_API_URLS.gantry.getGantryFlowBar,
      { gantryId, origid: REGION_IDS.ZHANGZHOU } // 根据实际API需求传递参数
    );
    // console.log(gantryId);

    if (response && Array.isArray(response)) {
      // 提取数据
      const carFlowData = response.map((item) => parseInt(item.carFlow) || 0);
      const trunkFlowData = response.map(
        (item) => parseInt(item.trunkFlow) || 0
      );

      // 提取并格式化时间数据
      const timeData = response.map((item) => {
        if (item.timePeriod) {
          // 从 "2026-02-05 22:00:00.0" 格式中提取时分
          const timeStr = item.timePeriod.split(' ')[1] || '';
          // 去掉毫秒部分，只保留时分秒
          const timeWithoutMs = timeStr.split('.')[0];
          // 去掉秒的部分，只保留时分
          return timeWithoutMs.split(':').slice(0, 2).join(':');
        }
        return '';
      });

      // 更新柱状图数据
      const newBarOption = {
        ...barOption.value,
        xAxis: {
          ...barOption.value.xAxis,
          data: timeData,
        },
        series: [
          {
            ...barOption.value.series[0],
            data: carFlowData,
          },
          {
            ...barOption.value.series[1],
            data: trunkFlowData,
          },
        ],
      };

      // 如果图表已初始化，则更新图表
      if (barChart) {
        barChart.setOption(newBarOption);
      }

      return response.data;
    }
  } catch (error) {
    console.error('获取门架流量数据失败:', error);
  }
};

// 监听chartData变化
watch(
  () => props.chartData,
  (newData) => {
    console.log('PopTrafficDashboardChart 数据变化:', newData);
    // 当数据变化时，重新获取流量数据
    if (newData) {
      fetchGantryFlowData(newData);
    }
  },
  { deep: true, immediate: true }
);
</script>

<style lang="less" scoped>
/* 使用 ptd- 前缀锁定命名空间 */
.ptd-wrapper {
  width: 100%;
  height: 100%;
  // min-height: 600px;
  /* background-color: #06112b; */
  /* padding: 20px; */
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.ptd-chart-section:first-child {
  flex: none; // 不平分空间
  height: 130px; // 强制设定高度
  padding: 10px; // 缩小内边距，给图表更多空间
}
.ptd-chart-section:last-child {
  flex: 1; // 占据剩余所有空间
  height: auto; // 覆盖默认的 130px
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  // padding: 16px;
  padding: 0px;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
}

.ptd-chart-section {
  // flex: 1;
  // height: 130px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.ptd-header {
  position: absolute;
  width: 100%;
  // display: flex;
  // justify-content: space-between;
  // align-items: center;
  margin-bottom: 12px;
  .ptd-title-box {
    float: left;
  }
  .ptd-toggle-right-box {
    float: right;
    position: relative;
    right: 110px;
    top: -5px;
  }
}

.ptd-title {
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  // border-left: 4px solid #3a7bd5;
  padding-left: 10px;
}

.ptd-chart-box {
  flex: 1;
  width: 100%;
  min-height: 0;
}

/* 切换按钮组 */
.ptd-toggle-group {
  display: flex;
  background: #14223d;
  border: 1px solid #2a466b;
  border-radius: 4px;
  overflow: hidden;
}

.ptd-toggle-btn {
  padding: 0.5px 16px;
  color: #8fb1d9;
  cursor: pointer;
  font-size: 13px;
  transition:
    background 0.2s,
    color 0.2s;
}

.ptd-toggle-btn:hover {
  color: #fff;
}

.ptd-toggle-btn.ptd-is-active {
  background: #3a7bd5;
  color: #fff;
}
</style>
