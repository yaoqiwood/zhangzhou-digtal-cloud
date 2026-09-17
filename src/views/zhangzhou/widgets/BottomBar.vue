<template>
  <div class="bottom_bar">
    <div class="bottom_bar_icons" v-if="false">
      <div v-if="false">
        <i class="bar-icon service-area-icon"></i>
        <i class="bar-icon etc-icon"></i>
        <i class="bar-icon camera-icon"></i>
        <i class="bar-icon tool-station-icon"></i>
        <i class="bar-icon warning-icon"></i>
        <i class="bar-icon maintenance-icon"></i>
        <i class="bar-icon traffic-accident-icon"></i>
        <i class="bar-icon natural-disaster-icon"></i>
        <i class="bar-icon smoothing-icon"></i>
        <i class="bar-icon jamed-icon"></i>
        <i class="bar-icon slowing-icon"></i>
      </div>
    </div>
    <div
      class="bt-flex_layout"
      @mouseenter="handleHoverChange(true)"
      @mouseleave="handleHoverChange(false)"
    >
      <div
        class="bottom-item"
        :class="{ 'is-inactive': !serviceActive }"
        style="margin-left: 45px"
        @click="handleToggleService"
      >
        <i class="bottom-icon service-bottom-icon"></i><span>服务区</span>
      </div>
      <div
        class="bottom-item"
        :class="{ 'is-inactive': !gantryActive }"
        @click="handleToggleGantry"
      >
        <i class="bottom-icon etc-bottom-icon"></i><span>ETC门架</span>
      </div>
      <div
        class="bottom-item"
        :class="{ 'is-inactive': !cameraActive }"
        @click="handleToggleCamera"
      >
        <i class="bottom-icon camera-bottom-icon"></i><span>视频监控</span>
      </div>

      <div
        class="bottom-item"
        :class="{ 'is-inactive': !tollStationActive }"
        @click="handleToggleTollStation"
      >
        <i class="bottom-icon tool-station-bottom-icon"></i><span>收费站</span>
      </div>
      <div
        class="bottom-item"
        :class="{ 'is-inactive': !variableMessageSignActive }"
        @click="handleToggleVariableMessageSign"
      >
        <i class="bottom-icon variable-message-sign-bottom-icon"></i
        ><span>情报板</span>
      </div>
      <div
        class="bottom-item"
        :class="{ 'is-inactive': !trafficEventActive }"
        @click="handleToggleTrafficEventMarker"
      >
        <i class="bottom-icon warning-bottom-icon"></i><span>交通事件</span>
      </div>
      <div
        class="bottom-item"
        :class="{ 'is-inactive': !roadConditionMarkerActive }"
        @click="handleToggleRoadConditionMarker"
      >
        <i class="bottom-icon jamed-bottom-icon"></i><span>拥堵事件</span>
      </div>
      <div><i></i></div>
    </div>
  </div>
</template>

<script>
// 组件逻辑区域
export default {
  name: 'MyComponent',
  emits: [
    'toggle-service',
    'toggle-gantry',
    'toggle-camera',
    'toggle-variable-message-sign',
    'toggle-toll-station',
    'toggle-traffic-event-marker',
    'toggle-road-condition-marker',
    'hover-change',
  ],
  // 组件属性定义
  props: {
    serviceActive: {
      type: Boolean,
      default: true,
    },
    gantryActive: {
      type: Boolean,
      default: true,
    },
    cameraActive: {
      type: Boolean,
      default: false,
    },
    variableMessageSignActive: {
      type: Boolean,
      default: true,
    },
    tollStationActive: {
      type: Boolean,
      default: true,
    },
    trafficEventActive: {
      type: Boolean,
      default: true,
    },
    roadConditionMarkerActive: {
      type: Boolean,
      default: true,
    },
  },
  // 组件数据
  data() {
    return {};
  },
  // 计算属性
  computed: {},
  // 方法
  methods: {
    handleToggleService() {
      this.$emit('toggle-service');
    },
    handleToggleGantry() {
      this.$emit('toggle-gantry');
    },
    handleToggleCamera() {
      this.$emit('toggle-camera');
    },
    handleToggleVariableMessageSign() {
      this.$emit('toggle-variable-message-sign');
    },
    handleToggleTollStation() {
      this.$emit('toggle-toll-station');
    },
    handleToggleTrafficEventMarker() {
      this.$emit('toggle-traffic-event-marker');
    },
    handleToggleRoadConditionMarker() {
      this.$emit('toggle-road-condition-marker');
    },
    handleHoverChange(isHovered) {
      this.$emit('hover-change', isHovered);
    },
  },
  // 生命周期钩子
  created() {},
  mounted() {},
};
</script>

<style lang="less" scoped>
/* 组件样式区域 */
.my-component {
  /* 在这里编写你的样式 */
}

.bottom_bar {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 45%;
  transform: translateX(-52%);
  height: 80px;
  margin-bottom: 50px;
}

.bt-flex_layout {
  background-image: url('@/assets/bottom_decoration-img.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 64px;

  div {
    display: flex;
    align-items: center;
    cursor: pointer;
    span {
      font-size: 14px;
      color: #fff;
    }
    // gap: 8px;
  }
  .bottom-item {
    .bottom-icon,
    span {
      transition: all 0.2s ease;
    }
    &.is-inactive {
      span {
        color: #7788a1;
      }
      .bottom-icon {
        filter: grayscale(100%);
        opacity: 0.5;
      }
    }
  }
}

/* 底部图标样式 */
.bottom_bar_icons {
  height: 89px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 10px;
}

.bar-icon {
  width: 56px;
  height: 56px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
}

/* 图标背景图片 */
.service-area-icon {
  background-image: url('@/assets/icon-service-area_tag@2x.png');
}

.etc-icon {
  background-image: url('@/assets/56px-etc-tag@2x.png');
}

.camera-icon {
  background-image: url('@/assets/camera-icon-tag@2x.png');
}

.tool-station-icon {
  background-image: url('@/assets/tolls-stations-icon@2x.png');
}

.warning-icon {
  background-image: url('@/assets/icon-warning_tag@2x.png');
}

.traffic-accident-icon {
  background-image: url('@/assets/traffic_accident_icon_tag@2x.png');
}

.maintenance-icon {
  background-image: url('@/assets/maintance_icon_tag@2x.png');
}

.natural-disaster-icon {
  background-image: url('@/assets/icon_netural_icon_tag@2x.png');
}

.smoothing-icon {
  background-image: url('@/assets/icon-smoothing_tag@2x.png');
}

.jamed-icon {
  background-image: url('@/assets/icon-jamed_tag@2x.png');
}

.slowing-icon {
  background-image: url('@/assets/icon-slowing_tag@2x.png');
}

/* 底部功能区图标样式 */
.bottom-icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: inline-block;
}

.service-bottom-icon {
  background-image: url('@/assets/icon-service-area@2x.png');
  span {
    color: #fff;
  }
}

.etc-bottom-icon {
  background-image: url('@/assets/bar-icon-etc@2x.png');
}

.camera-bottom-icon {
  background-image: url('@/assets/bar-camera-icon@2x.png');
}

.variable-message-sign-bottom-icon {
  background-image: url('@/assets/variable-message-sign-icon@2x.png');
}

.tool-station-bottom-icon {
  background-image: url('@/assets/tolls-stations-icon@2x.png');
}

.warning-bottom-icon {
  background-image: url('@/assets/warning@2x.png');
}

.jamed-bottom-icon {
  background-image: url('@/assets/jamed@2x.png');
}
</style>
