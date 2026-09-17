<template>
  <div class="dashboard-container">
    <div class="ui-header">
      <div class="header-content">
        <div class="nav-links">
          <div
            class="nav-item"
            :class="{ 'nav-item--inactive': !isHomePage }"
            @click="goToHomePage"
          >
            <i class="nav-icon home-icon"></i>
            <span>首页</span>
          </div>
          <div
            class="nav-item"
            :class="{ 'nav-item--inactive': !isBillingReportsPage }"
          >
            <i class="nav-icon billing-icon"></i>
            <span>收费报表</span>
          </div>
        </div>
        <span class="header-title">莆田数智云系统</span>
      </div>
    </div>

    <div class="billing-content-bg">
      <div class="billing-content-title">收费报表</div>
      <div class="billing-cards-grid">
        <div class="billing-menu">
          <div
            v-for="item in billingMenu"
            :key="item.title"
            class="menu-item-wrap"
          >
            <div
              class="menu-item"
              :class="{ active: activeTitle === item.title, disabled: item.disabled }"
              @click="handleMenuClick(item)"
            >
              <span class="menu-label">{{ item.title }}</span>
              <span
                v-if="item.children?.length"
                class="menu-arrow"
                :class="{ expanded: expandedTitles.includes(item.title) }"
              >
                ▸
              </span>
            </div>

            <div
              v-if="
                item.children?.length && expandedTitles.includes(item.title)
              "
              class="submenu"
            >
              <div
                v-for="child in item.children"
                :key="child.title"
                class="submenu-item"
                :class="{ active: activeTitle === child.title, disabled: child.disabled }"
                @click="handleMenuClick(child)"
              >
                <span class="menu-label">{{ child.title }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="billing-report-panel">
          <div
            ref="billingPanelBodyRef"
            class="billing-report-panel-body"
          >
            <component :is="currentReportComponent" />
          </div>
          <div v-if="panelLoading" class="billing-panel-mask">
            <div class="mask-spinner"></div>
            <div class="mask-text">加载中......</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-left"></div>
    <div class="bg-right"></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import GantryFlowPage from './reports/GantryFlowReportPage.vue';
import DailyBillingReportPage from './reports/DailyBillingReportPage.vue';
import DailyHolidayComparisonPage from './reports/DailyHolidayComparisonPage.vue';
import AnnualTrafficComparisonReportPage from './reports/AnnualTrafficComparisonReportPage.vue';
import HolidayStationRanking from './reports/HolidayStationRankingReportPage.vue';
import PeakDayComparison from './reports/PeakDayComparison.vue';
import OpeningDayComparison from './reports/OpeningDayComparisonReportPage.vue';
import TopFourHourTraffic from './reports/TopFourHourTrafficReportPage.vue';
import StationFlowReportPage from './reports/StationFlowReportPage.vue';
import ServiceAreaFlowReportPage from './reports/ServiceAreaFlowReportPage.vue';
import FeeDetailReportPage from './reports/FeeDetailReportPage.vue';
import MonitorAnalysisReportPage from './reports/MonitorAnalysisReportPage.vue';
import Call12122SummaryReportPage from './reports/Call12122SummaryReportPage.vue';
import Call12122CategoryReportPage from './reports/Call12122CategoryReportPage.vue';

const router = useRouter();
const route = useRoute();
const isHomePage = computed(() => route.path === '/putian');
const isBillingReportsPage = computed(
  () => route.path === '/putian/billing-reports'
);

const goToHomePage = () => {
  router.push('/putian');
};

const billingMenu = [
  { title: '门架流量' },
  { title: '每日收费情况' },
  { title: '节假日每日对比' },
  {
    title: '节假日流量分析',
    children: [
      { title: '节假日流量历年对比' },
      { title: '节假日站所排名' },
      { title: '峰值日同比分析' },
      { title: '首日同比分析' },
      { title: 'Top4 小时流量' },
      { title: '站所流量简明' },
    ],
  },
  { title: '服务区流量报表' },
  { title: '收费明细数据' },
  { title: '监控情况' },
  {
    title: '12122 接听情况',
    children: [
      { title: '总量' },
      { title: '分类' },
    ],
  },
  // { title: '路网运行情况' },
];

const expandedTitles = ref([]);
const activeTitle = ref('门架流量');
const billingPanelBodyRef = ref(null);
const panelLoading = ref(false);
let panelLoadingObserver = null;

const currentReportComponent = computed(() => {
  if (activeTitle.value === '收费明细数据') return FeeDetailReportPage;
  if (activeTitle.value === '每日收费情况') return DailyBillingReportPage;
  if (activeTitle.value === '节假日每日对比') return DailyHolidayComparisonPage;
  if (activeTitle.value === '节假日流量历年对比')
    return AnnualTrafficComparisonReportPage;
  if (activeTitle.value === '节假日站所排名') return HolidayStationRanking;
  if (activeTitle.value === '峰值日同比分析') return PeakDayComparison;
  if (activeTitle.value === '首日同比分析') return OpeningDayComparison;
  if (activeTitle.value === 'Top4 小时流量') return TopFourHourTraffic;
  if (activeTitle.value === '站所流量简明') return StationFlowReportPage;
  if (activeTitle.value === '服务区流量报表') return ServiceAreaFlowReportPage;
  if (activeTitle.value === '监控情况') return MonitorAnalysisReportPage;
  if (activeTitle.value === '总量') return Call12122SummaryReportPage;
  if (activeTitle.value === '分类') return Call12122CategoryReportPage;
  return GantryFlowPage;
});

const handleMenuClick = (item) => {
  if (item.disabled) return;
  if (item.children?.length) {
    const index = expandedTitles.value.indexOf(item.title);
    if (index > -1) {
      expandedTitles.value.splice(index, 1);
    } else {
      expandedTitles.value.push(item.title);
    }
    return;
  }
  activeTitle.value = item.title;
};

const syncPanelLoadingState = () => {
  const rootEl = billingPanelBodyRef.value;
  if (!rootEl) {
    panelLoading.value = false;
    return;
  }
  panelLoading.value = Boolean(rootEl.querySelector('.query-btn:disabled'));
};

const disconnectPanelLoadingObserver = () => {
  panelLoadingObserver?.disconnect();
  panelLoadingObserver = null;
};

const observePanelLoading = () => {
  disconnectPanelLoadingObserver();
  const rootEl = billingPanelBodyRef.value;
  if (!rootEl || typeof MutationObserver === 'undefined') return;
  panelLoadingObserver = new MutationObserver(() => {
    syncPanelLoadingState();
  });
  panelLoadingObserver.observe(rootEl, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'class'],
  });
};

watch(activeTitle, async () => {
  panelLoading.value = false;
  await nextTick();
  observePanelLoading();
  syncPanelLoadingState();
});

onMounted(async () => {
  await nextTick();
  observePanelLoading();
  syncPanelLoadingState();
});

onBeforeUnmount(() => {
  disconnectPanelLoadingObserver();
});
</script>

<style lang="less" scoped>
.dashboard-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #02091b;
  overflow: hidden;
}

.mars3d-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.ui-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  z-index: 100;
  background-image: url('@/assets/bg-top@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
}

.header-title {
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 4px;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-links {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 13px;
  font-weight: bold;
}

.nav-item {
  cursor: pointer;
  padding: 5px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item--inactive {
  filter: grayscale(1);
  opacity: 0.7;
}

.nav-icon {
  width: 25px;
  height: 25px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.home-icon {
  background-image: url('@/assets/index-icon@2x.png');
}

.billing-icon {
  background-image: url('@/assets/billing-report-icon@2x.png');
}

.billing-content-bg {
  position: absolute;
  left: 4%;
  right: 4%;
  top: 11%;
  bottom: 5.5%;
  background-color: rgba(0, 46, 96, 0.6);
  border: 1px solid #418adb;
  border-radius: 32px;
  z-index: 20;
  padding: 32px 40px;

  .billing-content-title {
    font-weight: 600;
    font-size: 24px;
    color: #e4fcff;
    line-height: 33px;
    text-align: left;
    font-style: normal;
    text-align: center;
  }
}

.billing-cards-grid {
  height: calc(100% - 9%);
  margin: 2.2% 0% 0;
  display: flex;
  gap: 16px;
}

.billing-menu {
  width: 13%;
  min-width: 180px;
  overflow-y: auto;
  padding-right: 6px;
}

.billing-report-panel {
  flex: 1;
  min-width: 0;
  margin: 0;
  position: relative;
  border: none;
  border-radius: 16px;
  background-color: rgba(0, 27, 61, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.billing-report-panel-body {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  min-height: 0;
  overflow: hidden;
}

.billing-panel-mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(6, 30, 58, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.mask-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(228, 252, 255, 0.38);
  border-top-color: #e4fcff;
  border-radius: 50%;
  animation: billing-panel-spin 0.75s linear infinite;
}

.mask-text {
  color: #e4fcff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

@keyframes billing-panel-spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-item-wrap + .menu-item-wrap {
  margin-top: 6px;
}

.menu-item-wrap {
  min-width: 0;
}

.menu-item,
.submenu-item {
  height: 40px;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  border-radius: 10px;
  color: #d8efff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0 10px;
}

.menu-item.disabled,
.submenu-item.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.menu-item:not(.disabled):hover,
.submenu-item:not(.disabled):hover {
  background-color: rgba(190, 201, 210, 0.25);
}

.menu-item.active,
.submenu-item.active {
  background-color: rgba(190, 201, 210, 0.35);
}

.menu-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 100%;
  font-size: 38px;
  color: #d8efff;
  margin-left: 8px;
  transition: transform 0.2s ease;
  line-height: 1;
  transform-origin: center;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

.menu-arrow:not(.expanded) {
  transform: translateY(-4px);
}

.menu-arrow.expanded {
  transform: translateY(0px) rotate(90deg);
}

.menu-label {
  display: block;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.submenu {
  margin-top: 4px;
}

.submenu-item {
  padding-left: 32px;
}

.bg-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 20vw;
  height: 100%;
  background-image: url('@/assets/bg-left@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 10;
  pointer-events: none;
}

.bg-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 20vw;
  height: 100%;
  background-image: url('@/assets/bg-right@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 10;
  pointer-events: none;
}

  .dashboard-container {
    --billing-shell-x: clamp(18px, 2.5vw, 48px);
    --billing-shell-top: clamp(58px, 10vh, 88px);
    --billing-shell-bottom: clamp(12px, 3vh, 28px);
    --billing-shell-padding-x: clamp(16px, 2.35vw, 36px);
    --billing-shell-padding-y: clamp(12px, 3vh, 26px);
    --billing-title-height: clamp(24px, 5vh, 32px);
    --billing-grid-gap: clamp(8px, 0.85vw, 16px);
    --billing-menu-width: clamp(156px, 9vw, 260px);
    --billing-menu-item-height: clamp(30px, 4.1vh, 38px);
    --billing-menu-font-size: clamp(13px, 1.6vh, 16px);
    --billing-panel-radius: clamp(8px, 0.75vw, 14px);
  }

  .ui-header {
    height: clamp(56px, 8.8vh, 72px);
    background-size: 100% 100%;
  }

  .header-content {
    padding: 0 clamp(18px, 2.5vw, 40px);
  }

  .header-title {
    font-size: clamp(20px, 3vh, 26px);
  }

  .nav-links {
    gap: clamp(10px, 1.2vw, 18px);
    margin-top: clamp(2px, 1vh, 8px);
  }

  .billing-content-bg {
    left: var(--billing-shell-x);
    right: var(--billing-shell-x);
    top: var(--billing-shell-top);
    bottom: var(--billing-shell-bottom);
    border-radius: clamp(14px, 1.5vw, 24px);
    padding: var(--billing-shell-padding-y) var(--billing-shell-padding-x);
    display: flex;
    flex-direction: column;
    min-height: 0;

    .billing-content-title {
      flex: 0 0 var(--billing-title-height);
      font-size: clamp(18px, 2.7vh, 24px);
      line-height: var(--billing-title-height);
    }
  }

  .billing-cards-grid {
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
    margin-top: clamp(8px, 1.8vh, 16px);
    display: grid;
    grid-template-columns:
      minmax(var(--billing-menu-width), var(--billing-menu-width))
      minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    align-items: stretch;
    gap: var(--billing-grid-gap);
  }

  .billing-menu {
    width: auto;
    min-width: 0;
    height: 100%;
    min-height: 0;
    padding-right: clamp(2px, 0.35vw, 6px);
  }

  .billing-report-panel {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    border-radius: var(--billing-panel-radius);
  }

  .billing-report-panel-body {
    height: auto;
    overflow: auto;
    scrollbar-gutter: stable both-edges;
  }

  .menu-item-wrap + .menu-item-wrap {
    margin-top: clamp(3px, 0.75vh, 6px);
  }

  .menu-item,
  .submenu-item {
    height: var(--billing-menu-item-height);
    border-radius: 8px;
    font-size: var(--billing-menu-font-size);
    padding: 0 clamp(7px, 0.8vw, 12px);
  }

  .submenu-item {
    padding-left: clamp(20px, 1.8vw, 34px);
  }

  .menu-arrow {
    width: clamp(18px, 1.6vw, 28px);
    margin-left: clamp(3px, 0.5vw, 8px);
    font-size: clamp(24px, 3.4vh, 34px);
  }

  .billing-report-panel-body :deep(.toolbar),
  .billing-report-panel-body :deep(.query-toolbar) {
    min-height: clamp(42px, 6.2vh, 56px);
    padding: clamp(4px, 1vh, 8px) clamp(10px, 1.2vw, 18px);
  }

  .billing-report-panel-body :deep(.query-toolbar-actions) {
    gap: 6px;
  }

  .billing-report-panel-body :deep(.toolbar-actions),
  .billing-report-panel-body :deep(.query-filters-row) {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: clamp(6px, 0.75vw, 10px);
  }

  .billing-report-panel-body :deep(.content-scroll),
  .billing-report-panel-body :deep(.report-scroll) {
    height: 100%;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1.4vh, 12px);
  }

  .billing-report-panel-body :deep(.chart-wrap) {
    flex: 1 1 0;
    min-height: 0;
    margin-top: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .billing-report-panel-body :deep(.chart-card) {
    flex: 1 1 0;
    min-height: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .billing-report-panel-body :deep(.trend-chart) {
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
  }

  .billing-report-panel-body :deep(.table-wrap) {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
  }

  .billing-report-panel-body :deep(.report-table) {
    min-width: 1280px;
  }

  .billing-report-panel-body :deep(.table-pagination) {
    height: 44px;
  }

  .billing-report-panel-body :deep(.top-four-hour-page .query-toolbar) {
    min-height: clamp(50px, 8vh, 72px);
  }

  .billing-report-panel-body :deep(.top-four-hour-page) {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .billing-report-panel-body :deep(.top-four-hour-page .report-scroll) {
    flex: 1 1 0;
    min-height: 0;
    height: auto;
  }

  .billing-report-panel-body :deep(.top-four-hour-page .chart-card) {
    flex: 1 1 0;
    min-height: 0;
  }

  .billing-report-panel-body :deep(.top-four-hour-page .trend-chart) {
    height: auto;
  }

  .billing-report-panel-body :deep(.top-four-hour-page .chart-card-head) {
    height: 48px;
  }

  .billing-report-panel-body :deep(.top-four-hour-page .split-bar) {
    height: 10px;
  }

  .billing-report-panel-body :deep(.station-tab) {
    height: 30px;
  }
</style>
