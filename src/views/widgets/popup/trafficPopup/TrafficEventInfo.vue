<template>
  <div class="mp-content">
    <div class="mpc-box">
      <div class="mp-content_header_flex">
        <div class="mpch_title">{{ popupTitle }}</div>
        <div class="mpch_close_btn" @click="onClose">X</div>
      </div>
      <div class="mp-content_sec_title">
        <span>{{ popupSubtitle }}</span>
        <statusTag style="margin-left: 35px" type="active">已启用</statusTag>
        <statusTag type="inactive">未启用</statusTag>
      </div>
      <div class="mp-content_detail">
        <div class="mpc-status-dashboard">
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">总流量</span>
              <span class="mpc-number">{{ popupMetrics.flow }}</span>
              <span class="mpc-unit">辆</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">一次过车率(出口)</span>
              <span class="mpc-number">{{ popupMetrics.exitPassRate }}</span>
              <span class="mpc-unit">%</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">一次过车率(入口)</span>
              <span class="mpc-number">{{ popupMetrics.entryPassRate }}</span>
              <span class="mpc-unit">%</span>
            </div>
          </div>

          <!-- <div class="mpc-card-item mpc-data-display">
            <span class="mpc-number">300</span>
            <span class="mpc-unit">辆/1小时</span>
          </div> -->
        </div>
      </div>
      <div class="mcp_chart">
        <PopTrafficDashboard />
      </div>
    </div>
  </div>
</template>

<script>
import statusTag from '@/components/statusTag/index.vue';
import PopTrafficDashboard from '../../chart/GantryDashboardChart.vue';
export default {
  name: 'TrafficInfoPopup',
  components: {
    statusTag,
    PopTrafficDashboard,
  },
  props: {
    title: { type: String, default: '信息' },
    data: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      active: 'active',
    };
  },
  computed: {
    popupTitle() {
      return (
        this.data?.name ||
        this.data?.routeName ||
        this.data?.location ||
        '交通事件详情'
      );
    },
    popupSubtitle() {
      return (
        this.data?.stakeNum ||
        this.data?.kmStart ||
        this.data?.route ||
        'L桩号：测试区段 K0+000'
      );
    },
    popupMetrics() {
      const flow =
        this.data?.totalFlow ??
        this.data?.flow ??
        this.data?.totalVehicles ??
        300;
      const exitPassRate = this.data?.exitPassRate ?? this.data?.passRate ?? 97.3;
      const entryPassRate =
        this.data?.entryPassRate ?? this.data?.passRate ?? 97.3;
      return {
        flow,
        exitPassRate,
        entryPassRate,
      };
    },
  },
  emits: ['close'],

  mounted() {
    // 调试日志已停用，保留 mounted 以便后续扩展初始化逻辑。
    // console.log('TrafficInfoPopup 组件已挂载');
    // console.log('弹窗标题:', this.title);
    // console.log('弹窗数据:', this.data);
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="less" scoped>
.mpc-box {
  height: 93%;
  margin: 3.5% 7% 0 7%;

  .mp-content_header_flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #ffffff;

    .mpch_title {
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
        padding: 12px 0;
        justify-content: space-around;

        .mpc-info-column {
          text-align: center;
          position: relative;
          flex: 1;

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
      }
    }
  }
  .mcp_chart {
    margin-top: 10px;
    height: 68%;
  }
}
</style>
