<template>
  <div class="mp-content">
    <div class="mpc-box">
      <div class="mp-content_header_flex">
        <div class="mpch_title">
          拥堵事件
          <i
            class="mpc_traffic_type_icon"
            :class="trafficTypeIconClass"
          ></i>
        </div>
        <div class="mpch_close_btn" @click="onClose">X</div>
      </div>
      <!-- <div class="mp-content_sec_title">
        <span>L桩号：中文名称及桩号</span>
        <statusTag style="margin-left: 5px" type="active">已启用</statusTag>
        <statusTag type="inactive">未启用</statusTag>
      </div> -->
      <div class="mp-content_detail">
        <div class="mpc-status-dashboard mpc-dashboard-main">
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">事件类型</span>
              <span class="mpc-number">{{ displayEventType }}</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">所属区段</span>
              <span class="mpc-number">{{
                filteredCongestionData?.fullSectionName || data.mileage || '-'
              }}</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">发生时间</span>
              <span class="mpc-number">{{
                filteredCongestionData?.time || data.time || '-'
              }}</span>
            </div>
          </div>
        </div>

        <div
          class="mpc-status-dashboard mpc-dashboard-secondary"
          style="margin-top: 10px"
        >
          <div class="mpc-card-item mpc-info-group">
            <div
              class="mpc-info-column"
              style="text-align: left; padding-left: 5px; flex: 1"
            >
              <span class="mpc-label">事件描述与详情</span>
              <div class="mpc-number" style="font-size: 11px; line-height: 1.6">
                总车辆：{{ filteredCongestionData?.totalVehicles || '0' }}，
                上游车辆：{{
                  filteredCongestionData?.upstreamVehicles || '0'
                }}， 滞留车辆：{{
                  filteredCongestionData?.strandedVehicles || '0'
                }}， 滞留货车：{{
                  filteredCongestionData?.strandedTrucks || '0'
                }}， 滞留客车：{{
                  filteredCongestionData?.strandedGuests || '0'
                }}， 下游车辆：{{
                  filteredCongestionData?.downstreamVehicles || '0'
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- <div
          class="mpc-status-dashboard mpc-dashboard-secondary"
          style="margin-top: 10px"
        >
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">车位总数</span>
              <span class="mpc-number">300</span>
              <span class="mpc-unit">辆</span>
            </div>
          </div>
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">充电站总数</span>
              <span class="mpc-number">200</span>
              <span class="mpc-unit">个</span>
            </div>
          </div>
        </div> -->
      </div>
      <div class="mcp_chart">
        <TrafficJamChart :data="data" />
      </div>
    </div>
  </div>
</template>

<script>
import statusTag from '@/components/statusTag/index.vue';
import TrafficJamChart from '@/views/widgets/chart/TrafficJamChart.vue';

// import PopTrafficDashboard from '../PopTrafficDashboard.vue';
// import ServiceChart from '@/views/widgets/ServiceChart.vue';
export default {
  name: 'TrafficInfoPopup',
  components: {
    statusTag,
    // PopTrafficDashboard,
    // ServiceChart,
    TrafficJamChart,
  },
  props: {
    title: { type: String, default: '信息' },
    data: { type: Object, default: () => ({}) },
    // 拥堵事件列表
    congestionEventList: { type: Array, default: () => [] },
  },
  data() {
    return {
      active: 'active',
      filteredCongestionData: null, // 存储筛选后的拥堵数据
    };
  },
  computed: {
    displayEventType() {
      const directType = String(this.data?.trafficType || '').trim();
      if (directType) return directType;

      const fallbackType = String(
        this.filteredCongestionData?.congestionStatus ||
          this.filteredCongestionData?.eventType ||
          this.data?.eventType ||
          ''
      ).trim();
      if (fallbackType) return fallbackType;

      const rawStatus = String(
        this.data?.status ?? this.filteredCongestionData?.status ?? ''
      ).trim();
      const rawType = String(
        this.data?.type ?? this.filteredCongestionData?.type ?? ''
      ).trim();

      if (rawStatus === '0' || rawType === '0' || rawType === '拥堵') {
        return '拥堵';
      }
      if (rawStatus === '1' || rawType === '1' || rawType === '缓行') {
        return '缓行';
      }

      return '-';
    },
    trafficTypeIconClass() {
      return this.displayEventType === '缓行' ? 'is-slow' : 'is-jammed';
    },
  },
  emits: ['close'],

  watch: {
    data: {
      handler(newVal, oldVal) {
        // console.log('newnewVal');
        // console.log(newVal);
        // console.log('data', newVal);
        // 当 data 变化时，筛选匹配的拥堵数据
        this.filterCongestionData();
      },
      deep: true,
      immediate: true,
    },
    congestionEventList: {
      handler(newVal, oldVal) {
        console.log('newVal', newVal);
        // 当 congestionEventList 变化时，筛选匹配的拥堵数据
        this.filterCongestionData();
      },
      deep: true,
      immediate: true,
    },
  },

  mounted() {
    // 组件挂载后的初始化操作
    // console.log('TrafficInfoPopup 组件已挂载');
    // console.log('弹窗标题:', this.title);
    // console.log('弹窗数据:', this.data);
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    // 筛选拥堵数据
    filterCongestionData() {
      if (!this.data || !this.data.flagId || !this.congestionEventList) {
        this.filteredCongestionData = null;
        return;
      }

      // 从 data.mileage 中提取路段代码（如 G5123）
      let routeCode = '';
      if (this.data.mileage) {
        const routeMatch = this.data.mileage.match(/([A-Z]+\d+)/);
        console.log('routeMatch:', routeMatch);
        if (routeMatch) {
          routeCode = routeMatch[0];
        }
      }

      console.log('this.congestionEventList:');
      console.log(this.congestionEventList);

      // 筛选出 Flagid 匹配的数据
      const matchedData = this.congestionEventList.find(
        (item) => item.Flagid === this.data.flagId
      );
      // console.log('matchedData');
      console.log(matchedData);
      if (matchedData) {
        this.filteredCongestionData = {
          ...matchedData,
          routeCode: routeCode, // 添加路段代码
          fullSectionName: routeCode
            ? `${routeCode} ${matchedData.sectionName}`
            : matchedData.sectionName, // 拼接路段代码和区段名称
        };
      } else {
        this.filteredCongestionData = null;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.mpc-box {
  height: 55%;
  margin: 3.5% 7% 0 7%;

  /* 拥堵车辆图标样式 */
  .mpc_traffic_type_icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    margin-left: 8px;
    vertical-align: middle;
  }

  .mpc_traffic_type_icon.is-jammed {
    background-image: url('@/assets/jamed@2x.png');
  }

  .mpc_traffic_type_icon.is-slow {
    background-image: url('@/assets/slow-moving@2x.png');
  }

  .mp-content_header_flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #ffffff;

    .mpch_title {
      display: flex;
      align-items: center;
      font-size: 20px;
    }
    .mpch_close_btn {
      font-size: 20px;
      cursor: pointer;
      font-family: Arial, sans-serif;
      text-shadow:
        0 0 5px rgba(255, 255, 255, 0.8),
        /* 核心近处光晕 */ 0 0 10px rgba(255, 255, 255, 0.5),
        /* 中层扩散 */ 0 0 20px rgba(173, 216, 230, 0.3); /* 外层淡蓝色虚化 */

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

    .mpc-status-dashboard {
      display: flex;
      gap: 12px;
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
        padding: 3px 0;
        // justify-content: space-around;

        .mpc-info-column {
          text-align: center;
          position: relative;
          flex: 1;

          .mpc-number {
            font-size: 11px;
            font-weight: 500;
            color: #ffffff;
            margin-right: 4px;
            font-family: Arial, Helvetica, sans-serif;
          }

          .mpc-unit {
            font-size: 13px;
            color: #418adb;
            margin-top: 4px;
          }
          // 新增：针对第一列“门架类型”缩小比例
          &:first-child {
            flex: 1; // 将比例缩小，其他两列会相对变宽
          }
          &:nth-child(1) {
            flex: 0.7; // 将比例缩小，其他两列会相对变宽
          }

          &:nth-child(3) {
            flex: 0.8; // 将比例缩小，其他两列会相对变宽
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

        .mpc-number {
          font-size: 25px;
          font-weight: 500;
          color: #ffffff;
          margin-right: 4px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .mpc-unit {
          font-size: 13px;
          color: #418adb;
          margin-top: 4px;
        }
      }
    }
  }
  .mcp_chart {
    margin-top: 30px;
    height: 105%;
  }
}
</style>
