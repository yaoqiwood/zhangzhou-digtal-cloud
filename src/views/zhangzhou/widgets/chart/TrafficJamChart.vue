<template>
  <div class="tc-wrapper">
    <section class="tc-section">
      <div class="tc-header">
        <h3 class="tc-title">区段历史流量</h3>
      </div>

      <div v-show="isLoading" class="tc-loading-mask">
        <div class="tc-loading-content">
          <div class="tc-loading-spinner"></div>
          <span class="tc-loading-text">加载中...</span>
        </div>
      </div>

      <div ref="flowChartRef" class="tc-chart-canvas"></div>
    </section>

    <section class="tc-section" style="margin-top: 10px">
      <div class="tc-header">
        <h3 class="tc-title">区段速度</h3>
      </div>

      <div v-show="isLoading" class="tc-loading-mask">
        <div class="tc-loading-content">
          <div class="tc-loading-spinner"></div>
          <span class="tc-loading-text">加载中...</span>
        </div>
      </div>

      <div ref="speedChartRef" class="tc-chart-canvas"></div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import http from '@/utils/http.js';
import { REGION_IDS } from '@/utils/constants.js';
import { getNow } from '@/utils/tools.js';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const flowChartRef = ref(null);
const speedChartRef = ref(null);
let chartInstances = [];
const isLoading = ref(false); // 统一的加载状态

// 图表数据
const xAxisData = ref([]);
const predictData = ref([]);
const historyFlowData = ref([]);
const historySpeedData = ref([]);

// 获取事件数据
const fetchEventData = async () => {
  if (!props.data?.flagId) {
    console.warn('No flagId provided');
    return;
  }

  // 设置加载状态
  isLoading.value = true;

  // 在开始请求前清空之前的数据
  xAxisData.value = [];
  historyFlowData.value = [];
  historySpeedData.value = [];

  try {
    const response = await http.get(FUZHOU_API_URLS.traffic.getEventData, {
      flags: props.data.flagId,
      nowTime: getNow(),
      origid: REGION_IDS.FUZHOU,
    });
    console.log({
      flags: props.data.flagId,
      nowTime: getNow(),
    });

    if (response && Array.isArray(response)) {
      // 遍历数组处理每个元素的数据
      response.forEach((item) => {
        // 处理历史流量数据
        if (item.history_flow && item.time) {
          xAxisData.value.push(item.time);
          historyFlowData.value.push(item.history_flow);
        }

        // 处理历史速度数据
        if (item.history_speed && item.history_speed !== 'Infinity') {
          // 四舍五入到第二位小数点
          const roundedSpeed = Math.round(item.history_speed * 100) / 100;
          historySpeedData.value.push(roundedSpeed);
        }
      });

      // 更新图表
      updateCharts();
    }
  } catch (error) {
    console.error('Failed to fetch event data:', error);
  } finally {
    // 隐藏加载状态
    isLoading.value = false;
  }
};

// 更新图表
const updateCharts = () => {
  if (chartInstances.length >= 2) {
    // 检查图表实例是否存在且未被销毁
    if (chartInstances[0] && !chartInstances[0].isDisposed()) {
      // 更新流量图表
      chartInstances[0].setOption(
        createOption(predictData.value, historyFlowData.value)
      );
    }

    if (chartInstances[1] && !chartInstances[1].isDisposed()) {
      chartInstances[1].setOption(
        createSpeedOption([], historySpeedData.value)
      );
    }
  }
};

const createOption = (pData, hData) => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(6, 22, 48, 0.9)',
    borderColor: '#00d1ff',
    textStyle: { color: '#fff' },
  },
  legend: {
    //'预测流量',
    data: ['历史流量'],
    // left: '19%',
    top: '-5',
    right: '2%',
    itemWidth: 10, // 图标宽度 (默认 25)
    itemHeight: 10, // 图标高度 (默认 14)
    itemGap: 20, // 两个图例之间的间距
    textStyle: { color: '#8fb1d9' },
  },
  grid: {
    left: '2%',
    right: '4%',
    bottom: '5%',
    top: '16%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: xAxisData.value,
    axisLine: { lineStyle: { color: '#334b7a' } },
    axisTick: { show: false },
    axisLabel: { color: '#8fb1d1', fontSize: 11, margin: 15 },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: true,
      lineStyle: { color: '#4e6a9e', width: 1 },
    },
    axisTick: {
      show: true,
      lineStyle: { color: '#4e6a9e' },
    },
    splitLine: {
      show: true,
      lineStyle: { color: '#2e4675', type: 'solid', width: 1 },
    },
    axisLabel: {
      color: '#8fb1d1',
      interval: 'auto',
      formatter: function (value) {
        return value;
      },
    },
    splitNumber: 5,
  },
  series: [
    {
      name: '预测流量',
      type: 'line',
      data: pData,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#00d1ff' },
      lineStyle: { width: 2 },
      label: { show: true, position: 'top', color: '#00d1ff', fontSize: 11 },
    },
    {
      name: '历史流量',
      type: 'line',
      data: hData,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#ff9c00' },
      lineStyle: { width: 2 },
      label: { show: false, position: 'top', color: '#ff9c00', fontSize: 11 },
    },
  ],
});

const createSpeedOption = (pData, hData) => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(6, 22, 48, 0.9)',
    borderColor: '#00d1ff',
    textStyle: { color: '#fff' },
  },
  legend: {
    //'预测流量',
    data: ['历史速度'],
    // left: '19%',
    top: '-5',
    right: '2%',
    itemWidth: 10, // 图标宽度 (默认 25)
    itemHeight: 10, // 图标高度 (默认 14)
    itemGap: 20, // 两个图例之间的间距
    textStyle: { color: '#8fb1d9' },
  },
  grid: {
    left: '2%',
    right: '4%',
    bottom: '5%',
    top: '16%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: xAxisData.value,
    axisLine: { lineStyle: { color: '#334b7a' } },
    axisTick: { show: false },
    axisLabel: { color: '#8fb1d1', fontSize: 11, margin: 15 },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: true,
      lineStyle: { color: '#4e6a9e', width: 1 },
    },
    axisTick: {
      show: true,
      lineStyle: { color: '#4e6a9e' },
    },
    splitLine: {
      show: true,
      lineStyle: { color: '#2e4675', type: 'solid', width: 1 },
    },
    axisLabel: {
      color: '#8fb1d1',
      interval: 'auto',
      formatter: function (value) {
        return value;
      },
    },
    splitNumber: 5,
  },
  series: [
    {
      name: '预测速度',
      type: 'line',
      data: pData,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#00d1ff' },
      lineStyle: { width: 2 },
      label: { show: true, position: 'top', color: '#00d1ff', fontSize: 11 },
    },
    {
      name: '历史速度',
      type: 'line',
      data: hData,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#ff9c00' },
      lineStyle: { width: 2 },
      label: { show: false, position: 'top', color: '#ff9c00', fontSize: 11 },
    },
  ],
});

onMounted(async () => {
  // 设置加载状态为true
  isLoading.value = true;

  // 确保DOM更新后再初始化图表
  await nextTick();

  // 检查DOM元素是否存在
  if (!flowChartRef.value || !speedChartRef.value) {
    console.warn('Chart DOM elements not found');
    isLoading.value = false;
    return;
  }

  try {
    const fChart = echarts.init(flowChartRef.value);
    const sChart = echarts.init(speedChartRef.value);

    // 初始化空图表
    fChart.setOption(createOption([], []));
    sChart.setOption(createSpeedOption([], []));

    chartInstances.push(fChart, sChart);
    window.addEventListener('resize', handleResize);

    // 初始获取数据
    await fetchEventData();
  } catch (error) {
    console.error('Failed to initialize charts:', error);
    isLoading.value = false;
  }
});

// 监听 data 变化
watch(
  () => props.data,
  (newData) => {
    if (newData?.flagId) {
      fetchEventData();
    }
  },
  { deep: true }
);

const handleResize = () =>
  chartInstances.forEach((instance) => instance.resize());

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  // 销毁图表实例前先检查它们是否存在且未被销毁
  chartInstances.forEach((instance) => {
    if (instance && !instance.isDisposed()) {
      instance.dispose();
    }
  });
  // 清空数组
  chartInstances = [];
});
</script>

<style lang="less" scoped>
// 使用变量统一管理，方便后续修改
@primary-bg: #061630;
@blue-theme: #00d1ff;
@orange-theme: #ff9c00;
@text-dim: #8fb1d1;

.tc-wrapper {
  // background-color: @primary-bg;
  // padding: 24px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  height: 96%;

  .tc-section {
    // margin-bottom: 40px;
    position: relative; // 必须！作为遮罩的定位基准
    height: 50%;
    overflow: hidden;

    // 新的遮罩层样式
    .tc-loading-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(6, 22, 48, 0.7); // 稍微加深半透明背景
      z-index: 100; // 确保在 ECharts 之上
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: all; // 拦截点击事件，加载时不允许操作
      backdrop-filter: blur(2px); // 可选：加一点毛玻璃感，更像遮罩

      .tc-loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .tc-loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 209, 255, 0.3);
          border-top-color: #00d1ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .tc-loading-text {
          margin-top: 10px;
          color: #00d1ff;
          font-size: 12px;
        }
      }
    }

    &:last-child {
      margin-bottom: 0;
    }

    .tc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      // margin-bottom: 15px;
      // padding-left: 5px;
      position: absolute;

      .tc-title {
        color: #ffffff;
        font-size: 12px;
        font-weight: 500;
        margin: 0;
        // padding-bottom: 10px;
        position: relative;
        bottom: 3px;
      }

      .tc-legend {
        display: flex;
        gap: 20px;

        .tc-legend-item {
          display: flex;
          align-items: center;
          color: #ffffff;
          font-size: 12px;

          .tc-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
            background: transparent;
            border: 2px solid transparent;

            &--predict {
              border-color: @blue-theme;
            }
            &--history {
              border-color: @orange-theme;
            }
          }
        }
      }
    }

    .tc-chart-canvas {
      height: 95%;
      width: 100%;

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    }
  }
}
</style>
