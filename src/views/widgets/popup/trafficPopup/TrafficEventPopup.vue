<template>
  <div class="mll-container">
    <div class="mll-header">
      <div class="mll-header-left">
        <i class="mll-icon-tool" :class="eventTypeIcon"></i>
        <span class="mll-title">{{ eventType }}</span>
        <span class="mll-tag-route">{{ route }}</span>
      </div>
      <div class="mll-status-badge" :style="{ background: eventColor }">
        {{ status }}
      </div>
    </div>

    <div
      ref="scrollViewRef"
      class="mll-scroll-view"
      @wheel="onScrollWheel"
      @mousedown.stop
      @pointerdown.stop
      @touchstart.stop
      @touchmove.stop
    >
      <div class="mll-log-item">
        <div class="mll-time">{{ happenTime }}</div>
        <div class="mll-content">{{ originalDataContent }}</div>
      </div>
      <div v-if="handleContent" class="mll-log-item">
        <div class="mll-time">后续处理</div>
        <div class="mll-content">{{ handleContent }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'MaintenanceLogList' });

const props = defineProps({
  data: { type: Object, default: () => ({}) },
});

const scrollViewRef = ref(null);

watch(
  () => props.data,
  (newVal) => {
    console.log('TrafficEventPopup data changed:', newVal);
  },
  { immediate: true, deep: true }
);

const logData = ref();

const eventType = computed(() => props.data.eventType || '其他紧急事件');

const route = computed(() => props.data.route || 'G15');

const status = computed(() => props.data.eventStatus || '执行中');

const happenTime = computed(
  () => props.data.originalData?.happenTime || props.data.time || ''
);

const originalDataContent = computed(
  () => props.data.description || props.data.originalData.content || ''
);

const handleContent = computed(() => props.data.handleContent || '');

const eventColor = computed(() => {
  switch (status.value) {
    case '未处理':
      return '#FFA500';
    case '已处理':
      return '#28a745';
    default:
      return '#FFA500';
  }
});

const eventTypeIcon = computed(() => {
  switch (eventType.value) {
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
});

const onScrollWheel = (event) => {
  const scrollEl = scrollViewRef.value;
  if (!scrollEl) return;

  event.stopPropagation();

  if (scrollEl.scrollHeight <= scrollEl.clientHeight) {
    event.preventDefault();
    return;
  }

  scrollEl.scrollTop += event.deltaY;
  event.preventDefault();
};
</script>

<style scoped>
.mll-container {
  /* width: 450px; */
  background: #0a2a68;
  border-radius: 4px;
  padding: 12px;
  color: #fff;
  font-family: sans-serif;
  margin-top: 5%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.mll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.mll-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mll-title {
  font-size: 16px;
  font-weight: bold;
}

.mll-tag-route {
  background: #28a745;
  color: #fff;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #ffffff55;
}

.mll-status-badge {
  background: #2b579a;
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
}

.mll-scroll-view {
  flex: 1;
  min-height: 0;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

/* 隐藏滚动条但保留功能 */
.mll-scroll-view::-webkit-scrollbar {
  width: 4px;
}
.mll-scroll-view::-webkit-scrollbar-thumb {
  background: #1a4e8a;
  border-radius: 2px;
}

.mll-log-item {
  margin-bottom: 20px;
}

.mll-log-item:last-child {
  margin-bottom: 0;
}

.mll-time {
  color: #5c89cc;
  font-size: 13px;
  margin-bottom: 6px;
}

.mll-content {
  color: #a0c2ed;
  font-size: 13px;
  line-height: 1.6;
  text-align: justify;
}

/* 图标样式 */
.mll-icon-tool {
  /* margin-right: 8px; */
  width: 20px;
  height: 20px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.warning-icon_inner {
  background-image: url('@/assets/warning@2x.png');
}

.traffic-accident-icon_inner {
  background-image: url('@/assets/traffic_accident@2x(1).png');
}

.maintenance-icon_inner {
  background-image: url('@/assets/maintenance@2x.png');
}

.natural-disaster-icon_inner {
  background-image: url('@/assets/netural_disaster@2x.png');
}
</style>
