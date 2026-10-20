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
  data: {
    type: Object,
    default: () => ({}),
  },
  enCharData: {
    type: Array,
    default: () => [],
  },
  exCharData: {
    type: Array,
    default: () => [],
  },
  enPredictData: {
    type: Array,
    default: () => [],
  },
  exPredictData: {
    type: Array,
    default: () => [],
  },
  stationType: {
    type: String,
    default: 'in',
  },
});

const activeTab = ref('月');

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
    data: ['预测流量', '历史流量'],
    right: 'center',
    top: -5,
    textStyle: { color: '#8fb1d9' },
    icon: 'circle',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10',
    top: '20',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
    axisLabel: { color: '#8fb1d9' },
    axisLine: { lineStyle: { color: '#2a466b' } },
  },
  yAxis: {
    type: 'value',
    splitNumber: 5,
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
      label: { show: false },
      data: [],
    },
    {
      name: '历史流量',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: '#f3a033' },
      label: { show: false },
      data: [],
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
    data: [],
    axisLabel: {
      color: '#8fb1d9',
      formatter: (value) => {
        return value;
      },
    },
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
      label: { show: false },
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
      label: { show: false },
      data: [],
    },
  ],
}));

// 生命周期钩子
onMounted(() => {
  // 使用nextTick确保DOM完全渲染
  nextTick(() => {
    ensureChartSize();
    initCharts();
    updateCurrentCharts();
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

// 监听activeTab变化，这里可以根据需要更新柱状图数据
watch(activeTab, () => {
  updateCurrentCharts();
});

watch(
  [
    () => props.enCharData,
    () => props.exCharData,
    () => props.enPredictData,
    () => props.exPredictData,
    () => props.stationType,
  ],
  () => {
    nextTick(() => {
      updateCurrentCharts();
    });
  },
  { deep: true, immediate: true }
);

const getCurrentActualData = () =>
  props.stationType === 'in' ? props.enCharData : props.exCharData;

const getCurrentPredictData = () =>
  props.stationType === 'in' ? props.enPredictData : props.exPredictData;

const formatTimeLabel = (timeText) => {
  const source = String(timeText || '').trim();
  if (!source) return '';
  const match = source.match(/(\d{1,2}):(\d{2})/);
  if (!match) return source;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const formatTimeKey = (timeText) => {
  const source = String(timeText || '').trim();
  if (!source) return '';

  const dateTimeMatch = source.match(
    /(\d{4}[/-]\d{2}[/-]\d{2})[ T](\d{1,2}):(\d{2})/
  );
  if (dateTimeMatch) {
    const [, datePart, hourPart, minutePart] = dateTimeMatch;
    return `${datePart.replace(/\//g, '-')} ${String(hourPart).padStart(2, '0')}:${minutePart}`;
  }

  const timestamp = Date.parse(source.replace(/\.\d+$/, '').replace(' ', 'T'));
  if (!Number.isFinite(timestamp)) return '';

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const getSortValue = (label) => {
  const source = String(label || '').trim();
  if (!source) return Number.NaN;

  const dateTimeMatch = source.match(
    /(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (dateTimeMatch) {
    const [, datePart, hour, minute, second = '00'] = dateTimeMatch;
    return Date.parse(`${datePart}T${hour}:${minute}:${second}`);
  }

  const timeMatch = source.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  }

  const timestamp = Date.parse(source.replace(' ', 'T'));
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
};

const extractHistoryTime = (item = {}) =>
  item.datetime ||
  item.time ||
  item.time_field ||
  item.timePeriod ||
  item.tradetime ||
  '';

const getHistoryTotal = (item = {}) => {
  const directTotal = Number(
    item.total ?? item.totalFlow ?? item.todayTotal ?? item.flow
  );
  if (Number.isFinite(directTotal)) {
    return directTotal;
  }

  const carFlow = Number(item.carFlow ?? item.todayCarFlow);
  const trunkFlow = Number(item.trunkFlow ?? item.todayTrunkFlow);
  const sum =
    (Number.isFinite(carFlow) ? carFlow : 0) +
    (Number.isFinite(trunkFlow) ? trunkFlow : 0);
  return Number.isFinite(sum) ? sum : 0;
};

const normalizeHistoryPoints = (data = []) =>
  (Array.isArray(data) ? data : []).map((item) => {
    const rawTime = extractHistoryTime(item);
    const timeKey = formatTimeKey(rawTime);
    return {
      timeKey,
      timeLabel: formatTimeLabel(rawTime),
      carFlow: Number(item.carFlow ?? item.todayCarFlow) || 0,
      trunkFlow: Number(item.trunkFlow ?? item.todayTrunkFlow) || 0,
      totalFlow: getHistoryTotal(item),
    };
  });

const normalizePredictPoints = (data = []) => {
  const points = [];

  (Array.isArray(data) ? data : []).forEach((item) => {
    if (Array.isArray(item) && item.length >= 3) {
      const source = String(item[2] || '').trim();
      const regex = /'([^']+)'\s*:\s*([-+]?\d*\.?\d+)/g;
      let match = regex.exec(source);
      while (match) {
        const value = Number(match[2]);
        if (Number.isFinite(value)) {
          points.push({
            timeKey: formatTimeKey(match[1]),
            timeLabel: formatTimeLabel(match[1]),
            value,
          });
        }
        match = regex.exec(source);
      }
      return;
    }

    if (!item || typeof item !== 'object') return;

    const value = Number(
      item.value ??
        item.predictFlow ??
        item.predict_flow ??
        item.predicted_flow ??
        item.flow
    );
    if (!Number.isFinite(value)) return;

    const rawTime =
      item.timeKey ||
      item.timeLabel ||
      item.time ||
      item.time_field ||
      item.timePeriod ||
      item.tradetime ||
      item.predict_time ||
      item.predictTime ||
      '';

    points.push({
      timeKey: formatTimeKey(rawTime),
      timeLabel: formatTimeLabel(rawTime),
      value,
    });
  });

  return points;
};

const sortPointsByAxis = (points = []) => {
  const list = [...(Array.isArray(points) ? points : [])];
  const canSort = list.every((item) =>
    Number.isFinite(getSortValue(item.timeKey || item.timeLabel))
  );
  if (!canSort) return list;
  return list.sort(
    (a, b) =>
      getSortValue(a.timeKey || a.timeLabel) - getSortValue(b.timeKey || b.timeLabel)
  );
};

const findFirstValidIndex = (series = []) =>
  series.findIndex((item) => Number.isFinite(item));

const findLastValidIndex = (series = []) => {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(series[index])) {
      return index;
    }
  }
  return -1;
};

const findPrevValidIndex = (series = [], startIndex = -1) => {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (Number.isFinite(series[index])) {
      return index;
    }
  }
  return -1;
};

const alignLineSeriesConnection = ({
  xAxisData = [],
  actualSeries = [],
  predictSeries = [],
}) => {
  const nextActualSeries = [...actualSeries];
  const nextPredictSeries = [...predictSeries];

  const lastActualIndex = findLastValidIndex(nextActualSeries);
  const firstPredictIndex = findFirstValidIndex(nextPredictSeries);

  if (lastActualIndex < 0 || firstPredictIndex < 0) {
    return {
      xAxisData,
      actualSeries: nextActualSeries,
      predictSeries: nextPredictSeries,
    };
  }

  const overlapIndexes = xAxisData.reduce((result, _, index) => {
    if (
      Number.isFinite(nextActualSeries[index]) &&
      Number.isFinite(nextPredictSeries[index])
    ) {
      result.push(index);
    }
    return result;
  }, []);

  if (overlapIndexes.length === 0) {
    nextPredictSeries[lastActualIndex] = nextActualSeries[lastActualIndex];
    return {
      xAxisData,
      actualSeries: nextActualSeries,
      predictSeries: nextPredictSeries,
    };
  }

  const lastOverlapIndex = overlapIndexes[overlapIndexes.length - 1];
  const actualLastValue = Number(nextActualSeries[lastActualIndex]);
  const predictOverlapValue = Number(nextPredictSeries[lastOverlapIndex]);
  const hasValueConflict =
    lastOverlapIndex === lastActualIndex &&
    Number.isFinite(actualLastValue) &&
    Number.isFinite(predictOverlapValue) &&
    actualLastValue !== predictOverlapValue;

  if (!hasValueConflict) {
    return {
      xAxisData,
      actualSeries: nextActualSeries,
      predictSeries: nextPredictSeries,
    };
  }

  nextActualSeries[lastActualIndex] = null;
  const prevActualIndex = findPrevValidIndex(nextActualSeries, lastActualIndex - 1);
  if (prevActualIndex >= 0) {
    nextPredictSeries[prevActualIndex] = nextActualSeries[prevActualIndex];
  }

  return {
    xAxisData,
    actualSeries: nextActualSeries,
    predictSeries: nextPredictSeries,
  };
};

const buildLineSeriesData = (actualData = [], predictData = []) => {
  const actualPoints = sortPointsByAxis(normalizeHistoryPoints(actualData));
  const predictPoints = sortPointsByAxis(normalizePredictPoints(predictData));

  const actualAxis = actualPoints
    .map((item) => item.timeKey || item.timeLabel)
    .filter((item) => item);
  const predictAxis = predictPoints
    .map((item) => item.timeKey || item.timeLabel)
    .filter((item) => item);

  let xAxisData = actualAxis.length ? [...actualAxis] : [...predictAxis];
  if (actualAxis.length && predictAxis.length) {
    const merged = Array.from(new Set([...actualAxis, ...predictAxis]));
    const canSort = merged.every((label) =>
      Number.isFinite(getSortValue(label))
    );
    xAxisData = canSort
      ? merged.sort((a, b) => getSortValue(a) - getSortValue(b))
      : merged;
  }

  const actualMap = new Map();
  actualPoints.forEach((item) => {
    const axisKey = item.timeKey || item.timeLabel;
    if (axisKey && Number.isFinite(item.totalFlow)) {
      actualMap.set(axisKey, item.totalFlow);
    }
  });

  const predictMap = new Map();
  predictPoints.forEach((item) => {
    const axisKey = item.timeKey || item.timeLabel;
    if (axisKey && Number.isFinite(item.value)) {
      predictMap.set(axisKey, item.value);
    }
  });

  let predictSeries = xAxisData.map((label) =>
    predictMap.has(label) ? predictMap.get(label) : null
  );
  const actualSeries = xAxisData.map((label) =>
    actualMap.has(label) ? actualMap.get(label) : null
  );

  if (!predictMap.size) {
    const rawValues = predictPoints
      .map((item) => item.value)
      .filter((item) => Number.isFinite(item));
    if (rawValues.length) {
      if (rawValues.length >= xAxisData.length) {
        predictSeries = rawValues.slice(rawValues.length - xAxisData.length);
      } else {
        predictSeries = Array(xAxisData.length - rawValues.length)
          .fill(null)
          .concat(rawValues);
      }
    }
  }

  const alignedSeries = alignLineSeriesConnection({
    xAxisData,
    actualSeries,
    predictSeries,
  });

  return {
    xAxisData: alignedSeries.xAxisData.map((item) => formatTimeLabel(item)),
    predictSeries: alignedSeries.predictSeries,
    actualSeries: alignedSeries.actualSeries,
  };
};

const updateBarChart = (data) => {
  const historyPoints = normalizeHistoryPoints(data);

  const carFlowData = historyPoints.map((item) => item.carFlow);
  const trunkFlowData = historyPoints.map((item) => item.trunkFlow);
  const timeData = historyPoints.map((item) => item.timeLabel || '');

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

  if (barChart) {
    barChart.setOption(newBarOption);
  }
};

const updateLineChart = (actualData, predictData) => {
  const { xAxisData, predictSeries, actualSeries } = buildLineSeriesData(
    actualData,
    predictData
  );

  const newLineOption = {
    ...lineOption.value,
    xAxis: {
      ...lineOption.value.xAxis,
      data: xAxisData,
    },
    series: [
      {
        ...lineOption.value.series[0],
        data: predictSeries,
      },
      {
        ...lineOption.value.series[1],
        data: actualSeries,
      },
    ],
  };

  if (lineChart) {
    lineChart.setOption(newLineOption);
  }
};

const updateCurrentCharts = () => {
  const currentActualData = getCurrentActualData();
  const currentPredictData = getCurrentPredictData();
  updateBarChart(currentActualData);
  updateLineChart(currentActualData, currentPredictData);
};
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
  flex: 1.35; // 让柱状图区块占据更多空间
  height: auto; // 覆盖默认的 130px
  min-height: 220px;
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
