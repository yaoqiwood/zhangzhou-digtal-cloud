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
          {{
            props.vehicleType === 'exception' ? '特情车辆详情' : '滞留车辆详情'
          }}
        </h2>
        <button class="vdc-close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="vdc-subtitle vdc-subtitle-row">
        <span class="vdc-subtitle-left">
          车牌：{{ props.vehicleData.plate || '未知车牌' }}
        </span>
        <span class="vdc-subtitle-center">
          车型：{{ props.vehicleData.vehType || '未知车型' }}
        </span>
        <span class="vdc-subtitle-right">
          滞留区段：{{ props.vehicleData.sectionName || '未知区段' }}
        </span>
      </div>
      <div class="vdc-body">
        <div class="vdc-table-panel">
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
                <th class="vdc-th">起止交易时间</th>
                <th class="vdc-th">速度（km/h）</th>
              </tr>
            </thead>
            <tbody
              ref="vdcTbodyRef"
              class="vdc-tbody-scroll"
              @scroll="hideTimeTooltip"
            >
              <tr
                v-for="(item, index) in tableData"
                :key="index"
                class="vdc-tr"
                :class="{ 'vdc-tr-active': isMatchedSection(item.name) }"
              >
                <td class="vdc-td" :title="item.name">{{ item.name }}</td>
                <td
                  class="vdc-td vdc-time-cell"
                  @mouseenter="
                    showTimeTooltip($event, item.fullTime || item.time)
                  "
                  @mousemove="moveTimeTooltip"
                  @mouseleave="hideTimeTooltip"
                >
                  <span class="vdc-time-text">{{ item.time }}</span>
                </td>
                <td class="vdc-td" :title="Number(item.avgSpeed).toFixed(2)">
                  {{ Number(item.avgSpeed).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="vehicleType === 'exception'" class="vdc-chart-info">
          <span class="vdc-chart-label">历史车辆特情频次直方图</span>
          <div class="vdc-legend">
            <span class="vdc-legend-icon"></span>
            <span class="vdc-legend-text">蓝闽A876AB</span>
          </div>
        </div>

        <div class="vdc-chart-wrap">
          <VehicleSpeedTrendChart v-if="!isLoading" :apiData="tableData" />
          <div v-else class="vdc-chart-loading-placeholder"></div>
        </div>
      </div>

      <div
        v-show="timeTooltip.visible"
        ref="timeTooltipRef"
        class="vdc-time-tooltip-floating"
        :style="{
          left: `${timeTooltip.left}px`,
          top: `${timeTooltip.top}px`,
        }"
      >
        {{ timeTooltip.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue';

import * as echarts from 'echarts';
import VehicleSpeedTrendChart from '../chart/VehicleSpeedTrendChart.vue';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import http from '@/utils/http.js';
import { REGION_IDS } from '@/utils/constants.js';
import { getTimeMinusMinutes } from '@/utils/tools.js';
// 定义组件名称
defineOptions({
  name: 'VehicleDetailCard',
});

const chartRef = ref(null);
const vdcTableRef = ref(null);
const vdcTbodyRef = ref(null);
const timeTooltipRef = ref(null);
let myChart = null;

const popupPosition = ref({
  left: '1%',
  top: '20%',
});

const popupStyle = computed(() => ({
  left: popupPosition.value.left,
  top: popupPosition.value.top,
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

const timeTooltip = ref({
  visible: false,
  text: '',
  left: 0,
  top: 0,
});

let lastTooltipMouseEvent = null;

const updateTimeTooltipPosition = (event) => {
  if (!timeTooltip.value.visible) return;
  const tooltipEl = timeTooltipRef.value;
  if (!tooltipEl || !event) return;

  const gap = 12;
  const padding = 8;
  const verticalOffset = 30;
  const horizontalOffset = 30;
  const tooltipWidth = tooltipEl.offsetWidth || 0;
  const tooltipHeight = tooltipEl.offsetHeight || 0;

  let left = event.clientX + gap - horizontalOffset;
  let top = event.clientY - tooltipHeight - gap + verticalOffset;

  if (left + tooltipWidth > window.innerWidth - padding) {
    left = window.innerWidth - tooltipWidth - padding;
  }
  if (left < padding) {
    left = padding;
  }

  if (top < padding) {
    top = event.clientY + gap + verticalOffset;
  }
  if (top + tooltipHeight > window.innerHeight - padding) {
    top = window.innerHeight - tooltipHeight - padding;
  }

  timeTooltip.value.left = left;
  timeTooltip.value.top = top;
};

const showTimeTooltip = (event, text) => {
  timeTooltip.value.text = String(text || '');
  timeTooltip.value.visible = true;
  lastTooltipMouseEvent = event;
  nextTick(() => updateTimeTooltipPosition(event));
};

const moveTimeTooltip = (event) => {
  if (!timeTooltip.value.visible) return;
  lastTooltipMouseEvent = event;
  updateTimeTooltipPosition(event);
};

const hideTimeTooltip = () => {
  timeTooltip.value.visible = false;
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

const scrollToMatchedSection = () => {
  if (!vdcTbodyRef.value) return;
  const activeRow = vdcTbodyRef.value.querySelector('.vdc-tr-active');
  if (!activeRow) return;

  const container = vdcTbodyRef.value;
  const targetTop =
    activeRow.offsetTop - container.clientHeight / 2 + activeRow.clientHeight;

  container.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: 'smooth',
  });
};

const onWindowResize = () => {
  myChart?.resize();
  syncTableHeaderWidth();
  if (timeTooltip.value.visible && lastTooltipMouseEvent) {
    updateTimeTooltipPosition(lastTooltipMouseEvent);
  }
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

const normalizeSectionName = (value) =>
  String(value ?? '')
    .replace(/\s*(->|→|-+)\s*/g, '->')
    .replace(/\s+/g, '')
    .trim();

const isMatchedSection = (sectionName) => {
  const currentSectionName = normalizeSectionName(
    props.vehicleData?.sectionName
  );
  if (!currentSectionName) return false;
  const normalizedTableSectionName = normalizeSectionName(sectionName);
  const isMatched = normalizedTableSectionName === currentSectionName;

  console.log('[DetainedVehiclePopup] 区段匹配调试', {
    matched: isMatched,
    vehicleSectionName: props.vehicleData?.sectionName || '',
    tableSectionName: sectionName || '',
    normalizedVehicleSectionName: currentSectionName,
    normalizedTableSectionName,
  });

  return isMatched;
};

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

const normalizeSpeedValue = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed)) {
    return Number(parsed.toFixed(2));
  }
  return fallback;
};

const buildManualAppendRecord = (vehicleData) => {
  if (!vehicleData || typeof vehicleData !== 'object') return null;

  const source = vehicleData.manualAppendRecord || {};
  const sectionName = String(
    source?.name || vehicleData?.sectionName || ''
  ).trim();

  if (!sectionName) return null;

  const avgSpeed = normalizeSpeedValue(
    source?.avgSpeed ?? source?.speed ?? vehicleData?.currentSpeed,
    0
  );
  const speed = normalizeSpeedValue(source?.speed, avgSpeed);

  return {
    name: sectionName,
    time: String(source?.time ?? '').trim(),
    fullTime: String(source?.fullTime ?? '').trim(),
    avgSpeed,
    speed,
    startTimeTs: Number.POSITIVE_INFINITY,
  };
};

// 获取滞留信息数据
const fetchRetentionInfo = async (passid) => {
  if (!passid) return;

  isLoading.value = true;
  tableData.value = [];
  try {
    let processedData = [];
    // 计算当前时间
    const nowTime = getTimeMinusMinutes(0);

    // 发送API请求
    const response = await http.get(FUZHOU_API_URLS.specialEvent.getRetentionInfo, {
      passid,
      nowTime,
      origid: REGION_IDS.FUZHOU,
    });

    // 处理返回的数据
    if (response) {
      // console.log(passid);
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

      const formatFullTimeInterval = (timeStr) => {
        if (!timeStr) return '';
        return timeStr.replace(/^\('(.*?)','(.*?)'\)$/, '$1-$2');
      };

      // 将返回的数据转换为表格需要的格式
      processedData = apiData.map((item) => ({
        name: `${item.ennodename || '未知入口'} -> ${item.exnodename || '未知出口'}`, // 拼接进入门架名称和出门架名称
        time: formatTimeInterval(item.histime) || '', // 使用格式化后的时间区间
        fullTime: formatFullTimeInterval(item.histime) || '',
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
    }

    const manualAppendRecord = buildManualAppendRecord(props.vehicleData);
    tableData.value = manualAppendRecord
      ? [...processedData, manualAppendRecord]
      : processedData;
  } catch (error) {
    console.error('获取滞留信息失败:', error);
    const manualAppendRecord = buildManualAppendRecord(props.vehicleData);
    tableData.value = manualAppendRecord ? [manualAppendRecord] : [];
  } finally {
    isLoading.value = false;
  }
};

// 监听vehicleData变化并获取滞留信息
watch(
  () => props.vehicleData,
  async (newData) => {
    if (newData && newData.passid) {
      // 如果有passid，则获取滞留信息
      await fetchRetentionInfo(newData.passid);
      await nextTick();
      syncTableHeaderWidth();
      scrollToMatchedSection();
    } else {
      // 否则使用传入的数据
      const manualAppendRecord = buildManualAppendRecord(newData);
      tableData.value = manualAppendRecord ? [manualAppendRecord] : [];
      await nextTick();
      syncTableHeaderWidth();
    }
  },
  { immediate: true, deep: true }
);

const initChart = () => {
  if (!chartRef.value) return;
  myChart = echarts.init(chartRef.value);

  const option = {
    grid: {
      top: '15%',
      left: '5%',
      right: '5%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: [
        '1.1',
        '1.2',
        '1.3',
        '1.4',
        '1.5',
        '1.6',
        '1.7',
        '1.8',
        '1.9',
        '1.10',
        '1.11',
        '1.12',
        '1.13',
        '1.14',
        '1.15',
      ],
      axisLine: { lineStyle: { color: '#1e3a5f' } },
      axisLabel: { color: '#88a9d4', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e3a5f', type: 'solid' } },
      axisLabel: { color: '#88a9d4' },
      max: 30,
    },
    series: [
      {
        type: 'bar',
        barWidth: '45%',
        data: [29, 12, 23, 18, 18, 18, 13, 23, 19, 28, 22, 9, 0, 22, 4],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#54dbff' },
            { offset: 1, color: '#0066ff' },
          ]),
          borderRadius: [2, 2, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#fff',
          fontSize: 10,
        },
      },
    ],
  };
  myChart.setOption(option);
};

onMounted(() => {
  initChart();
  nextTick(() => {
    syncTableHeaderWidth();
    scrollToMatchedSection();
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
  width: 600px;
  height: 600px;
  display: flex;
  flex-direction: column;
  background: #0b2555;
  border: 1px solid #0b4a9a;
  padding: 0px;
  border-radius: 4px;
  box-sizing: border-box;
  color: #ffffff;
  box-shadow: inset 0 0 20px rgba(0, 102, 255, 0.2);
  z-index: 1001; /* 确保弹窗在遮罩层上方 */
  overflow: hidden;
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

.vdc-subtitle-left {
  text-align: left;
}

.vdc-subtitle-center {
  text-align: left;
}

.vdc-subtitle-right {
  text-align: left;
  word-break: break-all;
  white-space: normal;
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
  flex-shrink: 0;
}

.vdc-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 20px;
}

.vdc-table-panel {
  flex: 0 0 42%;
  min-height: 0;
  padding: 0 20px;
}

.vdc-table {
  --vdc-scrollbar-width: 0px;
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

.vdc-tbody-scroll .vdc-tr.vdc-tr-active {
  background: rgba(84, 219, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(84, 219, 255, 0.45);
}

.vdc-tbody-scroll .vdc-tr.vdc-tr-active .vdc-td {
  color: #8fe9ff;
  font-weight: 600;
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
  width: 46.3%; /* 区段名称 */
}

.vdc-th:nth-child(2),
.vdc-td:nth-child(2) {
  width: 36%; /* 起止交易时间（加宽） */
}

.vdc-th:nth-child(3),
.vdc-td:nth-child(3) {
  width: 16.5%; /* 区段平均速度 */
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

.vdc-time-cell {
  position: relative;
  overflow: visible;
}

.vdc-time-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vdc-time-tooltip-floating {
  position: fixed;
  max-width: 360px;
  padding: 6px 10px;
  border: 1px solid #2a5fa8;
  border-radius: 4px;
  background: rgba(6, 25, 61, 0.96);
  color: #d8ecff;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  z-index: 3000;
  pointer-events: none;
}

.vdc-chart-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding: 0 20px;
  margin-bottom: 8px;
}

.vdc-chart-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  padding: 0 20px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.vdc-chart-wrap :deep(.vst-container) {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.vdc-chart-loading-placeholder {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid rgba(30, 58, 95, 0.5);
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(11, 37, 85, 0.9) 0%,
    rgba(19, 56, 116, 0.9) 50%,
    rgba(11, 37, 85, 0.9) 100%
  );
  background-size: 200% 100%;
  animation: vdc-chart-loading-shimmer 1.4s ease-in-out infinite;
}

.vdc-chart-label {
  font-size: 13px;
  color: #fff;
}

.vdc-legend {
  display: flex;
  align-items: center;
}

.vdc-legend-icon {
  width: 12px;
  height: 8px;
  background: #0066ff;
  margin-right: 6px;
}

.vdc-legend-text {
  font-size: 12px;
  color: #a0c2ed;
}

.vdc-chart-canvas {
  width: 100%;
  height: 220px;
}

/* 加载状态样式 */
.vdc-loading {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
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

@keyframes vdc-chart-loading-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
