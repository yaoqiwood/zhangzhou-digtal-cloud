<template>
  <div class="ptd-wrapper">
    <div class="ptd-chart-section">
      <div class="ptd-header">
        <div class="ptd-title-box">
          <span class="ptd-title">流量柱状图</span>
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
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import http from '@/utils/http.js';
import { PUTIAN_SERVICE_AREAS, REGION_IDS } from '@/utils/constants.js';

// 注册必要组件
use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

// 图表实例引用
const barChartRef = ref(null);
let barChart = null;
const timeLabels = ref([]);
const carFlowValues = ref([]);
const trunkFlowValues = ref([]);

// 窗口大小变化监听
const handleResize = () => {
  barChart?.resize();
};

defineOptions({
  name: 'PopTrafficDashboard',
});

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const formatBarTooltip = (params = []) => {
  if (!params.length) return '';

  const axisLabel = params[0]?.axisValueLabel || params[0]?.name || '';
  const totalFlow = params.reduce(
    (sum, item) => sum + (Number(item?.value) || 0),
    0
  );

  const detailLines = params.map((item) => {
    return `${item.marker}${item.seriesName}：${Number(item?.value) || 0}`;
  });

  return [axisLabel, ...detailLines, `总流量：${totalFlow}`].join('<br/>');
};

const extractTimeLabel = (datetime) => {
  if (!datetime) return '';
  const timeStr = datetime.split(' ')[1] || '';
  const timeWithoutMs = timeStr.split('.')[0];
  return timeWithoutMs.split(':').slice(0, 2).join(':');
};

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
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(13, 27, 62, 0.9)',
    borderColor: '#54d1f3',
    textStyle: { color: '#fff' },
    formatter: formatBarTooltip,
  },
  grid: {
    top: 30, // 留给 legend
    bottom: 20, // 留给 x 轴
    left: 15,
    right: 15,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: timeLabels.value,
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
      barWidth: 20,
      barCategoryGap: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3a7bd5' },
          { offset: 1, color: '#00d2ff' },
        ]),
      },
      label: { show: false },
      data: carFlowValues.value,
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
      label: { show: false },
      data: trunkFlowValues.value,
    },
  ],
}));

// 生命周期钩子
onMounted(() => {
  // 使用nextTick确保DOM完全渲染
  nextTick(() => {
    initCharts();
  });

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 初始化图表函数
const initCharts = () => {
  // 检查DOM元素是否存在且有尺寸
  if (barChartRef.value && barChartRef.value.clientWidth > 0) {
    barChart = echarts.init(barChartRef.value);
    barChart.setOption(barOption.value);
  } else {
    console.warn('Bar chart DOM element not ready or has zero size');
  }
};

onUnmounted(() => {
  // 销毁图表实例
  barChart?.dispose();

  // 移除事件监听
  window.removeEventListener('resize', handleResize);
});

// 根据 sub_name 获取服务区代码
const getServiceAreaCode = (subName, direction) => {
  console.log('获取服务区代码，subName:', subName, 'direction:', direction);

  // 遍历所有服务区，找到匹配的服务区
  for (const [key, serviceArea] of Object.entries(PUTIAN_SERVICE_AREAS)) {
    // 检查 sub_name 是否包含服务区名称
    if (subName && subName.includes(serviceArea.name)) {
      console.log('找到匹配的服务区:', serviceArea.name);

      // 根据 direction 判断是 A 区还是 B 区
      if (direction === 'A') {
        console.log('使用 A 区代码:', serviceArea.areaA);
        return serviceArea.areaA;
      } else if (direction === 'B') {
        console.log('使用 B 区代码:', serviceArea.areaB);
        return serviceArea.areaB;
      }
    }
  }

  console.warn('未找到匹配的服务区代码');
  return null;
};

const resolveServiceAreaCode = (data = {}) => {
  const directCodeCandidates = [
    data?.server_area_no,
    data?.serverAreaNo,
    data?.serviceAreaCode,
    data?.service_area_code,
    data?.service_area_no,
    data?.mc_id,
    data?.mcId,
    data?.code,
  ];
  const directCode = directCodeCandidates
    .map((value) => String(value ?? '').trim())
    .find(Boolean);
  if (directCode) {
    return directCode;
  }

  return getServiceAreaCode(data?.sub_name, data?.direction);
};

// 获取服务区窗口信息
const fetchServiceWindowInfo = async (data) => {
  try {
    if (!data) {
      console.warn('缺少服务区点位数据');
      return;
    }

    const serviceAreaCode = resolveServiceAreaCode(data);

    if (!serviceAreaCode) {
      console.error('无法获取服务区代码', data);
      return;
    }

    console.log('调用接口，参数 serviceAreaCode:', serviceAreaCode);

    const response = await http.get(
      FUZHOU_API_URLS.serviceArea.getServiceWindowInfo,
      { serviceAreaCode, origid: REGION_IDS.ZHANGZHOU }
    );

    console.log('获取到的服务区窗口信息:', response);

    // 处理数据并更新图表
    if (response && Array.isArray(response)) {
      updateBarChart(response);
    }
  } catch (error) {
    console.error('获取服务区窗口信息失败:', error);
  }
};

// 更新柱状图数据
const updateBarChart = (data) => {
  if (!data || data.length === 0) {
    timeLabels.value = [];
    carFlowValues.value = [];
    trunkFlowValues.value = [];
    barChart?.setOption(barOption.value);
    return;
  }

  // 按时间排序
  const sortedData = [...data].sort((a, b) => {
    return new Date(a.datetime) - new Date(b.datetime);
  });

  timeLabels.value = sortedData.map((item) => extractTimeLabel(item.datetime));
  carFlowValues.value = sortedData.map((item) => parseInt(item.carFlow) || 0);
  trunkFlowValues.value = sortedData.map(
    (item) => parseInt(item.trunkFlow) || 0
  );

  console.log('排序后的数据:', sortedData);
  console.log('时间数据:', timeLabels.value);
  console.log('客车流量数据:', carFlowValues.value);
  console.log('货车流量数据:', trunkFlowValues.value);

  barChart?.setOption(barOption.value);
};

// 监听 data 变化
watch(
  () => props.data,
  (newData) => {
    console.log('ServiceChart data 变化:', newData);
    if (newData) {
      fetchServiceWindowInfo(newData);
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
  box-sizing: border-box;
}

.ptd-chart-section {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 220px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.ptd-header {
  position: absolute;
  width: 100%;
  margin-bottom: 12px;
  .ptd-title-box {
    float: left;
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
</style>
