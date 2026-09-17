<template>
  <div class="call-analysis-container">
    <div class="chart-content">
      <div class="chart-content_stats">
        <div class="stats-cards">
          <div class="data-box" v-for="(item, index) in stats" :key="index">
            <div class="label">{{ item.label }}</div>
            <div class="value">
              <span class="num">{{ item.value }}</span>
              <span class="unit" v-if="item.unit">{{ item.unit }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-wrapper">
        <div ref="chartRef" class="echarts-dom"></div>
        <div class="chart-center-text" :key="selectedItem?.name">
          <div class="percent">{{ centerPercent }}%</div>
          <div class="sub-text">{{ centerName }}</div>
        </div>
      </div>

      <div class="legend-list">
        <div
          class="legend-item"
          v-for="(item, index) in chartData"
          :key="index"
          @click="handleLegendClick(item)"
          :class="{ active: legendSelected[item.name] }"
        >
          <span class="status-dot" :style="{ background: item.color }"></span>
          <span class="name">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { API_URLS } from '@/utils/apiUrls';
import http from '@/utils/http';
import { getNowRange } from '@/utils/tools';
import {
  REFRESH_INTERVALS,
  REFRESH_SWITCHES,
} from '@/settings/refreshIntervals';

const chartRef = ref(null);
let callAnalysisRefreshTimer = null;

// 当前选择的时间类型
const timeType = ref('day');

// 话务统计获取
const getTrafficCaseInfo = async (type = 'day') => {
  timeType.value = type;
  const trafficCaseInfoUrl = API_URLS.putian_highway.getTrafficCaseInfo;
  const timeRange = getNowRange(type, 70);
  try {
    const data = await http.get(trafficCaseInfoUrl, timeRange);
    if (data && Array.isArray(data)) {
      processCallData(data);
    }
  } catch (error) {
    console.error('获取话务数据失败:', error);
  }
};

// 流量类型统计获取
const getTrafficTypeInfo = async (type = 'day') => {
  timeType.value = type;
  const trafficTypeInfoUrl = API_URLS.putian_highway.getTrafficTypeInfo;
  const timeRange = getNowRange(type, 70);
  try {
    const data = await http.get(trafficTypeInfoUrl, timeRange);
    if (data && Array.isArray(data)) {
      processTrafficTypeData(data);
    }
  } catch (error) {
    console.error('获取流量类型数据失败:', error);
  }
};

// 处理流量类型数据
const processTrafficTypeData = (data) => {
  // 按 CONSULTTYPE 归类累加
  const typeMap = {};
  let totalValue = 0;

  // console.log(data);

  data.forEach((item) => {
    const consultType = item.CONSULTTYPE || '其他';
    const consultTypeNumb = item.CONSULTTYPENUMB || 0;

    if (!typeMap[consultType]) {
      typeMap[consultType] = 0;
    }
    typeMap[consultType] += consultTypeNumb;
    totalValue += consultTypeNumb;
  });

  console.log('归类后的数据:', typeMap);
  console.log('总计数值:', totalValue);

  // 生成图表数据
  const colorList = [
    '#00cc66',
    '#0099ff',
    '#ff6600',
    '#ffcc00',
    '#ff3366',
    '#9966ff',
  ];
  const newChartData = [];
  let colorIndex = 0;

  for (const [typeName, value] of Object.entries(typeMap)) {
    const percent =
      totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
    newChartData.push({
      value: value,
      name: typeName,
      color: colorList[colorIndex % colorList.length],
      percent: percent,
    });
    colorIndex++;
  }

  console.log('生成的图表数据:', newChartData);

  // 更新图表数据
  chartData.value = newChartData;

  // 更新图例状态
  const newLegendSelected = {};
  newChartData.forEach((item) => {
    newLegendSelected[item.name] = true;
  });
  legendSelected.value = newLegendSelected;

  // 清除选中状态
  selectedItem.value = null;

  // 重新渲染图表
  updateChart();
};

// 处理话务数据
const processCallData = (data) => {
  // 筛选莆田市的数据
  const putianData = data;

  // 累加各项指标
  let totalNORMALINITNUMB = 0; // 呼入总量
  let totalNORMALOUTNUMB = 0; // 呼出总量
  let totalTOTALNUMB = 0; // 总通话量
  let totalTOTALNORMALNUMB = 0; // 正常通话总量

  putianData.forEach((item) => {
    totalNORMALINITNUMB += item.NORMALINITNUMB || 0;
    totalNORMALOUTNUMB += item.NORMALOUTNUMB || 0;
    totalTOTALNUMB += item.TOTALNUMB || 0;
    totalTOTALNORMALNUMB += item.TOTALNORMALNUMB || 0;
  });

  console.log('处理后的莆田话务数据:', {
    totalNORMALINITNUMB,
    totalNORMALOUTNUMB,
    totalTOTALNUMB,
    totalTOTALNORMALNUMB,
  });

  // 更新统计卡片数据
  updateStats({
    totalNORMALINITNUMB,
    totalNORMALOUTNUMB,
    totalTOTALNUMB,
    totalTOTALNORMALNUMB,
  });

  // 更新图表数据
  updateChartData({
    totalNORMALINITNUMB,
    totalNORMALOUTNUMB,
    totalTOTALNUMB,
  });
};

// 更新统计卡片数据
const updateStats = (data) => {
  // 计算呼入占比和呼出占比
  const totalCalls = data.totalNORMALINITNUMB + data.totalNORMALOUTNUMB;
  const inboundRatio =
    totalCalls > 0
      ? ((data.totalNORMALINITNUMB / totalCalls) * 100).toFixed(1)
      : '0.0';
  const outboundRatio =
    totalCalls > 0
      ? ((data.totalNORMALOUTNUMB / totalCalls) * 100).toFixed(1)
      : '0.0';

  // 更新stats数据
  stats.value = [
    {
      label: '全域总量',
      value: data.totalTOTALNUMB,
      unit: '',
    },
    {
      label: '呼入占比',
      value: inboundRatio,
      unit: '%',
    },
    {
      label: '呼出占比',
      value: outboundRatio,
      unit: '%',
    },
  ];
};

// 更新图表数据
const updateChartData = (data) => {
  // 这里可以根据实际业务逻辑更新图表数据
  // 例如：将呼入、呼出等数据分配到不同的图表类别中
  console.log('更新图表数据:', data);

  // 示例：简单更新图表数据
  chartData.value = [
    {
      value: data.totalNORMALINITNUMB, // 紧急救援
      name: '紧急救援',
      color: '#00cc66',
    },
    {
      value: data.totalNORMALOUTNUMB, // ETC
      name: 'ETC',
      color: '#0099ff',
    },
    {
      value:
        data.totalTOTALNUMB -
        (data.totalNORMALINITNUMB + data.totalNORMALOUTNUMB), // 其他
      name: '其他',
      color: '#ff6600',
    },
  ];

  // 更新图例状态
  legendSelected.value = {
    紧急救援: true,
    ETC: true,
    其他: true,
  };

  // 重新渲染图表
  updateChart();
};

let myChart = null;
const resizeHandler = () => {
  if (myChart) {
    myChart.resize();
  }
};

// 左侧卡片模拟数据
const stats = ref([
  {
    label: '全域总量',
    value: '0',
    unit: '',
  },
  {
    label: '呼入占比',
    value: '0.0',
    unit: '%',
  },
  {
    label: '呼出占比',
    value: '0.0',
    unit: '%',
  },
]);

// 图表数据与颜色
const chartData = ref([
  {
    value: 0,
    name: '紧急救援',
    color: '#00cc66', // 直接使用纯色，与图表一致
    originalColor: 'linear-gradient(to right, #00ff88, #00cc66)',
  },
  {
    value: 0,
    name: 'ETC',
    color: '#0099ff',
  },
  {
    label: '其他',
    name: '其他',
    value: 0,
    color: '#ff6600', // 直接使用纯色，与图表一致
    originalColor: 'linear-gradient(to right, #ff9900, #ff6600)',
  },
]);

// 选中项状态
const selectedItem = ref(null);
// 图例显示状态
const legendSelected = ref({
  紧急救援: true,
  ETC: true,
  其他: true,
});

// 计算总数值
const totalValue = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.value, 0);
});

// 计算中心显示的百分比（取最大值的项）
const centerItem = computed(() => {
  return chartData.value.reduce(
    (max, item) => (item.value > max.value ? item : max),
    chartData.value[0]
  );
});

// 计算当前选中数据的总值
const selectedTotalValue = computed(() => {
  return chartData.value
    .filter((item) => legendSelected.value[item.name])
    .reduce((sum, item) => sum + item.value, 0);
});

const centerPercent = computed(() => {
  if (selectedTotalValue.value === 0) return 0;
  if (selectedItem.value) {
    // 如果有选中项，显示选中项的百分比
    return Math.round(
      (selectedItem.value.value / selectedTotalValue.value) * 100
    );
  }
  // 否则显示最大值的百分比
  const visibleItems = chartData.value.filter(
    (item) => legendSelected.value[item.name]
  );
  if (visibleItems.length === 0) return 0;

  const visibleCenterItem = visibleItems.reduce(
    (max, item) => (item.value > max.value ? item : max),
    visibleItems[0]
  );
  if (visibleCenterItem) {
    return Math.round(
      (visibleCenterItem.value / selectedTotalValue.value) * 100
    );
  }
  return 0;
});

const centerName = computed(() => {
  if (selectedItem.value) {
    // 如果有选中项，显示选中项的名称
    return selectedItem.value.name;
  }
  // 否则显示最大值的名称
  const visibleItems = chartData.value.filter(
    (item) => legendSelected.value[item.name]
  );
  if (visibleItems.length === 0) return '';

  const visibleCenterItem = visibleItems.reduce(
    (max, item) => (item.value > max.value ? item : max),
    visibleItems[0]
  );
  if (visibleCenterItem) {
    return visibleCenterItem.name;
  }
  return '';
});

// 处理图例点击
const handleLegendClick = (item) => {
  // 切换图例显示状态
  legendSelected.value[item.name] = !legendSelected.value[item.name];
  console.log(
    'Legend clicked:',
    item,
    'Selected:',
    legendSelected.value[item.name]
  );

  // 更新图表
  updateChart();
};

// 暴露方法给父组件
const updateCallDataByType = (type) => {
  getTrafficCaseInfo(type);
};

const updateTrafficTypeByType = (type) => {
  getTrafficTypeInfo(type);
};

const fetchCallAnalysisData = async () => {
  const type = timeType.value || 'day';
  await Promise.all([getTrafficCaseInfo(type), getTrafficTypeInfo(type)]);
};

// 暴露方法
defineExpose({
  updateCallDataByType,
  updateTrafficTypeByType,
});

const handleChartClick = (params) => {
  console.log('事件触发成功，参数：', params);

  // 核心改动：直接从 params 中提取数据，不依赖外部的 chartData
  // params.data 就是我们在 updateChart 里的那个对象
  if (params && params.data) {
    selectedItem.value = {
      name: params.data.name,
      value: params.data.value,
    };
    console.log('成功从参数中获取数据:', selectedItem.value);
    abc.value = selectedItem.value.name;
  } else {
    // 如果点到了空处
    selectedItem.value = null;
  }
};

// 更新图表
const updateChart = () => {
  if (!myChart) return;

  // 过滤出当前选中的数据
  const filteredData = chartData.value.filter(
    (item) => legendSelected.value[item.name]
  );
  const filteredTotal = filteredData.reduce((sum, item) => sum + item.value, 0);

  // 如果选中项被隐藏，清除选中状态
  if (selectedItem.value && !legendSelected.value[selectedItem.value.name]) {
    selectedItem.value = null;
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesIndex !== 0 || !params.data) {
          return '';
        }

        const { name, value, percent } = params.data;
        const displayPercent =
          percent ??
          (filteredTotal > 0
            ? ((value / filteredTotal) * 100).toFixed(1)
            : '0.0');

        return [
          `类型：${name}`,
          `数量：${value}`,
          `占比：${displayPercent}%`,
        ].join('<br/>');
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['60%', '95%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 0,
          borderColor: '#000a1a',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        data: filteredData.map((item) => ({
          value: item.value,
          name: item.name,
          percent: item.percent,
          itemStyle: {
            color: item.color,
          },
        })),
      },
      // 内圈装饰
      {
        type: 'pie',
        radius: ['0%', '55%'],
        silent: true,
        itemStyle: {
          color: 'rgba(24, 144, 255, 0.1)',
        },
        data: [
          {
            value: 100,
          },
        ],
      },
    ],
  };

  myChart.setOption(option);
};

const initChart = () => {
  if (!chartRef.value) {
    console.error('chartRef.value is null');
    return;
  }

  try {
    myChart = echarts.init(chartRef.value);
    console.log('ECharts initialized successfully');

    updateChart();
    console.log('Chart option set successfully');

    // 添加图表点击事件
    myChart.on('click', handleChartClick);
  } catch (error) {
    console.error('Error initializing chart:', error);
  }
};

const abc = ref('123');

onMounted(() => {
  initChart();
  window.addEventListener('resize', resizeHandler);
  // 初始化时获取当天数据
  fetchCallAnalysisData();
  if (REFRESH_SWITCHES.GLOBAL && REFRESH_SWITCHES.CALL_ANALYSIS_CHART) {
    callAnalysisRefreshTimer = setInterval(() => {
      fetchCallAnalysisData();
    }, REFRESH_INTERVALS.CALL_ANALYSIS_CHART);
  }
});

onUnmounted(() => {
  if (callAnalysisRefreshTimer) {
    clearInterval(callAnalysisRefreshTimer);
    callAnalysisRefreshTimer = null;
  }
  window.removeEventListener('resize', resizeHandler);
  myChart?.dispose();
});
</script>

<style lang="less" scoped>
.call-analysis-container {
  padding: 8px;
  color: #fff;
  width: 100%;
  height: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;

  .card-title {
    font-size: 13px; /* 1.2vh @ 1080 */
    margin-bottom: 11px; /* 1vh @ 1080 */
    color: #4da6ff;
  }

  .chart-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 0;
    padding: 11px 0; /* 1vh @ 1080 */

    .chart-content_stats {
      // 左侧卡片
      display: flex;
      align-items: center;

      .stats-cards {
        display: flex;
        flex-direction: column;
        gap: 5px; /* 0.5vh @ 1080 */

        .data-box {
          border: 1px solid rgba(24, 144, 255, 0.3);
          padding: 5px 16px; /* 0.5vh / 1.5vh @ 1080 */
          width: 100%;
          background: rgba(12, 58, 107, 0.2);
          text-align: center;

          .label {
            font-size: 12px; /* 1.1vh @ 1080 */
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 5px; /* 0.5vh @ 1080 */
          }
          .num {
            font-size: 17px; /* 1.6vh @ 1080 */
            font-weight: bold;
          }
          .unit {
            font-size: 10px; /* 0.9vh @ 1080 */
            margin-left: 3px; /* 0.3vh @ 1080 */
            color: #4da6ff;
          }
        }
      }
    }

    // 中间图表
    .chart-wrapper {
      position: relative;
      width: 173px; /* 16vh @ 1080 */
      height: 173px; /* 16vh @ 1080 */
      max-width: 200px;
      max-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;

      .echarts-dom {
        width: 100%;
        height: 100%;
        cursor: pointer;
      }

      .chart-center-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        pointer-events: none;

        .percent {
          font-size: 24px; /* 2.2vh @ 1080 */
          font-weight: bold;
        }
        .sub-text {
          font-size: 12px; /* 1.1vh @ 1080 */
          color: rgba(255, 255, 255, 0.8);
          margin-top: 3px; /* 0.3vh @ 1080 */
        }
      }
    }

    // 右侧图例
    .legend-list {
      display: flex;
      flex-direction: column;
      gap: 16px; /* 1.5vh @ 1080 */
      align-items: flex-start;

      .legend-item {
        display: flex;
        align-items: center;
        min-width: 86px; /* 8vh @ 1080 */
        cursor: pointer;
        padding: 3px 9px; /* 0.3vh / 0.8vh @ 1080 */
        border-radius: 5px; /* 0.5vh @ 1080 */
        transition: all 0.3s ease;

        &:hover {
          background: rgba(0, 255, 255, 0.1);
        }

        // &.active {
        //   background: rgba(0, 255, 255, 0.2);
        //   border: 1px solid rgba(0, 255, 255, 0.3);
        // }

        &:not(.active) {
          opacity: 0.6;

          .status-dot {
            opacity: 0.5;
          }
        }

        .status-dot {
          width: 13px; /* 1.2vh @ 1080 */
          height: 6px; /* 0.6vh @ 1080 */
          border-radius: 3px; /* 0.3vh @ 1080 */
          margin-right: 9px; /* 0.8vh @ 1080 */
        }
        .name {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }
}
</style>
