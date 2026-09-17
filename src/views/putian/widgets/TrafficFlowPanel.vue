<template>
  <div class="traffic-flow-layout">
    <div class="traffic-flow-row">
      <div class="traffic-flow-item traffic-main-bg">
        <div class="traffic-label-group">
          <i class="traffic-icon-bus"></i>
          <span class="traffic-label">今日交通量</span>
        </div>
        <div class="traffic-value-wrap">
          <span class="traffic-num">{{ formattedTodayCount }}</span>
          <span class="traffic-unit">辆</span>
        </div>
      </div>
      <div class="traffic-flow-item traffic-main-bg">
        <div class="traffic-label-group">
          <i class="traffic-icon-bus"></i>
          <span class="traffic-label">在途车辆数</span>
        </div>
        <div class="traffic-value-wrap">
          <span class="traffic-num">{{ formattedOnWayCount }}</span>
          <span class="traffic-unit">辆</span>
        </div>
      </div>
    </div>

    <div class="traffic-flow-row traffic-bottom-row">
      <div
        class="traffic-flow-sub-item traffic-sub-bg"
        v-for="(item, index) in lineData"
        :key="index"
      >
        <div class="traffic-sub-label">{{ item.name }}</div>
        <div class="traffic-sub-value">{{ item.value }}<span>辆</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { API_URLS } from '@/utils/apiUrls';
import { REGION_IDS } from '@/utils/constants';
import http from '@/utils/http';
import {
  REFRESH_INTERVALS,
  REFRESH_SWITCHES,
} from '@/settings/refreshIntervals';

// 响应式数据
const todayCount = ref('');
const onWayCount = ref('');
const lineData = ref([
  { name: '莆炎线', value: 0 },
  { name: '甬莞线', value: 0 },
  { name: '秀永线', value: 0 },
]);
let trafficFlowRefreshTimer = null;

const formatTrafficCount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return value || '0';

  // 超过 5 位数时按“万”换算显示
  if (Math.abs(num) >= 100000) {
    const wan = num / 10000;
    return `${Number(wan.toFixed(1)).toString()}万`;
  }

  return `${Math.trunc(num)}`;
};

const formattedTodayCount = computed(() => formatTrafficCount(todayCount.value));
const formattedOnWayCount = computed(() => formatTrafficCount(onWayCount.value));

// 获取实时交通流量数据
const fetchTrafficFlowData = async () => {
  try {
    const res = await http.get(API_URLS.putian_highway.getRealTimeTrafficFlow, {
      origid: REGION_IDS.PUTIAN,
    });
    const dataList = Array.isArray(res) ? res : [];
    const summary = dataList[0];
    if (!summary) return;

    todayCount.value = summary.allFlow || '0';
    onWayCount.value = summary.ztFlow || '0';

    lineData.value = dataList.map((item) => ({
      name: item.roadfield || '--',
      value: item.roadflow || '0',
    }));
  } catch (error) {
    console.error('获取交通流量数据失败:', error);
  }
};

const startAutoRefresh = () => {
  if (trafficFlowRefreshTimer) return;
  if (!REFRESH_SWITCHES.GLOBAL || !REFRESH_SWITCHES.TRAFFIC_FLOW_PANEL) return;

  trafficFlowRefreshTimer = setInterval(() => {
    fetchTrafficFlowData();
  }, REFRESH_INTERVALS.TRAFFIC_FLOW_PANEL);
};

const stopAutoRefresh = () => {
  if (!trafficFlowRefreshTimer) return;
  clearInterval(trafficFlowRefreshTimer);
  trafficFlowRefreshTimer = null;
};

// 从API获取数据
onMounted(() => {
  fetchTrafficFlowData();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="less" scoped>
/* 样式内容保持不变，仅更新了类名选择器 */
.traffic-flow-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 8px 16px;
}

.traffic-flow-row {
  display: flex;
  gap: 10px;
  height: 32%;
  font-size: 10px;

  &.traffic-bottom-row {
    height: 49px; /* 4.5vh @ 1080 */
  }
}

.traffic-main-bg {
  background: rgba(0, 162, 255, 0.1);
  border: 1px solid rgba(0, 162, 255, 0.2);
}

.traffic-sub-bg {
  background: rgba(0, 162, 255, 0.05);
  border: 1px solid rgba(0, 162, 255, 0.1);
}

.traffic-flow-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;

  .traffic-label-group {
    display: flex;
    align-items: center;
    gap: 8px;

    .traffic-label {
      color: #adbcff;
      font-size: 12px; /* 1.1vh @ 1080 */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .traffic-num {
    font-size: 15px;
    color: #fff;
    font-weight: bold;
    margin-right: 4px;
    white-space: nowrap;
  }

  .traffic-unit {
    font-size: 12px;
    color: #00a2ff;
    white-space: nowrap;
  }

  .traffic-value-wrap {
    display: flex;
    align-items: baseline;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.traffic-flow-sub-item {
  flex: 1;
  text-align: center;
  padding: 2px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .traffic-sub-label {
    font-size: 12px;
    color: #ccc;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .traffic-sub-value {
    font-size: 13px;
    font-weight: bold;
    color: #fff;

    span {
      font-size: 10px;
      margin-left: 2px;
      font-weight: normal;
    }
  }
}

.traffic-icon-bus {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-image: url('@/assets/icon-bus@2x.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
