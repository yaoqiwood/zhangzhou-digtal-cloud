<template>
  <div
    v-if="visible"
    class="traffic-event-search-float"
    :class="{
      'is-open': isPanelOpen,
      'is-dragging': isDragging,
      'is-panel-left': panelDirection === 'left',
    }"
    :style="searchIconStyle"
  >
    <button
      type="button"
      class="traffic-event-search-button"
      :class="{ 'is-active': isPanelOpen }"
      aria-label="打开交通事件搜索"
      :aria-expanded="String(isPanelOpen)"
      @pointerdown="handlePointerDown"
      @click="handleIconClick"
    >
      <SearchOutlined />
    </button>
    <div v-if="isPanelOpen" class="traffic-event-search-panel">
      <div
        class="traffic-event-search-select"
        tabindex="0"
        aria-label="搜索类型"
        role="button"
        :aria-expanded="String(isTypeDropdownOpen)"
        @click="toggleTypeDropdown"
        @keydown.enter.prevent="toggleTypeDropdown"
        @keydown.space.prevent="toggleTypeDropdown"
      >
        <span>{{ selectedSearchTypeLabel }}</span>
        <span class="traffic-event-search-select-arrow"></span>
        <div
          v-if="isTypeDropdownOpen"
          class="traffic-event-search-options"
          role="listbox"
        >
          <button
            v-for="option in searchTypeOptions"
            :key="option.value"
            type="button"
            class="traffic-event-search-option"
            :class="{ active: searchType === option.value }"
            role="option"
            :aria-selected="String(searchType === option.value)"
            @click.stop="selectSearchType(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="traffic-event-search-input-wrap">
        <input
          ref="searchInputRef"
          v-model="searchKeyword"
          class="traffic-event-search-input"
          type="text"
          placeholder="请输入关键字"
          @keydown.enter="handleSearchSubmit"
        />
        <button
          type="button"
          class="traffic-event-search-submit"
          @click="handleSearchSubmit"
        >
          查询
        </button>
        <MapSearchInputNotice
          :visible="noticeVisible"
          :message="noticeMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import SearchOutlinedIcon from '@ant-design/icons-svg/es/asn/SearchOutlined';
import MapSearchInputNotice from './MapSearchInputNotice.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
  containerEl: {
    type: Object,
    default: null,
  },
  anchorEl: {
    type: Object,
    default: null,
  },
  collisionRootEl: {
    type: Object,
    default: null,
  },
  extraCollisionEls: {
    type: Array,
    default: () => [],
  },
  noticeVisible: {
    type: Boolean,
    default: false,
  },
  noticeMessage: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['search', 'notice-close']);

const renderAntIconNode = (node) =>
  h(node.tag, node.attrs, (node.children || []).map(renderAntIconNode));

const SearchOutlined = defineComponent({
  name: 'SearchOutlined',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => {
      const { class: className, ...restAttrs } = attrs;
      return h(
        'span',
        {
          ...restAttrs,
          class: ['anticon', className],
          role: 'img',
        },
        [renderAntIconNode(SearchOutlinedIcon.icon)]
      );
    };
  },
});

const searchInputRef = ref(null);
const iconBasePosition = ref({ x: -9999, y: -9999 });
const iconOffset = ref({ x: 0, y: 0 });
const isPanelOpen = ref(false);
const isDragging = ref(false);
const isTypeDropdownOpen = ref(false);
const panelDirection = ref('right');
const searchType = ref('camera');
const searchKeyword = ref('');
const searchTypeOptions = [
  { value: 'camera', label: '摄像头' },
  { value: 'gantry', label: '门架' },
  { value: 'tollStation', label: '收费站' },
  { value: 'serviceArea', label: '服务区' },
  { value: 'variableMessageSign', label: '情报板' },
];

const SEARCH_BUTTON_SIZE = 28;
const SEARCH_PANEL_GAP = 8;
const SEARCH_PANEL_WIDTH = 250;
const SEARCH_PANEL_HEIGHT = 32;
const VIEWPORT_EDGE_GAP = 8;
const COLLISION_DETECT_GAP = 4;
const DEFAULT_RIGHT_PANEL_RIGHT = 20;
const DEFAULT_RIGHT_PANEL_WIDTH = 480;
const DEFAULT_ICON_LEFT_GAP = 40;
const DEFAULT_ICON_CENTER_Y = 134;
const dragState = {
  isDragging: false,
  hasMoved: false,
  startPointerX: 0,
  startPointerY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
};

const searchIconStyle = computed(() => ({
  left: `${iconBasePosition.value.x + iconOffset.value.x}px`,
  top: `${iconBasePosition.value.y + iconOffset.value.y}px`,
}));

const selectedSearchTypeLabel = computed(
  () =>
    searchTypeOptions.find((option) => option.value === searchType.value)
      ?.label || ''
);

const isRectIntersecting = (firstRect, secondRect) =>
  firstRect.left < secondRect.right &&
  firstRect.right > secondRect.left &&
  firstRect.top < secondRect.bottom &&
  firstRect.bottom > secondRect.top;

const expandRect = (rect, gap) => ({
  left: rect.left - gap,
  right: rect.right + gap,
  top: rect.top - gap,
  bottom: rect.bottom + gap,
});

const getRectOverlapArea = (firstRect, secondRect) => {
  const width = Math.max(
    0,
    Math.min(firstRect.right, secondRect.right) -
      Math.max(firstRect.left, secondRect.left)
  );
  const height = Math.max(
    0,
    Math.min(firstRect.bottom, secondRect.bottom) -
      Math.max(firstRect.top, secondRect.top)
  );
  return width * height;
};

const getViewportRect = () => ({
  left: VIEWPORT_EDGE_GAP,
  right: window.innerWidth - VIEWPORT_EDGE_GAP,
  top: VIEWPORT_EDGE_GAP,
  bottom: window.innerHeight - VIEWPORT_EDGE_GAP,
});

const getContainerMetrics = () => {
  const containerEl = props.containerEl;
  if (!containerEl) return null;

  const rect = containerEl.getBoundingClientRect();
  const layoutWidth = containerEl.offsetWidth || containerEl.clientWidth;
  const layoutHeight = containerEl.offsetHeight || containerEl.clientHeight;
  const scaleX =
    layoutWidth > 0 && rect.width > 0 ? rect.width / layoutWidth : 1;
  const scaleY =
    layoutHeight > 0 && rect.height > 0 ? rect.height / layoutHeight : 1;

  return {
    rect,
    layoutWidth,
    layoutHeight,
    scaleX,
    scaleY,
  };
};

const getClampedIconPosition = (position, metrics) => {
  if (!metrics?.layoutWidth || !metrics?.layoutHeight) return position;

  return {
    x: Math.min(
      Math.max(position.x, VIEWPORT_EDGE_GAP),
      metrics.layoutWidth - SEARCH_BUTTON_SIZE - VIEWPORT_EDGE_GAP
    ),
    y: Math.min(
      Math.max(position.y, SEARCH_BUTTON_SIZE / 2 + VIEWPORT_EDGE_GAP),
      metrics.layoutHeight - SEARCH_BUTTON_SIZE / 2 - VIEWPORT_EDGE_GAP
    ),
  };
};

const getFallbackIconPosition = (metrics) =>
  getClampedIconPosition(
    {
      x:
        (metrics?.layoutWidth || 1920) -
        DEFAULT_RIGHT_PANEL_RIGHT -
        DEFAULT_RIGHT_PANEL_WIDTH -
        DEFAULT_ICON_LEFT_GAP,
      y: DEFAULT_ICON_CENTER_Y,
    },
    metrics
  );

const getViewportOverflowSize = (rect) => {
  const viewportRect = getViewportRect();
  return (
    Math.max(0, viewportRect.left - rect.left) +
    Math.max(0, rect.right - viewportRect.right) +
    Math.max(0, viewportRect.top - rect.top) +
    Math.max(0, rect.bottom - viewportRect.bottom)
  );
};

const isPanelOverflowingViewport = (rect) => getViewportOverflowSize(rect) > 0;

const collectElementAndDescendants = (rootEl) => {
  if (!rootEl) return [];
  return [rootEl, ...Array.from(rootEl.querySelectorAll('*'))];
};

const getCollisionRects = () => {
  const collisionRootEl = props.collisionRootEl;
  const collisionParentEl = collisionRootEl?.parentElement;
  const collisionEls = new Set();

  if (collisionParentEl) {
    Array.from(collisionParentEl.children)
      .flatMap(collectElementAndDescendants)
      .forEach((el) => collisionEls.add(el));
    collisionParentEl
      .querySelectorAll('.event-table-container_inner, .data-card.is-empty')
      .forEach((el) => {
        collectElementAndDescendants(el).forEach((item) =>
          collisionEls.add(item)
        );
      });
  }

  props.extraCollisionEls
    .flatMap(collectElementAndDescendants)
    .forEach((el) => collisionEls.add(el));

  return Array.from(collisionEls)
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
};

const isPanelPlacementBlocked = (panelRect) => {
  const containerEl = props.containerEl;
  if (!containerEl) return false;

  const containerRect = containerEl.getBoundingClientRect();
  const hasBoundaryCollision =
    panelRect.left < containerRect.left ||
    panelRect.right > containerRect.right ||
    panelRect.top < containerRect.top ||
    panelRect.bottom > containerRect.bottom;
  const hasPanelLevelCollision = getCollisionRects().some((rect) =>
    isRectIntersecting(panelRect, rect)
  );

  return hasBoundaryCollision || hasPanelLevelCollision;
};

const getPanelCollisionScore = (panelRect) => {
  const expandedPanelRect = expandRect(panelRect, COLLISION_DETECT_GAP);
  return getCollisionRects().reduce(
    (sum, rect) => sum + getRectOverlapArea(expandedPanelRect, rect),
    0
  );
};

const buildPanelCandidateRect = (direction) => {
  const metrics = getContainerMetrics();
  if (!metrics) return null;

  const { rect: containerRect, scaleX, scaleY } = metrics;
  const iconLeft =
    containerRect.left +
    (iconBasePosition.value.x + iconOffset.value.x) * scaleX;
  const iconCenterY =
    containerRect.top +
    (iconBasePosition.value.y + iconOffset.value.y) * scaleY;
  const buttonWidth = SEARCH_BUTTON_SIZE * scaleX;
  const panelGap = SEARCH_PANEL_GAP * scaleX;
  const panelWidth = SEARCH_PANEL_WIDTH * scaleX;
  const panelHeight = SEARCH_PANEL_HEIGHT * scaleY;
  const left =
    direction === 'right'
      ? iconLeft + buttonWidth + panelGap
      : iconLeft - panelGap - panelWidth;
  const top = iconCenterY - panelHeight / 2;

  return {
    left,
    right: left + panelWidth,
    top,
    bottom: top + panelHeight,
  };
};

const updatePanelDirection = () => {
  const rightPanelRect = buildPanelCandidateRect('right');
  const leftPanelRect = buildPanelCandidateRect('left');
  if (!rightPanelRect || !leftPanelRect) {
    panelDirection.value = 'right';
    return;
  }

  const rightViewportOverflow = getViewportOverflowSize(rightPanelRect);
  const leftViewportOverflow = getViewportOverflowSize(leftPanelRect);
  const isRightViewportOverflowing = isPanelOverflowingViewport(rightPanelRect);
  const isLeftViewportOverflowing = isPanelOverflowingViewport(leftPanelRect);
  if (isRightViewportOverflowing || isLeftViewportOverflowing) {
    panelDirection.value =
      rightViewportOverflow <= leftViewportOverflow ? 'right' : 'left';
    return;
  }

  const rightCollisionScore = getPanelCollisionScore(rightPanelRect);
  const leftCollisionScore = getPanelCollisionScore(leftPanelRect);
  if (rightCollisionScore !== leftCollisionScore) {
    panelDirection.value =
      rightCollisionScore < leftCollisionScore ? 'right' : 'left';
    return;
  }

  const isRightBlocked = isPanelPlacementBlocked(rightPanelRect);
  const isLeftBlocked = isPanelPlacementBlocked(leftPanelRect);
  panelDirection.value = isRightBlocked && !isLeftBlocked ? 'left' : 'right';
};

const updateIconBasePosition = async () => {
  await nextTick();
  const metrics = getContainerMetrics();
  const anchorEl = props.anchorEl;
  if (!metrics) return;
  if (!anchorEl) {
    iconBasePosition.value = getFallbackIconPosition(metrics);
    return;
  }

  const { rect: containerRect, scaleX, scaleY } = metrics;
  const anchorRect = anchorEl.getBoundingClientRect();
  const hasValidAnchorRect = anchorRect.width > 0 && anchorRect.height > 0;
  if (!hasValidAnchorRect) {
    iconBasePosition.value = getFallbackIconPosition(metrics);
    return;
  }

  iconBasePosition.value = getClampedIconPosition(
    {
      x: (anchorRect.left - containerRect.left) / scaleX - 40,
      y:
        (anchorRect.top - containerRect.top) / scaleY +
        anchorRect.height / scaleY / 2,
    },
    metrics
  );
};

const syncFloatingPosition = async () => {
  await updateIconBasePosition();
  if (isPanelOpen.value) updatePanelDirection();
};

let positionRafId = 0;
let followUpPositionRafId = 0;
let resizeObserver = null;
const observedEls = new Set();

const cancelScheduledPositionSync = () => {
  if (positionRafId) {
    cancelAnimationFrame(positionRafId);
    positionRafId = 0;
  }
  if (followUpPositionRafId) {
    cancelAnimationFrame(followUpPositionRafId);
    followUpPositionRafId = 0;
  }
};

const scheduleFloatingPositionSync = () => {
  cancelScheduledPositionSync();
  positionRafId = requestAnimationFrame(() => {
    positionRafId = 0;
    syncFloatingPosition();

    followUpPositionRafId = requestAnimationFrame(() => {
      followUpPositionRafId = 0;
      syncFloatingPosition();
    });
  });
};

const isObservableElement = (el) =>
  el && typeof el.getBoundingClientRect === 'function';

const refreshObservedElements = () => {
  if (!window.ResizeObserver) return;
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      scheduleFloatingPositionSync();
    });
  }

  const nextObservedEls = new Set(
    [
      props.containerEl,
      props.containerEl?.parentElement,
      props.anchorEl,
      props.collisionRootEl,
      ...props.extraCollisionEls,
    ].filter(isObservableElement)
  );

  observedEls.forEach((el) => {
    if (!nextObservedEls.has(el)) {
      resizeObserver.unobserve(el);
      observedEls.delete(el);
    }
  });

  nextObservedEls.forEach((el) => {
    if (!observedEls.has(el)) {
      resizeObserver.observe(el);
      observedEls.add(el);
    }
  });
};

const stopDrag = () => {
  dragState.isDragging = false;
  isDragging.value = false;
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', stopDrag);
  window.removeEventListener('pointercancel', stopDrag);
};

const handlePointerMove = (event) => {
  if (!dragState.isDragging) return;
  const metrics = getContainerMetrics();
  const scaleX = metrics?.scaleX || 1;
  const scaleY = metrics?.scaleY || 1;
  const screenDeltaX = event.clientX - dragState.startPointerX;
  const screenDeltaY = event.clientY - dragState.startPointerY;
  const deltaX = screenDeltaX / scaleX;
  const deltaY = screenDeltaY / scaleY;

  if (!dragState.hasMoved && Math.hypot(screenDeltaX, screenDeltaY) < 4) return;

  dragState.hasMoved = true;
  iconOffset.value = {
    x: dragState.startOffsetX + deltaX,
    y: dragState.startOffsetY + deltaY,
  };

  if (isPanelOpen.value) updatePanelDirection();
};

const handlePointerDown = (event) => {
  if (event.button !== 0) return;

  event.preventDefault();
  stopDrag();
  dragState.isDragging = true;
  dragState.hasMoved = false;
  isDragging.value = true;
  dragState.startPointerX = event.clientX;
  dragState.startPointerY = event.clientY;
  dragState.startOffsetX = iconOffset.value.x;
  dragState.startOffsetY = iconOffset.value.y;

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
};

const handleIconClick = async (event) => {
  if (dragState.hasMoved) {
    event.preventDefault();
    dragState.hasMoved = false;
    return;
  }

  const nextOpenState = !isPanelOpen.value;
  if (nextOpenState) {
    updatePanelDirection();
  } else {
    isTypeDropdownOpen.value = false;
    emit('notice-close');
  }

  isPanelOpen.value = nextOpenState;
  if (isPanelOpen.value) {
    await nextTick();
    searchInputRef.value?.focus?.();
  }
};

const toggleTypeDropdown = () => {
  isTypeDropdownOpen.value = !isTypeDropdownOpen.value;
};

const selectSearchType = (type) => {
  searchType.value = type;
  isTypeDropdownOpen.value = false;
  nextTick(() => {
    searchInputRef.value?.focus?.();
  });
};

const handleSearchSubmit = () => {
  const keyword = searchKeyword.value.trim();
  searchKeyword.value = keyword;
  if (!keyword) return;

  emit('search', {
    type: searchType.value,
    keyword,
  });
};

const handleWindowResize = async () => {
  scheduleFloatingPositionSync();
};

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      isPanelOpen.value = false;
      isTypeDropdownOpen.value = false;
      emit('notice-close');
      return;
    }

    scheduleFloatingPositionSync();
  }
);

watch(
  () => [
    props.containerEl,
    props.anchorEl,
    props.collisionRootEl,
    props.extraCollisionEls,
  ],
  () => {
    refreshObservedElements();
    scheduleFloatingPositionSync();
  },
  { flush: 'post' }
);

onMounted(async () => {
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('orientationchange', handleWindowResize);
  window.visualViewport?.addEventListener('resize', handleWindowResize);
  refreshObservedElements();
  scheduleFloatingPositionSync();
});

onUnmounted(() => {
  stopDrag();
  cancelScheduledPositionSync();
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('orientationchange', handleWindowResize);
  window.visualViewport?.removeEventListener('resize', handleWindowResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  observedEls.clear();
});
</script>

<style lang="less" scoped>
.traffic-event-search-float {
  position: absolute;
  z-index: 1401;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  transform: translateY(-50%);
}

.traffic-event-search-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ffff;
  font-size: 18px;
  border: 1px solid rgba(0, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(1, 151, 190, 0.18);
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
  cursor: pointer;
  padding: 0;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.12s ease;

  &:hover,
  &.is-active {
    border-color: rgba(0, 255, 255, 0.8);
    background: rgba(1, 208, 241, 0.28);
    box-shadow: 0 0 14px rgba(0, 204, 255, 0.5);
  }

  &:active,
  &.is-active {
    transform: scale(0.94);
  }

  :deep(svg) {
    width: 1em;
    height: 1em;
    fill: currentColor;
  }
}

.traffic-event-search-float.is-dragging .traffic-event-search-button {
  cursor: grabbing;
  transform: scale(0.94);
}

.traffic-event-search-panel {
  position: absolute;
  top: 50%;
  left: calc(100% + 8px);
  width: 250px;
  height: 32px;
  display: flex;
  align-items: center;
  overflow: visible;
  touch-action: auto;
  user-select: auto;
  box-sizing: border-box;
  border: 1px solid rgba(0, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(5, 25, 55, 0.92);
  box-shadow: 0 0 14px rgba(0, 204, 255, 0.35);
  transform: translateY(-50%);
}

.traffic-event-search-float.is-panel-left .traffic-event-search-panel {
  right: calc(100% + 8px);
  left: auto;
}

.traffic-event-search-select,
.traffic-event-search-input-wrap {
  height: 100%;
  border: 0;
  outline: none;
  color: #fff;
  background: transparent;
  font-size: 13px;
  box-sizing: border-box;
}

.traffic-event-search-select {
  position: relative;
  width: 88px;
  flex: 0 0 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border-right: 1px solid rgba(0, 255, 255, 0.25);
  cursor: pointer;

  &:focus {
    background: rgba(0, 255, 255, 0.08);
  }
}

.traffic-event-search-select-arrow {
  width: 0;
  height: 0;
  margin-left: 6px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid rgba(255, 255, 255, 0.72);
}

.traffic-event-search-options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 1402;
  width: 88px;
  padding: 4px;
  border: 1px solid rgba(0, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(5, 25, 55, 0.96);
  box-shadow: 0 0 14px rgba(0, 204, 255, 0.35);
}

.traffic-event-search-option {
  width: 100%;
  height: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.82);
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:hover,
  &.active {
    color: #fff;
    background: rgba(1, 208, 241, 0.28);
  }
}

.traffic-event-search-input-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.traffic-event-search-input {
  width: 100%;
  height: 100%;
  padding: 0 48px 0 10px;
  border: 0;
  outline: none;
  color: #fff;
  background: transparent;
  font-size: 13px;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.55);
  }

  &:focus {
    background: rgba(0, 255, 255, 0.08);
  }
}

.traffic-event-search-submit {
  position: absolute;
  top: 50%;
  right: 4px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid rgba(0, 255, 255, 0.36);
  border-radius: 6px;
  color: #00ffff;
  background: rgba(1, 151, 190, 0.22);
  font-size: 12px;
  line-height: 22px;
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: rgba(0, 255, 255, 0.72);
    background: rgba(1, 208, 241, 0.3);
    box-shadow: 0 0 10px rgba(0, 204, 255, 0.35);
  }

  &:active {
    background: rgba(1, 208, 241, 0.42);
  }
}

.traffic-event-search-float.is-open {
  .traffic-event-search-button {
    border-color: rgba(0, 255, 255, 0.8);
    background: rgba(1, 208, 241, 0.28);
    box-shadow: 0 0 14px rgba(0, 204, 255, 0.5);
  }
}
</style>
