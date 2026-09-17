<template>
  <div class="dashboard-container_inner">
    <div class="stats-grid_inner">
      <div
        v-for="item in stats"
        :key="item.label"
        class="stat-card_inner"
        :class="{ 'is-active': selectedType === item.label }"
        @click="toggleFilter(item.label)"
        style="cursor: pointer"
      >
        <div class="stat-icon_inner">
          <img :src="item.icon" alt="" class="stat-icon-img_inner" />
        </div>
        <div class="stat-info_inner">
          <p class="stat-label_inner">{{ item.label }}</p>
          <p class="stat-value_inner">{{ item.value }}</p>
        </div>
      </div>
    </div>

    <div
      class="event-table-container_inner"
      v-if="shouldShowEventTable"
      :class="{ 'is-empty': displayEvents.length === 0 }"
    >
      <table
        class="event-table_inner"
        :class="{ 'has-scroll': shouldShowScroll }"
      >
        <thead>
          <tr>
            <th class="text-center_inner col-desc">事件描述路线</th>
            <th class="text-center_inner col-location">位置</th>
            <th class="text-center_inner col-time">发送时间</th>
            <th class="text-center_inner col-status">处理状态</th>
            <th class="text-center_inner col-action">操作栏</th>
          </tr>
        </thead>
        <tbody
          ref="tableBodyRef"
          :class="{
            'has-scroll': shouldShowScroll,
            expanded: expanded,
            'other-hidden': isOtherComponentsHidden,
            'is-empty': displayEvents.length === 0,
          }"
        >
          <tr
            v-for="(event, index) in displayEvents"
            :key="index"
            :class="{ 'is-highlighted': isHighlightedEventRow(event) }"
            :data-event-signature="event.eventSignature || ''"
          >
            <td class="event-desc_inner col-desc">
              <div class="scroll-wrapper_inner">
                <div class="scroll-content_inner" :title="event.description">
                  <i
                    class="type-icon_inner"
                    :class="getEventTypeIcon(event.eventType)"
                  ></i>
                  <span class="description-text_inner">{{
                    event.description
                  }}</span>
                  <i
                    class="type-icon_inner"
                    :class="getEventTypeIcon(event.eventType)"
                    aria-hidden="true"
                  ></i>
                  <span class="description-text_inner" aria-hidden="true">{{
                    event.description
                  }}</span>
                </div>
              </div>
            </td>
            <td class="text-center_inner col-location event-location_inner">
              <div class="scroll-wrapper-location_inner">
                <div
                  class="scroll-content-location_inner"
                  :title="event.location"
                >
                  <span class="location-text_inner">{{ event.location }}</span>
                  <span class="location-text_inner" aria-hidden="true">{{
                    event.location
                  }}</span>
                </div>
              </div>
            </td>
            <td class="text-center_inner col-time" :title="event.time">
              {{ formatTime(event.time) }}
            </td>
            <td
              class="text-center_inner col-status"
              :class="statusClass(event.status)"
              :title="event.status"
            >
              {{ event.status }}
            </td>
            <td
              class="text-center_inner col-action action-detail_inner"
              @click="showEventDetail(event)"
              title="点击查看详情"
            >
              详情
            </td>
          </tr>
          <tr v-if="showEventNoDataRow" class="no-data-row_inner">
            <td colspan="5" class="no-data-cell_inner">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- <VideoPopup v-if="showDetailPopup" @close="showDetailPopup = false" /> -->
    <div v-if="loading" class="loading-mask">
      <div class="loading-spinner"></div>
      <p>正在加载...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, watch, nextTick } from 'vue';
import { API_URLS } from '@/utils/apiUrls.js';
import http from '@/utils/http.js';
import {
  enrichTrafficEventCoordinateData,
  enrichTrafficEventCoordinateDataList,
} from '@/utils/trafficEventCoordinates.js';
// import VideoPopup from './popup/VideoPopup.vue';

// 定义组件接收的props
const props = defineProps({
  // 是否展开显示所有数据
  expanded: {
    type: Boolean,
    default: false,
  },
  // 实时路况信息卡片是否可见
  isRealTimeTrafficVisible: {
    type: Boolean,
    default: true,
  },
  // 区段重点车辆管理卡片是否可见
  isSectionVehicleManagementVisible: {
    type: Boolean,
    default: true,
  },
  // 交通事件数据
  events: {
    type: Array,
    default: () => [],
  },
  highlightEventSignature: {
    type: String,
    default: '',
  },
});

// 定义组件的事件
const emit = defineEmits([
  'show-video-columns',
  'update-total-events',
  'show-traffic-event-detail',
]);

// 强制定义组件名
defineOptions({
  name: 'TrafficEventInner',
});

// 计算是否需要显示所有数据（当任意卡片被隐藏或展开时）
const shouldShowAllData = computed(() => {
  return (
    props.expanded ||
    !props.isRealTimeTrafficVisible ||
    !props.isSectionVehicleManagementVisible
  );
});

// 新增：筛选方法
const toggleFilter = (label) => {
  // 如果点击的是已选中的，则取消筛选（显示全部）；否则切换到新类型
  // 注意：这里的 label 要和数据中的 item.label 或 eventType 对应
  if (selectedType.value === label) {
    selectedType.value = null;
  } else {
    selectedType.value = label;
  }
};

const normalizeEventCategory = (eventType) => {
  const typeText = String(eventType || '');

  if (typeText.includes('事故')) return '交通事故';
  if (typeText.includes('施工') || typeText.includes('养护')) return '施工养护';
  if (typeText.includes('自然灾害') || typeText.includes('灾害'))
    return '自然灾害';
  return '其他';
};

const buildEventLocation = (item) => {
  const routeName = item?.routeName || item?.route || '';
  const kmStart = item?.kmStart || '';
  const kmEnd = item?.kmEnd || '';
  const direction = item?.direction || '';

  const stake =
    kmStart && kmEnd && kmStart !== kmEnd ? `${kmStart}-${kmEnd}` : kmStart;

  return [routeName, stake, direction].filter(Boolean).join(' ');
};

const buildEventRoute = (item) => {
  const routeName = item?.routeName || item?.route || '';
  const kmStart = item?.kmStart || '';
  const kmEnd = item?.kmEnd || '';

  if (kmStart && kmEnd && kmStart !== kmEnd) {
    return `${routeName}${kmStart}-${kmEnd}`;
  }

  return `${routeName}${kmStart}`;
};

const normalizeEventSignaturePart = (value) => String(value ?? '').trim();

const mapTrafficEventItem = (item, coordinateData = null) => {
  const normalizedCoordinateData =
    coordinateData || enrichTrafficEventCoordinateData(item) || {};
  const originalData = {
    ...(item || {}),
    ...normalizedCoordinateData,
  };

  return {
    description: item?.content,
    location: buildEventLocation(item),
    time: item?.happenTime,
    status: item?.eventStatus,
    eventStatus: item?.eventStatus,
    color: getEventColor(item?.eventType),
    eventType: item?.eventType,
    route: buildEventRoute(item),
    handleContent: item?.handleContent,
    eventSignature: getTrafficEventSignature(item),
    ...normalizedCoordinateData,
    originalData,
  };
};

const getTrafficEventSignature = (item) => {
  if (!item || typeof item !== 'object') return '';
  const source = item?.originalData || item;
  const primary = normalizeEventSignaturePart(
    source?.eventNo ?? source?.eventId ?? source?.id
  );
  if (primary) return `event:${primary}`;

  const signatureParts = [
    normalizeEventSignaturePart(source?.content ?? item?.description),
    normalizeEventSignaturePart(source?.routeName ?? item?.route),
    normalizeEventSignaturePart(source?.kmStart),
    normalizeEventSignaturePart(source?.kmEnd),
    normalizeEventSignaturePart(source?.direction),
    normalizeEventSignaturePart(source?.happenTime ?? item?.time),
  ];
  if (signatureParts.every((part) => !part)) return '';
  return `event:${signatureParts.join('|')}`;
};

const normalizeTrafficEventResponse = (response) => {
  const payload =
    response && typeof response === 'object' && response.data !== undefined
      ? response.data
      : response;

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  return Object.values(payload).flatMap((item) =>
    Array.isArray(item) ? item : []
  );
};

const isRequestTimeoutError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const name = String(error?.name || '').toLowerCase();
  const message = String(error?.message || error || '').toLowerCase();
  return (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    name.includes('timeout') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('超时')
  );
};

const isRequestNetworkError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || error || '').toLowerCase();
  return (
    code === 'ERR_NETWORK' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH' ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('disconnected') ||
    message.includes('offline') ||
    message.includes('断网') ||
    message.includes('网络')
  );
};

const isRetainableRequestError = (error) =>
  isRequestTimeoutError(error) || isRequestNetworkError(error);

const isTimeoutLikeResponse = (payload) => {
  if (!payload || typeof payload !== 'object') return false;
  const code = String(payload?.code || '').toUpperCase();
  const message = String(
    payload?.message || payload?.msg || payload?.error || ''
  ).toLowerCase();
  return (
    code === '408' ||
    code.includes('TIMEOUT') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('超时')
  );
};

const buildStatsFromEventList = (eventList) => {
  const counters = {
    其他: 0,
    交通事故: 0,
    施工养护: 0,
    自然灾害: 0,
  };

  eventList.forEach((item) => {
    const category = normalizeEventCategory(item?.eventType);
    counters[category] += 1;
  });

  return [
    {
      label: '其他',
      value: counters.其他,
      color: '#FFA500',
      icon: warningIcon,
    },
    {
      label: '交通事故',
      value: counters.交通事故,
      color: '#FF4D4D',
      icon: trafficAccidentIcon,
    },
    {
      label: '施工养护',
      value: counters.施工养护,
      color: '#ADFF2F',
      icon: maintenanceIcon,
    },
    {
      label: '自然灾害',
      value: counters.自然灾害,
      color: '#D2B48C',
      icon: naturalDisasterIcon,
    },
  ];
};

const getEventTimeValue = (event) => {
  const timestamp = new Date(event?.time || '').getTime();
  return Number.isNaN(timestamp) ? -Infinity : timestamp;
};

// 计算要显示的事件数据
const baseEventList = computed(() =>
  props.events.length > 0 ? props.events : events.value
);

const displayEvents = computed(() => {
  const filteredEvents = !selectedType.value
    ? [...baseEventList.value]
    : baseEventList.value.filter((event) => {
        return normalizeEventCategory(event.eventType) === selectedType.value;
      });

  return filteredEvents.sort(
    (a, b) => getEventTimeValue(b) - getEventTimeValue(a)
  );
});

const hasLoadedEventTable = ref(false);
const shouldShowEventTable = computed(
  () => !hasLoadedEventTable.value || baseEventList.value.length > 0
);
const showEventNoDataRow = computed(
  () => hasLoadedEventTable.value && displayEvents.value.length === 0
);

// 从 API 获取交通事件数据
const fetchTrafficEventData = async (options = {}) => {
  const { showLoading = true } = options;
  if (showLoading) {
    loading.value = true;
  }
  try {
    const response = await http.get(
      API_URLS.putian_highway.getTrafficEventInfo,
      {
        origid: 1594,
      }
    );

    if (isTimeoutLikeResponse(response)) {
      console.warn('交通事件接口返回超时信息，保留当前列表数据');
      return {
        eventList: rawEventList.value,
        mappedEventList: events.value,
        stale: true,
      };
    }

    // 关键点：获取新数据后重置筛选状态
    selectedType.value = null;

    const eventList = normalizeTrafficEventResponse(response);
    rawEventList.value = eventList;

    const coordinateDataList = enrichTrafficEventCoordinateDataList(eventList);
    const mappedEvents =
      eventList.length > 0
        ? eventList.map((item, index) =>
            mapTrafficEventItem(item, coordinateDataList[index])
          )
        : [];
    events.value = mappedEvents;

    stats.value = buildStatsFromEventList(eventList);

    // 将总数传递给父组件
    const totalEvents = eventList.length;
    emit('update-total-events', totalEvents);
    return {
      eventList: rawEventList.value,
      mappedEventList: mappedEvents,
      stale: false,
    };
  } catch (error) {
    if (isRetainableRequestError(error)) {
      console.warn('交通事件数据请求失败，保留当前列表数据', error);
      return {
        eventList: rawEventList.value,
        mappedEventList: events.value,
        stale: true,
      };
    }
    console.error('获取交通事件数据失败:', error);
    return {
      eventList: rawEventList.value,
      mappedEventList: events.value,
      stale: true,
    };
  } finally {
    hasLoadedEventTable.value = true;
    if (showLoading) {
      loading.value = false;
    }
    // 重置滚动条到顶部
    if (tableBodyRef.value) {
      tableBodyRef.value.scrollTop = 0;
    }
  }
};

// 格式化时间，显示年月日并换行展示时分秒
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr; // 如果解析失败，返回原字符串

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month}月${day}日\n${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('时间格式化失败:', error);
    return timeStr;
  }
};

// 根据事件类型获取颜色
const getEventColor = (eventType) => {
  switch (eventType) {
    case '交通事故事件':
    case '交通事故':
      return '#FF4D4D';
    case '施工养护事件':
    case '施工养护':
      return '#ADFF2F';
    case '自然灾害事件':
      return '#D2B48C';
    case '其他紧急事件':
    default:
      return '#FFA500';
  }
};

// 根据事件类型获取图标类名
const getEventTypeIcon = (eventType) => {
  switch (eventType) {
    case '交通事故事件':
      return 'traffic-accident-icon_inner';
    case '施工养护事件':
      return 'maintenance-icon_inner';
    case '自然灾害事件':
      return 'natural-disaster-icon_inner';
    case '其他紧急事件':
    default:
      return 'warning-icon_inner';
  }
};

// 计算是否需要显示滚动条
const shouldShowScroll = computed(() => {
  return true; // 始终显示滚动条
});

// 计算是否有其他组件被隐藏
const isOtherComponentsHidden = computed(() => {
  return (
    !props.isRealTimeTrafficVisible || !props.isSectionVehicleManagementVisible
  );
});

// 导入图标资源
import warningIcon from '@/assets/warning@2x.png';
import trafficAccidentIcon from '@/assets/traffic_accident@2x(1).png';
import maintenanceIcon from '@/assets/maintenance@2x.png';
import naturalDisasterIcon from '@/assets/netural_disaster@2x.png';

const stats = ref([
  {
    label: '其他',
    value: 0,
    color: '#FFA500',
    icon: warningIcon,
  },
  {
    label: '交通事故',
    value: 0,
    color: '#FF4D4D',
    icon: trafficAccidentIcon,
  },
  {
    label: '施工养护',
    value: 0,
    color: '#ADFF2F',
    icon: maintenanceIcon,
  },
  {
    label: '自然灾害',
    value: 0,
    color: '#D2B48C',
    icon: naturalDisasterIcon,
  },
]);

// 初始化事件数组为空
const events = ref([]);
const rawEventList = ref([]);

// 新增：当前选中的筛选类型，null 表示显示全部
const selectedType = ref(null);

// 控制加载状态
const loading = ref(false);

// 表格 tbody 的引用
const tableBodyRef = ref(null);
// 计算处理状态的CSS类
const statusClass = (status) => {
  return status === '未处理'
    ? 'status-unprocessed_inner'
    : 'status-processed_inner';
};

// 显示事件详情
const showEventDetail = (event) => {
  console.log('查看事件详情:', event);
  // 触发 show-video-columns 事件，传递相关参数
  emit('show-video-columns', {
    type: 'event',
    data: event,
    source: 'TrafficEventMonitor',
  });
  // 触发父组件显示交通事件详情弹窗
  emit('show-traffic-event-detail', event);
};

const isHighlightedEventRow = (event) => {
  const currentSignature = String(event?.eventSignature || '');
  const targetSignature = String(props.highlightEventSignature || '');
  return Boolean(
    currentSignature && targetSignature && currentSignature === targetSignature
  );
};

const getSafeSelectorValue = (value) => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return String(value).replace(/["\\]/g, '\\$&');
};

const scrollHighlightedEventRowIntoView = async () => {
  if (!props.highlightEventSignature) return;
  await nextTick();
  const container = tableBodyRef.value;
  if (!container) return;
  const selectorValue = getSafeSelectorValue(props.highlightEventSignature);
  const targetRow = container.querySelector(
    `[data-event-signature="${selectorValue}"]`
  );
  if (!targetRow) return;

  const rowTop = targetRow.offsetTop;
  const rowHeight = targetRow.offsetHeight || 0;
  const containerHeight = container.clientHeight || 0;
  const targetScrollTop = Math.max(
    0,
    rowTop - containerHeight / 2 + rowHeight / 2
  );

  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  });
};

const focusEventBySignature = async (signature) => {
  const targetSignature = String(signature || '');
  if (!targetSignature) return null;

  selectedType.value = null;
  await nextTick();

  const baseEvents = props.events.length > 0 ? props.events : events.value;
  const matchedEvent = Array.isArray(baseEvents)
    ? baseEvents.find(
        (event) => String(event?.eventSignature || '') === targetSignature
      ) || null
    : null;

  if (!matchedEvent) return null;

  await nextTick();
  const container = tableBodyRef.value;
  if (!container) return matchedEvent;

  const selectorValue = getSafeSelectorValue(targetSignature);
  const targetRow = container.querySelector(
    `[data-event-signature="${selectorValue}"]`
  );

  if (!targetRow) return matchedEvent;

  const rowTop = targetRow.offsetTop;
  const rowHeight = targetRow.offsetHeight || 0;
  const containerHeight = container.clientHeight || 0;
  const targetScrollTop = Math.max(
    0,
    rowTop - containerHeight / 2 + rowHeight / 2
  );

  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  });

  return matchedEvent;
};

watch(
  () => props.highlightEventSignature,
  async (newVal) => {
    if (!newVal) return;
    selectedType.value = null;
    await scrollHighlightedEventRowIntoView();
  }
);

watch(
  displayEvents,
  async () => {
    if (!props.highlightEventSignature) return;
    await scrollHighlightedEventRowIntoView();
  },
  { deep: true }
);

// 暴露给父组件的方法
defineExpose({
  // 刷新交通事件数据
  refreshTrafficEvents: (options = {}) => fetchTrafficEventData(options),
  getRawEventList: () => rawEventList.value,
  focusEventBySignature,
});
</script>

<style scoped>
.dashboard-container_inner {
  /* padding: 10px; */
  color: #fff;
  font-family: sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 加载蒙层容器 */
.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  border-radius: 4px;
}

/* 旋转动画 */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 229, 255, 0.3);
  border-top: 3px solid #00e5ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.stats-grid_inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin-bottom: 10px;
  flex-shrink: 0; /* 确保统计信息区域不会被压缩 */
}

.stat-card_inner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 60px;
  transition: all 0.3s ease;
}

/* 新增激活状态样式 */
.stat-card_inner.is-active {
  background: rgba(0, 229, 255, 0.2); /* 亮蓝色背景 */
  border: 1px solid #00e5ff; /* 亮蓝色边框 */
  box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.3);
  transition: all 0.3s ease;
}

.stat-card_inner:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stat-icon-img_inner {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.stat-label_inner {
  font-size: 10px;
  color: #ccc;
  margin-bottom: 3px;
}

.stat-value_inner {
  font-size: 16px;
  font-weight: bold;
}

.event-table-container_inner {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  overflow: hidden;
  flex: 1; /* 填充剩余空间 */
  min-height: 0; /* 确保flex子元素能够正确收缩 */
  display: flex;
  flex-direction: column;
}

.table-header_inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background-color: rgba(0, 58, 140, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table-header_inner h3 {
  font-size: 12px;
  color: #fff;
  margin: 0;
}

.expand-btn_inner {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 10px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.expand-btn_inner:hover {
  background: rgba(255, 255, 255, 0.1);
}

.expand-icon_inner {
  display: inline-block;
  width: 12px;
  height: 12px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
}

.expand-icon_inner.expanded_inner {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M17 10l-5-5-5 5z'/%3E%3C/svg%3E");
}

/* 为表格内容添加纵向滚动条 */
.event-table_inner {
  display: flex;
  flex-direction: column;
  height: 100%; /* 填充容器高度 */
  overflow: hidden; /* 隐藏表格的滚动条，只在tbody显示 */
  width: 100%; /* 确保表格宽度为100% */
}

.event-table_inner thead,
.event-table_inner tbody {
  display: block;
  width: 100%; /* 确保thead和tbody宽度一致 */
}

.event-table_inner thead {
  /* 固定表头 */
  /* width: calc(100% - 17px); 减去滚动条宽度 */
}

.event-table_inner tbody {
  overflow-y: auto; /* 显示纵向滚动条 */
  flex: 1; /* 填充剩余空间 */
  min-height: 0; /* 确保flex子元素能够正确收缩 */
  width: 100%; /* 确保tbody宽度与表格一致 */
}

.event-table_inner tbody.has-scroll {
  overflow-y: auto; /* 显示纵向滚动条 */
}

.event-table_inner tbody.has-scroll.other-hidden {
  flex: 1; /* 填充剩余空间 */
}

.event-table_inner tbody.has-scroll.expanded {
  flex: 1; /* 填充剩余空间 */
}

.event-table-container_inner.is-empty .event-table_inner {
  height: auto;
}

.event-table_inner tbody.is-empty {
  flex: 0 0 auto;
  overflow-y: hidden;
}

/* 设置表格列宽 */
.event-table_inner .col-desc {
  width: 48%; /* 事件描述列宽度 */
}

.event-table_inner .col-location {
  width: 16%; /* 位置列宽度（再缩小） */
}

.event-table_inner .col-time {
  width: 13%; /* 时间列宽度 */
}

.event-table_inner .col-status {
  width: 13%; /* 状态列宽度（加宽） */
}

.event-table_inner thead {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 调整表头和单元格的宽度一致 */
.event-table_inner th,
.event-table_inner td {
  width: 100%;
  box-sizing: border-box;
}

.event-table_inner th:nth-child(1),
.event-table_inner td:nth-child(1) {
  width: 48%;
}

.event-table_inner th:nth-child(2),
.event-table_inner td:nth-child(2) {
  width: 16%;
}

.event-table_inner th:nth-child(3),
.event-table_inner td:nth-child(3) {
  width: 13%;
}

.event-table_inner th:nth-child(4),
.event-table_inner td:nth-child(4) {
  width: 13%;
}

.event-table_inner th:nth-child(5),
.event-table_inner td:nth-child(5) {
  width: 10%;
}

.event-table_inner tr {
  display: flex;
}

.event-table_inner {
  width: 100%;
  border-collapse: collapse;
  /* 移除 table-layout: fixed，使用自动布局以便更好地控制列宽 */
}

.event-table_inner th {
  background-color: #003a8c;
  color: #93c5fd;
  padding: 8px;
  font-size: 11px;
  white-space: nowrap;
  /* 为表头设置宽度 */
}

/* 为表头设置具体宽度 */
.event-table_inner th:nth-child(1) {
  /* width: 30%; 事件描述路线 */
  width: 48%;
}

.event-table_inner th:nth-child(2) {
  width: 16%; /* 位置（再缩小） */
}

.event-table_inner th:nth-child(3) {
  width: 13%; /* 发送时间 */
}

.event-table_inner th:nth-child(4) {
  width: 13%; /* 处理状态（加宽） */
}

.event-table_inner th:nth-child(5) {
  width: 10%; /* 操作栏（加宽） */
}

.event-table_inner td {
  padding: 10px 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-table_inner tr {
  transition: all 0.3s ease;
}

.event-table_inner tr:hover {
  background-color: rgba(0, 39, 102, 0.7);
}

.event-table_inner tr.no-data-row_inner {
  display: table;
  width: 100%;
  table-layout: fixed;
  height: 104px;
}

.event-table_inner td.no-data-cell_inner {
  width: 100% !important;
  display: table-cell !important;
  text-align: center;
  vertical-align: middle;
  color: rgba(255, 255, 255, 0.65);
  font-size: 16px !important;
  font-weight: 500;
  line-height: 1.4;
  height: 104px;
  padding: 0;
  border-bottom: none;
}

.event-table_inner tr.is-highlighted {
  background: linear-gradient(
    90deg,
    rgba(251, 146, 60, 0.32) 0%,
    rgba(124, 45, 18, 0.42) 100%
  );
  box-shadow: inset 3px 0 0 #fb923c;
}

.event-table_inner tr.is-highlighted td {
  color: #fff2e8;
  font-weight: 600;
}

/* 为表格单元格设置具体宽度 */
.event-table_inner td:nth-child(1) {
  width: 48%; /* 事件描述路线 */
}

.event-table_inner td:nth-child(2) {
  width: 16%; /* 位置（再缩小） */
}

.event-table_inner td:nth-child(3) {
  width: 13%; /* 发送时间 */
}

.event-table_inner td:nth-child(4) {
  width: 13%; /* 处理状态（加宽） */
}

.event-table_inner td:nth-child(5) {
  width: 10%; /* 操作栏（加宽） */
}

/* 三列防溢出：发送时间 / 处理状态 / 操作栏 */
.event-table_inner th.col-time,
.event-table_inner th.col-status,
.event-table_inner th.col-action {
  font-size: 10px;
  padding: 8px 4px;
  white-space: normal;
  word-break: break-all;
  overflow: visible;
  text-overflow: clip;
}

.event-table_inner td.col-time,
.event-table_inner td.col-status,
.event-table_inner td.col-action {
  padding-left: 2px;
  padding-right: 2px;
  white-space: normal;
  word-break: break-all;
  overflow: visible;
  text-overflow: clip;
}

.event-table_inner td.col-time {
  white-space: pre-line;
  line-height: 1.4;
}

/* 处理状态固定单行显示 */
.event-table_inner th.col-status,
.event-table_inner td.col-status {
  white-space: nowrap;
  word-break: keep-all;
}

.event-desc_inner {
  overflow: hidden;
  text-overflow: clip;
}

.event-location_inner {
  overflow: hidden;
  text-overflow: clip;
}

.scroll-wrapper_inner {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
}

.scroll-content_inner {
  display: inline-flex;
  align-items: center;
  padding-left: 100%;
  /* 控制滚动时间 */
  animation: scroll-left 55s linear infinite;
}

.scroll-wrapper_inner:hover .scroll-content_inner {
  animation-play-state: paused;
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

.scroll-wrapper-location_inner {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
}

.scroll-content-location_inner {
  display: inline-flex;
  align-items: center;
  padding-left: 100%;
  /* 控制滚动时间 */
  animation: scroll-left-location 10s linear infinite;
}

.scroll-wrapper-location_inner:hover .scroll-content-location_inner {
  animation-play-state: paused;
}

@keyframes scroll-left-location {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

.description-text_inner {
  max-width: none;
  flex: none;
  margin-right: 50px;
}

.location-text_inner {
  max-width: none;
  flex: none;
  margin-right: 32px;
}

.type-icon_inner {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.warning-icon_inner {
  background-image: url('@/assets/warning@2x.png');
  padding: 10px;
}

.jamed-icon_inner {
  background-image: url('@/assets/jamed@2x.png');
  padding: 10px;
}

/* 交通事故图标 */
.traffic-accident-icon_inner {
  background-image: url('@/assets/traffic_accident@2x(1).png');
  padding: 10px;
}

/* 施工养护图标 */
.maintenance-icon_inner {
  background-image: url('@/assets/maintenance@2x.png');
  padding: 10px;
}

/* 自然灾害图标 */
.natural-disaster-icon_inner {
  background-image: url('@/assets/netural_disaster@2x.png');
  padding: 10px;
}

.text-center_inner {
  text-align: center;
}

.text-left_inner {
  text-align: left;
}

.status-unprocessed_inner {
  color: #ff4d4d;
}

.status-processed_inner {
  color: #40e0d0;
}

.action-detail_inner {
  color: #00e5ff;
  cursor: pointer;
  text-decoration: underline;
  user-select: none;
}

.action-detail_inner:hover {
  color: #4fd1ff;
}

/* 优化滚动条样式（与实时路况组件一致） */
.event-table_inner tbody::-webkit-scrollbar {
  width: 6px;
}

.event-table_inner tbody::-webkit-scrollbar-thumb {
  background: #003a8c;
  border-radius: 3px;
}

.event-table_inner tbody::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
</style>
