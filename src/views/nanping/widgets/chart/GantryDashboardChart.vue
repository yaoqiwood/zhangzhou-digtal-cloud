<template>
  <div class="ptd-wrapper">
    <div class="ptd-chart-section">
      <!-- <div class="ptd-header">
        <span class="ptd-title">流量预测对比</span>
      </div> -->
      <div class="ptd-line-chart-wrap">
        <div class="ptd-chart-box" ref="lineChartRef"></div>
        <div v-show="props.loading" class="ptd-loading-mask">
          <div class="ptd-loading-spinner"></div>
          <div class="ptd-loading-text">图表加载中...</div>
        </div>
      </div>
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
  chartData: { type: Object, default: () => ({}) },
  gantryFlowData: { type: Array, default: () => [] },
  predictFlowData: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['updateTotalFlow']);

const activeTab = ref('月');

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const normalizeTimeLabel = (timeText) => {
  const source = String(timeText || '').trim();
  if (!source) return '';
  const match = source.match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const parseTimeToTimestamp = (timeText) => {
  const source = String(timeText || '').trim();
  if (!source) return NaN;
  const normalized = source.replace(/\.\d+$/, '');
  const tsFromIso = Date.parse(normalized.replace(' ', 'T'));
  if (Number.isFinite(tsFromIso)) return tsFromIso;
  const tsFromRaw = Date.parse(source);
  return Number.isFinite(tsFromRaw) ? tsFromRaw : NaN;
};

const formatTimestampKey = (timestamp) => {
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const normalizeTimeKey = (timeText) => {
  const source = String(timeText || '').trim();
  if (!source) return '';
  const dateTimeMatch = source.match(
    /(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/
  );
  if (dateTimeMatch) {
    const [, datePart, hourPart, minutePart] = dateTimeMatch;
    return `${datePart} ${String(hourPart).padStart(2, '0')}:${minutePart}`;
  }
  const timestamp = parseTimeToTimestamp(source);
  if (Number.isFinite(timestamp)) return formatTimestampKey(timestamp);
  return normalizeTimeLabel(source);
};

const timeLabelToMinutes = (timeLabel) => {
  const [hour, minute] = String(timeLabel || '')
    .split(':')
    .map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN;
  return hour * 60 + minute;
};

const getSortValue = (timeKey) => {
  const timestamp = parseTimeToTimestamp(timeKey);
  if (Number.isFinite(timestamp)) return timestamp;
  return timeLabelToMinutes(timeKey);
};

const formatAxisTickLabel = (timeKey) => {
  const source = String(timeKey || '');
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(source)) {
    return source.slice(11, 16);
  }
  const hhmm = normalizeTimeLabel(source);
  if (hhmm) {
    return hhmm;
  }
  return source;
};

const parsePredictPointsFromText = (payloadText) => {
  const source = String(payloadText || '').trim();
  if (!source) return [];
  const points = [];

  try {
    const parsed = JSON.parse(source.replace(/'/g, '"'));
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const [time, value] = Object.entries(item)[0] || [];
        const num = toNumber(value);
        if (!time || !Number.isFinite(num)) return;
        points.push({
          timeKey: normalizeTimeKey(time),
          timeLabel: normalizeTimeLabel(time),
          value: num,
        });
      });
      if (points.length) return points;
    }
  } catch (error) {
    // 回退到正则解析
  }

  const regex = /'([^']+)'\s*:\s*([-+]?\d*\.?\d+)/g;
  let match = regex.exec(source);
  while (match) {
    const num = toNumber(match[2]);
    if (Number.isFinite(num)) {
      points.push({
        timeKey: normalizeTimeKey(match[1]),
        timeLabel: normalizeTimeLabel(match[1]),
        value: num,
      });
    }
    match = regex.exec(source);
  }

  return points;
};

const normalizePredictPoints = (source) => {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (Array.isArray(item) && item.length >= 3) {
        return parsePredictPointsFromText(item[2]);
      }
      if (typeof item === 'number' || typeof item === 'string') {
        const value = toNumber(item);
        return Number.isFinite(value)
          ? { timeKey: '', timeLabel: '', value }
          : null;
      }
      if (!item || typeof item !== 'object') return null;

      const value = toNumber(
        item.predict_flow ??
          item.predictFlow ??
          item.pre_flow ??
          item.now_flow ??
          item.flow ??
          item.cnt ??
          item.value
      );

      // 兼容单键值对象: {"2026-03-04 15:00:00": 157.26}
      if (!Number.isFinite(value)) {
        const entries = Object.entries(item);
        if (entries.length === 1) {
          const [time, maybeValue] = entries[0];
          const parsed = toNumber(maybeValue);
          if (Number.isFinite(parsed)) {
            return {
              timeKey: normalizeTimeKey(time),
              timeLabel: normalizeTimeLabel(time),
              value: parsed,
            };
          }
        }
        return null;
      }

      const rawTime =
        item.timeKey ||
        item.timeLabel ||
        item.time ||
        item.time_field ||
        item.timePeriod ||
        item.predict_time ||
        item.predictTime ||
        '';
      return {
        timeKey: normalizeTimeKey(rawTime),
        timeLabel: normalizeTimeLabel(rawTime),
        value,
      };
    })
    .flat()
    .filter(Boolean);
};

const normalizeActualPoints = (source) => {
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const carFlow = toNumber(item.carFlow);
      const trunkFlow = toNumber(item.trunkFlow);
      const total = toNumber(item.total);
      const totalFlow = Number.isFinite(total)
        ? total
        : (Number.isFinite(carFlow) ? carFlow : 0) +
          (Number.isFinite(trunkFlow) ? trunkFlow : 0);
      const rawTime =
        item.timeKey ||
        item.timePeriod ||
        item.time ||
        item.time_field ||
        item.timeLabel ||
        '';
      const timeKey = normalizeTimeKey(rawTime);
      const timestamp = getSortValue(timeKey);

      if (!timeKey || !Number.isFinite(timestamp)) return null;
      return {
        timeKey,
        timeLabel: normalizeTimeLabel(rawTime) || timeKey.slice(11, 16),
        timestamp,
        carFlow: Number.isFinite(carFlow) ? carFlow : 0,
        trunkFlow: Number.isFinite(trunkFlow) ? trunkFlow : 0,
        totalFlow: Number.isFinite(totalFlow) ? totalFlow : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
};

const currentActualPoints = computed(() =>
  normalizeActualPoints(props.gantryFlowData)
);

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

const buildLineSeriesData = () => {
  const actualPoints = currentActualPoints.value;
  const actualAxis = actualPoints.map((item) => item.timeKey);
  const predictPoints = normalizePredictPoints(props.predictFlowData);

  // 默认保持现有 X 轴（实际流量时间）
  let xAxisData = [...actualAxis];
  const predictTimeLabels = predictPoints
    .map((item) => item.timeKey || item.timeLabel)
    .filter((item) => item);

  // 按预测 key 扩充 X 轴
  if (predictTimeLabels.length) {
    const merged = Array.from(new Set([...actualAxis, ...predictTimeLabels]));
    const canSort = merged.every((label) =>
      Number.isFinite(getSortValue(label))
    );
    xAxisData = canSort
      ? merged.sort((a, b) => getSortValue(a) - getSortValue(b))
      : merged;
  }

  const predictMap = new Map();
  predictPoints.forEach((item) => {
    const axisKey = item.timeKey || item.timeLabel;
    if (axisKey && Number.isFinite(item.value)) {
      predictMap.set(axisKey, item.value);
    }
  });

  const actualMap = new Map();
  actualPoints.forEach((item) => {
    if (item.timeKey && Number.isFinite(item.totalFlow)) {
      actualMap.set(item.timeKey, item.totalFlow);
    }
  });

  let predictSeries = xAxisData.map((label) =>
    predictMap.has(label) ? predictMap.get(label) : null
  );
  const actualSeries = xAxisData.map((label) =>
    actualMap.has(label) ? actualMap.get(label) : null
  );

  // 没有时间 key 时按顺序填充预测流量
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
    xAxisData: alignedSeries.xAxisData,
    predictSeries: alignedSeries.predictSeries,
    actualSeries: alignedSeries.actualSeries,
  };
};

const applyLineChartData = () => {
  if (!lineChart) return;
  const { xAxisData, predictSeries, actualSeries } = buildLineSeriesData();
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
  lineChart.setOption(newLineOption);
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
    left: 'center',
    top: -5,
    textStyle: { color: '#8fb1d9', fontSize: 12 },
    icon: 'circle',
  },
  grid: { left: '3%', right: '4%', bottom: '0', top: 35, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
    axisLabel: {
      color: '#8fb1d9',
      formatter: (value) => formatAxisTickLabel(value),
    },
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
    data: currentActualPoints.value.map((item) => item.timeKey),
    axisLabel: {
      color: '#8fb1d9',
      formatter: (value) => formatAxisTickLabel(value),
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
      data: currentActualPoints.value.map((item) => item.carFlow),
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
      data: currentActualPoints.value.map((item) => item.trunkFlow),
    },
  ],
}));

// 生命周期钩子
onMounted(() => {
  // 使用nextTick确保DOM完全渲染
  nextTick(() => {
    initCharts();
    // 初始化后获取数据
  });

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 初始化图表函数
const initCharts = () => {
  // 检查DOM元素是否存在且有尺寸
  if (!lineChart) {
    if (lineChartRef.value && lineChartRef.value.clientWidth > 0) {
      lineChart = echarts.init(lineChartRef.value);
      lineChart.setOption(lineOption.value);
    } else {
      console.warn('Line chart DOM element not ready or has zero size');
    }
  }

  if (!barChart) {
    if (barChartRef.value && barChartRef.value.clientWidth > 0) {
      barChart = echarts.init(barChartRef.value);
      barChart.setOption(barOption.value);
    } else {
      console.warn('Bar chart DOM element not ready or has zero size');
    }
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

watch(
  () => props.predictFlowData,
  () => {
    applyLineChartData();
  },
  { deep: true }
);

watch(
  currentActualPoints,
  (points) => {
    const totalFlowData = points.map((item) => item.totalFlow);
    emit('updateTotalFlow', totalFlowData);
    barChart?.setOption(barOption.value);
    applyLineChartData();
  },
  { immediate: true, deep: true }
);

watch(
  () => props.loading,
  (loading) => {
    if (loading) return;
    nextTick(() => {
      ensureChartSize();
      initCharts();
      lineChart?.resize();
      barChart?.resize();
      barChart?.setOption(barOption.value);
      applyLineChartData();
    });
  }
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

.ptd-line-chart-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.ptd-loading-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(7, 21, 50, 0.72);
  backdrop-filter: blur(1px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 4px;
}

.ptd-loading-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba(143, 177, 217, 0.35);
  border-top-color: #54d1f3;
  animation: ptd-spin 0.9s linear infinite;
}

.ptd-loading-text {
  color: #d5ebff;
  font-size: 12px;
  letter-spacing: 1px;
  animation: ptd-fade 1.2s ease-in-out infinite;
}

@keyframes ptd-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes ptd-fade {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

.ptd-chart-section:first-child {
  flex: none; // 不平分空间
  height: 150px; // 强制设定高度
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
