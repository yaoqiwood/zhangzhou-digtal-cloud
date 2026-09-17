<template>
  <div class="mp-content">
    <div class="mpc-box">
      <div class="mp-content_header_flex">
        <div class="mpch_title">
          {{ displayData.flagName || this.data.gantry_name }}门架详情
        </div>
        <div class="mpch_close_btn" @click="onClose">X</div>
      </div>
      <div class="mp-content_sec_title">
        <span class="mll-tag-route">桩号：{{ data.pile_no }}</span>
        <statusTag
          style="margin-left: 5px"
          :type="displayData.isUsed === '启用' ? 'active' : 'inactive'"
        >
          {{ displayData.isUsed === '启用' ? '已启用' : '未启用' }}
        </statusTag>
      </div>
      <div class="mp-content_detail">
        <div class="mpc-status-dashboard">
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">门架类型</span>
              <span class="mpc-value">{{ displayData.isVirtual }}</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">所属高速公路编号</span>
              <span class="mpc-value">{{ data.road_no || '' }}</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">车辆流向</span>
              <span class="mpc-value">{{ displayData.roadway }}</span>
            </div>
          </div>

          <div class="mpc-card-item mpc-data-display">
            <span class="mpc-number">{{ lastHourFlow }}</span>
            <span class="mpc-unit">辆/1小时</span>
          </div>
        </div>
      </div>
      <div class="mcp_chart">
        <GantryDashboardChart
          :chart-data="data"
          :gantry-flow-data="gantryFlowData"
          :predict-flow-data="predictFlowData"
          :loading="isChartLoading"
          @updateTotalFlow="handleUpdateTotalFlow"
        />
      </div>
    </div>
  </div>
</template>

<script>
import statusTag from '@/components/statusTag/index.vue';
import GantryDashboardChart from '../chart/GantryDashboardChart.vue';
import { API_URLS } from '@/utils/apiUrls.js';
import { REGION_IDS } from '@/utils/constants.js';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import http from '@/utils/http.js';

export default {
  name: 'TrafficInfoPopup',
  components: {
    statusTag,
    GantryDashboardChart,
  },
  props: {
    title: { type: String, default: '信息' },
    data: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      active: 'active',
      gantryData: null, // 存储接口返回的门架基础数据
      gantryFlowData: [], // 存储实际流量数据
      totalFlowData: [], // 存储总流量数据
      predictFlowData: [], // 存储预测流量数据
      isChartLoading: true, // 折线图加载遮罩
      chartLoadingToken: 0, // 处理并发请求，避免旧请求提前关闭遮罩
      displayData: {
        roadNum: '',
        isUsed: '启用',
        isVirtual: '路段门架',
        roadway: '下行',
      }, // 用于模板显示的数据
    };
  },
  emits: ['close'],

  computed: {
    lastHourFlow() {
      if (this.totalFlowData && this.totalFlowData.length > 0) {
        return this.totalFlowData[this.totalFlowData.length - 2];
      }
      return 0;
    },
  },

  watch: {
    data: {
      handler() {
        this.fetchGantryBasicInfo();
        this.fetchGantryData();
      },
      deep: true,
    },
  },

  mounted() {
    // 组件挂载后的初始化操作
    console.log('TrafficInfoPopup 组件已挂载');
    console.log('弹窗标题:', this.title);
    console.log('弹窗数据:', this.data);
    this.fetchGantryBasicInfo();
    this.fetchGantryData();
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    // 获取门架基础信息
    async fetchGantryBasicInfo() {
      try {
        if (!this.data.gantry_hex) return;

        const response = await http.get(
          API_URLS.putian_highway.getGantryBasicInfo,
          {
            flagId: this.data.gantry_hex,
            origid: REGION_IDS.FUZHOU,
          }
        );

        if (response && response.length > 0) {
          this.gantryData = response[0];
          this.processData();
        }
      } catch (error) {
        console.error('获取门架基础数据失败:', error);
      }
    },
    // 获取门架实际流量
    async fetchGantryData() {
      const token = ++this.chartLoadingToken;
      this.isChartLoading = true;
      try {
        const gantryId = this.data?.gantry_hex || '';
        if (!gantryId) {
          this.gantryFlowData = [];
          this.predictFlowData = [];
          return;
        }

        const response = await http.get(FUZHOU_API_URLS.gantry.getGantryFlowBar, {
          gantryId,
          origid: REGION_IDS.FUZHOU,
        });

        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response && Array.isArray(response.data)) {
          list = response.data;
        }

        this.gantryFlowData = list;
        await this.fetchPredictFlowData();
      } catch (error) {
        console.error('获取门架实际流量失败:', error);
        this.gantryFlowData = [];
        this.predictFlowData = [];
      } finally {
        if (token === this.chartLoadingToken) {
          this.isChartLoading = false;
        }
      }
    },
    getFlagId() {
      return (
        this.data?.flagid ||
        this.data?.flagId ||
        this.data?.gantry_hex ||
        ''
      );
    },
    formatTimeLabel(timeText) {
      const source = String(timeText || '').trim();
      if (!source) return '';
      const match = source.match(/(\d{1,2}):(\d{2})/);
      if (!match) return '';
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    },
    formatTimeKey(timeText) {
      const source = String(timeText || '').trim();
      if (!source) return '';

      const dateTimeMatch = source.match(
        /(\d{4}[/-]\d{2}[/-]\d{2})[ T](\d{1,2}):(\d{2})/
      );
      if (dateTimeMatch) {
        const [, datePart, hourPart, minutePart] = dateTimeMatch;
        return `${datePart.replace(/\//g, '-')} ${String(hourPart).padStart(2, '0')}:${minutePart}`;
      }

      const timestamp = Date.parse(source.replace(/\.\d+$/, '').replace(' ', 'T'));
      if (!Number.isFinite(timestamp)) return '';

      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },
    parsePredictPointsFromText(payloadText) {
      const source = String(payloadText || '').trim();
      if (!source) return [];

      const points = [];

      // 示例:
      // "[{'2026-03-04 15:00:00': 157.26}, {'2026-03-04 15:15:00': 157.53}]"
      try {
        const parsed = JSON.parse(source.replace(/'/g, '"'));
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            const [time, value] = Object.entries(item)[0] || [];
            const num = Number(value);
            if (!time || !Number.isFinite(num)) return;
            points.push({
              timeKey: this.formatTimeKey(time),
              timeLabel: this.formatTimeLabel(time),
              value: num,
            });
          });
          if (points.length) return points;
        }
      } catch (error) {
        // 回退到正则解析
      }

      // 回退正则，兼容非标准字符串
      const regex = /'([^']+)'\s*:\s*([-+]?\d*\.?\d+)/g;
      let match = regex.exec(source);
      while (match) {
        const num = Number(match[2]);
        if (Number.isFinite(num)) {
          points.push({
            timeKey: this.formatTimeKey(match[1]),
            timeLabel: this.formatTimeLabel(match[1]),
            value: num,
          });
        }
        match = regex.exec(source);
      }
      return points;
    },
    normalizePredictFlowData(response) {
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && Array.isArray(response.data)) {
        list = response.data;
      } else if (response && Array.isArray(response.rows)) {
        list = response.rows;
      } else if (response && response.data && Array.isArray(response.data.rows)) {
        list = response.data.rows;
      } else if (response && typeof response === 'object') {
        list = [response];
      }

      const points = [];
      list.forEach((item) => {
        // 兼容: [flagid, gmtTime, "[{'2026-...':157.26}, ...]"]
        if (Array.isArray(item) && item.length >= 3) {
          points.push(...this.parsePredictPointsFromText(item[2]));
          return;
        }

        if (typeof item === 'number' || typeof item === 'string') {
          const num = Number(item);
          if (Number.isFinite(num)) {
            points.push({ timeLabel: '', value: num });
          }
          return;
        }

        if (!item || typeof item !== 'object') return;

        const value = Number(
          item.predicted_flow ??
            item.predict_flow ??
            item.predictFlow ??
            item.pre_flow ??
            item.now_flow ??
            item.flow ??
            item.cnt ??
            item.value
        );

        // 兼容单键值对象: {"2026-03-04 15:00:00":157.26}
        if (!Number.isFinite(value)) {
          const entries = Object.entries(item);
          if (entries.length === 1) {
            const [time, maybeValue] = entries[0];
            const num = Number(maybeValue);
            if (Number.isFinite(num)) {
              points.push({
                timeKey: this.formatTimeKey(time),
                timeLabel: this.formatTimeLabel(time),
                value: num,
              });
            }
          }
          return;
        }

        const rawTime =
          item.timeKey ||
          item.timeLabel ||
          item.time ||
          item.time_field ||
          item.timePeriod ||
          item.tradetime ||
          item.predict_time ||
          item.predictTime ||
          '';
        points.push({
          timeKey: this.formatTimeKey(rawTime),
          timeLabel: this.formatTimeLabel(rawTime),
          value,
        });
      });

      return points;
    },
    async fetchPredictFlowData() {
      try {
        const flagid = this.getFlagId();
        if (!flagid) {
          this.predictFlowData = [];
          return;
        }

        const response = await http.get(API_URLS.putian_highway.getPredictFlow, {
          flagid,
          origid: REGION_IDS.FUZHOU,
        });
        this.predictFlowData = this.normalizePredictFlowData(response);
      } catch (error) {
        console.error('获取预测流量数据失败:', error);
        this.predictFlowData = [];
      }
    },
    // 处理数据
    processData() {
      if (!this.gantryData) return;
      this.displayData.flagName = this.data.gantry_name || '';
      this.displayData.roadNum = this.gantryData.roadNum || '';
      this.displayData.isUsed = this.gantryData.isUsed || '启用';
      this.displayData.isVirtual = this.gantryData.isVirtual || '路段门架';
      this.displayData.roadway = this.gantryData.roadway || '下行';
    },
    // 处理总流量数据更新
    handleUpdateTotalFlow(totalFlowData) {
      console.log('接收到总流量数据:', totalFlowData);
      this.totalFlowData = totalFlowData;
    },
  },
};
</script>

<style lang="less" scoped>
.mpc-box {
  height: 93%;
  margin: 5.5% 7% 0 7%;

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

    .mll-tag-route {
      display: inline-block;
      background: #28a745;
      color: #fff;
      font-size: 12px;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #ffffff55;
    }
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
    margin-top: 10px;
    height: 70%;
  }
}
</style>
