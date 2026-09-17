<template>
  <div class="charge-info-panel-content">
    <div class="stats-header">
      <div class="stat-item total">
        <div class="stat-body">
          <div class="stat-row-item">
            <div class="label">今日收费总额</div>
            <div class="value-box">
              <span class="num">{{ formattedTotalAmount.num }}</span
              ><span v-if="formattedTotalAmount.unit" class="unit">{{
                formattedTotalAmount.unit
              }}</span>
            </div>
          </div>
          <div class="flex-icon">
            <i class="icon-coin"></i>
          </div>
        </div>
      </div>

      <div class="stat-item up">
        <div class="stat-body">
          <div class="stat-row-item">
            <div class="label">同比</div>
            <div class="value-box">
              <span class="num">{{ stats.yoy }}%</span>
            </div>
          </div>
          <div class="icon-group flex-icon">
            <i class="icon-up" v-if="stats.yoy > 0"></i>
            <i class="icon-down" v-else></i>
          </div>
        </div>
      </div>

      <div class="stat-item down">
        <div class="stat-body">
          <div class="stat-row-item">
            <div class="label">环比</div>
            <div class="value-box">
              <span class="num">{{ stats.mom }}%</span>
            </div>
          </div>
          <div class="icon-group flex-icon">
            <i class="icon-up" v-if="stats.mom > 0"></i>
            <i class="icon-down" v-else></i>
          </div>
        </div>
      </div>
    </div>

    <div class="stations-wrapper">
      <template v-if="allStations.length > 0">
        <div class="nav-arrow" @click="prevStation">
          <i
            class="arrow-left"
            :class="{ 'arrow-disabled': currentIndex === 0 }"
          ></i>
        </div>

        <div class="stations-track">
          <div
            ref="stationsTrackRef"
            class="stations-transition-group"
            :style="stationsTrackStyle"
            @transitionend="handleTrackTransitionEnd"
          >
            <div
              v-for="(station, index) in renderedStations"
              :key="`${station?.stationname || 'station'}-${renderStartIndex + index}`"
              class="station-card"
            >
              <div class="name">{{ station?.stationname }}</div>
              <div class="detail-line">
                <i class="icon-amount"></i> {{ station?.money }}元
              </div>
              <div class="detail-line">
                <i class="icon-car"></i> 出口：{{ station?.outflow }}辆
              </div>
              <div class="detail-line">
                <i class="icon-car"></i> 入口：{{ station?.inflow }}辆
              </div>
              <div class="detail-line time">
                <i class="icon-clock"></i>
                {{ station?.time || new Date().toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>

        <div class="nav-arrow" @click="nextStation">
          <i
            class="arrow-right"
            :class="{
              'arrow-disabled': currentIndex >= allStations.length - 2,
            }"
          ></i>
        </div>
      </template>
      <div v-else class="stations-empty">暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api';
import http from '@/utils/http';
import { REGION_IDS, REQUEST_TYPES } from '@/utils/constants';
import { getTimeMinusMinutes } from '@/utils/tools';
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue';
import {
  REFRESH_INTERVALS,
  REFRESH_SWITCHES,
} from '@/settings/refreshIntervals';

// 使用正确的 API URL
const feeUrl = FUZHOU_API_URLS.fee.getShoufeiApi;
const stationRankUrl = FUZHOU_API_URLS.fee.getFeeCard;

// 内部状态管理
const stats = ref({
  total: 0, // 总金额（元）
  yoy: '0',
  mom: '0',
});

const allStations = ref([]); // 保存所有收费站数据
const currentIndex = ref(0); // 当前显示的起始索引
const stationsTrackRef = ref(null);
const stationStep = ref(0);
const stationCardWidth = ref(0);
const stationGap = ref(8);
const stationsViewportWidth = ref(0);
const isAnimating = ref(false);
const animationDirection = ref('');
const trackTransitionEnabled = ref(false);
const animateOffsetPx = ref(0);
const stationSlideDuration = 0.75;
const stationAutoplayInterval = 5 * 1000;
let chargeStatsRefreshTimer = null;
let stationCarouselTimer = null;

const stations = ref([
  {
    stationName: '收费站名称',
    money: 100,
    outFlow: 100,
    inFlow: 100,
    time: '2026.09.09',
  },
  {
    stationName: '收费站名称',
    money: 100,
    outFlow: 100,
    inFlow: 100,
    time: '2026.09.09',
  },
]);

const sortedStations = computed(() => {
  return [...allStations.value].sort((a, b) => {
    const moneyA = Number(a?.money) || 0;
    const moneyB = Number(b?.money) || 0;
    return moneyB - moneyA;
  });
});

// 计算属性：当前显示的收费站数据
const displayStations = computed(() => {
  return sortedStations.value.slice(currentIndex.value, currentIndex.value + 2);
});

const renderStartIndex = computed(() => {
  if (isAnimating.value && animationDirection.value === 'prev') {
    return Math.max(0, currentIndex.value - 1);
  }
  return currentIndex.value;
});

const renderedStations = computed(() => {
  if (isAnimating.value) {
    if (animationDirection.value === 'next') {
      return sortedStations.value.slice(
        currentIndex.value,
        currentIndex.value + 3
      );
    }
    if (animationDirection.value === 'prev') {
      return sortedStations.value.slice(
        Math.max(0, currentIndex.value - 1),
        currentIndex.value + 2
      );
    }
  }
  return displayStations.value;
});

const stationsBaseOffset = computed(() => {
  const visibleWidth = stationCardWidth.value * 2 + stationGap.value;
  if (!Number.isFinite(visibleWidth) || visibleWidth <= 0) return 0;
  const centerOffset = Math.max(
    0,
    (stationsViewportWidth.value - visibleWidth) / 2
  );
  return centerOffset;
});

const stationsTrackStyle = computed(() => ({
  transform: `translateX(${stationsBaseOffset.value + animateOffsetPx.value}px)`,
  transition: trackTransitionEnabled.value
    ? `transform ${stationSlideDuration}s ease`
    : 'none',
  '--station-card-width': `${stationCardWidth.value}px`,
}));

// 计算属性：是否显示左箭头
const showLeftArrow = computed(() => {
  return currentIndex.value > 0;
});

// 计算属性：是否显示右箭头
const showRightArrow = computed(() => {
  return currentIndex.value < allStations.value.length - 2;
});

// 格式化总金额，处理单位转换
const formattedTotalAmount = computed(() => {
  const total = Number(stats.value.total);
  if (total < 10000) {
    // 万元以下，显示元为单位
    return {
      num: total,
      unit: '元',
    };
  } else {
    // 万元以上，转换为万元显示
    return {
      num: (total / 10000).toFixed(1),
      unit: '万元',
    };
  }
});

const fetchChargeStatsData = async () => {
  await Promise.all([getHighwayFeeInfo(), getStationRank()]);
};

// 正确定义函数
const getHighwayFeeInfo = async () => {
  try {
    const res = await http.get(feeUrl, {
      nowTime: getTimeMinusMinutes(), // 使用公共方法获取时间
      origid: REGION_IDS.FUZHOU, // 使用福州地区编号
      type: REQUEST_TYPES.FEE_INFO, // 使用常量
    });
    // 假设后端返回的总金额是元为单位
    if (res && res.total !== undefined) {
      stats.value.total = res.total;
    }
    // totalhb: 总收费环比
    if (res && res.totalhb !== undefined) {
      stats.value.mom = res.totalhb;
    }
    // totaltb: 总收费同比
    if (res && res.totaltb !== undefined) {
      stats.value.yoy = res.totaltb;
    }
  } catch (error) {
    console.error('获取收费统计数据失败:', error);
  }
};

// 获取收费站排名数据
const getStationRank = async () => {
  try {
    const res = await http.get(stationRankUrl, {
      nowTime: getTimeMinusMinutes(), // 使用公共方法获取时间
      origid: REGION_IDS.FUZHOU, // 使用福州地区编号
      type: REQUEST_TYPES.FEE_INFO, // 使用常量
    });
    // 假设后端返回的是一个数组
    if (res && Array.isArray(res)) {
      allStations.value = res;
      currentIndex.value = 0;
      await nextTick();
      updateStationStep();
    }
  } catch (error) {
    console.error('获取收费站排名数据失败:', error);
  }
};

const updateStationStep = () => {
  const trackEl = stationsTrackRef.value;
  if (!trackEl) {
    stationStep.value = 0;
    stationCardWidth.value = 0;
    stationGap.value = 8;
    stationsViewportWidth.value = 0;
    return;
  }

  const viewportEl = trackEl.parentElement;
  if (!viewportEl) {
    stationStep.value = 0;
    stationCardWidth.value = 0;
    stationGap.value = 8;
    stationsViewportWidth.value = 0;
    return;
  }

  const trackStyle = window.getComputedStyle(trackEl);
  const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
  // 使用布局宽度而不是变换后的可视宽度，避免在横向补偿时被二次压缩
  const viewportWidth =
    viewportEl.clientWidth ||
    viewportEl.offsetWidth ||
    viewportEl.getBoundingClientRect().width;
  // 两张卡片 + 一个 gap 精确铺满可视轨道，避免右侧出现大块空白
  const nextCardWidth = Math.max(0, (viewportWidth - gap) / 2);

  stationGap.value = gap;
  stationsViewportWidth.value = viewportWidth;
  stationCardWidth.value = nextCardWidth;
  stationStep.value = nextCardWidth + gap;
};

const handleTrackTransitionEnd = () => {
  if (!isAnimating.value) return;

  trackTransitionEnabled.value = false;
  if (animationDirection.value === 'next') {
    currentIndex.value += 1;
  } else if (animationDirection.value === 'prev') {
    currentIndex.value -= 1;
  }

  isAnimating.value = false;
  animationDirection.value = '';
  animateOffsetPx.value = 0;
  nextTick(() => {
    updateStationStep();
  });
};

const advanceStationCarousel = () => {
  if (isAnimating.value || allStations.value.length <= 2) return;

  if (currentIndex.value >= allStations.value.length - 2) {
    currentIndex.value = 0;
    trackTransitionEnabled.value = false;
    animateOffsetPx.value = 0;
    nextTick(() => {
      updateStationStep();
    });
    return;
  }

  nextStation();
};

const startAutoRefresh = () => {
  if (chargeStatsRefreshTimer) return;
  if (!REFRESH_SWITCHES.GLOBAL || !REFRESH_SWITCHES.CHARGE_STATS) return;

  chargeStatsRefreshTimer = setInterval(() => {
    fetchChargeStatsData();
  }, REFRESH_INTERVALS.CHARGE_STATS);
};

const stopAutoRefresh = () => {
  if (!chargeStatsRefreshTimer) return;
  clearInterval(chargeStatsRefreshTimer);
  chargeStatsRefreshTimer = null;
};

const startStationCarousel = () => {
  if (stationCarouselTimer) return;
  stationCarouselTimer = setInterval(() => {
    advanceStationCarousel();
  }, stationAutoplayInterval);
};

const stopStationCarousel = () => {
  if (!stationCarouselTimer) return;
  clearInterval(stationCarouselTimer);
  stationCarouselTimer = null;
};

onMounted(() => {
  fetchChargeStatsData();
  window.addEventListener('resize', updateStationStep);
  nextTick(() => {
    updateStationStep();
  });
  startAutoRefresh();
  startStationCarousel();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateStationStep);
  stopAutoRefresh();
  stopStationCarousel();
});

// 切换到下一个收费站
const nextStation = () => {
  if (isAnimating.value || currentIndex.value >= allStations.value.length - 2) {
    return;
  }

  animationDirection.value = 'next';
  isAnimating.value = true;
  trackTransitionEnabled.value = false;
  animateOffsetPx.value = 0;

  nextTick(() => {
    updateStationStep();
    requestAnimationFrame(() => {
      trackTransitionEnabled.value = true;
      animateOffsetPx.value = -stationStep.value;
    });
  });
};

// 切换到上一个收费站
const prevStation = () => {
  if (isAnimating.value || currentIndex.value <= 0) {
    return;
  }

  animationDirection.value = 'prev';
  isAnimating.value = true;
  trackTransitionEnabled.value = false;

  nextTick(() => {
    updateStationStep();
    animateOffsetPx.value = -stationStep.value;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        trackTransitionEnabled.value = true;
        animateOffsetPx.value = 0;
      });
    });
  });
};
</script>

<style lang="less" scoped>
.stats-header {
  display: flex;
  flex-direction: row;
  gap: 10px;
  padding: 2px 0 2px 2px;
  justify-content: space-around;

  .stat-item {
    padding-top: 5px;
    width: 30%;
    border: 1px solid #0c3a6b;
    background: rgba(12, 58, 107, 0.2);
    font-size: 0.7rem;
    height: 54px; /* 5vh @ 1080 */
    .stat-body {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      padding: 0 5px; /* 补一点内边距防止贴边 */
    }
    .stat-row-item {
      .label {
        color: #ccc;
        font-size: 12px; /* 1.1vh @ 1080 */
      }
      .num {
        font-size: 1.1rem;
        color: #fff;
        font-weight: bold;
      }
      .unit {
        font-size: 0.6rem;
        color: #fff;
        margin-left: 2px;
      }
    }
  }

  .flex-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    .icon-coin {
      display: inline-block;
      width: 28px;
      height: 28px;
      background-image: url('@/assets/icon-collect-coin@2x(1).png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .icon-up {
      display: inline-block;
      width: 20px;
      height: 20px;
      background-image: url('@/assets/icon-up@2x(2).png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .icon-down {
      display: inline-block;
      width: 20px;
      height: 20px;
      background-image: url('@/assets/icon-down@2x(3).png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  }

  .icon-arrow {
    font-weight: bold;
    &.down {
      color: #52c41a;
    }
  }
}

.stations-wrapper {
  --stations-panel-height: 200px;
  --stretch-ratio: var(--screen-stretch-ratio, 1);
  --stations-width-boost: 1.06;
  --stations-layout-width: calc(
    (100% / var(--stretch-ratio)) * var(--stations-width-boost)
  );
  margin-top: 16px;
  display: flex;
  flex-direction: row;
  height: var(--stations-panel-height);
  width: var(--stations-layout-width);
  margin-left: calc((100% - var(--stations-layout-width)) / 2);
  transform: scaleX(var(--stretch-ratio));
  transform-origin: center top;

  .stations-track {
    flex: 1 1 auto;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .stations-transition-group {
    position: relative;
    display: flex;
    height: 100%;
    width: max-content;
    gap: 8px;
    will-change: transform;
  }

  .stations-empty {
    width: 100%;
    height: var(--stations-panel-height);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #93c5fd;
    font-size: 14px;
    border: 1px solid #0c3a6b;
    background: rgba(12, 58, 107, 0.2);
  }

  .nav-arrow {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 5px;

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

    // 添加箭头变暗样式
    .arrow-disabled {
      opacity: 0.3; // 通过透明度实现变暗效果
      cursor: not-allowed; // 鼠标指针变为禁止状态
    }
  }

  .station-card {
    flex: 0 0 var(--station-card-width, calc((100% - 8px) / 2));
    width: var(--station-card-width, calc((100% - 8px) / 2));
    padding: 8px;
    gap: 5px;
    height: 100%;
    border: 1px solid #0c3a6b;
    background: rgba(12, 58, 107, 0.2);
    font-size: 15px;

    .name {
      color: #00ffff;
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .detail-line {
      color: #fff;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      font-size: 15px;
      line-height: 2;

      i {
        margin-right: 4px;
        flex: 0 0 auto;
      }
    }
    .time {
      color: #fff;
      margin-top: 6px;
      font-size: 14px;
    }

    .icon-amount {
      display: inline-block;
      width: 16px;
      height: 16px;
      background-image: url('@/assets/icon-collect-coin@2x(1).png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .icon-car {
      display: inline-block;
      width: 16px;
      height: 16px;
      background-image: url('@/assets/icon-car@2x.png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .icon-clock {
      display: inline-block;
      width: 16px;
      height: 16px;
      background-image: url('@/assets/icon-clock@2x.png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}
</style>
