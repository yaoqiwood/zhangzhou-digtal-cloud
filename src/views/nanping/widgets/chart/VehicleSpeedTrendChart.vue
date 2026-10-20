<template>
  <div class="vst-container">
    <div class="vst-header">
      <span class="vst-title">滞留区段速度趋势</span>
      <div class="vst-legend">
        <div class="vst-legend-item">
          <span class="vst-dot vst-dot-realtime"></span>
          <span class="vst-legend-text">区段速度</span>
        </div>
        <div class="vst-legend-item">
          <span class="vst-dot vst-dot-avg"></span>
          <span class="vst-legend-text">车辆速度</span>
        </div>
      </div>
    </div>

    <div ref="trendChartRef" class="vst-canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

defineOptions({
  name: 'VehicleSpeedTrend',
});

const trendChartRef = ref(null);
let myChart = null;

// 定义props
const props = defineProps({
  apiData: {
    type: Array,
    default: () => [],
  },
});

const formatSectionLabelByArrow = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const parts = text.split(/\s*(?:->|→)\s*/).filter(Boolean);

  if (parts.length <= 1) {
    return parts[0]?.trim() || text;
  }

  return `${parts[0].trim()}\n${parts.slice(1).join(' ').trim()}`;
};

const parseChartStartTimeMs = (item) => {
  if (typeof item?.startTimeTs === 'number' && Number.isFinite(item.startTimeTs)) {
    return item.startTimeTs;
  }

  const fullTime = String(item?.fullTime || '').trim();
  if (fullTime) {
    const startText = fullTime.split('-').slice(0, 3).join('-').trim();
    const fullTimeMs = new Date(startText).getTime();
    if (!Number.isNaN(fullTimeMs)) {
      return fullTimeMs;
    }
  }

  const rawTime = String(item?.time || '').trim();
  const timeMatch = rawTime.match(
    /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})/
  );
  if (!timeMatch?.[1]) {
    return Number.POSITIVE_INFINITY;
  }

  const timeMs = new Date(timeMatch[1]).getTime();
  return Number.isNaN(timeMs) ? Number.POSITIVE_INFINITY : timeMs;
};

const sortChartDataByTradeTime = (data) =>
  [...data].sort((a, b) => parseChartStartTimeMs(a) - parseChartStartTimeMs(b));

const formatSectionAxisLabel = (item) => String(item?.name || '').trim();

const getAdaptiveLabelConfig = (xAxisData) => {
  const labels = xAxisData
    .filter(Boolean)
    .map((item) => String(item || '').trim());
  const labelCount = Math.max(labels.length, 1);
  const chartWidth =
    myChart?.getWidth?.() || trendChartRef.value?.clientWidth || 600;
  const slotWidth = Math.max(Math.floor(chartWidth / labelCount), 20);

  // 保证绘图区高度优先：不使用会挤压图形区的底部滑块，改为自适应抽稀标签
  const maxVisibleLabels = chartWidth < 520 ? 6 : 9;
  const interval = Math.max(
    Math.ceil(xAxisData.length / maxVisibleLabels) - 1,
    0
  );

  // 改为中间换行展示，取消倾斜旋转
  const rotate = 0;
  const bottomPadding = slotWidth < 52 ? 24 : 16;

  return {
    rotate,
    interval,
    bottomPadding,
  };
};

// 处理API数据转换为图表所需格式
const processApiData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { realtimeData: [], avgData: [], xAxisData: [], segmentNames: [] };
  }

  const sortedData = sortChartDataByTradeTime(data);
  const realtimeData = sortedData.map((item) => {
    const value = Number.parseFloat(item?.speed || 0);
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  });
  const avgData = sortedData.map((item) => {
    const value = Number.parseFloat(item?.avgSpeed || 0);
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  });
  const xAxisData = sortedData.map((item) => formatSectionAxisLabel(item));
  const segmentNames = sortedData.map((item) => String(item?.name || '').trim());

  return { realtimeData, avgData, xAxisData, segmentNames };
};

const initChart = (data = props.apiData) => {
  if (!trendChartRef.value) return;
  if (!myChart) {
    myChart = echarts.init(trendChartRef.value);
  }

  const { realtimeData, avgData, xAxisData, segmentNames } =
    processApiData(data);
  const { rotate, interval, bottomPadding } = getAdaptiveLabelConfig(xAxisData);

  const option = {
    grid: {
      top: '10%',
      left: '5%',
      right: '5%',
      bottom: bottomPadding,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const dataIndex = params[0]?.dataIndex ?? -1;
        const sectionName = segmentNames[dataIndex] || '';

        const lines = params
          .filter((item) => item?.value !== null && item?.value !== undefined)
          .map(
            (item) =>
              `${item.marker}${item.seriesName}：${Number(item.value).toFixed(2)} km/h`
          );

        const title = sectionName || '区段';
        return [title, ...lines].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: { show: true, onZero: false, lineStyle: { color: '#1e3a5f' } },
      splitLine: {
        show: true,
        lineStyle: { color: 'rgba(30,58,95,0.45)', type: 'solid' },
      },
      axisLabel: {
        color: '#88a9d4',
        fontSize: 10,
        lineHeight: 14,
        interval,
        rotate,
        hideOverlap: true,
        alignMinLabel: 'left',
        alignMaxLabel: 'right',
        formatter: (value) => formatSectionLabelByArrow(value),
      },
      axisTick: { show: true, alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      position: 'left',
      min: 0,
      // max: 30,
      // interval: 15,
      splitLine: { lineStyle: { color: '#1e3a5f' } },
      axisLine: {
        show: true,
        onZero: false,
        lineStyle: { color: '#1e3a5f', width: 2 },
      },
      axisTick: { show: true },
      axisLabel: { color: '#88a9d4' },
    },
    series: [
      {
        name: '区段速度',
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        smooth: false, // 图片中是折线，非平滑曲线
        connectNulls: true,
        lineStyle: { color: '#00e5ff', width: 2 },
        itemStyle: { color: '#00e5ff', borderColor: '#fff', borderWidth: 1 },
        label: { show: false, position: 'top', color: '#00e5ff', fontSize: 10 },
        data: realtimeData,
      },
      {
        name: '车辆速度',
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: true,
        lineStyle: { color: '#ff9900', width: 2 },
        itemStyle: { color: '#ff9900', borderColor: '#fff', borderWidth: 1 },
        label: {
          show: false,
          position: 'bottom',
          color: '#ff9900',
          fontSize: 10,
        },
        data: avgData,
      },
    ],
  };

  myChart.setOption(option, true);
};

const onResize = () => {
  if (!myChart) return;
  myChart.resize();
  initChart(props.apiData);
};

// 监听apiData变化，更新图表
watch(
  () => props.apiData,
  (newData) => {
    // 无论数据是否为空，都更新图表
    // 如果数据为空，processApiData会返回默认数据
    initChart(newData);
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  initChart();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  myChart?.dispose();
});
</script>

<style scoped>
.vst-container {
  margin-top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.vst-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 8px;
  margin-bottom: 4px;
}

.vst-title {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.vst-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  min-width: 0;
}

.vst-legend-item {
  display: flex;
  align-items: center;
}

.vst-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  position: relative;
}

/* 模拟图片中的空心圆点样式 */
.vst-dot::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: #020b1a;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.vst-dot-realtime {
  background: #00e5ff;
  border: 1px solid #00e5ff;
}
.vst-dot-avg {
  background: #ff9900;
  border: 1px solid #ff9900;
}

.vst-legend-text {
  font-size: 11px;
  color: #a0c2ed;
}

.vst-canvas {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: auto;
}
</style>
