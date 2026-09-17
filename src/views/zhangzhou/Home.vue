<template>
  <div ref="dashboardContainerRef" class="dashboard-container">
    <!-- <div id="mars3dContainer" class="mars3d-container"></div> -->
    <mapContainer
      ref="mapContainerRef"
      id="mars3dContainer"
      class="mars3d-container"
      :track-polylines="trackPolylines"
      :traffic-event-markers="trafficEventMarkers"
      @traffic-event-marker-click="handleTrafficEventMarkerClick"
    />
    <div class="ui-header">
      <div class="header-content">
        <div class="nav-links">
          <div class="nav-item" :class="{ 'nav-item--inactive': !isHomePage }">
            <i class="nav-icon home-icon"></i>
            <span>首页</span>
          </div>
          <div
            class="nav-item"
            :class="{ 'nav-item--inactive': !isBillingReportsPage }"
            @click="goToBillingReports"
          >
            <i class="nav-icon billing-icon"></i>
            <span>收费报表</span>
          </div>
        </div>
        <span class="header-title">福州数智云系统</span>
      </div>
    </div>
    <div class="bg-left"></div>
    <div class="panel-side left-side">
      <div class="data-card traffic-flow-panel">
        <div class="card-title">
          <span>实时流量</span>
        </div>
        <div class="card-content flow-layout">
          <TrafficFlowPanel />
        </div>
      </div>
      <div class="data-card charge-info-panel">
        <div class="card-title">
          <span>收费信息</span>
        </div>
        <div class="card-content charge-info-content">
          <div class="charge-stats-wrap">
            <charge-stats />
          </div>
          <!-- StructureBar 使用自身默认数据和标签，无需额外 props -->
          <div class="structure-bar-wrap">
            <StructureBar />
          </div>
        </div>
      </div>
      <div class="data-card call-analysis-panel">
        <div class="card-header">
          <div class="card-title time-selector">
            <span>话务统计</span>
            <div style="margin-right: 10px">
              <div class="time-buttons" v-if="false">
                <button
                  class="time-btn"
                  :class="{ active: selectedTimeType === 'day' }"
                  @click="changeTimeType('day')"
                >
                  日
                </button>
                <button
                  class="time-btn"
                  :class="{ active: selectedTimeType === 'month' }"
                  @click="changeTimeType('month')"
                >
                  月
                </button>
                <button
                  class="time-btn"
                  :class="{ active: selectedTimeType === 'year' }"
                  @click="changeTimeType('year')"
                >
                  年
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="call-analysis-wrapper">
            <CallAnalysisChart ref="callAnalysisRef" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-right"></div>

    <div
      class="panel-side right-side"
      :class="{
        'two-cards': visibleRightCardsCount === 2,
        'three-cards': visibleRightCardsCount === 3,
        'only-realtime-empty': isOnlyRealTimeTrafficCardEmptyVisible,
        'tabs-only': isRightPanelTabsOnly,
      }"
      :style="{ gridTemplateRows: rightPanelGridTemplateRows }"
    >
      <!-- 原有卡片 -->
      <div class="info-flex-layout">
        <div class="info-tabs">
          <div class="info-tab active">
            <span>交通事件信息</span>
            <label class="switch small">
              <input type="checkbox" v-model="isTrafficEventVisible" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="info-tabs">
          <div class="info-tab">
            <span>实时路况信息</span>
            <label class="switch small">
              <input type="checkbox" v-model="isRealTimeTrafficVisible" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="info-tabs section-vehicle-tab-wrap">
          <div class="info-tab section-vehicle-tab">
            <span>区段重点车辆管理</span>
            <label class="switch small">
              <input
                type="checkbox"
                v-model="isSectionVehicleManagementVisible"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div
        ref="trafficEventCardRef"
        class="data-card"
        :class="{ 'is-empty': isTrafficEventCardEmpty }"
        v-if="isTrafficEventVisible"
      >
        <div ref="trafficEventCardHeaderRef" class="card-header">
          <!-- 信息标签栏 -->
          <div class="info-details">
            <div class="info-item active">
              <div class="info-header">
                <span class="info-title">交通事件信息</span>
                <div class="info-count-box_num">
                  <span class="info-count"
                    >全部事件数量 {{ totalEventsCount }}</span
                  >
                </div>
                <div class="te-traffic_button_group">
                  <i
                    class="refresh-icon"
                    @click="refreshTrafficEvents"
                    title="刷新交通事件数据"
                  ></i>
                  <i
                    class="info-expand"
                    @click="toggleTrafficEventExpand"
                    :class="{ expanded: isTrafficEventExpanded }"
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="card-content"
          :class="{ 'card-content-auto': isTrafficEventCardEmpty }"
        >
          <TrafficEventMonitor
            ref="trafficEventMonitorRef"
            :expanded="isTrafficEventExpanded"
            :is-real-time-traffic-visible="isRealTimeTrafficVisible"
            :is-section-vehicle-management-visible="
              isSectionVehicleManagementVisible
            "
            :highlight-event-signature="highlightedEventSignature"
            @show-video-columns="showVideoColumns"
            @update-total-events="handleTotalEventsUpdate"
            @show-traffic-event-detail="
              (event) => showTrafficEventDetail(event, 'traffic-monitor-detail')
            "
          />
        </div>
      </div>
      <div
        ref="realTimeTrafficCardRef"
        class="data-card"
        v-if="isRealTimeTrafficVisible"
        :class="{
          'realtime-traffic-expanded': isRealTimeTrafficExpanded,
          'is-empty': isRealTimeTrafficCardEmpty,
        }"
      >
        <div class="card-header">
          <!-- 信息标签栏 -->
          <div class="info-details">
            <div class="info-item active">
              <div class="info-header">
                <span class="info-title">实时路况信息</span>
                <div class="info-count-box_num">
                  <span class="info-count"
                    >路网畅通率 {{ roadSmoothRate }}%</span
                  >
                </div>
                <div class="te-traffic_button_group">
                  <i
                    class="refresh-icon"
                    @click="refreshRealTimeTraffic"
                    title="刷新实时路况数据"
                  ></i>
                  <i
                    class="info-expand"
                    @click="toggleRealTimeTrafficExpand"
                    :class="{ expanded: isRealTimeTrafficExpanded }"
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="card-content"
          :class="{ 'card-content-auto': isRealTimeTrafficCardEmpty }"
        >
          <RealTimeTraffic
            ref="realTimeTrafficRef"
            :expanded="isRealTimeTrafficExpanded"
            :is-traffic-event-visible="isTrafficEventVisible"
            :is-section-vehicle-management-visible="
              isSectionVehicleManagementVisible
            "
            :external-loading="isRealTimeTrafficRefreshing"
            :show-external-loading="showRealTimeTrafficLoading"
            :traffic-data="trafficData.roadConditionList"
            :congestion-event-list="trafficData.congestionEventList"
            :highlight-road-signature="highlightedRoadSignature"
            :highlight-road-type="highlightedRoadType"
            @update-ratios="handleTrafficRatiosUpdate"
            @update-table-length="handleRealTimeTrafficTableLengthUpdate"
            @show-video-columns="showVideoColumns"
            @show-traffic-jam-detail="showTrafficJamDetail"
            @jam-road-updated="handleJamRoadUpdated"
          />
          <!-- 子组件在拥堵路段数据刷新后会 emit `jam-road-updated`，
                 父组件在此接收最新 jamRoad 列表并执行“基线 + 增量”通知判断。 -->
        </div>
      </div>
      <div
        ref="sectionVehicleCardRef"
        class="data-card"
        :class="{ 'is-empty': isSectionVehicleCardEmpty }"
        v-if="isSectionVehicleManagementVisible"
      >
        <div class="card-header card-header-blue">
          <div class="card-title card-title_flex_layout">
            <div class="card-title-wrapper">
              <span class="">区段重点车辆管理</span>
            </div>
            <div class="card-actions">
              <!-- <button class="card-btn download-btn">
                <i class="download-icon"></i> 下载
              </button> -->
              <div class="te-traffic_button_group">
                <i
                  class="refresh-icon"
                  @click="refreshSectionVehicleManagement"
                  title="刷新区段重点车辆管理数据"
                ></i>
                <i
                  class="expand-icon"
                  @click="toggleSectionVehicleManagementExpand"
                  :class="{ expanded: isSectionVehicleManagementExpanded }"
                ></i>
              </div>
            </div>
          </div>
        </div>
        <div
          class="card-content"
          :class="{ 'card-content-auto': isSectionVehicleCardEmpty }"
        >
          <SectionVehicleManagement
            ref="sectionVehicleManagementRef"
            :expanded="isSectionVehicleManagementExpanded"
            :is-traffic-event-visible="isTrafficEventVisible"
            :is-real-time-traffic-visible="isRealTimeTrafficVisible"
            :external-loading="isSectionVehicleManagementRefreshing"
            :show-external-loading="showSectionVehicleManagementLoading"
            :section-mgmt-list="trafficData.sectionMgmtList"
            :vehicleList="trafficData.vehicleList"
            :exception-vehicle-list="exceptionSectionData"
            @show-detail="showStrandedDetail"
            @show-exception-detail="showExceptionPopupDetail"
            @update-polylines="handleUpdatePolylines"
            @highlight-gantry-nodes="handleHighlightGantryNodes"
          />
        </div>
      </div>
    </div>

    <MapSearchFloating
      :visible="isTrafficEventVisible"
      :container-el="dashboardContainerRef"
      :anchor-el="trafficEventCardHeaderRef"
      :collision-root-el="trafficEventCardRef"
      :notice-visible="mapSearchNoticeVisible"
      :notice-message="mapSearchNoticeMessage"
      :extra-collision-els="[
        trafficEventCardRef,
        realTimeTrafficCardRef,
        sectionVehicleCardRef,
      ]"
      @search="handleMapSearch"
      @notice-close="hideMapSearchNotice"
    />

    <!-- 详情弹窗放到 right-side 外面，避免被父级 z-index: 10 的层叠上下文限制 -->
    <DetainedVehiclePopup
      v-if="showDetailPopup"
      :vehicle-data="selectedVehicle"
      :vehicle-type="selectedVehicleType"
      overlay-scope="right-panel"
      @close="handleCloseStrandedDetail"
    />
    <ExceptionDetailCardPopup
      v-if="showExceptionDetailPopup"
      :vehicle-data="selectedExceptionData"
      :vehicle-type="selectedExceptionType"
      overlay-scope="right-panel"
      @close="handleCloseExceptionDetail"
    />

    <MapPopup
      v-if="showTrafficEventPopup"
      type="trafficEvent"
      :data="selectedTrafficEventData"
      :popup-source="trafficEventPopupSource"
      :anchor-screen-point="trafficEventPopupAnchor"
      overlay-scope="right-panel"
      title=""
      @close="handleCloseTrafficEventPopup"
    />

    <MapPopup
      v-if="showTrafficJamPopup"
      type="trafficJam"
      :data="selectedTrafficJamData"
      :anchor-screen-point="trafficJamPopupAnchor"
      title=""
      overlay-scope="right-panel"
      :congestion-event-list="trafficData.congestionEventList"
      @close="handleCloseTrafficJamPopup"
    />

    <div
      class="bottom-bar-hover-area"
      :class="{ 'is-visible': isBottomBarVisible }"
      @mouseenter="isBottomBarHovered = true"
      @mouseleave="isBottomBarHovered = false"
    >
      <BottomBar
        :service-active="isServiceActive"
        :gantry-active="isGantryActive"
        :camera-active="isCameraActive"
        :variable-message-sign-active="isVariableMessageSignActive"
        :toll-station-active="isTollStationActive"
        :traffic-event-active="isTrafficEventMarkerActive"
        :road-condition-marker-active="isRoadConditionMarkerActive"
        @toggle-service="handleToggleService"
        @toggle-gantry="handleToggleGantry"
        @toggle-camera="handleToggleCamera"
        @toggle-variable-message-sign="handleToggleVariableMessageSign"
        @toggle-toll-station="handleToggleTollStation"
        @toggle-traffic-event-marker="handleToggleTrafficEventMarker"
        @toggle-road-condition-marker="handleToggleRoadConditionMarker"
        @hover-change="isBottomBarHovered = $event"
      />
    </div>
    <div
      class="bottom-bar-bridge-area"
      :class="{ 'is-visible': isBottomBarVisible }"
      @mouseenter="isBridgeAreaHovered = true"
      @mouseleave="isBridgeAreaHovered = false"
    />
    <div
      class="ui-footer-bar"
      @mouseenter="isFooterBarHovered = true"
      @mouseleave="isFooterBarHovered = false"
    />

    <VideoColumns
      class="vc-display"
      :visible="isVideoColumnsVisible"
      @update:visible="(val) => (isVideoColumnsVisible = val)"
      :params="videoColumnsParams"
      @close="handleVideoColumnsClose"
      @play-video="handlePlayVideo"
    />

    <!-- 视频播放弹窗   ws://35.41.30.245:559/openUrl/hjff3zy-->
    <!-- 视频播放弹窗   ws://35.55.64.5:559/openUrl/DU2CMNO-->
    <VideoPlayerModal
      v-if="isVideoPlayerVisible"
      :visible="isVideoPlayerVisible"
      :currentUrl="videoUrl"
      @close="handleVideoPlayerClose"
    />
    <NotificationModal
      v-for="(notice, index) in eventNotificationList"
      :key="notice.id"
      :alert-time="notice.alertTime"
      :alert-message="notice.alertMessage"
      :clickable="true"
      :style="{ top: `${82 + index * 120}px` }"
      @click="handleNotificationClick(notice, 'event')"
      @close="removeNotification(notice.id, 'event')"
    />
    <NotificationModal
      v-for="(notice, index) in roadNotificationList"
      :key="notice.id"
      :alert-time="notice.alertTime"
      :alert-message="notice.alertMessage"
      :clickable="true"
      :style="{ top: `${82 + (eventNotificationList.length + index) * 120}px` }"
      @click="handleNotificationClick(notice, 'road')"
      @close="removeNotification(notice.id, 'road')"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from "vue";
// import 'mars3d-cesium/Build/Cesium/Widgets/widgets.css';
// import 'mars3d/mars3d.css';
// import * as mars3d from 'mars3d';
import { useRoute, useRouter } from "vue-router";
import StructureBar from "./widgets/StructureBar.vue";
import CallAnalysisChart from "./widgets/CallAnalysisChart.vue";
import TrafficEventMonitor from "./widgets/TrafficEventMonitor.vue";
import RealTimeTraffic from "./widgets/RealTimeTraffic.vue";
import SectionVehicleManagement from "./widgets/SectionVehicleManagement.vue";
import TrafficFlowPanel from "./widgets/TrafficFlowPanel.vue";
import ChargeStats from "./widgets/ChargeStats.vue";
import BottomBar from "./widgets/BottomBar.vue";
import mapContainer from "./widgets/MapContainer.vue";
import VideoColumns from "./widgets/VideoColumns.vue";
import VideoPlayerModal from "./widgets/VideoPlayerModal.vue";
import DetainedVehiclePopup from "./widgets/popup/DetainedVehiclePopup.vue";
import ExceptionDetailCardPopup from "./widgets/popup/ExceptionDetailCardPopup.vue";
import NotificationModal from "./widgets/popup/NotificationModal.vue";
import MapPopup from "./widgets/MapPopup.vue";
import MapSearchFloating from "@/components/MapSearchFloating.vue";
import { API_URLS } from "@/utils/apiUrls.js";
import { REGION_IDS } from "@/utils/constants.js";
import { FUZHOU_API_URLS } from "@/utils/fuzhou_api.js";
import {
  REFRESH_INTERVALS,
  REFRESH_SWITCHES,
} from "@/settings/refreshIntervals";
import http from "@/utils/http.js";
import mockService from "@/utils/mockService";
import { enrichTrafficEventCoordinateData } from "@/utils/trafficEventCoordinates.js";

const router = useRouter();
const route = useRoute();
const dashboardContainerRef = ref(null);
const mapContainerRef = ref(null);
const trafficEventCardRef = ref(null);
const trafficEventCardHeaderRef = ref(null);
const realTimeTrafficCardRef = ref(null);
const sectionVehicleCardRef = ref(null);
const isHomePage = computed(() => route.path === "/1591");
const isBillingReportsPage = computed(
  () => route.path === "/1591/billing-reports"
);

/**
 * Home 页面职责说明
 * 1) 作为右侧核心业务卡片的数据编排层：负责交通事件、实时路况、区段重点车辆管理的数据拉取与刷新。
 * 2) 作为弹窗状态中心：统一管理各类详情弹窗与顶部通知弹窗（事件通知/路况通知）显示与关闭。
 * 3) 作为自动刷新调度器：按照配置定时触发业务接口刷新，并将结果分发给子组件。
 * 4) 作为数据去重与增量判断层：对交通事件和路况列表做签名比对，仅对新增数据触发通知。
 */

// 控制交通事件信息 实时路况信息 区段重点车辆管理可见
const isTrafficEventVisible = ref(true);
const isRealTimeTrafficVisible = ref(true);
const isSectionVehicleManagementVisible = ref(true);
const isFooterBarHovered = ref(false);
const isBottomBarHovered = ref(false);
const isBridgeAreaHovered = ref(false);
const isServiceActive = ref(true);
const isGantryActive = ref(true);
const isCameraActive = ref(false);
const isVariableMessageSignActive = ref(true);
const isTollStationActive = ref(true);
const isTrafficEventMarkerActive = ref(true);
const isRoadConditionMarkerActive = ref(true);
const isBottomBarVisible = computed(
  () =>
    isFooterBarHovered.value ||
    isBottomBarHovered.value ||
    isBridgeAreaHovered.value,
);

// CallAnalysisChart组件引用
const callAnalysisRef = ref(null);
// 当前选中的时间类型
const selectedTimeType = ref("day");

// 控制交通事件信息卡片是否展开
const isTrafficEventExpanded = ref(false);

// 组件引用
const trafficEventMonitorRef = ref(null);
const realTimeTrafficRef = ref(null);
const sectionVehicleManagementRef = ref(null);
const isRealTimeTrafficRefreshing = ref(false);
const isSectionVehicleManagementRefreshing = ref(false);
const showRealTimeTrafficLoading = ref(false);
const showSectionVehicleManagementLoading = ref(false);
let trafficEventRefreshTimer = null;
let unifiedRightPanelRefreshTimer = null;

// 刷新交通事件数据
const refreshTrafficEvents = async (options = {}) => {
  // 功能：刷新交通事件列表，并用当前刷新轮次做“新增事件通知”比对。
  const { showLoading = true } = options;
  const eventNotificationCycleKey = getEventNotificationCycleKey();
  try {
    const refreshResult =
      (await trafficEventMonitorRef.value?.refreshTrafficEvents?.({
        showLoading,
      })) ?? {};
    const eventList = Array.isArray(refreshResult)
      ? refreshResult
      : Array.isArray(refreshResult?.eventList)
        ? refreshResult.eventList
        : [];
    const hasResolvedEventList =
      Array.isArray(refreshResult) || Array.isArray(refreshResult?.eventList);
    const markerEventList = Array.isArray(refreshResult?.mappedEventList)
      ? refreshResult.mappedEventList
      : [];

    if (!Array.isArray(refreshResult) && refreshResult?.stale) {
      refreshNotificationTimers("event");
    }

    if (hasResolvedEventList) {
      trafficEventMarkers.value =
        normalizeTrafficEventMarkerList(markerEventList);
    }

    await fetchTrafficEventLatestAndCompare({
      eventList,
      notificationCycleKey: eventNotificationCycleKey,
    });
  } finally {
    hasLoadedTrafficEventCard.value = true;
  }
};

// 刷新实时路况数据
const refreshRealTimeTraffic = async (options = {}) => {
  // 功能：触发实时路况组件刷新，同时维护父层 loading 状态。
  const { showLoading = true } = options;
  isRealTimeTrafficRefreshing.value = true;
  showRealTimeTrafficLoading.value = showLoading;
  try {
    // 同步刷新实时路况子组件与父层 vehJam 主数据（getVehJamStatus 复核接口）
    const notificationCycleKey = getRoadNotificationCycleKey();
    await Promise.all([
      realTimeTrafficRef.value?.refreshTrafficData?.({ showLoading }) ??
        Promise.resolve(),
      fetchRoadConditionData({ notificationCycleKey }),
    ]);
  } finally {
    hasLoadedRealTimeTrafficCard.value = true;
    isRealTimeTrafficRefreshing.value = false;
    showRealTimeTrafficLoading.value = false;
  }
};

// 刷新区段重点车辆管理数据
const refreshSectionVehicleManagement = async (options = {}) => {
  // 功能：刷新区段重点车辆管理所需的主数据与特情数据。
  const { showLoading = true } = options;
  isSectionVehicleManagementRefreshing.value = true;
  showSectionVehicleManagementLoading.value = showLoading;
  try {
    // 区段重点车辆管理数据由父组件请求后通过 props 下发
    await Promise.all([
      fetchSectionVehicleManagementData(),
      fetchExceptionSectionData(),
    ]);
  } finally {
    hasLoadedSectionVehicleCard.value = true;
    isSectionVehicleManagementRefreshing.value = false;
    showSectionVehicleManagementLoading.value = false;
  }
};

// 统一刷新实时路况信息 + 区段重点车辆管理（使用统一刷新时间）
const refreshRightPanelsByUnifiedTimer = async () => {
  // 功能：按统一计时器并行刷新“实时路况 + 区段重点车辆管理”两个区域。
  const shouldRefreshRealtime =
    REFRESH_SWITCHES.GLOBAL && REFRESH_SWITCHES.REALTIME_TRAFFIC;
  const shouldRefreshSection =
    REFRESH_SWITCHES.GLOBAL && REFRESH_SWITCHES.SECTION_VEHICLE_MANAGEMENT;

  if (!shouldRefreshRealtime && !shouldRefreshSection) return;

  if (shouldRefreshRealtime) {
    isRealTimeTrafficRefreshing.value = true;
    showRealTimeTrafficLoading.value = false;
  }
  if (shouldRefreshSection) {
    isSectionVehicleManagementRefreshing.value = true;
    showSectionVehicleManagementLoading.value = false;
  }

  try {
    const notificationCycleKey = getRoadNotificationCycleKey();
    const tasks = [];

    if (shouldRefreshSection) {
      // 区段重点车辆管理与实时路况接口解耦，单独请求自身主数据。
      tasks.push(fetchSectionVehicleManagementData());
      tasks.push(fetchExceptionSectionData());
    }
    if (shouldRefreshRealtime) {
      tasks.push(fetchRoadConditionData({ notificationCycleKey }));
      tasks.push(
        realTimeTrafficRef.value?.refreshTrafficData?.({
          showLoading: false,
        }) ?? Promise.resolve(),
      );
    }

    await Promise.all(tasks);
  } finally {
    if (shouldRefreshRealtime) isRealTimeTrafficRefreshing.value = false;
    if (shouldRefreshSection)
      isSectionVehicleManagementRefreshing.value = false;
  }
};

// 控制实时路况信息卡片是否展开
const isRealTimeTrafficExpanded = ref(false);

// 控制区段重点车辆管理卡片是否展开
const isSectionVehicleManagementExpanded = ref(false);

// 控制 VideoColumns 组件的显示/隐藏
const isVideoColumnsVisible = ref(false);
// 存储传递给 VideoColumns 的参数
const videoColumnsParams = ref({});

// 控制视频播放弹窗的显示/隐藏
const isVideoPlayerVisible = ref(false);
// 存储视频URL
const videoUrl = ref("");
const roadNotificationList = ref([]);
const eventNotificationList = ref([]);
const roadNotificationTimerMap = new Map();
const eventNotificationTimerMap = new Map();
const roadNotificationIdSeed = ref(0);
const eventNotificationIdSeed = ref(0);
const activeRoadNotificationCycleKey = ref("");
const activeEventNotificationCycleKey = ref("");
const mapSearchNoticeVisible = ref(false);
const mapSearchNoticeMessage = ref("");
let mapSearchNoticeTimer = null;
const MAP_SEARCH_NOTICE_DURATION = 5000;
const seenRoadConditionSignatures = ref(new Set());
const seenTrafficEventSignatures = ref(new Set());
const hasInitializedJamRoadNotification = ref(false);
const hasInitializedRoadConditionBaseline = ref(false);
const lastRoadConditionNotificationSignature = ref("");
const highlightedRoadSignature = ref("");
const highlightedRoadType = ref("");
const highlightedRoadNoticeId = ref("");
const highlightedEventSignature = ref("");
const highlightedEventNoticeId = ref("");

// 全部事件总数
const totalEventsCount = ref(0);
const hasLoadedTrafficEventCard = ref(false);

// 路网畅通率
const roadSmoothRate = ref(0);
const hasLoadedRealTimeTrafficCard = ref(false);
const realTimeTrafficTableLength = ref(0);

// 交通比例数据
const trafficRatios = ref({ smooth: 0, jammed: 0, slow: 0 });
// 特情区段数据
const exceptionSectionData = ref([]);
const hasLoadedSectionVehicleCard = ref(false);

const getListLength = (value) => {
  if (Array.isArray(value)) return value.length;
  if (Array.isArray(value?.data)) return value.data.length;
  if (Array.isArray(value?.data?.data)) return value.data.data.length;
  return 0;
};

const isTrafficEventCardEmpty = computed(
  () =>
    hasLoadedTrafficEventCard.value &&
    Number(totalEventsCount.value || 0) === 0,
);

const isRealTimeTrafficCardEmpty = computed(() => {
  if (!hasLoadedRealTimeTrafficCard.value) return false;
  return Number(realTimeTrafficTableLength.value || 0) === 0;
});

const isSectionVehicleCardEmpty = computed(() => {
  if (!hasLoadedSectionVehicleCard.value) return false;
  const sectionCount = getListLength(trafficData.value?.sectionMgmtList);
  const vehicleCount = getListLength(trafficData.value?.vehicleList);
  const exceptionCount = getListLength(exceptionSectionData.value);
  return sectionCount === 0 && vehicleCount === 0 && exceptionCount === 0;
});

const isOnlyRealTimeTrafficVisible = computed(
  () =>
    isRealTimeTrafficVisible.value &&
    !isTrafficEventVisible.value &&
    !isSectionVehicleManagementVisible.value,
);

const isOnlyRealTimeTrafficCardEmptyVisible = computed(
  () => isOnlyRealTimeTrafficVisible.value && isRealTimeTrafficCardEmpty.value,
);

const isRightPanelTabsOnly = computed(
  () =>
    !isTrafficEventVisible.value &&
    !isRealTimeTrafficVisible.value &&
    !isSectionVehicleManagementVisible.value,
);

// 当前选中的交通数据（用于传递给 TrafficJamChart）
const currentTrafficData = ref(null);

// 弹框控制状态
const showDetailPopup = ref(false);
const showExceptionDetailPopup = ref(false);
const showTrafficEventPopup = ref(false);
const showTrafficJamPopup = ref(false);
const selectedVehicle = ref(null);
const selectedExceptionData = ref(null);
const selectedTrafficEventData = ref(null);
const trafficEventPopupSource = ref("");
const trafficEventPopupAnchor = ref(null);
const selectedTrafficJamData = ref(null);
const trafficJamPopupAnchor = ref(null);
const selectedVehicleType = ref("");
const selectedExceptionType = ref("");
const trackPolylines = ref([]);
const roadConditionMarkers = ref([]);
const trafficEventMarkers = ref([]);
const trafficJamRouteRequestId = ref(0);
let trafficEventAnchorRefreshTimer = null;
let trafficJamAnchorRefreshTimer = null;

// 处理交通事件总数更新
const handleTotalEventsUpdate = (total) => {
  // 功能：接收子组件上报的事件总数并同步到页面状态。
  totalEventsCount.value = total;
};

// 处理交通比例更新
const handleTrafficRatiosUpdate = (ratios) => {
  // 功能：接收路况比例并同步更新路网畅通率及比例对象。
  roadSmoothRate.value = ratios.smooth;
  trafficRatios.value = {
    smooth: ratios.smooth,
    jammed: ratios.jammed,
    slow: ratios.slow,
  };
};

const handleRealTimeTrafficTableLengthUpdate = (length) => {
  realTimeTrafficTableLength.value = Number(length || 0);
};

// 处理显示视频列事件
const showVideoColumns = (params) => {
  // 功能：打开视频联动侧栏，并缓存当前联动参数。
  videoColumnsParams.value = params || {};
  isVideoColumnsVisible.value = true;
  // 保存当前选中的交通数据
  if (params?.data) {
    currentTrafficData.value = params.data;
  }
};

const normalizeVideoListByFlags = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const resolveRoadConditionFlagId = (item) =>
  String(
    item?.flagId ||
      item?.Flagid ||
      item?.mileage ||
      item?.stakeNum ||
      item?.kmStart ||
      "",
  ).trim();

const buildRoadConditionVideoColumnsParams = async (detailData) => {
  const flagid = resolveRoadConditionFlagId(detailData);
  const baseData =
    detailData && typeof detailData === "object"
      ? {
          ...detailData,
          flagId: detailData?.flagId || flagid,
          Flagid: detailData?.Flagid || flagid,
        }
      : {};
  const baseParams = {
    type: "traffic",
    data: baseData,
    source: "MapRoadConditionMarker",
    flagid,
    flagId: flagid,
    Flagid: flagid,
    cameraNums: [],
  };

  if (!flagid) return baseParams;

  try {
    const response = await http.get(FUZHOU_API_URLS.video.getVideoListByFlags, {
      flagid,
      origid: REGION_IDS.FUZHOU,
    });
    const cameraNums = normalizeVideoListByFlags(response)
      .map((camera) => String(camera?.cameraNum || "").trim())
      .filter(Boolean);

    return {
      ...baseParams,
      cameraNums,
    };
  } catch (error) {
    console.error("根据区段 flagid 获取视频列表失败:", error);
    return baseParams;
  }
};

// 计算右侧面板可见卡片数量
const visibleRightCardsCount = computed(() => {
  // 功能：根据三个卡片可见状态，实时计算右侧可见卡片数量。
  let count = 0;
  if (isTrafficEventVisible.value) count++;
  if (isRealTimeTrafficVisible.value) count++;
  if (isSectionVehicleManagementVisible.value) count++;
  return count;
});

const rightPanelGridTemplateRows = computed(() => {
  if (isRightPanelTabsOnly.value) {
    return "auto";
  }

  if (isOnlyRealTimeTrafficCardEmptyVisible.value) {
    return "auto auto";
  }

  if (visibleRightCardsCount.value === 3 && !isRealTimeTrafficCardEmpty.value) {
    return "auto repeat(3, minmax(0, 1fr))";
  }

  const rows = ["auto"];
  const visibleCards = [
    {
      visible: isTrafficEventVisible.value,
      empty: false,
    },
    {
      visible: isRealTimeTrafficVisible.value,
      empty: isRealTimeTrafficCardEmpty.value,
    },
    {
      visible: isSectionVehicleManagementVisible.value,
      empty: false,
    },
  ];

  visibleCards.forEach((card) => {
    if (!card.visible) return;
    rows.push(card.empty ? "auto" : "minmax(0, 1fr)");
  });

  return rows.join(" ");
});

watch(isTrafficEventVisible, async (visible) => {
  if (!visible) return;
  // 交通事件卡片由 v-if 控制，重新显示时子组件会重建，需要主动拉取一次数据。
  await nextTick();
  await refreshTrafficEvents({ showLoading: true });
});

watch(
  () => showTrafficEventPopup.value,
  async (visible) => {
    if (!visible) return;
    await nextTick();
    scheduleTrafficEventPopupAnchorRefresh(680);
  },
);

watch(
  () => showTrafficJamPopup.value,
  async (visible) => {
    if (!visible) return;
    await nextTick();
    scheduleTrafficJamPopupAnchorRefresh(680);
  },
);

watch(
  () => selectedTrafficEventData.value,
  () => {
    if (!showTrafficEventPopup.value) return;
    scheduleTrafficEventPopupAnchorRefresh(680);
  },
  { deep: true },
);

watch(
  () => trackPolylines.value,
  () => {
    if (!showTrafficJamPopup.value) return;
    scheduleTrafficJamPopupAnchorRefresh(680);
  },
  { deep: true },
);

// 切换交通事件信息卡片展开状态
const toggleTrafficEventExpand = () => {
  // 功能：切换“交通事件”卡片展开态；展开时独占显示，收起时恢复其他卡片。
  isTrafficEventExpanded.value = !isTrafficEventExpanded.value;

  if (isTrafficEventExpanded.value) {
    // 当交通事件信息卡片展开时，隐藏实时路况信息和区段重点车辆管理卡片
    isRealTimeTrafficVisible.value = false;
    isSectionVehicleManagementVisible.value = false;
  } else {
    // 当交通事件信息卡片收起时，显示实时路况信息和区段重点车辆管理卡片
    isRealTimeTrafficVisible.value = true;
    isSectionVehicleManagementVisible.value = true;
  }
};

// 切换实时路况信息卡片展开状态
const toggleRealTimeTrafficExpand = () => {
  // 功能：切换“实时路况”卡片展开态；展开时独占显示，收起时恢复其他卡片。
  isRealTimeTrafficExpanded.value = !isRealTimeTrafficExpanded.value;

  if (isRealTimeTrafficExpanded.value) {
    // 当实时路况信息卡片展开时，隐藏交通事件信息和区段重点车辆管理卡片
    isTrafficEventVisible.value = false;
    isSectionVehicleManagementVisible.value = false;
  } else {
    // 当实时路况信息卡片收起时，显示交通事件信息和区段重点车辆管理卡片
    isTrafficEventVisible.value = true;
    isSectionVehicleManagementVisible.value = true;
  }
};

// 切换区段重点车辆管理卡片展开状态
const toggleSectionVehicleManagementExpand = () => {
  // 功能：切换“区段重点车辆管理”卡片展开态；展开时隐藏其余两卡片。
  isSectionVehicleManagementExpanded.value =
    !isSectionVehicleManagementExpanded.value;

  if (isSectionVehicleManagementExpanded.value) {
    // 当区段重点车辆管理卡片展开时，隐藏前两张卡片
    isTrafficEventVisible.value = false;
    isRealTimeTrafficVisible.value = false;
  } else {
    // 收起时恢复显示
    isTrafficEventVisible.value = true;
    isRealTimeTrafficVisible.value = true;
  }
};

// 显示 VideoColumns 组件的方法
// const showVideoColumns = (params) => {
//   videoColumnsParams.value = params || {};
//   isVideoColumnsVisible.value = true;
// };

// 隐藏 VideoColumns 组件的方法
const handleVideoColumnsClose = () => {
  // 功能：关闭视频联动侧栏并清空参数，避免下次误用旧数据。
  isVideoColumnsVisible.value = false;
  videoColumnsParams.value = {};
};

// 处理视频播放事件
const handlePlayVideo = (url) => {
  // 功能：设置播放地址并打开视频播放弹窗。
  videoUrl.value = url;
  isVideoPlayerVisible.value = true;
};

// 处理视频播放弹窗关闭
const handleVideoPlayerClose = () => {
  // 功能：关闭播放器并清理播放地址。
  isVideoPlayerVisible.value = false;
  videoUrl.value = "";
};

// 显示滞留车辆详情弹窗
const showStrandedDetail = (vehicle, type) => {
  // 功能：展示滞留车辆详情弹窗，并关闭视频联动视图避免遮挡。
  isVideoColumnsVisible.value = false;
  videoColumnsParams.value = {};
  selectedVehicle.value = vehicle;
  selectedVehicleType.value = type;
  showDetailPopup.value = true;
};

const handleUpdatePolylines = (polylines) => {
  // 功能：同步地图轨迹线数据，非数组时回退为空数组。
  trackPolylines.value = Array.isArray(polylines) ? polylines : [];
};

const handleHighlightGantryNodes = (payload) => {
  let nodeCodes = [];
  if (Array.isArray(payload)) {
    nodeCodes = payload;
  } else if (payload && typeof payload === "object") {
    nodeCodes = [payload.fromNode, payload.toNode];
  }

  nodeCodes = nodeCodes
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (nodeCodes.length === 0) return;
  mapContainerRef.value?.highlightGantryByNodeCodes?.(nodeCodes);
};

const resolveTrafficJamAnchorSource = () => {
  if (Array.isArray(trackPolylines.value) && trackPolylines.value.length > 0) {
    return trackPolylines.value;
  }
  const fallbackPath =
    selectedTrafficJamData.value?.Path ||
    selectedTrafficJamData.value?.path ||
    "";
  if (!String(fallbackPath || "").trim()) {
    return [];
  }
  return [{ path: fallbackPath }];
};

const updateTrafficJamPopupAnchor = () => {
  if (!showTrafficJamPopup.value) return;
  const source = resolveTrafficJamAnchorSource();
  if (!Array.isArray(source) || source.length === 0) {
    trafficJamPopupAnchor.value = null;
    return;
  }
  trafficJamPopupAnchor.value =
    mapContainerRef.value?.getPolylineAnchorScreenPoint?.(source, {
      margin: 16,
    }) || null;
};

const updateTrafficEventPopupAnchor = () => {
  if (!showTrafficEventPopup.value) return;
  if (!selectedTrafficEventData.value) {
    trafficEventPopupAnchor.value = null;
    return;
  }
  trafficEventPopupAnchor.value =
    mapContainerRef.value?.getTrafficEventAnchorScreenPoint?.(
      selectedTrafficEventData.value,
      {
        margin: 18,
      },
    ) || null;
};

const scheduleTrafficEventPopupAnchorRefresh = (delayMs = 620) => {
  if (trafficEventAnchorRefreshTimer) {
    clearTimeout(trafficEventAnchorRefreshTimer);
    trafficEventAnchorRefreshTimer = null;
  }
  updateTrafficEventPopupAnchor();
  trafficEventAnchorRefreshTimer = setTimeout(
    () => {
      updateTrafficEventPopupAnchor();
      trafficEventAnchorRefreshTimer = null;
    },
    Math.max(0, Number(delayMs) || 0),
  );
};

const scheduleTrafficJamPopupAnchorRefresh = (delayMs = 620) => {
  if (trafficJamAnchorRefreshTimer) {
    clearTimeout(trafficJamAnchorRefreshTimer);
    trafficJamAnchorRefreshTimer = null;
  }
  updateTrafficJamPopupAnchor();
  trafficJamAnchorRefreshTimer = setTimeout(
    () => {
      updateTrafficJamPopupAnchor();
      trafficJamAnchorRefreshTimer = null;
    },
    Math.max(0, Number(delayMs) || 0),
  );
};

const handleCloseStrandedDetail = () => {
  // 功能：关闭滞留车辆详情并清空轨迹线。
  showDetailPopup.value = false;
  trackPolylines.value = [];
  mapContainerRef.value?.restoreDefaultPointDisplay?.();
};

// 显示特情车辆详情弹窗
const showExceptionPopupDetail = (row) => {
  // 功能：展示特情车辆详情弹窗，并关闭视频联动视图避免重叠。
  isVideoColumnsVisible.value = false;
  videoColumnsParams.value = {};

  const nodeCode = String(row?.flagid ?? row?.flagId ?? "").trim();
  if (nodeCode) {
    mapContainerRef.value?.focusGantryByNodeCode?.(nodeCode, {
      zoom: 15.8,
      duration: 520,
    });
  }

  selectedExceptionData.value = row;
  selectedExceptionType.value = "exception";
  showExceptionDetailPopup.value = true;
};

const handleCloseExceptionDetail = () => {
  // 功能：关闭特情详情并清空轨迹线。
  showExceptionDetailPopup.value = false;
  trackPolylines.value = [];
  mapContainerRef.value?.restoreDefaultPointDisplay?.();
};

const normalizeTrafficJamRouteList = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.data)) return rawData.data;
  if (Array.isArray(rawData?.data?.data)) return rawData.data.data;
  return [];
};

const extractNodeCodesFromRouteList = (routeList = []) => {
  if (!Array.isArray(routeList)) return [];
  const nodeSet = new Set();
  routeList.forEach((item) => {
    const fromNode = String(item?.fromnode ?? item?.fromNode ?? "").trim();
    const toNode = String(item?.tonode ?? item?.toNode ?? "").trim();
    if (fromNode) nodeSet.add(fromNode);
    if (toNode) nodeSet.add(toNode);
  });
  return Array.from(nodeSet);
};

const buildTrafficJamTrackPolylines = (routeList = []) =>
  routeList
    .map((item) => {
      const polyline = String(item?.polyline || "").trim();
      if (!polyline) return null;
      return {
        ...item,
        path: polyline,
        type: "1",
        lineColor: "#ea1b21",
        motionSymbol: "dot",
        dotColor: "#ffffff",
        dotSize: 7,
        dotSpacing: 0.0048,
        dotFlowSpeed: 0.00003,
      };
    })
    .filter(Boolean);

const parseTrafficJamNodes = (trafficData) => {
  const rawFlagId = String(
    trafficData?.Flagid || trafficData?.flagId || "",
  ).trim();
  if (!rawFlagId) return null;

  const [fromnode = "", tonode = ""] = rawFlagId
    .split("-")
    .map((item) => item.trim());

  if (!fromnode || !tonode) return null;
  return { fromnode, tonode };
};

const fetchTrafficJamTrackPolylines = async (trafficData, requestId) => {
  const nodes = parseTrafficJamNodes(trafficData);
  if (!nodes) {
    trackPolylines.value = [];
    trafficJamPopupAnchor.value = null;
    return;
  }

  try {
    const routeRaw = await http.get(FUZHOU_API_URLS.traffic.setPositionByNode, {
      fromnode: nodes.fromnode,
      tonode: nodes.tonode,
      origid: REGION_IDS.FUZHOU,
    });
    if (requestId !== trafficJamRouteRequestId.value) return;

    const routeList = normalizeTrafficJamRouteList(routeRaw);
    trackPolylines.value = buildTrafficJamTrackPolylines(routeList);
    const nodeCodes = extractNodeCodesFromRouteList(routeList);
    if (nodeCodes.length > 0) {
      mapContainerRef.value?.highlightWarningNodesByCodes?.(nodeCodes);
    } else {
      mapContainerRef.value?.restoreDefaultPointDisplay?.();
    }
    scheduleTrafficJamPopupAnchorRefresh(680);
  } catch (error) {
    if (requestId !== trafficJamRouteRequestId.value) return;
    trackPolylines.value = [];
    trafficJamPopupAnchor.value = null;
    mapContainerRef.value?.restoreDefaultPointDisplay?.();
    console.error("获取拥堵路段轨迹失败:", error);
  }
};

// 显示交通事件详情弹窗
const showTrafficEventDetail = (event, source = "") => {
  // 功能：写入交通事件详情数据并打开事件详情弹窗。
  selectedTrafficEventData.value = event;
  trafficEventPopupSource.value = String(source || "");
  showTrafficEventPopup.value = true;
  mapContainerRef.value?.focusTrafficEventMarker?.(event, {
    zoom: 15.2,
    duration: 480,
  });
  scheduleTrafficEventPopupAnchorRefresh(680);
};

const handleCloseTrafficEventPopup = () => {
  if (trafficEventAnchorRefreshTimer) {
    clearTimeout(trafficEventAnchorRefreshTimer);
    trafficEventAnchorRefreshTimer = null;
  }
  showTrafficEventPopup.value = false;
  selectedTrafficEventData.value = null;
  trafficEventPopupSource.value = "";
  trafficEventPopupAnchor.value = null;
};

const ensureTrafficEventPanelVisible = async () => {
  // 功能：确保交通事件卡片已渲染，便于高亮行滚动定位。
  if (!isTrafficEventVisible.value) {
    isTrafficEventVisible.value = true;
  }

  if (
    isRealTimeTrafficExpanded.value ||
    isSectionVehicleManagementExpanded.value
  ) {
    isRealTimeTrafficExpanded.value = false;
    isSectionVehicleManagementExpanded.value = false;
    isRealTimeTrafficVisible.value = true;
    isSectionVehicleManagementVisible.value = true;
  }

  await nextTick();
};

const ensureRealTimeTrafficPanelVisible = async () => {
  // 功能：确保实时路况卡片已渲染，便于通知点击后直接联动详情。
  if (!isRealTimeTrafficVisible.value) {
    isRealTimeTrafficVisible.value = true;
  }

  if (
    isTrafficEventExpanded.value ||
    isSectionVehicleManagementExpanded.value
  ) {
    isTrafficEventExpanded.value = false;
    isSectionVehicleManagementExpanded.value = false;
    isTrafficEventVisible.value = true;
    isSectionVehicleManagementVisible.value = true;
  }

  await nextTick();
};

// 显示拥堵详情弹窗
const showTrafficJamDetail = async (trafficData) => {
  // 功能：写入拥堵详情数据并打开拥堵详情弹窗，同时绘制对应路段轨迹。
  selectedTrafficJamData.value = trafficData;
  showTrafficJamPopup.value = true;
  scheduleTrafficJamPopupAnchorRefresh(680);
  const requestId = trafficJamRouteRequestId.value + 1;
  trafficJamRouteRequestId.value = requestId;
  await fetchTrafficJamTrackPolylines(trafficData, requestId);
};

const handleCloseTrafficJamPopup = () => {
  // 功能：关闭拥堵详情并清空地图轨迹，且废弃未完成的轨迹请求响应。
  trafficJamRouteRequestId.value += 1;
  if (trafficJamAnchorRefreshTimer) {
    clearTimeout(trafficJamAnchorRefreshTimer);
    trafficJamAnchorRefreshTimer = null;
  }
  showTrafficJamPopup.value = false;
  selectedTrafficJamData.value = null;
  trackPolylines.value = [];
  trafficJamPopupAnchor.value = null;
  mapContainerRef.value?.restoreDefaultPointDisplay?.();
};

const toTimeTs = (value) => {
  // 功能：将时间值安全转换为时间戳，转换失败时返回 null。
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
};

const normalizeSignaturePart = (value) => {
  // 功能：统一将签名字段转为去空格字符串，避免 undefined/null 影响比对。
  return String(value ?? "").trim();
};

const getRoadNotificationCycleKey = () => {
  // 功能：按“实时路况刷新间隔”生成当前通知轮次 key。
  const intervalMs =
    Number(REFRESH_INTERVALS.REALTIME_TRAFFIC || 30000) || 30000;
  return `cycle-${Math.floor(Date.now() / intervalMs)}`;
};

const getEventNotificationCycleKey = () => {
  // 功能：按“交通事件刷新间隔”生成当前通知轮次 key。
  const intervalMs =
    Number(REFRESH_INTERVALS.TRAFFIC_EVENT_INFO || 30000) || 30000;
  return `cycle-${Math.floor(Date.now() / intervalMs)}`;
};

// 测试注入逻辑（轮次造数）已停用，当前仅保留真实业务数据链路。

const getNotificationContext = (source = "road") => {
  // 功能：根据通知来源返回对应的列表、计时器和轮次状态引用。
  if (source === "event") {
    return {
      list: eventNotificationList,
      timerMap: eventNotificationTimerMap,
      idSeed: eventNotificationIdSeed,
      activeCycleKey: activeEventNotificationCycleKey,
    };
  }
  return {
    list: roadNotificationList,
    timerMap: roadNotificationTimerMap,
    idSeed: roadNotificationIdSeed,
    activeCycleKey: activeRoadNotificationCycleKey,
  };
};

const isRequestTimeoutError = (error) => {
  // 功能：统一识别 axios/后端透传的超时错误，超时时保留旧通知展示。
  const code = String(error?.code || "").toUpperCase();
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || error || "").toLowerCase();
  return (
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    name.includes("timeout") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("超时")
  );
};

const isRequestNetworkError = (error) => {
  // 功能：识别断网/连接失败等网络异常，异常时继续保留当前通知展示。
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || error || "").toLowerCase();
  return (
    code === "ERR_NETWORK" ||
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH" ||
    message.includes("network error") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("disconnected") ||
    message.includes("offline") ||
    message.includes("断网") ||
    message.includes("网络")
  );
};

const isRetainableRequestError = (error) =>
  isRequestTimeoutError(error) || isRequestNetworkError(error);

const isTimeoutLikeResponse = (payload) => {
  // 功能：兼容接口以“成功响应包裹超时文案”的场景，避免误覆盖旧通知。
  if (!payload || typeof payload !== "object") return false;
  const code = String(payload?.code || "").toUpperCase();
  const message = String(
    payload?.message || payload?.msg || payload?.error || "",
  ).toLowerCase();
  return (
    code === "408" ||
    code.includes("TIMEOUT") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("超时")
  );
};

const clearNotificationTimers = (source = "") => {
  const clearByContext = (ctx) => {
    // 功能：清理指定来源下所有通知自动关闭计时器。
    ctx.timerMap.forEach((timerId) => clearTimeout(timerId));
    ctx.timerMap.clear();
  };
  // 功能：支持按来源清理，未传来源时清理全部通知计时器。
  if (source === "road" || source === "event") {
    clearByContext(getNotificationContext(source));
    return;
  }
  clearByContext(getNotificationContext("road"));
  clearByContext(getNotificationContext("event"));
};

const refreshNotificationTimers = (source = "road") => {
  // 功能：在超时等异常情况下延长当前通知展示时间，避免旧文案被立即清空。
  const ctx = getNotificationContext(source);
  if (!Array.isArray(ctx.list.value) || ctx.list.value.length === 0) return;

  clearNotificationTimers(source);
  ctx.list.value.forEach((item) => {
    const timerId = setTimeout(
      () => removeNotification(item.id, source),
      REFRESH_INTERVALS.NOTIFICATION_DURATION,
    );
    ctx.timerMap.set(item.id, timerId);
  });
};

const resetNotificationList = () => {
  // 功能：重置通知体系（列表、计时器、ID 种子、轮次 key）。
  clearNotificationTimers();
  roadNotificationList.value = [];
  eventNotificationList.value = [];
  roadNotificationIdSeed.value = 0;
  eventNotificationIdSeed.value = 0;
  activeRoadNotificationCycleKey.value = "";
  activeEventNotificationCycleKey.value = "";
  hideMapSearchNotice();
  highlightedRoadSignature.value = "";
  highlightedRoadType.value = "";
  highlightedRoadNoticeId.value = "";
  highlightedEventSignature.value = "";
  highlightedEventNoticeId.value = "";
};

const removeNotification = (id, source = "road") => {
  // 功能：移除单条通知，并同步清理其自动关闭计时器。
  const ctx = getNotificationContext(source);
  const removedNotice = ctx.list.value.find((item) => item.id === id) || null;
  const timerId = ctx.timerMap.get(id);
  if (timerId) {
    clearTimeout(timerId);
    ctx.timerMap.delete(id);
  }
  ctx.list.value = ctx.list.value.filter((item) => item.id !== id);

  if (source === "road") {
    const removedRoadSignature = String(removedNotice?.roadSignature || "");
    const shouldClearRoadHighlight =
      highlightedRoadNoticeId.value === id ||
      (removedRoadSignature &&
        removedRoadSignature === highlightedRoadSignature.value);

    if (shouldClearRoadHighlight) {
      highlightedRoadNoticeId.value = "";
      highlightedRoadSignature.value = "";
      highlightedRoadType.value = "";
    }
  }

  if (source === "event") {
    const removedEventSignature = String(removedNotice?.eventSignature || "");
    const shouldClearEventHighlight =
      highlightedEventNoticeId.value === id ||
      (removedEventSignature &&
        removedEventSignature === highlightedEventSignature.value);

    if (shouldClearEventHighlight) {
      highlightedEventNoticeId.value = "";
      highlightedEventSignature.value = "";
    }
  }
};

const handleNotificationClick = async (notice, source = "road") => {
  if (!notice) return;

  if (source === "road") {
    const signature = String(notice.roadSignature || "");
    if (!signature) return;

    await ensureRealTimeTrafficPanelVisible();
    highlightedRoadSignature.value = "";
    highlightedRoadType.value = "";
    await nextTick();
    highlightedRoadSignature.value = signature;
    highlightedRoadType.value = String(notice.roadType || "");
    highlightedRoadNoticeId.value = String(notice.id || "");
    const detailData = mapRoadConditionToDetailData(notice.detailData);
    const openedByTrafficPanel =
      (await realTimeTrafficRef.value?.openDetailByRoadSignature?.(
        signature,
        detailData,
      )) || false;
    if (!openedByTrafficPanel && detailData) {
      await showTrafficJamDetail(detailData);
    }
    return;
  }

  if (source === "event") {
    const signature = String(notice.eventSignature || "");
    if (!signature) return;

    await ensureTrafficEventPanelVisible();
    highlightedEventSignature.value = "";
    await nextTick();
    highlightedEventSignature.value = signature;
    highlightedEventNoticeId.value = String(notice.id || "");
    const focusedEvent =
      (await trafficEventMonitorRef.value?.focusEventBySignature?.(
        signature,
      )) || null;
    const detailData = mapTrafficEventToDetailData(
      focusedEvent || notice.detailData,
    );
    if (detailData) {
      showTrafficEventDetail(detailData, "traffic-monitor-detail");
    }
  }
};

const getNotificationSignature = (item) => {
  // 功能：生成通知去重签名（时间 + 文案）。
  return `${normalizeSignaturePart(item?.alertTime)}__${normalizeSignaturePart(item?.alertMessage)}`;
};

const appendNotifications = (items, options = {}) => {
  // 功能：追加通知并处理去重、跨轮次清理、自动关闭计时。
  const { cycleKey = "", source = "road" } = options;
  const ctx = getNotificationContext(source);
  if (!Array.isArray(items) || items.length === 0) return [];
  // Step 1: 先在“本次入参”内部去重，避免同一批次重复通知。
  const incomingDedupSet = new Set();
  const normalizedIncomingItems = items
    .map((item) => ({
      alertTime: item?.alertTime || "",
      alertMessage: item?.alertMessage || "",
      roadSignature: item?.roadSignature || "",
      roadType: item?.roadType || "",
      eventSignature: item?.eventSignature || "",
      detailData: item?.detailData || null,
    }))
    .filter((item) => {
      const signature = getNotificationSignature(item);
      if (incomingDedupSet.has(signature)) return false;
      incomingDedupSet.add(signature);
      return true;
    });
  if (normalizedIncomingItems.length === 0) return [];

  const currentSignatureSet = new Set(
    ctx.list.value.map((item) => getNotificationSignature(item)),
  );
  const incomingNewItems = normalizedIncomingItems.filter(
    (item) => !currentSignatureSet.has(getNotificationSignature(item)),
  );
  if (incomingNewItems.length === 0) return [];

  // Step 2: 计算通知轮次 key。轮次变化表示进入新刷新周期，可按策略清理旧通知。
  const fallbackCycleKey =
    source === "event"
      ? getEventNotificationCycleKey()
      : getRoadNotificationCycleKey();
  const resolvedCycleKey = cycleKey || fallbackCycleKey;
  const isCrossCycle =
    ctx.activeCycleKey.value && ctx.activeCycleKey.value !== resolvedCycleKey;

  // 跨轮次且有新数据时，清理旧弹窗；同轮次直接共存追加
  if (isCrossCycle) {
    clearNotificationTimers(source);
    ctx.list.value = [];
  }
  ctx.activeCycleKey.value = resolvedCycleKey;

  // Step 3: 二次兜底去重，避免并发/状态切换下重复插入。
  const finalSignatureSet = new Set(
    ctx.list.value.map((item) => getNotificationSignature(item)),
  );
  const finalItems = incomingNewItems.filter((item) => {
    const signature = getNotificationSignature(item);
    if (finalSignatureSet.has(signature)) return false;
    finalSignatureSet.add(signature);
    return true;
  });
  if (finalItems.length === 0) return [];

  // Step 4: 路况通知采用“单条最新优先”策略，只保留最新一组。
  if (source === "road") {
    clearNotificationTimers("road");
    ctx.list.value = [];
  }

  // Step 5: 生成稳定通知 ID，绑定自动关闭计时器。
  const now = Date.now();
  const newNotices = finalItems.map((item) => ({
    id: `${source}-notice-${now}-${++ctx.idSeed.value}`,
    alertTime: item.alertTime,
    alertMessage: item.alertMessage,
    roadSignature: item.roadSignature || "",
    roadType: item.roadType || "",
    eventSignature: item.eventSignature || "",
    detailData: item.detailData || null,
  }));
  ctx.list.value.push(...newNotices);

  newNotices.forEach((item) => {
    const timerId = setTimeout(
      () => removeNotification(item.id, source),
      REFRESH_INTERVALS.NOTIFICATION_DURATION,
    );
    ctx.timerMap.set(item.id, timerId);
  });

  return newNotices;
};

const formatNotificationTime = () => {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const showMockEnabledNotification = () => {
  const isMockEnabled = mockService.logInitStatus();
  if (!isMockEnabled) return;

  appendNotifications(
    [
      {
        alertTime: formatNotificationTime(),
        alertMessage: "当前已启用 Mock 数据模式，请注意核对当前环境。",
      },
    ],
    { cycleKey: "mock-init", source: "event" },
  );
};

const hideMapSearchNotice = () => {
  if (mapSearchNoticeTimer) {
    clearTimeout(mapSearchNoticeTimer);
    mapSearchNoticeTimer = null;
  }
  mapSearchNoticeVisible.value = false;
};

const showMapSearchNoResultNotice = () => {
  hideMapSearchNotice();
  mapSearchNoticeMessage.value = "当前关键字未查询到任何信息";
  mapSearchNoticeVisible.value = true;
  mapSearchNoticeTimer = setTimeout(() => {
    mapSearchNoticeVisible.value = false;
    mapSearchNoticeTimer = null;
  }, MAP_SEARCH_NOTICE_DURATION);
};

const handleMapSearch = (payload = {}) => {
  const type = String(payload?.type || "camera");
  const keyword = String(payload?.keyword ?? "").trim();
  hideMapSearchNotice();
  if (!keyword) return;

  const searchHandlers = {
    camera: () => mapContainerRef.value?.searchCameraByAlias?.(keyword),
    gantry: () => mapContainerRef.value?.searchGantryByName?.(keyword),
    tollStation: () =>
      mapContainerRef.value?.searchTollStationByName?.(keyword),
    serviceArea: () => mapContainerRef.value?.searchServiceBySubName?.(keyword),
    variableMessageSign: () =>
      mapContainerRef.value?.searchVariableMessageSignByName?.(keyword),
  };
  const pointLayerTypeBySearchType = {
    camera: "camera",
    gantry: "gantry",
    tollStation: "tollStation",
    serviceArea: "service",
    variableMessageSign: "variableMessageSign",
  };
  const pointLayerType = pointLayerTypeBySearchType[type];
  if (pointLayerType) {
    mapContainerRef.value?.bringPointLayerTypeToTop?.(pointLayerType);
  }

  const searchHandler = searchHandlers[type];
  if (!searchHandler) return;

  const result = searchHandler();
  if (!result?.found) {
    showMapSearchNoResultNotice();
    return;
  }

  if (type === "camera") {
    isCameraActive.value =
      mapContainerRef.value?.getGraphicsVisibility?.("camera") ?? true;
    return;
  }

  if (type === "gantry") {
    isGantryActive.value =
      mapContainerRef.value?.getGraphicsVisibility?.("gantry") ??
      isGantryActive.value;
    return;
  }

  if (type === "tollStation") {
    isTollStationActive.value =
      mapContainerRef.value?.getGraphicsVisibility?.("tollStation") ??
      isTollStationActive.value;
    return;
  }

  if (type === "serviceArea") {
    isServiceActive.value =
      mapContainerRef.value?.getGraphicsVisibility?.("service") ??
      isServiceActive.value;
    return;
  }

  if (type === "variableMessageSign") {
    isVariableMessageSignActive.value =
      mapContainerRef.value?.getGraphicsVisibility?.("variableMessageSign") ??
      isVariableMessageSignActive.value;
  }
};

const buildRoadConditionMessage = (item) => {
  // 功能：将路况对象组装为通知文案，兼容字段缺失场景。
  if (!item || typeof item !== "object") return "实时路况信息发生更新";
  const type = normalizeRoadConditionType(item);
  const prefix =
    type === "jammed" ? "【拥堵】" : type === "slow" ? "【缓行】" : "";
  const sectionName =
    item.sectionName ||
    item.routeName ||
    `${item.fromName || ""}${item.toname ? `-${item.toname}` : ""}` ||
    item.stakeNum ||
    item.kmStart ||
    "";
  const stakeNum = item?.stakeNum || item?.kmStart || "-";
  const avgSpeed =
    item?.avgSpeed !== undefined && item?.avgSpeed !== null
      ? `${item.avgSpeed}km/h`
      : "-";
  const flow =
    item?.flow !== undefined && item?.flow !== null ? item.flow : "-";
  const typeLabel =
    type === "jammed" ? "拥堵" : type === "slow" ? "缓行" : "未知";
  // 类型：${typeLabel}
  // return `${prefix} 区段名称：${sectionName || '-'} 桩号：${stakeNum} 平均车速：${avgSpeed} 流量：${flow}`;
  return `${prefix} 区段名称：${sectionName || "-"} 桩号：${stakeNum} 平均车速：${avgSpeed} `;
};

const buildTrafficEventMessage = (item) => {
  // 功能：将交通事件对象组装为通知文案（描述 + 路线）。
  if (!item || typeof item !== "object") return "事件描述路线：-";
  const description = item?.content || "-";
  const route = `${item?.routeName || ""}${item?.kmStart || ""}${item?.kmEnd ? `-${item.kmEnd}` : ""}`;
  const routePart = route ? `（${route}）` : "";
  return `事件描述路线：${description}${routePart}`;
};

const buildTrafficEventRoute = (item) => {
  if (!item || typeof item !== "object") return "";
  const routeName = item?.routeName || item?.route || "";
  const kmStart = item?.kmStart || "";
  const kmEnd = item?.kmEnd || "";

  if (kmStart && kmEnd && kmStart !== kmEnd) {
    return `${routeName}${kmStart}-${kmEnd}`;
  }

  return `${routeName}${kmStart}`;
};

const buildTrafficEventLocation = (item) => {
  if (!item || typeof item !== "object") return "";
  const routeName = item?.routeName || item?.route || "";
  const kmStart = item?.kmStart || "";
  const kmEnd = item?.kmEnd || "";
  const direction = item?.direction || "";
  const stake =
    kmStart && kmEnd && kmStart !== kmEnd ? `${kmStart}-${kmEnd}` : kmStart;

  return [routeName, stake, direction].filter(Boolean).join(" ");
};

const mapTrafficEventToDetailData = (item) => {
  if (!item || typeof item !== "object") return null;

  if (item?.originalData || item?.description || item?.route) {
    return item;
  }

  const coordinateData = enrichTrafficEventCoordinateData(item) || {};
  const originalData = {
    ...item,
    ...coordinateData,
  };

  return {
    description: item?.content || "",
    location: buildTrafficEventLocation(item),
    time: item?.happenTime || item?.time || "",
    status: item?.eventStatus || item?.status || "",
    eventStatus: item?.eventStatus || item?.status || "",
    eventType: item?.eventType || "",
    route: buildTrafficEventRoute(item),
    handleContent: item?.handleContent || "",
    eventSignature: getTrafficEventSignature(item),
    ...coordinateData,
    originalData,
  };
};

const mapRoadConditionToDetailData = (item) => {
  if (!item || typeof item !== "object") return null;

  if (item?.roadSignature && item?.trafficType && item?.sectionName) {
    return item;
  }

  const normalizedType = normalizeRoadConditionType(item);
  const sectionName =
    item?.sectionName ||
    item?.routeName ||
    `${item?.fromName || ""}${item?.toname ? `-${item.toname}` : ""}`;
  const avgSpeedRaw =
    item?.avgSpeed === null ||
    item?.avgSpeed === undefined ||
    item?.avgSpeed === ""
      ? ""
      : String(item.avgSpeed);

  return {
    ...item,
    flagId: item?.flagId || item?.Flagid || item?.id || "",
    sectionName,
    mileage: item?.mileage || item?.stakeNum || item?.kmStart || "",
    avgSpeed: avgSpeedRaw ? `${avgSpeedRaw}km/h` : "-",
    avgSpeedRaw,
    flow: String(item?.flow ?? item?.totalVehicles ?? 0),
    time: item?.time || item?.startTime || item?.happenTime || "",
    trafficType:
      normalizedType === "jammed"
        ? "拥堵"
        : normalizedType === "slow"
          ? "缓行"
          : item?.trafficType || "未知",
    roadSignature: getRoadConditionSignature(item),
  };
};

const handleRoadConditionMarkerClick = async (markerData) => {
  const detailData = mapRoadConditionToDetailData(markerData);
  if (!detailData) return;
  const videoParams = await buildRoadConditionVideoColumnsParams(detailData);
  showVideoColumns(videoParams);
  await showTrafficJamDetail(detailData);
};

const handleTrafficEventMarkerClick = async (markerData) => {
  const detailData = markerData?.originalData ? markerData : null;
  if (!detailData) return;
  highlightedEventSignature.value = String(detailData?.eventSignature || "");
  await nextTick();
  await trafficEventMonitorRef.value?.focusEventBySignature?.(
    detailData?.eventSignature,
  );
  showVideoColumns({
    type: "event",
    data: detailData,
    source: "TrafficEventMonitor",
  });
  showTrafficEventDetail(detailData, "traffic-monitor-detail");
};

const normalizeRoadConditionType = (item) => {
  // 功能：统一归一化路况类型，输出 jammed/slow/unknown 三类。
  const rawType = normalizeSignaturePart(item?.type).toLowerCase();
  const rawStatus = normalizeSignaturePart(item?.status).toLowerCase();
  const rawEventType = normalizeSignaturePart(item?.eventType).toLowerCase();
  // 设计说明：后端字段来源不一致，统一拼接后做关键词/编码双通道识别。
  const merged = `${rawType}|${rawStatus}|${rawEventType}`;

  const isJammedCode =
    rawType === "0" ||
    rawStatus === "0" ||
    rawEventType === "0" ||
    rawType === "jammed" ||
    rawStatus === "jammed";
  const isSlowCode =
    rawType === "1" ||
    rawStatus === "1" ||
    rawEventType === "1" ||
    rawType === "slow" ||
    rawStatus === "slow";

  if (
    isJammedCode ||
    merged.includes("拥堵") ||
    merged.includes("堵塞") ||
    merged.includes("congest") ||
    merged.includes("jam")
  ) {
    return "jammed";
  }
  if (
    isSlowCode ||
    merged.includes("缓行") ||
    merged.includes("慢行") ||
    merged.includes("缓慢") ||
    merged.includes("slow")
  ) {
    return "slow";
  }
  return "unknown";
};

const inferRoadConditionTypeByStatusAndSpeed = (
  item,
  congestionStatusMap = new Map(),
) => {
  // 功能：当类型字段不可靠时，按拥堵状态文本和速度阈值兜底推断类型。
  const statusText = String(
    item?.congestionStatus ||
      congestionStatusMap.get(item?.Flagid || item?.flagId) ||
      "",
  ).trim();

  if (statusText.includes("拥堵") || statusText.includes("堵塞")) {
    return "jammed";
  }
  if (
    statusText.includes("缓行") ||
    statusText.includes("慢行") ||
    statusText.includes("缓慢")
  ) {
    return "slow";
  }

  const speed = Number(item?.avgSpeed);
  if (!Number.isNaN(speed)) {
    if (speed <= 20) return "jammed";
    if (speed <= 55) return "slow";
  }

  return "unknown";
};

const normalizeBaseRoadConditionListForCompare = (
  baseRoadConditionList = [],
) => {
  // 功能：为基础路况列表补齐可识别类型，提升后续通知比对准确性。
  const congestionStatusMap = new Map(
    (Array.isArray(trafficData.value?.congestionEventList)
      ? trafficData.value.congestionEventList
      : []
    ).map((entry) => [entry?.Flagid, entry?.congestionStatus]),
  );

  return baseRoadConditionList.map((item) => {
    // Step 1: 原始字段可直接识别时，保留原对象，避免无意义改写。
    const currentType = normalizeRoadConditionType(item);
    if (currentType !== "unknown") return item;

    // Step 2: 无法识别时，基于状态文案+速度推断类型并回填标准字段。
    const inferredType = inferRoadConditionTypeByStatusAndSpeed(
      item,
      congestionStatusMap,
    );
    if (inferredType === "jammed") {
      return {
        ...item,
        type: "0",
        status: "0",
        eventType: "拥堵",
      };
    }
    if (inferredType === "slow") {
      return {
        ...item,
        type: "1",
        status: "1",
        eventType: "缓行",
      };
    }
    return item;
  });
};

const getRoadConditionTimeTs = (item) => {
  // 功能：提取路况时间字段并转为时间戳，用于“最新一条”判断。
  return toTimeTs(item?.startTime || item?.time || item?.happenTime);
};

const getRoadConditionSignature = (item) => {
  // 功能：生成路况签名，结合主键与关键字段识别内容变化。
  if (!item || typeof item !== "object") return "";
  const primary = item?.Flagid ?? item?.flagId ?? item?.id;
  const type = normalizeRoadConditionType(item);
  const section = normalizeSignaturePart(
    item?.sectionName ||
      item?.routeName ||
      `${item?.fromName || ""}${item?.toname ? `-${item.toname}` : ""}`,
  );
  // 与 RealTimeTraffic.vue 保持一致：兼容 mileage / happenTime / avgSpeedRaw 字段。
  const stakeNum = normalizeSignaturePart(
    item?.stakeNum || item?.mileage || item?.kmStart,
  );
  const happenTime = normalizeSignaturePart(
    item?.startTime || item?.time || item?.happenTime,
  );
  const avgSpeed = normalizeSignaturePart(item?.avgSpeedRaw ?? item?.avgSpeed);
  const flow = normalizeSignaturePart(item?.flow);
  const status =
    type === "jammed"
      ? "0"
      : type === "slow"
        ? "1"
        : normalizeSignaturePart(item?.status);
  const primaryText = normalizeSignaturePart(primary);
  // 使用“主键 + 关键内容字段”作为签名，避免主键固定时无法识别更新
  const signatureParts = [
    primaryText,
    type,
    status,
    section,
    stakeNum,
    happenTime,
    avgSpeed,
    flow,
  ];
  if (signatureParts.every((part) => !part)) return "";
  return `road:${signatureParts.join("|")}`;
};

const mergeSeenSignatures = (sourceSet, signatures) => {
  // 功能：合并历史签名集合，保留已见记录用于增量判断。
  if (!Array.isArray(signatures) || signatures.length === 0) return sourceSet;
  return new Set([...sourceSet, ...signatures]);
};

const getTrafficEventSignature = (item) => {
  // 功能：生成交通事件签名，优先使用事件主键，不足时回退字段组合。
  if (!item || typeof item !== "object") return "";
  const primary = item?.eventNo ?? item?.eventId ?? item?.id;
  const primaryText = normalizeSignaturePart(primary);
  if (primaryText) return `event:${primaryText}`;

  const parts = [
    normalizeSignaturePart(item?.content),
    normalizeSignaturePart(item?.routeName),
    normalizeSignaturePart(item?.kmStart),
    normalizeSignaturePart(item?.kmEnd),
    normalizeSignaturePart(item?.direction),
    normalizeSignaturePart(item?.happenTime),
  ];
  if (parts.every((part) => !part)) return "";
  return `event:${parts.join("|")}`;
};

const checkRoadConditionUpdate = (data, options = {}) => {
  // 功能：比较路况最新状态与基线，发现变化时触发路况通知。
  const { notificationCycleKey = "" } = options;
  const roadConditionList = Array.isArray(data?.roadConditionList)
    ? data.roadConditionList
    : [];
  if (roadConditionList.length === 0) return;

  // Step 1: 为每条路况构建签名、类型、时间戳，过滤无效记录。
  const signedItems = roadConditionList
    .map((item, index) => ({
      item,
      index,
      signature: getRoadConditionSignature(item),
      type: normalizeRoadConditionType(item),
      ts: getRoadConditionTimeTs(item),
    }))
    .filter((entry) => entry.signature);
  if (signedItems.length === 0) return;

  const recognizedEntries = signedItems.filter(
    (entry) => entry.type === "jammed" || entry.type === "slow",
  );
  if (recognizedEntries.length === 0) return;

  // Step 2: 按业务优先级选候选集。
  // 多条时取最新一条；有拥堵则优先从拥堵里选，否则在缓行里选。
  const jammedEntries = recognizedEntries.filter(
    (entry) => entry.type === "jammed",
  );
  const candidatePool =
    jammedEntries.length > 0
      ? jammedEntries
      : recognizedEntries.filter((entry) => entry.type === "slow");

  const latestCandidate = candidatePool.reduce((latest, current) => {
    // 比较规则：优先有时间戳；其次时间戳更大；再其次保留后出现项（index 大）。
    if (!latest) return current;
    if (latest.ts === null && current.ts !== null) return current;
    if (latest.ts !== null && current.ts === null) return latest;
    if ((current.ts || 0) > (latest.ts || 0)) return current;
    if ((current.ts || 0) < (latest.ts || 0)) return latest;
    return current.index > latest.index ? current : latest;
  }, null);

  if (!latestCandidate) return;

  // Step 3: 首次加载仅建立基线，不弹框，避免页面初始化“误报”。
  if (!hasInitializedRoadConditionBaseline.value) {
    lastRoadConditionNotificationSignature.value = latestCandidate.signature;
    hasInitializedRoadConditionBaseline.value = true;
    return;
  }

  // Step 4: 与上一次已通知签名相同则不重复通知。
  if (
    latestCandidate.signature === lastRoadConditionNotificationSignature.value
  ) {
    return;
  }

  const newNotices = appendNotifications(
    [
      {
        alertTime:
          latestCandidate.item?.startTime || latestCandidate.item?.time || "",
        alertMessage: buildRoadConditionMessage(latestCandidate.item),
        roadSignature: latestCandidate.signature,
        roadType: latestCandidate.type,
        detailData: mapRoadConditionToDetailData(latestCandidate.item),
      },
    ],
    { cycleKey: notificationCycleKey, source: "road" },
  );
  if (newNotices.length > 0) {
    highlightedRoadSignature.value = "";
    highlightedRoadType.value = "";
    highlightedRoadNoticeId.value = "";
  }
  lastRoadConditionNotificationSignature.value = latestCandidate.signature;
};

const handleJamRoadUpdated = (jamRoadConditionList = []) => {
  // 功能：处理 RealTimeTraffic 组件的 `jam-road-updated` 事件。
  // 触发时机：子组件完成 jamRoad（拥堵路段）拉取或更新后 emit。
  // 处理结果：按“拥堵优先 + 首次仅建基线 + 后续增量检测”策略决定是否弹出路况通知。
  const baseRoadConditionList = Array.isArray(
    trafficData.value?.roadConditionList,
  )
    ? trafficData.value.roadConditionList
    : [];
  const normalizedBaseRoadConditionList =
    normalizeBaseRoadConditionListForCompare(baseRoadConditionList);
  const normalizedJamRoadList = Array.isArray(jamRoadConditionList)
    ? jamRoadConditionList
    : [];
  // Step 1: 拥堵优先数据源选择。
  // 有 jamRoad 数据时只对 jamRoad 比对；为空时才回退到 base 的缓行数据。
  const compareRoadConditionList =
    normalizedJamRoadList.length > 0
      ? normalizedJamRoadList
      : normalizedBaseRoadConditionList.filter(
          (item) => normalizeRoadConditionType(item) === "slow",
        );

  // Step 2: 首次接收 jamRoad 仅建立基线，不触发通知。
  if (!hasInitializedJamRoadNotification.value) {
    const signedItems = compareRoadConditionList
      .map((item, index) => ({
        item,
        index,
        signature: getRoadConditionSignature(item),
        type: normalizeRoadConditionType(item),
        ts: getRoadConditionTimeTs(item),
      }))
      .filter((entry) => entry.signature);
    // 基线构建策略与 checkRoadConditionUpdate 保持一致，确保后续比较稳定。
    const recognizedEntries = signedItems.filter(
      (entry) => entry.type === "jammed" || entry.type === "slow",
    );
    if (recognizedEntries.length > 0) {
      const jammedEntries = recognizedEntries.filter(
        (entry) => entry.type === "jammed",
      );
      const candidatePool =
        jammedEntries.length > 0
          ? jammedEntries
          : recognizedEntries.filter((entry) => entry.type === "slow");
      const latestCandidate = candidatePool.reduce((latest, current) => {
        if (!latest) return current;
        if (latest.ts === null && current.ts !== null) return current;
        if (latest.ts !== null && current.ts === null) return latest;
        if ((current.ts || 0) > (latest.ts || 0)) return current;
        if ((current.ts || 0) < (latest.ts || 0)) return latest;
        return current.index > latest.index ? current : latest;
      }, null);
      if (latestCandidate) {
        lastRoadConditionNotificationSignature.value =
          latestCandidate.signature;
        hasInitializedRoadConditionBaseline.value = true;
      }
    }
    hasInitializedJamRoadNotification.value = true;
    return;
  }

  // Step 3: 非首次回调时，进入统一路况更新检测流程。
  const notificationCycleKey = getRoadNotificationCycleKey();
  checkRoadConditionUpdate(
    {
      roadConditionList: compareRoadConditionList,
    },
    { notificationCycleKey },
  );
};

const fetchTrafficEventLatestAndCompare = async (options = {}) => {
  // 功能：对交通事件做增量比对，仅对新增事件弹出通知。
  const { eventList = [], notificationCycleKey = "" } = options;
  if (!Array.isArray(eventList) || eventList.length === 0) return;

  // Step 1: 预处理事件，补充时间戳与签名并过滤无效项。
  const validEvents = eventList
    .map((item) => ({
      ...item,
      _ts: toTimeTs(item?.happenTime),
      _signature: getTrafficEventSignature(item),
    }))
    .filter((item) => item._signature);
  if (validEvents.length === 0) return;

  // Step 2: 首次仅记录为“已见集合”，不弹窗，防止首屏历史数据刷屏。
  if (seenTrafficEventSignatures.value.size === 0) {
    seenTrafficEventSignatures.value = new Set(
      validEvents.map((item) => item._signature),
    );
    return;
  }

  // Step 3: 只保留当前轮次“新出现”的事件。
  const newEvents = validEvents.filter(
    (item) => !seenTrafficEventSignatures.value.has(item._signature),
  );
  if (newEvents.length > 0) {
    highlightedEventSignature.value = "";
    highlightedEventNoticeId.value = "";

    // 通知展示优先显示时间最新的事件。
    const sortedNewEvents = [...newEvents].sort(
      (a, b) => (b._ts || 0) - (a._ts || 0),
    );
    appendNotifications(
      sortedNewEvents.map((item) => ({
        alertTime: item?.happenTime || "",
        alertMessage: buildTrafficEventMessage(item),
        eventSignature: item._signature,
        detailData: mapTrafficEventToDetailData(item),
      })),
      { cycleKey: notificationCycleKey, source: "event" },
    );
  }
  // Step 4: 合并当前轮次签名到历史集合，作为下一轮的比对基线。
  seenTrafficEventSignatures.value = mergeSeenSignatures(
    seenTrafficEventSignatures.value,
    validEvents.map((item) => item._signature),
  );
};

const handleToggleGantry = () => {
  // 功能：切换龙门架显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleGantry?.();
  isGantryActive.value =
    mapContainerRef.value?.getGraphicsVisibility?.("gantry") ??
    !isGantryActive.value;
};

const handleToggleService = () => {
  // 功能：切换服务区显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleService?.();
  isServiceActive.value =
    mapContainerRef.value?.getGraphicsVisibility?.("service") ??
    !isServiceActive.value;
};

const handleToggleCamera = () => {
  // 功能：切换视频监控显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleCamera?.();
  isCameraActive.value =
    mapContainerRef.value?.getGraphicsVisibility?.("camera") ??
    !isCameraActive.value;
};

const handleToggleVariableMessageSign = () => {
  // 功能：切换情报板显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleVariableMessageSign?.();
  isVariableMessageSignActive.value =
    mapContainerRef.value?.getGraphicsVisibility?.("variableMessageSign") ??
    !isVariableMessageSignActive.value;
};

const handleToggleTollStation = () => {
  // 功能：切换收费站显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleTollStation?.();
  isTollStationActive.value =
    mapContainerRef.value?.getGraphicsVisibility?.("tollStation") ??
    !isTollStationActive.value;
};

const handleToggleTrafficEventMarker = () => {
  // 功能：切换交通事件点位显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleTrafficEventMarker?.();
  isTrafficEventMarkerActive.value =
    mapContainerRef.value?.getTrafficEventMarkerVisibility?.() ??
    !isTrafficEventMarkerActive.value;
};

const handleToggleRoadConditionMarker = () => {
  // 功能：切换实时路况点位显隐并同步底栏按钮激活样式。
  mapContainerRef.value?.toggleRoadConditionMarker?.();
  isRoadConditionMarkerActive.value =
    mapContainerRef.value?.getRoadConditionMarkerVisibility?.() ??
    !isRoadConditionMarkerActive.value;
};

// 交通数据
const trafficData = ref({
  congestionEventList: [],
  roadConditionList: [],
  sectionMgmtList: [],
  vehicleList: [],
});

const normalizeRoadConditionList = (rawData) => {
  const source = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : [];

  return source.map((item) => ({
    ...item,
    type: "1",
    status: "1",
    eventType: "缓行",
    flow: item?.flow ?? item?.totalVehicles ?? 0,
    avgSpeed: item?.avgSpeed ?? null,
    stakeNum: item?.stakeNum || "",
    mileage: item?.mileage || item?.stakeNum || item?.Flagid || "",
  }));
};

const normalizeTrafficEventMarkerList = (eventList = []) => {
  const source = Array.isArray(eventList) ? eventList : [];
  return source
    .map((item) => {
      const coordinateData =
        enrichTrafficEventCoordinateData(item) ||
        enrichTrafficEventCoordinateData(item?.originalData || {});
      if (!coordinateData) return null;

      return {
        ...item,
        ...coordinateData,
        eventSignature: getTrafficEventSignature(item),
      };
    })
    .filter(Boolean);
};

const normalizeRoadConditionMarkerList = (rawData) => {
  const source = Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : [];

  return source
    .flatMap((group) => (Array.isArray(group) ? group : group ? [group] : []))
    .map((item) => ({
      ...item,
      point: item?.point || "",
      polyline: item?.polyline || "",
      type: String(item?.type || "").trim(),
      eventType: String(item?.type || "").trim(),
      status: String(item?.type || "")
        .trim()
        .includes("拥堵")
        ? "0"
        : "1",
      fromnode: item?.fromnode || "",
      tonode: item?.tonode || "",
      Flagid:
        item?.Flagid ||
        item?.flagId ||
        [item?.fromnode || "", item?.tonode || ""].filter(Boolean).join("-"),
      flagId:
        item?.flagId ||
        item?.Flagid ||
        [item?.fromnode || "", item?.tonode || ""].filter(Boolean).join("-"),
    }))
    .filter((item) => String(item.point || "").trim());
};

const normalizeSectionMgmtList = (rawData) => {
  const source = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : [];

  return source.map((item) => ({
    ...item,
    sectionName: item?.sectionName || "",
    vehicleCount: Number(item?.vehicleCount) || 0,
    upstreamCount: Number(item?.upstreamCount) || 0,
    downstreamCount: Number(item?.downstreamCount) || 0,
    passids: item?.passids || "",
    linkId: item?.linkId || item?.linkid || item?.Flagid || item?.flagId || "",
    time: item?.time || "",
  }));
};

const normalizeVehicleList = (rawData) => {
  const source = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : [];

  return source.map((item) => ({
    ...item,
    passid: item?.passid || "",
    linkId: item?.linkId || "",
    plate: item?.plate || "",
    vehType: item?.vehType || "",
    strandedTime: item?.strandedTime || "",
    currentSpeed: item?.currentSpeed ?? "",
    entryTime: item?.entryTime || "",
    predExitTime: item?.predExitTime || "",
    isStranded: item?.isStranded ?? true,
  }));
};

const fetchRoadConditionData = async (options = {}) => {
  // 功能：仅请求实时路况列表，并执行路况通知比对。
  const { notificationCycleKey = "" } = options;
  try {
    const [roadConditionResult, roadConditionMarkerResult] =
      // 获取实时路况列表和路况标记数据，供通知比对和地图标记展示使用。
      await Promise.allSettled([
        http.get(API_URLS.putian_highway.getCongestionEventList, {
          origid: REGION_IDS.FUZHOU,
        }),
        http.get(API_URLS.putian_highway.getAllPositionByNode, {
          origid: REGION_IDS.FUZHOU,
        }),
      ]);
    if (roadConditionResult.status !== "fulfilled") {
      throw roadConditionResult.reason;
    }
    const roadConditionRaw = roadConditionResult.value;
    if (isTimeoutLikeResponse(roadConditionRaw)) {
      console.warn("实时路况接口返回超时信息，保留当前路况通知");
      refreshNotificationTimers("road");
      return;
    }
    const roadConditionList = normalizeRoadConditionList(roadConditionRaw);
    roadConditionMarkers.value =
      roadConditionMarkerResult.status === "fulfilled"
        ? normalizeRoadConditionMarkerList(roadConditionMarkerResult.value)
        : [];
    const mergedData = {
      ...trafficData.value,
      // 这里保留同结构字段，避免现有依赖联动断开。
      congestionEventList: roadConditionList,
      roadConditionList,
    };
    trafficData.value = mergedData;
    checkRoadConditionUpdate(mergedData, { notificationCycleKey });
  } catch (error) {
    if (isRetainableRequestError(error)) {
      console.warn("获取实时路况数据失败，保留当前路况通知", error);
      refreshNotificationTimers("road");
      return;
    }
    roadConditionMarkers.value = [];
    console.error("获取实时路况数据失败:", error);
  }
};

const fetchSectionVehicleManagementData = async () => {
  // 功能：仅请求区段重点车辆管理主数据，不触发实时路况接口。
  try {
    // 旧接口获取方式，暂注释保留，便于后续接口替换时参考：
    // const vehJamData = await http.get(API_URLS.putian_highway.getVehJamStatus);
    // const baseData =
    //   vehJamData && typeof vehJamData === 'object' ? vehJamData : {};
    // const legacyVehicleList = baseData?.vehicleList || [];
    // const legacySectionMgmtList = baseData?.sectionMgmtList || [];

    const [sectionMgmtListRaw, vehicleListRaw] = await Promise.all([
      http.get(API_URLS.putian_highway.getSectionMgmtList, {
        origid: REGION_IDS.FUZHOU,
      }),
      http.get(API_URLS.putian_highway.getVehicleList, {
        origid: REGION_IDS.FUZHOU,
      }),
    ]);
    const sectionMgmtList = normalizeSectionMgmtList(sectionMgmtListRaw);
    const vehicleList = normalizeVehicleList(vehicleListRaw);
    trafficData.value = {
      ...trafficData.value,
      sectionMgmtList,
      vehicleList,
    };
  } catch (error) {
    console.error("获取区段重点车辆管理数据失败:", error);
  }
};

// 获取特情区段数据
const fetchExceptionSectionData = async () => {
  // 功能：请求特情区段数据，供区段重点车辆模块展示。
  try {
    // 使用 http.get 方法获取特情区段数据
    const data = await http.get(FUZHOU_API_URLS.specialEvent.getTeQingSection, {
      origid: REGION_IDS.FUZHOU,
    });
    exceptionSectionData.value = data;
    // console.log(exceptionSectionData.value);

    console.log("特情区段数据:", exceptionSectionData.value);
  } catch (error) {
    console.error("获取特情区段数据失败:", error);
  }
};

// 切换时间类型
const changeTimeType = (type) => {
  // 功能：切换话务统计时间维度，并通知图表组件重载数据。
  selectedTimeType.value = type;
  if (callAnalysisRef.value) {
    callAnalysisRef.value.updateCallDataByType(type);
  }
};

const startAutoRefresh = () => {
  // 功能：按配置开启自动刷新定时器（事件与右侧统一刷新）。
  if (REFRESH_SWITCHES.GLOBAL && REFRESH_SWITCHES.TRAFFIC_EVENT_INFO) {
    trafficEventRefreshTimer = setInterval(() => {
      refreshTrafficEvents({ showLoading: false });
    }, REFRESH_INTERVALS.TRAFFIC_EVENT_INFO);
  }

  if (
    REFRESH_SWITCHES.GLOBAL &&
    (REFRESH_SWITCHES.REALTIME_TRAFFIC ||
      REFRESH_SWITCHES.SECTION_VEHICLE_MANAGEMENT)
  ) {
    unifiedRightPanelRefreshTimer = setInterval(() => {
      refreshRightPanelsByUnifiedTimer();
    }, REFRESH_INTERVALS.REALTIME_TRAFFIC);
  }
};

const stopAutoRefresh = () => {
  // 功能：清理全部自动刷新定时器，防止页面卸载后继续请求。
  if (trafficEventRefreshTimer) {
    clearInterval(trafficEventRefreshTimer);
    trafficEventRefreshTimer = null;
  }
  if (unifiedRightPanelRefreshTimer) {
    clearInterval(unifiedRightPanelRefreshTimer);
    unifiedRightPanelRefreshTimer = null;
  }
};

onMounted(async () => {
  // 功能：页面挂载初始化入口，完成首屏数据加载并启动自动刷新。
  // 首屏加载：右侧三个业务模块统一展示加载动画。
  resetNotificationList();
  showMockEnabledNotification();
  await Promise.all([
    refreshTrafficEvents({ showLoading: true }),
    refreshRealTimeTraffic({ showLoading: true }),
    refreshSectionVehicleManagement({ showLoading: true }),
  ]);
  startAutoRefresh();
  // 设置新的天地图 TK 值
  // mars3d.Token.updateTianditu(['']);
  // 初始化地图配置参数
  // const mapOptions = {
  //   scene: {
  //     // 设置地图初始视角位置，定位到莆田市
  //     center: { lat: 24.25, lng: 119.05, alt: 150000, heading: 0, pitch: -45 },
  //     // 显示太阳，适用于白天场景
  //     showSun: false,
  //     // 显示月亮
  //     showMoon: false,
  //     // 显示天空盒
  //     showSkyBox: false,
  //     // 显示大气层效果
  //     showSkyAtmosphere: false,
  //     // 设置背景颜色为深蓝色，符合主题色调
  //     backgroundColor: '#2f4784',
  //     globe: {
  //       // 地球表面基础颜色，使用绿色调
  //       baseColor: '#003300',
  //       // 开启地形深度检测
  //       depthTestAgainstTerrain: true,
  //       enableLighting: false, // 彻底关闭全球光照，让地图全身高亮
  //       showGroundAtmosphere: false, // 彻底关闭地面大气效应，消除明暗分割线
  //     },
  //   },
  //   control: {
  //     // 隐藏底图选择器控件
  //     baseLayerPicker: false,
  //     // 隐藏全屏按钮控件
  //     fullscreenButton: false,
  //   },
  //   basemaps: [
  //     {
  //       name: '绿色底图', // 底图名称
  //       type: 'tdt', // 使用天地图作为数据源
  //       layer: 'img_d', // 天地图影像图层
  //       token: '2f66024c900e4a33b6b7b712a5f2830f', // 新的天地图 TK 值
  //       // filterColor: '#004d00', // 滤镜颜色，调整为绿色调
  //       show: true, // 默认显示此底图
  //     },
  //   ],
  // };
  // 创建 Mars3D 地图实例，绑定到页面容器元素
  // const map = new mars3d.Map('mars3dContainer', mapOptions);
  // 1. 内部行政区划图层（去掉轮廓，只留填充和标签）
  // const putianInnerLayer = new mars3d.layer.GeoJsonLayer({
  //   name: '莆田市内部行政区',
  //   url: 'https://data.mars3d.cn/file/geojson/areas/350300_full.json',
  //   symbol: {
  //     type: 'polygon',
  //     styleOptions: {
  //       fill: true,
  //       color: '#74bcc8',
  //       opacity: 0.3,
  //       outline: true, // 如果完全不想要内部线，这里设为 false
  //       outlineColor: '#ffffff', // 如果想要内部线，给一个极淡的颜色
  //       outlineOpacity: 0.1, // 降低内部线的透明度
  //       outlineWidth: 1,
  //       label: {
  //         text: '{name}',
  //         font: '20px sans-serif',
  //         fillColor: Cesium.Color.WHITE,
  //         pixelOffsetY: -25,
  //       },
  //     },
  //   },
  // });
  // map.addLayer(putianInnerLayer);
  // // 2. 外部边界图层（关键：不使用 _full，只画外圈）
  // const putianOutlineLayer = new mars3d.layer.GeoJsonLayer({
  //   name: '莆田市外部轮廓',
  //   // 注意：这里去掉了 _full，只请求市级本身的边界
  //   url: 'https://data.mars3d.cn/file/geojson/areas/350300.json',
  //   symbol: {
  //     type: 'polyline', // 强制作为线状处理
  //     styleOptions: {
  //       width: 5, // 外部轮廓加粗
  //       color: '#00ffff', // 设置为醒目的亮色（如青色）
  //       opacity: 1,
  //       glowPower: 0.3, // 增加发光感，突出数字孪生风格
  //     },
  //   },
  // });
  // map.addLayer(putianOutlineLayer);
  // // 2. 创建高速公路网络图层，模拟绿色高速线条效果
  // const roadLayer = new mars3d.layer.GeoJsonLayer({
  //   name: '高速路网', // 图层名称
  //   // 使用福建地区的高速路数据
  //   url: '/highway.geojson',
  //   symbol: {
  //     type: 'polyline', // 使用线状符号化
  //     styleOptions: {
  //       width: 4, // 线条宽度
  //       color: '#00cc66', // 绿色高速线路颜色
  //       opacity: 0.8, // 线条透明度
  //       glowPower: 0.2, // 开启发光效果，增强视觉效果
  //     },
  //   },
  // });
  // map.addLayer(roadLayer); // 将道路图层添加到地图
  // // 3. 创建图形标注图层，用于业务打点和信息展示
  // const graphicLayer = new mars3d.layer.GraphicLayer();
  // map.addLayer(graphicLayer);
  // 添加示例标注点
  // 绿色圆形图标（服务区或收费站）
  // const servicePoints = [
  // { position: [119.2, 25.5, 0], type: 'service' },
  // { position: [118.8, 25.8, 0], type: 'service' },
  // { position: [119.5, 26.0, 0], type: 'service' },
  // { position: [118.5, 26.2, 0], type: 'service' },
  // { position: [119.0, 26.5, 0], type: 'service' },
  // ];
  // 橙色圆形图标（事件或事故点）
  // const eventPoints = [
  // {
  // position: [119.007, 25.433, 0],
  // type: 'event',
  // title: 'S55 BK39 (后角隧道内)',
  // content:
  // '小车撞异物，人没事，现车子已驶离高速，障碍物占用主车道。(三方) 10:45秀永养护来电告知巡无障碍物。',
  // },
  // {
  // position: [118.9, 25.6, 0],
  // type: 'event',
  // title: 'G15 沈海高速',
  // content: '车辆故障，正在处理中',
  // },
  // {
  // position: [119.3, 25.7, 0],
  // type: 'event',
  // title: 'S10 莆永高速',
  // content: '施工路段，请减速慢行',
  // },
  // ];
  // // 添加绿色服务点
  // servicePoints.forEach((point) => {
  // const billboard = new mars3d.graphic.BillboardEntity({
  // position: point.position,
  // style: {
  // image: 'https://data.mars3d.cn/img/marker/mark-green.png',
  // scale: 0.7,
  // horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
  // verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
  // },
  // });
  // graphicLayer.addGraphic(billboard);
  // });
  // // 添加橙色事件点
  // eventPoints.forEach((point) => {
  // const billboard = new mars3d.graphic.BillboardEntity({
  // position: point.position,
  // style: {
  // image: 'https://data.mars3d.cn/img/marker/mark-orange.png',
  // scale: 0.7,
  // horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
  // verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
  // },
  // });
  // graphicLayer.addGraphic(billboard);
  // // 为事件点绑定弹窗
  // billboard.bindPopup(
  // function (event) {
  // return `<div class="custom-popup-panel">
  // <div class="popup-title">${point.title}</div>
  // <div class="popup-content">${point.content}</div>
  // </div>`;
  // },
  // {
  // template: `<div class="mars3d-popup-background">
  // {content}
  // </div>`,
  // horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
  // verticalOrigin: Cesium.VerticalOrigin.CENTER,
  // }
  // );
  // });
  // 4. 添加指南针控件
  // const compass = new mars3d.control.Compass({
  //   position: 'bottom-right',
  // });
  // map.addControl(compass);
  // 5. 移除不存在的2D/3D切换控件
  // 注意：mars3d 3.10.12 版本中可能不存在 ViewMode 控件
  // 如果需要此功能，可以考虑使用其他方式实现
});

onUnmounted(() => {
  // 功能：页面卸载清理入口，停止定时器并清空通知计时器。
  if (trafficEventAnchorRefreshTimer) {
    clearTimeout(trafficEventAnchorRefreshTimer);
    trafficEventAnchorRefreshTimer = null;
  }
  if (trafficJamAnchorRefreshTimer) {
    clearTimeout(trafficJamAnchorRefreshTimer);
    trafficJamAnchorRefreshTimer = null;
  }
  stopAutoRefresh();
  clearNotificationTimers();
  hideMapSearchNotice();
});
// 跳转到莆田数智云页面
const goToPutianSmartCloud = () => {
  // 功能：跳转至莆田数智云页面路由。
  router.push("/putian-smart-cloud");
};
const goToBillingReports = () => {
  // 功能：跳转至收费报表页面路由。
  router.push("/1591/billing-reports");
};
</script>

<style lang="less" scoped>
.dashboard-container,
.dashboard-container :deep(*) {
  font-family: "Noto Sans SC" !important;
}

/* 1. 基础容器：锁定全屏 */
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

/* 2. 顶部导航栏：科技感渐变 */
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
  // border-bottom: 1px solid rgba(0, 255, 255, 0.2);
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
  /* color: #adbcff; */
  cursor: pointer;
  padding: 5px 15px;
  // background: rgba(0, 255, 255, 0.05);
  // border: 1px solid rgba(0, 255, 255, 0.2);
  // clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%); /* 制作斜角效果 */
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

// 3. 背景图片

.bg-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 384px; /* 20vw @ 1920 */
  height: 100%;
  background-image: url('@/assets/bg-left@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 999;
  pointer-events: none;
}

.bg-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 384px; /* 20vw @ 1920 */
  height: 100%;
  background-image: url('@/assets/bg-right@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 999;
  pointer-events: none;
}

/* 3. 侧边栏布局：自适应计算宽度 */
.panel-side {
  position: absolute;
  top: 90px;
  bottom: 30px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 5px;

  // 信息标签栏
  .info-flex-layout {
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 0;
  }
  .info-tabs {
    flex: 1;
    min-width: 0;
    display: flex;
    background: #081d3e;
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 4px;
    padding: 8px 12px;
    // gap: 8px;
    // margin-bottom: 10px;

    & + .info-tabs {
      margin-left: 8px;
    }

    .info-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      justify-content: space-between;

      span {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
      }

      .switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 18px;

        input {
          opacity: 0;
          width: 0;
          height: 0;

          &:checked + .slider {
            background-color: #00ccff;
          }

          &:checked + .slider:before {
            transform: translateX(18px);
          }
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.3);
          transition: 0.4s;
          border-radius: 18px;

          &:before {
            position: absolute;
            content: '';
            height: 14px;
            width: 14px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
          }
        }
      }
    }
  }

  .section-vehicle-tab-wrap {
    flex: 1.28;
  }

  .section-vehicle-tab {
    min-width: 0;

    > span {
      max-width: none;
      overflow: visible;
      text-overflow: clip;
      white-space: nowrap;
    }

    .switch {
      flex-shrink: 0;
    }
  }
}

.left-side {
  left: 20px;
  width: 430px; /* 22.4vw @ 1920 */
}

.right-side {
  right: 20px;
  width: 480px; /* 25vw @ 1920 */
  bottom: auto;
  height: calc(100% - 120px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  // height: calc(100vh - 120px);
  overflow: hidden;
  min-height: 0;
}

.right-side.two-cards {
  grid-template-rows: auto repeat(2, minmax(0, 1fr));
}

.right-side.three-cards {
  grid-template-rows: auto repeat(3, minmax(0, 1fr));
}

.right-side.only-realtime-empty,
.right-side.tabs-only {
  align-content: start;
}

/* 当右侧面板只有两张卡片时，各占一半空间 */
.right-side.two-cards .data-card {
  height: 100%;
  min-height: 0;
}

/* 右侧面板三个卡片等分高度 */
.right-side .data-card {
  height: 100%;
  min-height: 0;
  font-size: 16px;
}

.right-side .data-card.is-empty {
  height: auto;
}

/* 4. 科技感数据卡片 */
.data-card {
  background: rgba(5, 25, 55, 0.75);
  border: 1px solid rgba(0, 180, 255, 0.3);
  box-shadow: inset 0 0 30px rgba(0, 100, 255, 0.2);
  backdrop-filter: blur(8px);
  position: relative;
  display: flex;
  flex-direction: column;
  font-weight: bold;
  overflow: hidden;
}

.traffic-flow-panel {
  flex: none;
  height: 162px; /* 15vh @ 1080 */
}

// 收费信息面板高度控制
.charge-info-panel {
  // flex: none;
  // height: 46vh;
  flex:1.2;
}

.charge-info-content {
  padding: 18px 16px 10px;
  gap: 0;
  justify-content: flex-start;
}

.charge-info-content > * {
  margin-top: 0;
  margin-bottom: 0;
}

.charge-stats-wrap {
  flex: 0 0 auto;
  min-height: 0;
  margin-bottom: 10px;
}

.structure-bar-wrap {
  flex: 0.82 1 auto;
  min-height: 0;
  display: flex;
  align-items: flex-end;
}

.card-title {
  // color: #00ffff;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  // margin-bottom: 10px;
  background-image: url(/src/assets/second-title-400x40@2x.png?t=1769516623537);
  background-size: cover;
  background-repeat: no-repeat;
  height: 40px;
  width: 100%;
  display: flex;
  align-items: center;
  flex: none; /* 确保在 flex 容器中保持固定高度 */
}
.card-title span {
  margin-left: 35px;
}

.card-content {
  flex: 1;
  color: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.right-side .card-content {
  flex: 1 1 auto;
  overflow: hidden;
}

.right-side .card-content > * {
  min-height: 0;
}

.right-side .data-card.is-empty .card-content {
  flex: 0 0 auto;
}

.right-side.three-cards .card-content {
  padding: 10px 12px;
}

.card-content-auto {
  height: auto;
  flex: 1 1 auto;
  min-height: 0;
}

/* 实时路况信息卡片展开时，限制内容区域的最大高度 */
.data-card.realtime-traffic-expanded .card-content {
  max-height: 864px; /* 80vh @ 1080 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 1. 实时流量布局 */
.flow-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 5px;
}
.flow-row {
  display: flex;
  gap: 10px;
  height: 27px; /* 2.5vh @ 1080 */
  font-size: 10px;
}

// 话务统计面板高度控制
.call-analysis-panel {
  flex: 0.6;
  min-height: 0;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // margin-bottom: 10px;
  }

  .call-analysis-wrapper {
    height: 100%;
    overflow: hidden;
  }


}
.time-selector {
  display: flex;
  justify-content: space-between;

  .time-buttons {
    display: flex;
    gap: 8px;

    .time-btn {
      padding: 4px 12px;
      background: rgba(0, 180, 255, 0.2);
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 180, 255, 0.3);
        border-color: rgba(0, 255, 255, 0.5);
      }

      &.active {
        background: linear-gradient(135deg, #0066cc, #0099ff);
        border-color: #00ccff;
        box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
      }
    }
  }
}

// 数据卡片信息栏
.data-card {
  .card-header {
    height:40px;
    // 信息详情区
    .info-details {
      .info-item {
        display: none;

        &.active {
          display: block;
        }

        .info-header {
          color: #00ffff;
          font-size: 16px;
          font-weight: bold;
          // margin-bottom: 10px;
          background-image: url(/src/assets/second-title-400x40@2x.png?t=1769516623537);
          background-size: cover;
          background-repeat: no-repeat;
          height: 40px;
          width: 100%;
          display: flex;
          align-items: center;
          flex: none; /* 确保在 flex 容器中保持固定高度 */

          .info-title {
            color: #fff;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
          }

          .info-count-box {
            color: #fff;
            font-size: 13px;
            font-weight: bold;
          }

          .info-expand {
            width: 16px;
            height: 16px;
            background-image: url(/src/assets/icon_enlarge@2x.png);
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            cursor: pointer;
          }
        }
      }
    }
  }
}

// 实时路况信息卡片头部样式
.card-header .info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // background: linear-gradient(135deg, #0066cc, #0099ff);
  background-image: url(/src/assets/second-title-400x40@2x.png?t=1769516623537);
  background-size: cover;
  background-repeat: no-repeat;
  padding: 10px 15px;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;

  .info-title {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    align-items: center;
    margin-left:20px

    // &:before {
    //   content: '◆';
    //   margin-right: 8px;
    //   color: #00ccff;
    //   font-size: 10px;
    // }
  }
  .info-count-box_num{
    border:2px solid #0297be;
    border-radius: 30px;
    padding: 2px 16px;
    position:relative;
    right:32px;
    span{
      color: #01d0f1;
    }
  }

  .info-count {
    color: #fff;
    font-size: 14px;
    font-weight: bold;
  }



  .info-expand.expanded {
    transform: rotate(180deg);
  }

  .te-traffic_button_group{
    // width:40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    .info-expand, .expand-icon {
      width: 16px;
      height: 16px;
      background-image: url(/src/assets/icon_enlarge@2x.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-left: 4px;
    }
    .refresh-icon {
      display: block;
      width: 20px;
      height: 20px;
      background-image: url(/src/assets/icon-refresh@2x.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .refresh-icon:hover {
      transform: rotate(180deg);
    }


  }




}
/* 蓝色标题栏样式 */
.data-card .card-header-blue {
  background: linear-gradient(90deg, #003a8c 0%, #0056b3 100%);
  border-bottom: none;
  padding: 8px 0px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .card-title_flex_layout{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.data-card .card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-card span {
  font-size: 18px;
}

.data-card .card-icon {
  color: #93c5fd;
  font-size: 12px;
  font-weight: bold;
}

.data-card .card-header-blue .card-title {
  color: white;
  font-size: 13px;
  padding-bottom: 0;
  border-bottom: none;
  margin-bottom: 0;
}

.data-card .card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 15px;

  // 针对区段重点车辆管理的按钮组特殊样式
  .te-traffic_button_group {
    margin-left: 8px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    .refresh-icon {
      right: 0;
      width: 20px;
      height: 20px;
      background-image: url(/src/assets/icon-refresh@2x.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .expand-icon {
      width: 16px;
      height: 16px;
      background-image: url(/src/assets/icon_enlarge@2x.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-left: 4px;
    }

    .refresh-icon:hover {
      transform: rotate(180deg);
    }
  }
}

.data-card .card-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(147, 197, 253, 0.3);
  color: #93c5fd;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-card .card-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #93c5fd;
}

.data-card .download-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.data-card .download-icon {
  width: 15px;
  height: 15px;
  background-image: url(/src/assets/icon-download@2x.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.data-card .expand-btn {
  padding: 4px 6px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.data-card .expand-icon {
  width: 16px;
  height: 16px;
  background-image: url(/src/assets/icon_enlarge@2x.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-card .expand-icon.expanded {
  transform: rotate(180deg);
}

.ui-footer-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  // background: rgba(0, 255, 255, 0.1);
  background-image: url('@/assets/bg-footer@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  // border-top: 1px solid rgba(0, 255, 255, 0.3);
  z-index: 999;
  pointer-events: auto;
}

.bottom-bar-hover-area {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 240px;
  transform: translateY(100%);
  z-index: 13;
  opacity: 0;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  pointer-events: none;
}

.bottom-bar-hover-area.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.bottom-bar-bridge-area {
  position: absolute;
  left: 50%;
  bottom: 30px;
  width: 72%;
  height: 150px;
  transform: translateX(-52%);
  z-index: 12;
  pointer-events: none;
}

.bottom-bar-bridge-area.is-visible {
  pointer-events: auto;
}

.vc-display{
  z-index:999;
  position: absolute;
  top: 6%;
  left: 3px;

}
</style>
