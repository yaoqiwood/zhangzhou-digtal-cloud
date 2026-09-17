<template>
  <div>
    <!-- 半透明背景遮罩 -->
    <div
      class="vdc-overlay"
      :class="{ 'overlay-right-panel': overlayScope === 'right-panel' }"
      @click="$emit('close')"
    ></div>
    <!-- 弹窗内容 -->
    <div class="vdc-container" :style="popupStyle">
      <div class="vdc-header" @mousedown="onHeaderMouseDown">
        <h2 class="vdc-title" style="margin-left: 20px; margin-top: 10px">
          特情车辆详情
        </h2>
        <button class="vdc-close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="vdc-subtitle vdc-subtitle-row">
        <span>车牌：{{ props.vehicleData.plate || '未知车牌' }}</span>
        <span>特情类型：{{ props.vehicleData.errorDesc || '未知类型' }}</span>
        <span>特情门架：{{ props.vehicleData.flagname || '未知门架' }}</span>
      </div>
      <div style="padding: 0 20px; height: 40%">
        <!-- 加载状态指示器 -->
        <div v-if="isLoading" class="vdc-loading">
          <div class="vdc-loading-spinner"></div>
          <div class="vdc-loading-text">加载中...</div>
        </div>

        <!-- 表格内容 -->
        <table ref="vdcTableRef" v-else class="vdc-table">
          <thead>
            <tr class="vdc-head-row">
              <th class="vdc-th">区段名称</th>
              <th class="vdc-th">起始交易时间</th>
              <th class="vdc-th">区段平均速度</th>
            </tr>
          </thead>
          <tbody ref="vdcTbodyRef" class="vdc-tbody-scroll">
            <tr v-for="(item, index) in tableData" :key="index" class="vdc-tr">
              <td class="vdc-td" :title="item.name">{{ item.name }}</td>
              <td class="vdc-td" :title="item.time">{{ item.time }}</td>
              <td
                class="vdc-td"
                :title="Number(item.avgSpeed).toFixed(2) + 'km/h'"
              >
                {{ Number(item.avgSpeed).toFixed(2) }}km/h
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 条件渲染：显示柱状图或趋势图 -->
      <div class="chart-container">
        <div v-if="vehicleType === 'exception'" class="vdc-chart-floating-title">
          {{ props.vehicleData.plate || '未知车牌' }}历史特情情况
        </div>
        <!-- 图表加载状态 -->
        <div v-show="chartLoading" class="vdc-loading">
          <div class="vdc-loading-spinner"></div>
          <div class="vdc-loading-text">加载中...</div>
        </div>

        <!-- 图表容器 -->
        <div ref="chartRef" class="vdc-chart-canvas"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
// import VehicleSpeedTrendChart from '../chart/VehicleSpeedTrendChart.vue';
import { API_URLS } from '@/utils/apiUrls.js';
import http from '@/utils/http.js';
import { getTimeMinusMinutes } from '@/utils/tools.js';

// 定义组件名称
defineOptions({
  name: 'VehicleDetailCard',
});

const chartRef = ref(null);
const vdcTableRef = ref(null);
const vdcTbodyRef = ref(null);
let myChart = null;
const CHART_COLORS = [
  '#39d5ff',
  '#1f6fff',
  '#00d68f',
  '#ffd166',
  '#ff8c42',
  '#9b6bff',
  '#ff4fa3',
  '#7ce577',
];

const popupPosition = ref({
  left: '1%',
  top: '20%',
});

const popupStyle = computed(() => ({
  left: popupPosition.value.left,
  top: popupPosition.value.top,
  transform: 'none',
}));

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragContainerEl = null;

const getPositionContextMetrics = (containerEl) => {
  const contextEl =
    containerEl?.closest?.('.dashboard-container') || document.documentElement;
  const rect = contextEl.getBoundingClientRect();
  const layoutWidth = contextEl.offsetWidth || contextEl.clientWidth;
  const layoutHeight = contextEl.offsetHeight || contextEl.clientHeight;
  const scaleX =
    layoutWidth > 0 && rect.width > 0 ? rect.width / layoutWidth : 1;
  const scaleY =
    layoutHeight > 0 && rect.height > 0 ? rect.height / layoutHeight : 1;

  return {
    rect,
    width: layoutWidth || window.innerWidth,
    height: layoutHeight || window.innerHeight,
    scaleX,
    scaleY,
  };
};

const screenPointToLayout = (event, containerEl) => {
  const metrics = getPositionContextMetrics(containerEl);
  return {
    x: (event.clientX - metrics.rect.left) / metrics.scaleX,
    y: (event.clientY - metrics.rect.top) / metrics.scaleY,
  };
};

const onHeaderMouseDown = (event) => {
  event.preventDefault();
  const containerEl = event.currentTarget.closest('.vdc-container');
  if (!containerEl) return;

  isDragging = true;
  dragContainerEl = containerEl;

  const metrics = getPositionContextMetrics(containerEl);
  const containerRect = containerEl.getBoundingClientRect();
  const pointer = screenPointToLayout(event, containerEl);
  const containerLeft =
    (containerRect.left - metrics.rect.left) / metrics.scaleX;
  const containerTop = (containerRect.top - metrics.rect.top) / metrics.scaleY;
  dragOffsetX = pointer.x - containerLeft;
  dragOffsetY = pointer.y - containerTop;
};

const onMouseMove = (event) => {
  if (!isDragging) return;
  const containerEl = dragContainerEl;
  const metrics = getPositionContextMetrics(containerEl);
  const pointer = screenPointToLayout(event, containerEl);
  const containerWidth = containerEl?.offsetWidth || 0;
  const containerHeight = containerEl?.offsetHeight || 0;
  const maxLeft = Math.max(0, metrics.width - containerWidth);
  const maxTop = Math.max(0, metrics.height - containerHeight);
  const nextLeft = Math.min(Math.max(0, pointer.x - dragOffsetX), maxLeft);
  const nextTop = Math.min(Math.max(0, pointer.y - dragOffsetY), maxTop);

  popupPosition.value = {
    left: `${nextLeft}px`,
    top: `${nextTop}px`,
  };
};

const onMouseUp = () => {
  isDragging = false;
  dragContainerEl = null;
};

const syncTableHeaderWidth = () => {
  if (!vdcTableRef.value || !vdcTbodyRef.value) return;
  const scrollbarWidth =
    vdcTbodyRef.value.offsetWidth - vdcTbodyRef.value.clientWidth;
  vdcTableRef.value.style.setProperty(
    '--vdc-scrollbar-width',
    `${Math.max(scrollbarWidth, 0)}px`
  );
};

const onWindowResize = () => {
  myChart?.resize();
  syncTableHeaderWidth();
};

// 接收父组件传递的参数
const props = defineProps({
  vehicleData: {
    type: Object,
    default: () => {},
  },
  vehicleType: {
    type: String,
    default: 'exception',
  },
  overlayScope: {
    type: String,
    default: 'viewport',
  },
});

// 处理车辆数据并转换为表格数据格式
const tableData = ref([]);
const isLoading = ref(false);
const chartLoading = ref(false); // 图表加载状态

const parseStartTradeTimeTs = (histime) => {
  if (!histime || typeof histime !== 'string') return null;
  const match = histime.match(/^\('(.*?)','(.*?)'\)$/);
  const startTime = match?.[1] || '';
  if (!startTime) return null;
  const ts = new Date(startTime).getTime();
  return Number.isNaN(ts) ? null : ts;
};

const formatTimeToHms = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const timeMatch = text.match(/(\d{2}:\d{2}:\d{2})/);
  if (timeMatch?.[1]) return timeMatch[1];

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// 获取滞留信息数据
const fetchRetentionInfo = async (passid) => {
  if (!passid) return;

  isLoading.value = true;
  try {
    // 计算当前时间
    const nowTime = getTimeMinusMinutes(0);

    // 发送API请求
    const response = await http.get(API_URLS.putian_highway.getRetentionInfo, {
      passid,
      nowTime,
    });

    // 处理返回的数据
    if (response) {
      // 检查返回的数据是否为数组
      const apiData = Array.isArray(response) ? response : [response];

      // 处理时间区间格式：将('xxx','xxx')转换为xxx-xxx
      const formatTimeInterval = (timeStr) => {
        if (!timeStr) return '';
        const match = timeStr.match(/^\('(.*?)','(.*?)'\)$/);
        if (!match) return formatTimeToHms(timeStr);
        const startTime = formatTimeToHms(match[1]);
        const endTime = formatTimeToHms(match[2]);
        return [startTime, endTime].filter(Boolean).join('-');
      };

      // 将返回的数据转换为表格需要的格式
      const processedData = apiData.map((item) => ({
        name: `${item.ennodename || '未知入口'} -> ${item.exnodename || '未知出口'}`, // 拼接进入门架名称和出门架名称
        time: formatTimeInterval(item.histime) || '', // 使用格式化后的时间区间
        avgSpeed: item.avgspeed || 0, // 使用平均速度
        speed: item.prespeed || 0, // 当前速度
        startTimeTs: parseStartTradeTimeTs(item.histime),
      }));

      // 按“起始交易时间”升序排序，无法解析时间的记录排在最后
      processedData.sort((a, b) => {
        if (a.startTimeTs === null && b.startTimeTs === null) return 0;
        if (a.startTimeTs === null) return 1;
        if (b.startTimeTs === null) return -1;
        return a.startTimeTs - b.startTimeTs;
      });

      tableData.value = processedData;
    }
  } catch (error) {
    console.error('获取滞留信息失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 获取特情图表数据
const fetchTeQingChartData = async (plate) => {
  if (!plate) return;

  chartLoading.value = true;
  try {
    // 发送API请求
    const response = await http.get(
      API_URLS.putian_highway.getTeQingChartByPlate,
      {
        plate,
      }
    );

    // console.log(response);
    // 处理返回的数据
    if (response && Array.isArray(response)) {
      // 排序数据：按时间从小到大
      const sortedData = response.sort(
        (a, b) => new Date(a.happenTime) - new Date(b.happenTime)
      );
      // 更新图表数据
      updateChartData(sortedData);
    } else {
      updateChartData([]);
    }
  } catch (error) {
    console.error('获取特情图表数据失败:', error);
  } finally {
    chartLoading.value = false;
  }
};

// 更新图表数据
const updateChartData = (data) => {
  if (!myChart) return;

  const groupedByTime = new Map();
  const contentSet = new Set();
  const contentTotalMap = new Map();

  data.forEach((item) => {
    const happenTime = item?.happenTime || '-';
    const content = item?.content || '未知类型';
    const cnt = Number.parseInt(item?.cnt, 10) || 0;

    contentSet.add(content);
    contentTotalMap.set(content, (contentTotalMap.get(content) || 0) + cnt);

    if (!groupedByTime.has(happenTime)) {
      groupedByTime.set(happenTime, {});
    }
    const timeBucket = groupedByTime.get(happenTime);
    timeBucket[content] = (timeBucket[content] || 0) + cnt;
  });

  const xAxisData = Array.from(groupedByTime.keys()).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const legendData = Array.from(contentSet).filter((content) => {
    if (content !== '未知类型') return true;
    return (contentTotalMap.get(content) || 0) > 0;
  });
  const series = legendData.map((content, index) => ({
    name: content,
    type: 'bar',
    barMaxWidth: 28,
    data: xAxisData.map((time) => {
      const value = groupedByTime.get(time)?.[content] || 0;
      return value > 0 ? value : null;
    }),
    itemStyle: {
      color: CHART_COLORS[index % CHART_COLORS.length],
      borderRadius: [2, 2, 0, 0],
    },
    label: {
      show: true,
      position: 'top',
      color: '#fff',
      fontSize: 10,
      formatter: (params) => (params.value > 0 ? params.value : ''),
    },
  }));

  // 更新图表配置
  myChart.setOption({
    legend: {
      data: legendData,
    },
    xAxis: {
      data: xAxisData,
    },
    series,
  });
};

// 监听vehicleData变化并获取滞留信息和图表数据
watch(
  () => props.vehicleData,
  async (newData) => {
    if (newData) {
      // 如果有车牌，则获取特情图表数据
      // console.log(newData.plate);
      if (newData.plate) {
        fetchTeQingChartData(newData.plate);
      }
      // 如果有passid，则获取滞留信息
      if (newData.passid) {
        await fetchRetentionInfo(newData.passid);
        await nextTick();
        syncTableHeaderWidth();
      } else {
        // 否则清空表格数据
        tableData.value = [];
        await nextTick();
        syncTableHeaderWidth();
      }
    }
  },
  { immediate: true, deep: true }
);

const initChart = () => {
  if (!chartRef.value) return;
  myChart = echarts.init(chartRef.value);

  const option = {
    grid: {
      top: '26%',
      left: '5%',
      right: '5%',
      bottom: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      top: 4,
      right: 12,
      textStyle: {
        color: '#a0c2ed',
        fontSize: 12,
      },
      itemWidth: 12,
      itemHeight: 8,
      data: [],
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: { lineStyle: { color: '#1e3a5f' } },
      axisLabel: {
        color: '#88a9d4',
        fontSize: 10,
        interval: 0, // 👈 强制显示所有标签
        rotate: 30, // 👈 如果标签太长挤在一起，可以设置旋转角度
      },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e3a5f', type: 'solid' } },
      axisLabel: { color: '#88a9d4' },
    },
    series: [],
  };
  myChart.setOption(option);
};

onMounted(() => {
  initChart();
  nextTick(() => {
    syncTableHeaderWidth();
  });
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('resize', onWindowResize);
  myChart?.dispose();
});
</script>

<style lang="less" scoped>
/* 使用 vdc- 前缀确保样式隔离 */
/* 半透明背景遮罩 */
.vdc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;

  &.overlay-right-panel {
    top: 90px;
    right: 20px;
    bottom: 30px;
    left: auto;
    width: 480px; /* 25vw @ 1920 */
  }
}

/* 弹窗容器 */
.vdc-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: #0b2555;
  border: 1px solid #0b4a9a;
  padding: 0px;
  border-radius: 4px;
  color: #ffffff;
  box-shadow: inset 0 0 20px rgba(0, 102, 255, 0.2);
  z-index: 1001; /* 确保弹窗在遮罩层上方 */
}

.vdc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
  // border-bottom: 2px solid #0091ff;
  padding-bottom: 8px;
  margin-bottom: 12px;
  background-image: url('@/assets/popup/img-header@2x.png');
  background-size: 100% 100%;
  // padding: 0 15px;
}

.vdc-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

.vdc-subtitle-row {
  margin: 0 20px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.vdc-close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.7;
}

.vdc-close-btn:hover {
  opacity: 1;
}

.vdc-subtitle {
  color: #54dbff;
  font-size: 14px;
  margin-bottom: 12px;
}

.vdc-table {
  --vdc-scrollbar-width: 0px;
  --vdc-col-name-width: 52.3%;
  --vdc-col-time-width: 30%;
  --vdc-col-speed-width: 17%;
  width: 100%;
  border-collapse: collapse;
  background: #0a2a68;
  table-layout: fixed;
  height: 100%;
}

.vdc-table thead {
  display: block;
  width: 100%;
}

.vdc-head-row,
.vdc-tbody-scroll .vdc-tr {
  display: table;
  table-layout: fixed;
  text-align: center;
}

.vdc-head-row {
  width: calc(100% - var(--vdc-scrollbar-width));
}

.vdc-tbody-scroll .vdc-tr {
  width: 100%;
}

.vdc-tbody-scroll {
  display: block;
  width: 100%;
  height: calc(100% - 36px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.vdc-th {
  color: #7ab1ff;
  font-size: 12px;
  font-weight: normal;
  padding: 8px;
  border: 1px solid #073070;
}

.vdc-th:nth-child(1),
.vdc-td:nth-child(1) {
  width: var(--vdc-col-name-width); /* 区段名称 */
}

.vdc-th:nth-child(2),
.vdc-td:nth-child(2) {
  width: var(--vdc-col-time-width); /* 起始交易时间 */
}

.vdc-th:nth-child(3),
.vdc-td:nth-child(3) {
  width: var(--vdc-col-speed-width); /* 区段平均速度 */
}

.vdc-td {
  padding: 8px;
  text-align: center;
  font-size: 13px;
  border: 1px solid #073070;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vdc-chart-canvas {
  width: 100%;
  height: 220px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 220px;
  margin-top: 20px;
}

.vdc-chart-floating-title {
  position: absolute;
  top: 4px;
  left: 20px;
  z-index: 2;
  margin-top: 10px;
  font-size: 13px;
  color: #fff;
  line-height: 20px;
  pointer-events: none;
}

/* 加载状态样式 */
.vdc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #00eaff;
}

.vdc-loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 234, 255, 0.3);
  border-top-color: #00eaff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.vdc-loading-text {
  margin-top: 10px;
  font-size: 14px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
