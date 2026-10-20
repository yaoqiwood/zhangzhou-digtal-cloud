<!-- src/components/MapPopup.vue -->
<template>
  <div>
    <!-- 半透明背景遮罩 -->
    <div
      class="mp-overlay"
      :class="{
        'overlay-traffic-jam': type === 'trafficJam',
        'overlay-right-panel': overlayScope === 'right-panel',
      }"
      @click="onClose"
    ></div>
    <!-- 弹窗内容 -->
    <div
      ref="popupRef"
      class="map-popup"
      :class="[
        popupClass,
        { draggable: canDragPopup, 'is-dragging': dragActive },
      ]"
      :style="popupStyle"
    >
      <div
        v-if="canDragPopup"
        class="mp-drag-handle"
        @mousedown.stop.prevent="onPopupMouseDown"
      ></div>
      <div class="mp-background">
        <div class="mp-bk-lu"></div>
        <div class="mp-bk-lm"></div>
        <div class="mp-bk-ld"></div>
        <div class="mp-bk-ru"></div>
        <div class="mp-bk-rm"></div>
        <div class="mp-bk-rd"></div>
      </div>
      <GantryInfoPopup
        v-if="type === 'gantry'"
        :title="title"
        :data="data"
        @close="onClose"
      />
      <TollStationInfoPopup
        v-if="type === 'tollStation'"
        :title="title"
        :data="data"
        @close="onClose"
      />
      <ServiceInfoPopup
        v-if="type === 'service'"
        :title="title"
        :data="data"
        @close="onClose"
      />
      <!-- <TrafficEventInfoPopup
      v-if="type === 'trafficEvent'"
      :title="title"
      :data="data"
      @close="onClose"
    /> -->
      <TrafficPopup
        v-if="type === 'trafficEvent'"
        :title="title"
        :data="data"
        @close="onClose"
      />
      <TrafficJamPopup
        v-if="type === 'trafficJam'"
        :title="title"
        :data="data"
        :congestion-event-list="congestionEventList"
        @close="onClose"
      />
      <div v-if="type === 'variableMessageSign'" class="mp-content">
        <div class="mpc-box">
          <div class="mp-content_header_flex">
            <div class="mpch_title">{{ variableMessageSignTitle }}</div>
            <div class="mpch_close_btn" @click="onClose">X</div>
          </div>
          <div class="mp-content_sec_title">
            <span>{{ variableMessageSignRouteInfo }}</span>
          </div>
          <div class="mp-content_detail">
            <div class="variable-message-sign-grid">
              <div
                v-for="item in variableMessageSignInfoRows"
                :key="item.label"
                class="variable-message-sign-row"
              >
                <span class="variable-message-sign-label">{{
                  item.label
                }}</span>
                <span class="variable-message-sign-value">{{
                  item.value
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CameraPopup
        v-if="type === 'camera'"
        :title="title"
        :data="data"
        @close="onClose"
      />
    </div>
  </div>
</template>

<script>
import GantryInfoPopup from './popup/GantryPopup.vue';
import TollStationInfoPopup from './popup/TollStationPopup.vue';
import ServiceInfoPopup from './popup/ServicePopup.vue';
import TrafficEventInfoPopup from './popup/trafficPopup/TrafficEventInfo.vue';
import TrafficPopup from './popup/trafficPopup//TrafficPopup.vue';
import TrafficJamPopup from './popup/trafficPopup/TrafficJamPopup.vue';
import CameraPopup from './popup/CameraPopup.vue';
export default {
  name: 'MapPopup',
  components: {
    GantryInfoPopup,
    TollStationInfoPopup,
    ServiceInfoPopup,
    TrafficEventInfoPopup,
    TrafficPopup,
    TrafficJamPopup,
    CameraPopup,
  },
  props: {
    title: { type: String, default: '信息' },
    type: { type: String, default: '' },
    data: { type: Object, default: () => ({}) },
    congestionEventList: { type: Array, default: () => [] },
    draggable: { type: Boolean, default: false },
    disableDrag: { type: Boolean, default: false },
    overlayScope: { type: String, default: 'viewport' },
    popupSource: { type: String, default: '' },
    anchorScreenPoint: { type: Object, default: null },
  },
  emits: ['close'],
  data() {
    return {
      dragActive: false,
      popupPos: {
        left: null,
        top: null,
      },
      dragOffset: {
        x: 0,
        y: 0,
      },
      popupRect: {
        width: 0,
        height: 0,
      },
      adaptiveHeight: '',
      hasManualPosition: false,
    };
  },

  mounted() {
    // 组件挂载后的初始化操作
    console.log('MapPopup 组件已挂载');
    // console.log('弹窗标题:', this.title);
    console.log('弹框type:', this.type);
    console.log('弹窗数据:', this.data);

    if (this.isTrafficMonitorDetailPopup) {
      this.updateTrafficEventAdaptiveHeight();
    }

    if (this.canDragPopup) {
      this.initDragPosition();
      window.addEventListener('resize', this.onWindowResize);
    }
  },
  beforeUnmount() {
    this.removeDragListeners();
    window.removeEventListener('resize', this.onWindowResize);
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    getSafeAnchorScreenPoint() {
      const x = Number(this.anchorScreenPoint?.x);
      const y = Number(this.anchorScreenPoint?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    },
    getPositionContextMetrics() {
      const popupEl = this.$refs.popupRef;
      const contextEl =
        popupEl?.closest?.('.dashboard-container') || document.documentElement;
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
    },
    screenPointToLayout(point) {
      if (!point) return null;
      const metrics = this.getPositionContextMetrics();
      return {
        x: (point.x - metrics.rect.left) / metrics.scaleX,
        y: (point.y - metrics.rect.top) / metrics.scaleY,
      };
    },
    screenBoundsToLayout(bounds) {
      if (!bounds) return null;
      const topLeft = this.screenPointToLayout({
        x: bounds.left,
        y: bounds.top,
      });
      const bottomRight = this.screenPointToLayout({
        x: bounds.right,
        y: bounds.bottom,
      });
      if (!topLeft || !bottomRight) return null;
      return {
        left: Math.min(topLeft.x, bottomRight.x),
        top: Math.min(topLeft.y, bottomRight.y),
        right: Math.max(topLeft.x, bottomRight.x),
        bottom: Math.max(topLeft.y, bottomRight.y),
      };
    },
    getSafeAnchorLayoutPoint() {
      return this.screenPointToLayout(this.getSafeAnchorScreenPoint());
    },
    getSafeAnchorScreenBounds() {
      const bounds = this.anchorScreenPoint?.bounds;
      if (!bounds || typeof bounds !== 'object') return null;
      const left = Number(bounds.left);
      const top = Number(bounds.top);
      const right = Number(bounds.right);
      const bottom = Number(bounds.bottom);
      if (
        !Number.isFinite(left) ||
        !Number.isFinite(top) ||
        !Number.isFinite(right) ||
        !Number.isFinite(bottom)
      ) {
        return null;
      }
      return {
        left: Math.min(left, right),
        top: Math.min(top, bottom),
        right: Math.max(left, right),
        bottom: Math.max(top, bottom),
      };
    },
    getSafeAnchorLayoutBounds() {
      return this.screenBoundsToLayout(this.getSafeAnchorScreenBounds());
    },
    getSafePolylineLayoutBounds() {
      if (this.type !== 'trafficJam') return null;
      return this.getSafeAnchorLayoutBounds();
    },
    clampPopupPosition(position = {}, rect = { width: 0, height: 0 }) {
      const width = Number(rect?.width) || 0;
      const height = Number(rect?.height) || 0;
      const metrics = this.getPositionContextMetrics();
      const maxLeft = Math.max(0, metrics.width - width);
      const maxTop = Math.max(0, metrics.height - height);
      return {
        left: Math.min(Math.max(0, Number(position?.left) || 0), maxLeft),
        top: Math.min(Math.max(0, Number(position?.top) || 0), maxTop),
      };
    },
    isAnchorCoveredByPopup(anchor, position, rect, clearance = 24) {
      if (!anchor || !position) return false;
      const left = Number(position.left);
      const top = Number(position.top);
      const width = Number(rect?.width) || 0;
      const height = Number(rect?.height) || 0;
      const safeClearance = Math.max(0, Number(clearance) || 0);
      return (
        anchor.x >= left - safeClearance &&
        anchor.x <= left + width + safeClearance &&
        anchor.y >= top - safeClearance &&
        anchor.y <= top + height + safeClearance
      );
    },
    isPopupIntersectPolylineBounds(position, rect, bounds, padding = 14) {
      if (!position || !rect || !bounds) return false;
      const safePadding = Math.max(0, Number(padding) || 0);
      const popupLeft = Number(position.left);
      const popupTop = Number(position.top);
      const popupRight = popupLeft + (Number(rect.width) || 0);
      const popupBottom = popupTop + (Number(rect.height) || 0);
      const targetLeft = Number(bounds.left) - safePadding;
      const targetTop = Number(bounds.top) - safePadding;
      const targetRight = Number(bounds.right) + safePadding;
      const targetBottom = Number(bounds.bottom) + safePadding;

      return !(
        popupRight < targetLeft ||
        popupLeft > targetRight ||
        popupBottom < targetTop ||
        popupTop > targetBottom
      );
    },
    buildAnchorCandidateList(anchor, rect = { width: 0, height: 0 }) {
      const width = Number(rect?.width) || 0;
      const height = Number(rect?.height) || 0;
      const metrics = this.getPositionContextMetrics();
      const gap = Math.max(
        18,
        Math.min(42, Math.round(Math.min(width || 42, height || 42) * 0.08))
      );
      const preferLeftFirst = anchor.x > metrics.width / 2;
      const preferTopFirst = anchor.y > metrics.height / 2;
      const horizontalCandidates = preferLeftFirst
        ? [
            { left: anchor.x - width - gap, top: anchor.y - height / 2 },
            { left: anchor.x + gap, top: anchor.y - height / 2 },
          ]
        : [
            { left: anchor.x + gap, top: anchor.y - height / 2 },
            { left: anchor.x - width - gap, top: anchor.y - height / 2 },
          ];
      const verticalCandidates = preferTopFirst
        ? [
            { left: anchor.x - width / 2, top: anchor.y - height - gap },
            { left: anchor.x - width / 2, top: anchor.y + gap },
          ]
        : [
            { left: anchor.x - width / 2, top: anchor.y + gap },
            { left: anchor.x - width / 2, top: anchor.y - height - gap },
          ];

      return [...horizontalCandidates, ...verticalCandidates].map((item) =>
        this.clampPopupPosition(item, rect)
      );
    },
    buildTrafficJamAnchoredPosition(rect = { width: 0, height: 0 }) {
      const anchor = this.getSafeAnchorLayoutPoint();
      if (!anchor) return null;
      const polylineBounds = this.getSafePolylineLayoutBounds();
      const candidateList = this.buildAnchorCandidateList(anchor, rect);

      const scored = candidateList.map((candidate) => {
        const centerX = candidate.left + (Number(rect?.width) || 0) / 2;
        const centerY = candidate.top + (Number(rect?.height) || 0) / 2;
        const distance = Math.hypot(centerX - anchor.x, centerY - anchor.y);
        const covered = this.isAnchorCoveredByPopup(
          anchor,
          candidate,
          rect,
          26
        );
        const intersectPolyline = this.isPopupIntersectPolylineBounds(
          candidate,
          rect,
          polylineBounds,
          16
        );
        return { candidate, distance, covered, intersectPolyline };
      });

      const strictPreferred = scored.filter(
        (item) => !item.covered && !item.intersectPolyline
      );
      if (strictPreferred.length > 0) {
        strictPreferred.sort((a, b) => a.distance - b.distance);
        return strictPreferred[0].candidate;
      }

      const nonCovered = scored.filter((item) => !item.covered);
      if (nonCovered.length > 0) {
        nonCovered.sort((a, b) => a.distance - b.distance);
        return nonCovered[0].candidate;
      }

      const nonIntersected = scored.filter((item) => !item.intersectPolyline);
      if (nonIntersected.length > 0) {
        nonIntersected.sort((a, b) => a.distance - b.distance);
        return nonIntersected[0].candidate;
      }

      scored.sort((a, b) => b.distance - a.distance);
      return scored[0]?.candidate || null;
    },
    buildTrafficEventAnchoredPosition(rect = { width: 0, height: 0 }) {
      const anchor = this.getSafeAnchorLayoutPoint();
      if (!anchor) return null;
      const anchorBounds = this.getSafeAnchorLayoutBounds();
      const width = Number(rect?.width) || 0;
      const height = Number(rect?.height) || 0;
      const gap = Math.max(
        24,
        Math.min(56, Math.round(Math.min(width || 56, height || 56) * 0.1))
      );
      const lift = Math.max(36, Math.round(height * 0.16));
      const metrics = this.getPositionContextMetrics();
      const preferLeftFirst = anchor.x > metrics.width / 2;

      const horizontalCandidates = preferLeftFirst
        ? [
            {
              left: anchor.x - width - gap,
              top: anchor.y - height - gap - lift,
            },
            {
              left: anchor.x + gap,
              top: anchor.y - height - gap - lift,
            },
          ]
        : [
            {
              left: anchor.x + gap,
              top: anchor.y - height - gap - lift,
            },
            {
              left: anchor.x - width - gap,
              top: anchor.y - height - gap - lift,
            },
          ];

      const verticalCandidates = [
        {
          left: anchor.x - width / 2,
          top: anchor.y - height - gap - lift,
        },
        {
          left: anchor.x - width / 2,
          top: anchor.y + gap,
        },
      ];

      const candidateList = [
        ...horizontalCandidates,
        ...verticalCandidates,
      ].map((item) => this.clampPopupPosition(item, rect));

      const scored = candidateList.map((candidate) => {
        const centerX = candidate.left + (Number(rect?.width) || 0) / 2;
        const centerY = candidate.top + (Number(rect?.height) || 0) / 2;
        const distance = Math.hypot(centerX - anchor.x, centerY - anchor.y);
        const covered = this.isAnchorCoveredByPopup(
          anchor,
          candidate,
          rect,
          56
        );
        const intersectAnchorBounds = this.isPopupIntersectPolylineBounds(
          candidate,
          rect,
          anchorBounds,
          28
        );
        return { candidate, distance, covered, intersectAnchorBounds };
      });

      const strictPreferred = scored.filter(
        (item) => !item.covered && !item.intersectAnchorBounds
      );
      if (strictPreferred.length > 0) {
        strictPreferred.sort((a, b) => a.distance - b.distance);
        return strictPreferred[0].candidate;
      }

      const nonCovered = scored.filter((item) => !item.covered);
      if (nonCovered.length > 0) {
        nonCovered.sort((a, b) => a.distance - b.distance);
        return nonCovered[0].candidate;
      }

      scored.sort((a, b) => a.distance - b.distance);
      return scored[0]?.candidate || null;
    },
    getInitialPopupPosition(rect = { width: 0, height: 0 }) {
      const width = Number(rect?.width) || 0;
      const height = Number(rect?.height) || 0;
      const metrics = this.getPositionContextMetrics();
      const maxLeft = Math.max(0, metrics.width - width);
      const maxTop = Math.max(0, metrics.height - height);

      if (this.isTrafficMonitorDetailPopup) {
        const anchoredPosition = this.buildTrafficEventAnchoredPosition(rect);
        if (anchoredPosition) {
          return anchoredPosition;
        }
      }

      if (this.type === 'trafficJam') {
        const anchoredPosition = this.buildTrafficJamAnchoredPosition(rect);
        if (anchoredPosition) {
          return anchoredPosition;
        }
        return {
          left: 0,
          top: Math.min(Math.max(0, (metrics.height - height) / 2), maxTop),
        };
      }

      return {
        left: Math.min(Math.max(0, (metrics.width - width) / 2), maxLeft),
        top: Math.min(Math.max(0, (metrics.height - height) / 2), maxTop),
      };
    },
    refreshPopupRect() {
      const popupEl = this.$refs.popupRef;
      if (!popupEl) return;
      const rect = popupEl.getBoundingClientRect();
      const metrics = this.getPositionContextMetrics();
      this.popupRect.width = rect.width / metrics.scaleX;
      this.popupRect.height = rect.height / metrics.scaleY;
    },
    updateTrafficEventAdaptiveHeight() {
      if (!this.isTrafficMonitorDetailPopup) {
        this.adaptiveHeight = '';
        return;
      }
      this.$nextTick(() => {
        const popupEl = this.$refs.popupRef;
        if (!popupEl) return;
        const contentEl = popupEl.querySelector('.mp-content');
        if (!contentEl) return;
        const popupStyle = window.getComputedStyle(popupEl);
        const paddingTop = parseFloat(popupStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(popupStyle.paddingBottom) || 0;
        const metrics = this.getPositionContextMetrics();
        const maxHeight = Math.floor(metrics.height * 0.9);
        const minHeight = 260;
        const rawHeight = Math.ceil(
          contentEl.scrollHeight + paddingTop + paddingBottom + 2
        );
        const nextHeight = Math.min(maxHeight, Math.max(minHeight, rawHeight));
        this.adaptiveHeight = `${nextHeight}px`;
        this.refreshPopupRect();

        if (!this.canDragPopup) return;
        if (this.popupPos.left === null || this.popupPos.top === null) return;
        const maxLeft = Math.max(0, metrics.width - this.popupRect.width);
        const maxTop = Math.max(0, metrics.height - this.popupRect.height);
        this.popupPos.left = Math.min(Math.max(0, this.popupPos.left), maxLeft);
        this.popupPos.top = Math.min(Math.max(0, this.popupPos.top), maxTop);
      });
    },
    initDragPosition() {
      this.$nextTick(() => {
        const popupEl = this.$refs.popupRef;
        if (!popupEl) return;
        this.refreshPopupRect();
        const position = this.getInitialPopupPosition(this.popupRect);
        this.popupPos.left = position.left;
        this.popupPos.top = position.top;
      });
    },
    onPopupMouseDown(event) {
      if (!this.canDragPopup || event.button !== 0) return;

      const popupEl = this.$refs.popupRef;
      if (!popupEl) return;
      const rect = popupEl.getBoundingClientRect();
      const metrics = this.getPositionContextMetrics();
      this.popupRect.width = rect.width / metrics.scaleX;
      this.popupRect.height = rect.height / metrics.scaleY;
      const pointer = this.screenPointToLayout({
        x: event.clientX,
        y: event.clientY,
      });
      const popupLeft = (rect.left - metrics.rect.left) / metrics.scaleX;
      const popupTop = (rect.top - metrics.rect.top) / metrics.scaleY;
      this.dragActive = true;
      this.dragOffset.x = pointer.x - popupLeft;
      this.dragOffset.y = pointer.y - popupTop;

      window.addEventListener('mousemove', this.onPopupMouseMove);
      window.addEventListener('mouseup', this.onPopupMouseUp);
    },
    onPopupMouseMove(event) {
      if (!this.dragActive) return;
      this.hasManualPosition = true;
      const metrics = this.getPositionContextMetrics();
      const maxLeft = Math.max(0, metrics.width - this.popupRect.width);
      const maxTop = Math.max(0, metrics.height - this.popupRect.height);
      const pointer = this.screenPointToLayout({
        x: event.clientX,
        y: event.clientY,
      });
      const nextLeft = pointer.x - this.dragOffset.x;
      const nextTop = pointer.y - this.dragOffset.y;
      this.popupPos.left = Math.min(Math.max(0, nextLeft), maxLeft);
      this.popupPos.top = Math.min(Math.max(0, nextTop), maxTop);
    },
    onPopupMouseUp() {
      this.dragActive = false;
      this.removeDragListeners();
    },
    removeDragListeners() {
      window.removeEventListener('mousemove', this.onPopupMouseMove);
      window.removeEventListener('mouseup', this.onPopupMouseUp);
    },
    onWindowResize() {
      if (this.isTrafficMonitorDetailPopup) {
        this.updateTrafficEventAdaptiveHeight();
      }
      if (!this.canDragPopup) return;
      if (
        (this.type === 'trafficJam' || this.isTrafficMonitorDetailPopup) &&
        !this.hasManualPosition
      ) {
        this.initDragPosition();
        return;
      }
      if (this.popupPos.left === null || this.popupPos.top === null) {
        this.initDragPosition();
        return;
      }
      const metrics = this.getPositionContextMetrics();
      const maxLeft = Math.max(0, metrics.width - this.popupRect.width);
      const maxTop = Math.max(0, metrics.height - this.popupRect.height);
      this.popupPos.left = Math.min(Math.max(0, this.popupPos.left), maxLeft);
      this.popupPos.top = Math.min(Math.max(0, this.popupPos.top), maxTop);
    },
  },
  computed: {
    isTrafficMonitorDetailPopup() {
      return (
        this.type === 'trafficEvent' &&
        this.popupSource === 'traffic-monitor-detail'
      );
    },
    variableMessageSignTitle() {
      const data = this.data || {};
      return (
        data.name ||
        data.alias ||
        data.board_name ||
        data.boardName ||
        data.vms_name ||
        data.vmsName ||
        `${this.title || '情报板'}详情`
      );
    },
    variableMessageSignRouteInfo() {
      const data = this.data || {};
      const route = data.route_no || data.road_no || data.routeName || '';
      const pile = data.pile_no || data.pileNo || data.stake_no || '';
      if (route && pile) return `${route} ${pile}`;
      return route || pile || '情报板点位';
    },
    variableMessageSignInfoRows() {
      const data = this.data || {};
      const formatValue = (value) => {
        const text = String(value ?? '').trim();
        return text || '-';
      };
      return [
        {
          label: '点位名称',
          value: formatValue(this.variableMessageSignTitle),
        },
        {
          label: '路线编号',
          value: formatValue(data.route_no || data.road_no || data.routeName),
        },
        {
          label: '桩号',
          value: formatValue(data.pile_no || data.pileNo || data.stake_no),
        },
        {
          label: '方向',
          value: formatValue(
            data.direction || data.roadway || data.orientation
          ),
        },
        {
          label: '编号',
          value: formatValue(data.fid || data.id || data.code),
        },
        {
          label: '所属机构',
          value: formatValue(data.org_name || data.dept_name || data.city),
        },
      ];
    },
    canDragPopup() {
      if (this.disableDrag) {
        return false;
      }
      return (
        this.draggable ||
        this.type === 'trafficEvent' ||
        this.type === 'trafficJam'
      );
    },
    popupClass() {
      // 交通事件详情单独降低高度，避免影响其他弹框
      if (this.type === 'trafficEvent') {
        if (this.isTrafficMonitorDetailPopup) {
          return 'height-traffic-event-auto';
        }
        return 'height-traffic-event';
      }
      // 拥堵详情保持原有高度
      if (this.type === 'trafficJam') {
        return 'height-traffic-jam';
      }
      return '';
    },
    popupStyle() {
      const style = {};
      if (this.isTrafficMonitorDetailPopup && this.adaptiveHeight) {
        style.height = this.adaptiveHeight;
      }
      if (!this.canDragPopup) return style;
      if (this.popupPos.left === null || this.popupPos.top === null) {
        return style;
      }
      return {
        ...style,
        left: `${this.popupPos.left}px`,
        top: `${this.popupPos.top}px`,
        transform: 'none',
      };
    },
  },
  watch: {
    data: {
      handler() {
        this.updateTrafficEventAdaptiveHeight();
      },
      deep: true,
    },
    popupSource() {
      this.updateTrafficEventAdaptiveHeight();
    },
    type() {
      this.updateTrafficEventAdaptiveHeight();
    },
    anchorScreenPoint: {
      handler() {
        if (this.type !== 'trafficJam' && !this.isTrafficMonitorDetailPopup) {
          return;
        }
        if (!this.canDragPopup) return;
        if (this.hasManualPosition) return;
        this.initDragPosition();
      },
      deep: true,
    },
  },
};
</script>

<style lang="less" scoped>
/* 半透明背景遮罩 */
.mp-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;

  &.overlay-traffic-jam {
    z-index: 2998 !important;
  }

  &.overlay-right-panel {
    top: 90px;
    right: 20px;
    bottom: 30px;
    left: auto;
    width: 480px; /* 25vw @ 1920 */
  }
}

.map-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px;
  background: #1b53ae;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 12px;
  width: 500px;
  height: 100%;
  max-width: 1728px; /* 90vw @ 1920 */
  max-height: 972px; /* 90vh @ 1080 */
  z-index: 1001;
  color: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  // overflow: hidden;
  &.draggable {
    .mp-drag-handle {
      position: absolute;
      top: 0;
      left: 0;
      right: 64px;
      height: 56px;
      cursor: move;
      z-index: 3;
    }
  }

  &.height-traffic-event {
    height: 42% !important;
  }

  &.height-traffic-event-auto {
    width: 508px;
    height: auto !important;
    min-height: 260px;

    :deep(.mp-content) {
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      width: calc(100% - 18px);
      height: auto;
      min-height: calc(100% - 4px);
      margin: 0 12px 0 7px;
    }

    :deep(.mpc-box) {
      height: auto;
      margin: 20px 7% 20px 7%;
    }

    :deep(.mll-container) {
      margin-top: 12px;
    }

    :deep(.mll-scroll-view) {
      max-height: min(420px, calc(90vh - 170px));
    }
  }

  &.height-traffic-jam {
    height: 55% !important;
    z-index: 2999 !important;
  }

  &.is-dragging {
    z-index: 3000 !important;
  }

  .mp-content {
    position: relative;
    z-index: 1;
    width: 97%;
    height: 97%;
    background: #06245a;
    .mpc-box {
      height: 93%;
      margin: 7% 7% 0 7%;

      .mp-content_header_flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #ffffff;
        // margin-top: 7%;

        .mpch_title {
          font-size: 20px;

          // margin-left: 7%;
        }
        .mpch_close_btn {
          font-size: 20px;
          cursor: pointer;
          // margin-right: 7%;
          font-family: Arial, sans-serif;
          // font-weight: bold;
          /* 通过多层阴影营造发光和虚化感 */
          text-shadow:
            0 0 5px rgba(255, 255, 255, 0.8),
            /* 核心近处光晕 */ 0 0 10px rgba(255, 255, 255, 0.5),
            /* 中层扩散 */ 0 0 20px rgba(173, 216, 230, 0.3); /* 外层淡蓝色虚化 */

          /* 稍微让整体模糊一点，模仿图片中的非锐利效果 */
          filter: blur(0.5px);
          opacity: 0.9;
        }
      }
      .mp-content_sec_title {
        color: #418adb;
        font-weight: bold;
      }

      .mp-content_detail {
        margin-top: 5px;

        .variable-message-sign-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 14px;

          .variable-message-sign-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 36px;
            padding: 0 12px;
            background: #0a2a68;
            border: 1px solid #1a428a;
            border-radius: 4px;
            box-sizing: border-box;
          }

          .variable-message-sign-label {
            flex: 0 0 82px;
            color: #418adb;
            white-space: nowrap;
          }

          .variable-message-sign-value {
            flex: 1;
            color: #ffffff;
            font-weight: bold;
            text-align: right;
            word-break: break-all;
          }
        }

        .mpc-status-dashboard {
          display: flex;
          gap: 12px;
          // padding: 15px;
          // background-color: #020b24; // 模拟大屏深色底色
          font-family: 'Microsoft YaHei', sans-serif;

          // 公用卡片容器
          .mpc-card-item {
            background: #0a2a68;
            border: 1px solid #1a428a;
            border-radius: 4px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
          }

          // 左侧三个信息的组合容器
          .mpc-info-group {
            flex: 2;
            padding: 12px 0;
            justify-content: space-around;

            .mpc-info-column {
              text-align: center;
              position: relative;
              flex: 1;
              // 新增：针对第一列“门架类型”缩小比例
              &:first-child {
                flex: 0.6; // 将比例缩小，其他两列会相对变宽
              }

              &:nth-child(3) {
                flex: 0.6; // 将比例缩小，其他两列会相对变宽
              }

              // 中间的垂直分割线
              &:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 20%;
                height: 60%;
                width: 1px;
                background: linear-gradient(
                  to bottom,
                  transparent,
                  #1a428a,
                  transparent
                );
              }

              .mpc-label {
                font-size: 11px;
                color: #418adb;
                margin-bottom: 6px;
                display: block;
                white-space: nowrap;
              }

              .mpc-value {
                font-size: 11px;
                color: #ffffff;
                font-weight: bold;
                display: block;
              }
            }
          }

          // 右侧大数字展示卡片
          .mpc-data-display {
            flex: 1;
            padding: 0 0px;
            justify-content: center;
            align-items: center;
            // min-width: 140px;

            .mpc-number {
              font-size: 25px;
              font-weight: 500;
              color: #ffffff;
              margin-right: 4px;
              // 数字建议使用特定的科技感字体
              font-family: Arial, Helvetica, sans-serif;
            }

            .mpc-unit {
              font-size: 13px;
              color: #418adb;
              // 让单位对齐数字底部
              // align-self: flex-end;
              margin-top: 4px;
            }
          }
        }
      }
      .mcp_chart {
        margin-top: 10px;
        height: 68%;
      }
    }
  }

  .mp-bk {
    position: absolute;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }
  .mp-background {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;

    .mp-bk-lu {
      position: absolute;
      z-index: 2;
      top: -4px;
      left: -5px;
      width: 35%;
      height: 20%;
      background-image: url('@/assets/popup/left-up@2x.png');
      background-size: 100% 100%; /* 确保图片完整显示 */
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .mp-bk-lm {
      position: absolute;
      z-index: 2;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 1.1%;
      height: 20%;
      background-image: url('@/assets/popup/left-middle@2x.png');
      background-size: 100% 100%; /* 确保图片完整显示 */
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .mp-bk-ld {
      position: absolute;
      z-index: 2;
      bottom: -6px;
      left: -4px;
      width: 35%;
      height: 20%;
      background-image: url('@/assets/popup/left-down@2x.png');
      background-size: 100% 100%; /* 确保图片完整显示 */
      pointer-events: none;
    }
    .mp-bk-ru {
      position: absolute;
      z-index: 2;
      top: -4px;
      right: -5px;
      width: 35%;
      height: 20%;
      background-image: url('@/assets/popup/right-up@2x.png');
      background-size: 100% 100%; /* 确保图片完整显示 */
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .mp-bk-rm {
      position: absolute;
      z-index: 2;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      width: 1.1%;
      height: 20%;
      background-image: url('@/assets/popup/right-middle@2x.png');
      background-size: 100% 100%; /* 确保图片完整显示 */
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .mp-bk-rd {
      position: absolute;
      z-index: 2;
      bottom: -6px;
      right: -4px;
      width: 35%;
      height: 20%;
      background-image: url('@/assets/popup/right-down@2x.png');
      background-size: 100% 100%; /* 确保图片完整显示 */
      background-repeat: no-repeat;
      pointer-events: none;
    }
  }
}
.close-btn {
  margin-top: 8px;
  padding: 4px 12px;
  font-size: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
.close-btn:hover {
  opacity: 0.9;
}
</style>
