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

    <div class="traffic-flow-carousel">
      <div class="nav-arrow" @click="prevLinePage">
        <i
          class="arrow-left"
          :class="{ 'arrow-disabled': currentLineIndex === 0 }"
        ></i>
      </div>

      <div class="traffic-flow-row traffic-bottom-row">
        <div v-if="lineData.length > 0" class="traffic-flow-track">
          <div
            ref="lineTrackRef"
            class="traffic-flow-transition-group"
            :style="lineTrackStyle"
            @transitionend="handleLineTrackTransitionEnd"
          >
            <div
              class="traffic-flow-sub-item traffic-sub-bg"
              v-for="(item, index) in renderedLines"
              :key="`${item.name}-${renderLineStartIndex + index}`"
            >
              <div class="traffic-sub-label">{{ item.name }}</div>
              <div class="traffic-sub-value">
                {{ item.value }}<span>辆</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="traffic-flow-empty traffic-sub-bg">暂无数据</div>
      </div>

      <div class="nav-arrow" @click="nextLinePage">
        <i
          class="arrow-right"
          :class="{ 'arrow-disabled': currentLineIndex >= lastLinePageStart }"
        ></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
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
const lineData = ref([]);
const visibleLineCount = 3;
const lineAutoplayInterval = 5 * 1000;
const currentLineIndex = ref(0);
const lineTrackRef = ref(null);
const lineItemWidth = ref(0);
const lineStep = ref(0);
const isLineAnimating = ref(false);
const lineAnimationDirection = ref('');
const lineTrackTransitionEnabled = ref(false);
const lineAnimateOffsetPx = ref(0);
const lineSlideDuration = 0.75;
let trafficFlowRefreshTimer = null;
let trafficFlowCarouselTimer = null;

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
const displayLineData = computed(() =>
  lineData.value.slice(
    currentLineIndex.value,
    currentLineIndex.value + visibleLineCount
  )
);
const lastLinePageStart = computed(() => {
  if (lineData.value.length <= visibleLineCount) return 0;
  return lineData.value.length - visibleLineCount;
});
const renderLineStartIndex = computed(() => {
  if (isLineAnimating.value && lineAnimationDirection.value === 'prev') {
    return Math.max(0, currentLineIndex.value - 1);
  }
  return currentLineIndex.value;
});
const renderedLines = computed(() => {
  if (isLineAnimating.value) {
    if (lineAnimationDirection.value === 'next') {
      return lineData.value.slice(
        currentLineIndex.value,
        currentLineIndex.value + visibleLineCount + 1
      );
    }

    if (lineAnimationDirection.value === 'prev') {
      return lineData.value.slice(
        Math.max(0, currentLineIndex.value - 1),
        currentLineIndex.value + visibleLineCount
      );
    }
  }

  return displayLineData.value;
});
const lineTrackStyle = computed(() => ({
  transform: `translateX(${lineAnimateOffsetPx.value}px)`,
  transition: lineTrackTransitionEnabled.value
    ? `transform ${lineSlideDuration}s ease`
    : 'none',
  '--line-card-width': `${lineItemWidth.value}px`,
}));

// 获取实时交通流量数据
const fetchTrafficFlowData = async () => {
  try {
    const res = await http.get(API_URLS.putian_highway.getRealTimeTrafficFlow, {
      origid: REGION_IDS.FUZHOU,
    });
    const data = res?.[0];
    if (!data) {
      todayCount.value = '0';
      onWayCount.value = '0';
      lineData.value = [];
      currentLineIndex.value = 0;
      isLineAnimating.value = false;
      lineAnimationDirection.value = '';
      lineTrackTransitionEnabled.value = false;
      lineAnimateOffsetPx.value = 0;
      return;
    }

    todayCount.value = data.allFlow || '0';
    onWayCount.value = data.ztFlow || '0';

    lineData.value = Array.isArray(res)
      ? res.map((item, index) => ({
          name: item?.roadfield || `线路${index + 1}`,
          value: item?.roadflow || '0',
        }))
      : [];

    isLineAnimating.value = false;
    lineAnimationDirection.value = '';
    lineTrackTransitionEnabled.value = false;
    lineAnimateOffsetPx.value = 0;
    currentLineIndex.value = Math.min(
      currentLineIndex.value,
      Math.max(lineData.value.length - visibleLineCount, 0)
    );
    await nextTick();
    updateLineMetrics();
  } catch (error) {
    console.error('获取交通流量数据失败:', error);
  }
};

const updateLineMetrics = () => {
  const trackEl = lineTrackRef.value;
  if (!trackEl) {
    lineItemWidth.value = 0;
    lineStep.value = 0;
    return;
  }

  const viewportEl = trackEl.parentElement;
  if (!viewportEl) {
    lineItemWidth.value = 0;
    lineStep.value = 0;
    return;
  }

  const trackStyle = window.getComputedStyle(trackEl);
  const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
  const viewportWidth =
    viewportEl.clientWidth ||
    viewportEl.offsetWidth ||
    viewportEl.getBoundingClientRect().width;
  const nextItemWidth = Math.max(
    0,
    (viewportWidth - gap * (visibleLineCount - 1)) / visibleLineCount
  );

  lineItemWidth.value = nextItemWidth;
  lineStep.value = nextItemWidth + gap;
};

const handleLineTrackTransitionEnd = () => {
  if (!isLineAnimating.value) return;

  lineTrackTransitionEnabled.value = false;
  if (lineAnimationDirection.value === 'next') {
    currentLineIndex.value = Math.min(
      currentLineIndex.value + 1,
      lastLinePageStart.value
    );
  } else if (lineAnimationDirection.value === 'prev') {
    currentLineIndex.value = Math.max(
      currentLineIndex.value - 1,
      0
    );
  }

  isLineAnimating.value = false;
  lineAnimationDirection.value = '';
  lineAnimateOffsetPx.value = 0;
  nextTick(() => {
    updateLineMetrics();
  });
};

const resetLineCarousel = () => {
  stopLineCarousel();
  startLineCarousel();
};

const nextLinePage = (shouldResetTimer = true) => {
  if (
    isLineAnimating.value ||
    currentLineIndex.value >= lastLinePageStart.value
  ) {
    return;
  }

  lineAnimationDirection.value = 'next';
  isLineAnimating.value = true;
  lineTrackTransitionEnabled.value = false;
  lineAnimateOffsetPx.value = 0;
  if (shouldResetTimer) {
    resetLineCarousel();
  }

  nextTick(() => {
    updateLineMetrics();
    if (!lineStep.value) {
      isLineAnimating.value = false;
      lineAnimationDirection.value = '';
      return;
    }
    requestAnimationFrame(() => {
      lineTrackTransitionEnabled.value = true;
      lineAnimateOffsetPx.value = -lineStep.value;
    });
  });
};

const prevLinePage = () => {
  if (isLineAnimating.value || currentLineIndex.value <= 0) {
    return;
  }

  lineAnimationDirection.value = 'prev';
  isLineAnimating.value = true;
  lineTrackTransitionEnabled.value = false;
  resetLineCarousel();

  nextTick(() => {
    updateLineMetrics();
    if (!lineStep.value) {
      isLineAnimating.value = false;
      lineAnimationDirection.value = '';
      lineAnimateOffsetPx.value = 0;
      return;
    }
    lineAnimateOffsetPx.value = -lineStep.value;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lineTrackTransitionEnabled.value = true;
        lineAnimateOffsetPx.value = 0;
      });
    });
  });
};

const advanceLineCarousel = () => {
  if (isLineAnimating.value || lineData.value.length <= visibleLineCount) return;

  if (currentLineIndex.value >= lastLinePageStart.value) {
    currentLineIndex.value = 0;
    lineTrackTransitionEnabled.value = false;
    lineAnimateOffsetPx.value = 0;
    nextTick(() => {
      updateLineMetrics();
    });
    return;
  }

  nextLinePage(false);
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

const startLineCarousel = () => {
  if (trafficFlowCarouselTimer) return;
  trafficFlowCarouselTimer = setInterval(() => {
    advanceLineCarousel();
  }, lineAutoplayInterval);
};

const stopLineCarousel = () => {
  if (!trafficFlowCarouselTimer) return;
  clearInterval(trafficFlowCarouselTimer);
  trafficFlowCarouselTimer = null;
};

// 从API获取数据
onMounted(() => {
  fetchTrafficFlowData();
  window.addEventListener('resize', updateLineMetrics);
  nextTick(() => {
    updateLineMetrics();
  });
  startAutoRefresh();
  startLineCarousel();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateLineMetrics);
  stopAutoRefresh();
  stopLineCarousel();
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

.traffic-flow-carousel {
  display: flex;
  align-items: center;
  gap: 4px;
}

.traffic-flow-row {
  display: flex;
  gap: 10px;
  height: 32%;
  font-size: 10px;

  &.traffic-bottom-row {
    flex: 1;
    height: 49px; /* 4.5vh @ 1080 */
    min-width: 0;
  }
}

.traffic-flow-track {
  flex: 1 1 auto;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.traffic-flow-transition-group {
  position: relative;
  display: flex;
  gap: 10px;
  height: 100%;
  width: max-content;
  will-change: transform;
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
  flex: 0 0 var(--line-card-width, calc((100% - 20px) / 3));
  width: var(--line-card-width, calc((100% - 20px) / 3));
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

.traffic-flow-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #93c5fd;
  font-size: 12px;
}

.nav-arrow {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 2px;
  flex: 0 0 auto;

  .arrow-left {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-image: url('@/assets/arrow-left@2x.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .arrow-right {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-image: url('@/assets/arrow-right@2x.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .arrow-disabled {
    opacity: 0.3;
    cursor: not-allowed;
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
