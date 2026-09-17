<template>
  <div class="mp-content">
    <div class="mpc-box">
      <div class="mp-content_header_flex">
        <div class="mpch_title">{{ displayData.name }}</div>
        <div class="mpch_toggle_group">
          <div
            class="mpch_toggle_item"
            :class="{ active: stationType === 'in' }"
            @click="toggleStationType('in')"
          >
            （入站）
          </div>
          <div
            class="mpch_toggle_item"
            :class="{ active: stationType === 'out' }"
            @click="toggleStationType('out')"
          >
            （出站）
          </div>
        </div>
        <div class="mpch_close_btn" @click="onClose">X</div>
      </div>
      <div class="mp-content_sec_title" v-if="false">
        <span>L桩号：{{ displayData.roadNum }}</span>
        <statusTag
          style="margin-left: 35px"
          :type="displayData.isUsed ? 'active' : 'inactive'"
        >
          {{ displayData.isUsed ? '已启用' : '未启用' }}
        </statusTag>
      </div>
      <div class="mp-content_detail">
        <div class="mpc-status-dashboard">
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">今日总流量</span>
              <span class="mpc-number">{{ flowData.todayTotal || '0' }}</span>
              <span class="mpc-unit">辆</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">今日客车流量</span>
              <span class="mpc-number">{{ flowData.todayCarFlow || '0' }}</span>
              <span class="mpc-unit">辆</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">今日货车流量</span>
              <span class="mpc-number">{{
                flowData.todayTrunkFlow || '0'
              }}</span>
              <span class="mpc-unit">辆</span>
            </div>
          </div>

          <!-- <div class="mpc-card-item mpc-data-display">
            <span class="mpc-number">300</span>
            <span class="mpc-unit">辆/1小时</span>
          </div> -->
        </div>
      </div>
      <div class="mcp_chart">
        <TollStationBarChart
          :data="data"
          :en-char-data="enCharData"
          :ex-char-data="exCharData"
          :en-predict-data="enPredictData"
          :ex-predict-data="exPredictData"
          :station-type="stationType"
        />
      </div>
    </div>
  </div>
</template>

<script>
import statusTag from '@/components/statusTag/index.vue';
import TollStationBarChart from '../chart/TollStationBarChart.vue';
import { API_URLS } from '@/utils/apiUrls.js';
import http from '@/utils/http.js';
export default {
  name: 'TrafficInfoPopup',
  components: {
    statusTag,
    // PopTrafficDashboard,
    TollStationBarChart,
  },
  props: {
    title: { type: String, default: '信息' },
    data: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      active: 'active',
      url: API_URLS.putian_highway.getStationWindowsDetail,
      stationData: null, // 存储接口返回的数据
      displayData: {
        name: '',
        roadNum: '',
        isUsed: false,
      }, // 用于模板显示的数据
      stationType: 'in', // 'in' 入站, 'out' 出站
      flowData: {
        todayTotal: '',
        todayCarFlow: '',
        todayTrunkFlow: '',
      }, // 流量数据
      currentCode: '', // 当前站点 code
      enCharData: [], // 入站数据
      exCharData: [], // 出站数据
      enPredictData: [], // 入站预测流量
      exPredictData: [], // 出站预测流量
    };
  },
  emits: ['close'],

  watch: {
    data: {
      handler(newVal) {
        this.currentCode = this.resolveStationCode(newVal);
        this.refreshPopupData();
      },
      deep: true,
      immediate: true,
    },
  },

  mounted() {
    // 组件挂载后的初始化操作
    console.log('TrafficInfoPopup 组件已挂载');
    console.log('弹窗标题:', this.title);
    console.log('弹窗数据:', this.data);
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    toggleStationType(status) {
      this.stationType = status;
      this.applyFlowDataByStationType();
    },
    resolveStationCode(data) {
      const code =
        data?.code ?? data?.flagId ?? data?.Flagid ?? data?.toll_id ?? '';
      return this.normalizeStationCode(code);
    },
    normalizeStationCode(code) {
      return String(code || '')
        .trim()
        .toUpperCase()
        .replace(/(EN|EX)$/i, '');
    },
    buildPredictFlagId(type) {
      const suffix = type === 'in' ? 'EN' : 'EX';
      return this.currentCode ? `${this.currentCode}${suffix}` : '';
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
      } else if (response && typeof response === 'object') {
        list = [response];
      }

      const points = [];
      list.forEach((item) => {
        if (Array.isArray(item) && item.length >= 3) {
          points.push(...this.parsePredictPointsFromText(item[2]));
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
            item.value
        );

        if (Number.isFinite(value)) {
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
          return;
        }

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
      });

      return points;
    },
    refreshPopupData() {
      if (!this.currentCode) {
        this.displayData = {
          name: '',
          roadNum: '',
          isUsed: false,
        };
        this.flowData = {
          todayTotal: '',
          todayCarFlow: '',
          todayTrunkFlow: '',
        };
        this.enCharData = [];
        this.exCharData = [];
        this.enPredictData = [];
        this.exPredictData = [];
        return;
      }

      this.fetchStationData();
      this.fetchAllStationFlowData();
      this.fetchAllPredictFlowData();
    },
    applyFlowDataByStationType() {
      const list =
        this.stationType === 'in' ? this.enCharData : this.exCharData;
      if (!Array.isArray(list) || list.length === 0) {
        this.flowData.todayTotal = '';
        this.flowData.todayCarFlow = '';
        this.flowData.todayTrunkFlow = '';
        return;
      }
      const flowItem = list[0];
      this.flowData.todayTotal = flowItem.todayTotal || '';
      this.flowData.todayCarFlow = flowItem.todayCarFlow || '';
      this.flowData.todayTrunkFlow = flowItem.todayTrunkFlow || '';
    },
    // 获取接口数据
    async fetchStationData() {
      try {
        const response = await http.get(this.url);
        if (response) {
          this.stationData = response;
          // console.log(this.stationData);
          this.processData();
        }
      } catch (error) {
        console.error('获取接口数据失败:', error);
      }
    },
    // 处理数据，对比code和flagId
    processData() {
      if (!this.stationData || !this.currentCode) return;

      // 遍历过滤找到匹配的flagId
      const matchedItem = this.stationData.find(
        (item) => Number(item.flagId) === Number(this.currentCode)
      );
      // console.log(Number(this.data.code));
      // this.stationData.forEach((element) => {
      //   console.log(Number(element.flagId) === this.data.code);
      // });

      if (matchedItem) {
        this.displayData.name = matchedItem.flagName || '';
        this.displayData.roadNum = matchedItem.roadNum || '';
        this.displayData.isUsed = matchedItem.isUsed; // 假设接口返回的isUsed是布尔值
      }
    },
    // 获取站点流量数据
    async fetchStationFlowData() {
      try {
        if (!this.currentCode) return;
        const apiUrl =
          this.stationType === 'in'
            ? API_URLS.putian_highway.getEnStationFlow
            : API_URLS.putian_highway.getExStationFlow;
        const response = await http.get(apiUrl, {
          flagId: this.currentCode,
        });
        if (response && response.length > 0) {
          const flowItem = response[0];
          this.flowData.todayTotal = flowItem.todayTotal || '';
          this.flowData.todayCarFlow = flowItem.todayCarFlow || '';
          this.flowData.todayTrunkFlow = flowItem.todayTrunkFlow || '';
        }
      } catch (error) {
        console.error('获取站点流量数据失败:', error);
      }
    },
    // 获取所有站点流量数据（入站和出站）
    async fetchAllStationFlowData() {
      try {
        if (!this.currentCode) return;
        const [enResponse, exResponse] = await Promise.all([
          http.get(API_URLS.putian_highway.getEnStationFlow, {
            flagId: this.currentCode,
          }),
          http.get(API_URLS.putian_highway.getExStationFlow, {
            flagId: this.currentCode,
          }),
        ]);
        this.enCharData = enResponse || [];
        this.exCharData = exResponse || [];
        this.applyFlowDataByStationType();
      } catch (error) {
        console.error('获取站点流量数据失败:', error);
        this.enCharData = [];
        this.exCharData = [];
        this.applyFlowDataByStationType();
      }
    },
    async fetchAllPredictFlowData() {
      try {
        if (!this.currentCode) return;

        const [enResponse, exResponse] = await Promise.all([
          http.get(API_URLS.putian_highway.getPredictFlow, {
            flagid: this.buildPredictFlagId('in'),
          }),
          http.get(API_URLS.putian_highway.getPredictFlow, {
            flagid: this.buildPredictFlagId('out'),
          }),
        ]);

        this.enPredictData = this.normalizePredictFlowData(enResponse);
        this.exPredictData = this.normalizePredictFlowData(exResponse);
      } catch (error) {
        console.error('获取预测流量数据失败:', error);
        this.enPredictData = [];
        this.exPredictData = [];
      }
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
    .mpch_toggle_group {
      display: flex;
      gap: 4px;
      margin-left: 0px;
      position: relative;
      right: 20px;

      .mpch_toggle_item {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 3px;
        cursor: pointer;
        color: #418adb;
        border: 1px solid #1a428a;
        background: rgba(10, 42, 104, 0.5);
        transition: all 0.3s ease;

        &.active {
          background: #418adb;
          color: #ffffff;
          border-color: #418adb;
          box-shadow: 0 0 8px rgba(65, 138, 219, 0.5);
          cursor: pointer;
        }

        &:hover:not(.active) {
          background: rgba(65, 138, 219, 0.3);
        }
      }
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
