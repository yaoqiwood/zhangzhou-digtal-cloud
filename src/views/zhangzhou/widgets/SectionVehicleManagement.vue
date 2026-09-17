<template>
  <div class="qd-vehicle-container">
    <div class="qd-stats-row">
      <div
        class="qd-stat-card"
        v-for="(item, index) in computedStats"
        :key="index"
        @click="handleStatClick(index)"
      >
        <div class="qd-icon-box">
          <i class="qd-icon" :class="'icon-' + index"></i>
        </div>
        <div class="qd-stat-info">
          <div
            class="qd-stat-label"
            v-if="!(item.loading && item.hideLabelWhenLoading)"
          >
            {{ item.label }}
          </div>
          <div class="qd-stat-value">
            <template v-if="item.loading">
              <span class="qd-mini-loading-spinner"></span>
              <span class="qd-mini-loading-text">加载中</span>
            </template>
            <template v-else>
              {{ item.value }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="qd-table-section" v-if="shouldRenderTableSection">
      <div class="qd-tabs">
        <div
          class="qd-tab"
          :class="{ active: currentTab === 'stranded' }"
          @click="switchTab('stranded')"
          v-if="(currentTab === 'stranded') | (currentTab === 'exception')"
        >
          滞 留
        </div>
        <div
          v-if="currentTab === 'back'"
          class="qd-tab"
          :class="{ active: currentTab === 'back' }"
          @click="handleBackToStranded"
        >
          返 回 滞 留
        </div>
        <div
          class="qd-tab"
          :class="{ active: currentTab === 'exception' }"
          @click="switchTab('exception')"
          v-if="(currentTab !== 'exceptionBack') & (currentTab !== 'back')"
        >
          特 情
        </div>
        <div
          v-if="currentTab === 'exceptionBack'"
          class="qd-tab"
          :class="{ active: currentTab === 'exceptionBack' }"
          @click="handleBackToException"
        >
          返 回 特 情
        </div>
      </div>

      <div
        class="qd-table-wrapper"
        :class="{ 'is-empty': isCurrentTableEmpty }"
      >
        <!-- 加载遮罩层 -->
        <div
          class="qd-loading-mask"
          v-if="
            isLoading ||
            (externalLoading && showExternalLoading) ||
            showExceptionInitLoading
          "
        >
          <div class="qd-loading-content">
            <div class="qd-loading-spinner"></div>
            <div class="qd-loading-text">正在加载...</div>
          </div>
        </div>
        <!-- 滞留车辆区段信息表格 -->
        <table
          class="qd-data-table stranded-table"
          v-if="
            (currentTab === 'stranded') &
            (current_table != 'stranded-detail-table')
          "
        >
          <thead>
            <tr>
              <th class="col-section-name">区段名称</th>
              <th class="col-count">车辆数</th>
              <th class="col-upstream">上游车辆</th>
              <th class="col-downstream">下游车辆</th>
              <th class="col-time" style="text-align: center">时间</th>
              <th class="col-action">操作栏</th>
            </tr>
          </thead>
          <tbody
            :class="{
              'has-scroll': true,
              expanded: expanded,
              'other-hidden': isOtherComponentsHidden,
              'is-empty': tableData.length === 0,
            }"
          >
            <tr v-for="(row, idx) in tableData" :key="idx">
              <td class="col-section-name section-name-cell">{{ row.name }}</td>
              <td class="col-count">{{ row.count }}</td>
              <td class="col-upstream">{{ row.upstream }}</td>
              <td class="col-downstream">{{ row.downstream }}</td>
              <td class="col-time">{{ formatTime(row.time) }}</td>
              <td
                class="col-action qd-action-col"
                @click="switchStrandedDetailTable(row)"
              >
                详情
              </td>
            </tr>
            <tr v-if="showCurrentTableNoDataRow" class="qd-no-data-row">
              <td colspan="6" class="qd-no-data-cell">暂无数据</td>
            </tr>
          </tbody>
        </table>
        <table
          class="qd-data-table stranded-detail-table"
          v-if="
            (current_table === 'stranded-detail-table') &
            (currentTab != 'exception')
          "
        >
          <thead>
            <tr>
              <!-- <th>车辆通行ID</th> -->
              <th>车牌号</th>
              <th>车辆类型</th>
              <th>上游时间</th>
              <th>下游预测时间</th>
              <th>滞留时间</th>
              <th>当前速度</th>
              <th>操作栏</th>
              <!-- <th>拓扑链路ID</th> -->
            </tr>
          </thead>
          <tbody
            :class="{
              'has-scroll': true,
              expanded: expanded,
              'other-hidden': isOtherComponentsHidden,
              'is-empty': filteredVehicleList.length === 0,
            }"
          >
            <tr v-for="row in filteredVehicleList" :key="row.passid">
              <!-- <td>{{ row.passid }}</td> -->
              <td :title="row.plate">{{ row.plate }}</td>
              <td>{{ row.vehType }}</td>
              <td :title="row.entryTime">{{ formatTime(row.entryTime) }}</td>
              <td :title="row.predExitTime">
                {{ formatTime(row.predExitTime) }}
              </td>
              <td :title="row.strandedTime">
                {{ formatTime(row.strandedTime) }}
              </td>
              <td :title="row.currentSpeed + ' km/h'">
                {{ row.currentSpeed }} km/h
              </td>
              <td
                class="qd-action-col"
                @click="showStrandedDetail(row, 'stranded')"
              >
                详情
              </td>
              <!-- <td>{{ row.isStranded ? '是' : '否' }}</td> -->
              <!-- <td>{{ row.linkId }}</td> -->
            </tr>
            <tr v-if="showCurrentTableNoDataRow" class="qd-no-data-row">
              <td colspan="7" class="qd-no-data-cell">暂无数据</td>
            </tr>
          </tbody>
        </table>
        <!-- 特情车辆区段信息表格 -->
        <table
          class="qd-data-table exception-table"
          v-if="
            (currentTab === 'exception') &
            (current_table != 'exception-detail-table')
          "
        >
          <thead>
            <tr>
              <th class="col-ex-name">区段名称</th>
              <th class="col-ex-total">总车辆数</th>
              <th class="col-ex-car">小车数</th>
              <th class="col-ex-truck">货车数</th>
              <th class="col-ex-time">时间</th>
              <th class="col-ex-action">操作栏</th>
            </tr>
          </thead>
          <tbody
            :class="{
              'has-scroll': true,
              expanded: expanded,
              'other-hidden': isOtherComponentsHidden,
              'is-empty': exceptionVehicleList.length === 0,
            }"
          >
            <tr v-for="row in exceptionVehicleList" :key="row.flagId">
              <td class="col-ex-name section-name-cell">{{ row.flagName }}</td>
              <td class="col-ex-total">{{ row.total }}</td>
              <td class="col-ex-car">{{ row.car }}</td>
              <td class="col-ex-truck">{{ row.trunk }}</td>
              <td class="col-ex-time">{{ formatTime(row.timePeriod) }}</td>
              <td
                class="col-ex-action qd-action-col"
                @click="showExceptionDetail(row)"
              >
                详情
              </td>
            </tr>
            <tr v-if="showCurrentTableNoDataRow" class="qd-no-data-row">
              <td colspan="6" class="qd-no-data-cell">暂无数据</td>
            </tr>
          </tbody>
        </table>
        <!-- 特情详细列表 -->
        <table
          class="qd-data-table exception-table"
          v-if="
            (currentTab === 'exceptionBack') &
            (current_table === 'exception-detail-table')
          "
        >
          <thead>
            <tr>
              <th>门架名称</th>
              <th>错误描述</th>
              <th>车牌</th>
              <th class="qd-center-col">门架编码</th>
              <th class="qd-center-col">交易时间</th>
              <th>操作栏</th>
            </tr>
          </thead>
          <tbody
            :class="{
              'has-scroll': true,
              expanded: expanded,
              'other-hidden': isOtherComponentsHidden,
              'is-empty': exceptionDetailList.length === 0,
            }"
          >
            <tr v-for="row in exceptionDetailList" :key="row.passid">
              <td :title="row.flagname">{{ row.flagname }}</td>
              <td :title="row.errorDesc">{{ row.errorDesc }}</td>
              <td :title="row.plate">{{ row.plate }}</td>
              <td :title="row.flagid" class="qd-center-col">
                {{ row.flagid }}
              </td>
              <td :title="row.tradeTime" class="qd-center-col">
                {{ formatTime(row.tradeTime) }}
              </td>
              <td class="qd-action-col" @click="showExceptionPopupDetail(row)">
                详情
              </td>
            </tr>
            <tr v-if="showCurrentTableNoDataRow" class="qd-no-data-row">
              <td colspan="6" class="qd-no-data-cell">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import { REGION_IDS } from '@/utils/constants.js';
import http from '@/utils/http.js';
import { getNow } from '@/utils/tools.js';
export default {
  name: 'SectionVehicleManagement',
  components: {},
  emits: [
    'show-detail',
    'show-exception-detail',
    'update-polylines',
    'highlight-gantry-nodes',
  ],
  props: {
    // 是否展开显示所有数据
    expanded: {
      type: Boolean,
      default: false,
    },
    // 交通事件信息卡片是否可见
    isTrafficEventVisible: {
      type: Boolean,
      default: true,
    },
    // 实时路况信息卡片是否可见
    isRealTimeTrafficVisible: {
      type: Boolean,
      default: true,
    },
    // 外部控制加载状态（由父组件刷新时触发）
    externalLoading: {
      type: Boolean,
      default: false,
    },
    showExternalLoading: {
      type: Boolean,
      default: true,
    },
    // 区段管理列表数据
    sectionMgmtList: {
      type: Array,
      default: () => [],
    },
    // 车辆列表数据
    vehicleList: {
      type: Array,
      default: () => [],
    },
    exceptionVehicleList: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    // 计算是否有其他组件被隐藏
    isOtherComponentsHidden() {
      return !this.isTrafficEventVisible || !this.isRealTimeTrafficVisible;
    },
    isCurrentTableEmpty() {
      if (
        this.currentTab === 'stranded' &&
        this.current_table !== 'stranded-detail-table'
      ) {
        return this.tableData.length === 0;
      }
      if (
        this.current_table === 'stranded-detail-table' &&
        this.currentTab !== 'exception'
      ) {
        return this.filteredVehicleList.length === 0;
      }
      if (
        this.currentTab === 'exception' &&
        this.current_table !== 'exception-detail-table'
      ) {
        return this.exceptionVehicleList.length === 0;
      }
      if (
        this.currentTab === 'exceptionBack' &&
        this.current_table === 'exception-detail-table'
      ) {
        return this.exceptionDetailList.length === 0;
      }
      return false;
    },
    hasPrimaryTableData() {
      return this.tableData.length > 0 || this.exceptionVehicleList.length > 0;
    },
    shouldRenderTableSection() {
      if (!this.hasLoadedTableSection) {
        return true;
      }
      if (this.currentTab === 'stranded' || this.currentTab === 'exception') {
        return this.hasPrimaryTableData;
      }
      return this.hasPrimaryTableData || !this.isCurrentTableEmpty;
    },
    showCurrentTableNoDataRow() {
      return this.hasLoadedTableSection && this.isCurrentTableEmpty;
    },
    // 获取特情表格数据
    tableData() {
      // 如果有传入sectionMgmtList则使用，否则使用本地数据
      if (this.sectionMgmtList && this.sectionMgmtList.length > 0) {
        return this.sectionMgmtList
          .filter((item) => item.vehicleCount > 0)
          .map((item) => ({
            name: item.sectionName,
            count: item.vehicleCount,
            upstream: item.upstreamCount,
            downstream: item.downstreamCount,
            time: item.time,
            passids: item.passids,
            linkId:
              item?.linkId || item?.linkid || item?.Flagid || item?.flagId || '',
          }));
      }
      // console.log(this.vehicleList);
      // 返回本地默认数据
      return [
        // {
        //   name: '区段A',
        //   count: 10,
        //   upstream: 5,
        //   downstream: 5,
        //   time: '2026-01-01 16:00',
        //   passids: '',
        // },
        // {
        //   name: '区段B',
        //   count: 15,
        //   upstream: 8,
        //   downstream: 7,
        //   time: '2026-01-01 15:50',
        //   passids: '',
        // },
      ];
    },
    // 特情一级表首次进入且数据尚未回填时，显示加载动画
    showExceptionInitLoading() {
      return (
        this.showExternalLoading &&
        this.currentTab === 'exception' &&
        this.current_table !== 'exception-detail-table' &&
        !this.hasReceivedExceptionList &&
        (!this.exceptionVehicleList || this.exceptionVehicleList.length === 0)
      );
    },
    // 特情统计卡片加载态：外部刷新中，或首次数据尚未回填
    isExceptionStatsLoading() {
      return (
        (this.externalLoading && this.showExternalLoading) ||
        (this.showExternalLoading &&
          !this.hasReceivedExceptionList &&
          (!this.exceptionVehicleList ||
            this.exceptionVehicleList.length === 0))
      );
    },
    // 滞留统计卡片加载态：跟随父层区段重点车辆接口刷新状态
    isDetainedStatsLoading() {
      return this.externalLoading && this.showExternalLoading;
    },
    secExptionCarTotal() {
      // console.log('exceptionVehicleList', this.exceptionVehicleList);
      // 累加 exceptionVehicleList 中每个元素的 total 值
      const total = this.exceptionVehicleList.reduce((sum, item) => {
        return sum + (Number(item.total) || 0);
      }, 0);
      return total;
    },
    secExceptionTotal() {
      const total = this.exceptionVehicleList.reduce((sum, item) => {
        return (sum += 1);
      }, 0);
      return total;
    },
    detainedCarTotal() {
      const total = this.sectionMgmtList.reduce((sum, item) => {
        return (sum += Number(item.vehicleCount) || 0);
      }, 0);
      return total;
    },
    detainedSectionTotal() {
      // 只统计 vehicleCount 大于 0 的区段记录
      const total = this.sectionMgmtList.reduce((sum, item) => {
        return (sum += item.vehicleCount > 0 ? 1 : 0);
      }, 0);
      return total;
    },
    // 计算统计信息
    computedStats() {
      return [
        {
          label: '滞留车辆',
          value: this.detainedCarTotal,
          loading: this.isDetainedStatsLoading,
          hideLabelWhenLoading: true,
        },
        {
          label: '滞留区段数',
          value: this.detainedSectionTotal,
          loading: this.isDetainedStatsLoading,
          hideLabelWhenLoading: true,
        },
        {
          label: '特情车辆',
          value: this.secExptionCarTotal || 0,
          loading: this.isExceptionStatsLoading,
          hideLabelWhenLoading: true,
        },
        {
          label: '特情区段数',
          value: this.secExceptionTotal,
          loading: this.isExceptionStatsLoading,
          hideLabelWhenLoading: true,
        },
      ];
    },
  },
  data() {
    return {
      currentTab: 'stranded', // 当前选中的标签页：'exception'（特情）或 'stranded'（滞留）
      current_table: '',
      stats: [
        { label: '重点车辆', value: 0 },
        { label: '滞留车辆', value: 0 },
        { label: '特情车辆', value: 0 },
      ],
      filteredVehicleList: [], // 筛选后的车辆列表
      exceptionDetailList: [], // 特情详情列表数据
      isLoading: false, // 加载状态
      hasReceivedExceptionList: false, // 特情列表是否已收到过一次数据
      hasLoadedTableSection: false, // 主表格区域是否完成过首次数据加载
      selectedStrandedSectionName: '', // 一级表点击“详情”后缓存的区段名
    };
  },
  watch: {
    externalLoading: {
      handler(newVal, oldVal) {
        if (oldVal === true && newVal === false) {
          this.hasLoadedTableSection = true;
        }
      },
    },
    exceptionVehicleList: {
      handler(newVal) {
        // 只要父组件异步回填过特情列表（包括空数组），都视为初始化加载结束
        if (Array.isArray(newVal)) {
          this.hasReceivedExceptionList = true;
        }
      },
      deep: false,
    },
  },
  methods: {
    getErrorKeyByType(type) {
      return type === 'stranded' ? 1 : 2;
    },
    getPassidFromRow(row) {
      if (!row || typeof row !== 'object') return '';
      if (row.passid) return String(row.passid);
      if (row.passId) return String(row.passId);
      if (row.passids) {
        const first = String(row.passids)
          .split(',')
          .map((v) => v.trim())[0];
        return first || '';
      }
      return '';
    },
    normalizePolylineResponse(data) {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.list)) return data.list;
      return [];
    },
    normalizeSectionPolylineResponse(data) {
      const source = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : Array.isArray(data?.data?.data)
            ? data.data.data
            : [];

      return source
        .flatMap((group) => (Array.isArray(group) ? group : group ? [group] : []))
        .map((item) => {
          const path = String(item?.polyline || item?.path || '').trim();
          if (!path) return null;
          return {
            ...item,
            path,
            type: '1',
            lineColor: '#ea1b21',
            motionSymbol: 'dot',
            dotColor: '#ffffff',
            dotSize: 7,
            dotSpacing: 0.0048,
            dotFlowSpeed: 0.00003,
          };
        })
        .filter(Boolean);
    },
    getSectionLinkId(row, vehicles = []) {
      const rowLinkId = String(
        row?.linkId || row?.linkid || row?.Flagid || row?.flagId || ''
      ).trim();
      if (rowLinkId) return rowLinkId;

      const vehicleLinkId = vehicles
        .map((item) =>
          String(
            item?.linkId || item?.linkid || item?.Flagid || item?.flagId || ''
          ).trim()
        )
        .find(Boolean);

      return vehicleLinkId || '';
    },
    parseSectionNodesFromLinkId(linkId) {
      const rawLinkId = String(linkId || '').trim();
      if (!rawLinkId) return null;

      const [fromnode = '', tonode = ''] = rawLinkId
        .split('-')
        .map((item) => item.trim());

      if (!fromnode || !tonode) return null;
      return { fromnode, tonode };
    },
    async fetchAndEmitSectionTrackByLinkId(linkId) {
      const nodes = this.parseSectionNodesFromLinkId(linkId);
      if (!nodes) {
        this.$emit('update-polylines', []);
        return;
      }

      try {
        const data = await http.get(FUZHOU_API_URLS.traffic.setPositionByNode, {
          fromnode: nodes.fromnode,
          tonode: nodes.tonode,
          origid: REGION_IDS.ZHANGZHOU,
        });
        const polylineData = this.normalizeSectionPolylineResponse(data);
        this.$emit('update-polylines', polylineData);
      } catch (error) {
        console.error('获取区段轨迹失败:', error);
        this.$emit('update-polylines', []);
      }
    },
    normalizeNodeCode(value) {
      return String(value ?? '').trim();
    },
    extractNodeCodesFromErrorInfo(data) {
      const nodeSet = new Set();

      const collectFromItem = (item) => {
        if (!item || typeof item !== 'object') return;
        const fromNode = this.normalizeNodeCode(item.fromNode ?? item.fromnode);
        const toNode = this.normalizeNodeCode(item.toNode ?? item.tonode);
        if (fromNode) nodeSet.add(fromNode);
        if (toNode) nodeSet.add(toNode);
      };

      const collectFromArray = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((item) => collectFromItem(item));
      };

      collectFromItem(data);
      collectFromItem(data?.data);
      collectFromArray(data);
      collectFromArray(data?.data);
      collectFromArray(data?.list);

      return Array.from(nodeSet);
    },
    async getErrorInfoByPlate({ passid, errorKey, nowTime }) {
      return await http.get(FUZHOU_API_URLS.specialEvent.getErrorInfoByPlate, {
        passid,
        errorKey,
        nowTime,
        origid: REGION_IDS.ZHANGZHOU,
      });
    },
    async fetchAndEmitVehicleTrack(row, type, options = {}) {
      const passid = this.getPassidFromRow(row);
      if (!passid) {
        console.warn('当前记录缺少 passid，无法查询轨迹');
        this.$emit('update-polylines', []);
        return;
      }

      const params = {
        nowTime: getNow(),
        errorKey: this.getErrorKeyByType(type),
        passid,
      };

      try {
        const data = await this.getErrorInfoByPlate(params);
        const polylineData = this.normalizePolylineResponse(data);
        this.$emit('update-polylines', polylineData);
        if (options?.emitNodeHighlight) {
          const nodeCodes = this.extractNodeCodesFromErrorInfo(data);
          if (Array.isArray(nodeCodes) && nodeCodes.length > 0) {
            this.$emit('highlight-gantry-nodes', nodeCodes);
          }
        }
      } catch (error) {
        console.error('获取车辆轨迹失败:', error);
        this.$emit('update-polylines', []);
      }
    },
    handleBackToStranded() {
      this.switchTab('stranded');
      this.filteredVehicleList = [];
    },
    handleBackToException() {
      this.switchTab('exception');
      this.exceptionDetailList = [];
    },
    // 点击顶部统计卡片，快捷切换到对应“返回”视图
    handleStatClick(index) {
      // 滞留车辆总数 / 滞留区段数
      if (index === 0 || index === 1) {
        // 已在滞留详情页时，执行“返回滞留”同等逻辑，回到一级表格
        if (
          this.currentTab === 'back' ||
          this.current_table === 'stranded-detail-table'
        ) {
          this.handleBackToStranded();
          return;
        }
        // 非详情态时，切到滞留一级表格
        this.switchTab('stranded');
        return;
      }

      // 特情车辆总数 / 特情区段数
      if (index === 2 || index === 3) {
        // 已在特情详情页时，执行“返回特情”同等逻辑，回到一级表格
        if (
          this.currentTab === 'exceptionBack' ||
          this.current_table === 'exception-detail-table'
        ) {
          this.handleBackToException();
          return;
        }
        // 非详情态时，切到特情一级表格
        this.switchTab('exception');
      }
    },
    // 格式化时间，只显示时分秒
    formatTime(timeStr) {
      if (!timeStr) return '';
      try {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr; // 如果解析失败，返回原字符串

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error('时间格式化失败:', error);
        return timeStr;
      }
    },
    // 切换标签页
    switchTab(tab) {
      this.currentTab = tab;
      if (this.currentTab === 'stranded') {
        this.current_table = '';
      } else if (this.currentTab === 'exception') {
        this.current_table = '';
        this.selectedStrandedSectionName = '';
      }
    },
    switchStrandedDetailTable(item) {
      this.selectedStrandedSectionName = String(item?.name || '').trim();
      // 解析passids字符串为列表
      const passidList = item.passids
        ? item.passids.split(',').map((value) => String(value).trim())
        : [];

      const matchedVehicles = this.vehicleList.filter((vehicle) =>
        passidList.includes(String(vehicle.passid || '').trim())
      );

      // 筛选vehicleList中passid在passidList中的车辆，并挂上所属区段名供详情弹窗使用
      this.filteredVehicleList = matchedVehicles.map((vehicle) => ({
        ...vehicle,
        sectionName: item.name || vehicle.sectionName || '',
      }));
      console.log(this.filteredVehicleList);
      this.currentTab = 'back';
      // 切换到滞留详细标签页显示筛选结果
      this.current_table = 'stranded-detail-table';
    },
    // 显示车辆详情弹窗
    showStrandedDetail(vehicle, type) {
      console.log(vehicle);
      const sectionName = String(
        vehicle?.sectionName || this.selectedStrandedSectionName || ''
      ).trim();
      const currentSpeed = Number.parseFloat(vehicle?.currentSpeed);
      const manualAppendRecord = sectionName
        ? {
            name: sectionName,
            time: '',
            fullTime: '',
            avgSpeed: Number.isFinite(currentSpeed) ? currentSpeed : 0,
            speed: Number.isFinite(currentSpeed) ? currentSpeed : 0,
            startTimeTs: Number.POSITIVE_INFINITY,
          }
        : null;
      const detailVehicle = {
        ...vehicle,
        sectionName,
        manualAppendRecord,
      };
      const linkId = this.getSectionLinkId(vehicle, [vehicle]);
      if (linkId) {
        this.fetchAndEmitSectionTrackByLinkId(linkId).catch((error) => {
          console.error('异步获取区段轨迹失败:', error);
        });
      } else {
        console.warn('当前车辆记录缺少 linkId，无法查询区段轨迹');
        this.$emit('update-polylines', []);
      }
      this.$emit('show-detail', detailVehicle, type);
    },
    // 获取特情列表数据
    async getTeQingList(flagId) {
      this.exceptionDetailList = [];
      this.isLoading = true; // 开始加载
      try {
        const data = await http.get(FUZHOU_API_URLS.specialEvent.getTeQingList, {
          flagId: flagId,
        origid: REGION_IDS.ZHANGZHOU,
        });
        this.exceptionDetailList = data;
        this.isLoading = false;
        console.log('特情列表数据:', this.exceptionDetailList);
      } catch (error) {
        console.error('获取特情列表数据失败:', error);
      } finally {
        this.isLoading = false; // 加载完成
      }
    },
    // 显示特情详情表格
    showExceptionDetail(row) {
      const flagId = row?.flagId;
      // 获取特情列表数据
      this.getTeQingList(flagId);
      // 切换到详情表格
      this.current_table = 'exception-detail-table';
      this.currentTab = 'exceptionBack';
    },
    // 显示特情车辆详情弹窗
    showExceptionPopupDetail(row) {
      this.fetchAndEmitVehicleTrack(row, 'exception', {
        emitNodeHighlight: true,
      }).catch((error) => {
        console.error('异步获取特情轨迹失败:', error);
      });
      this.$emit('show-exception-detail', row);
    },
  },
  mounted() {
    // 组件初始化时若已存在特情数据，避免误显示加载态
    if (
      Array.isArray(this.exceptionVehicleList) &&
      this.exceptionVehicleList.length > 0
    ) {
      this.hasReceivedExceptionList = true;
    }
    if (
      (Array.isArray(this.sectionMgmtList) && this.sectionMgmtList.length > 0) ||
      (Array.isArray(this.vehicleList) && this.vehicleList.length > 0) ||
      (Array.isArray(this.exceptionVehicleList) &&
        this.exceptionVehicleList.length > 0)
    ) {
      this.hasLoadedTableSection = true;
    }
  },
};
</script>

<style lang="less" scoped>
/* 使用 qd- 前缀防止污染 */
.qd-vehicle-container {
  color: #fff;
  /* padding: 15px; */
  font-family: 'Microsoft YaHei', sans-serif;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 统计卡片布局 */
.qd-stats-row {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: center;
  margin: 6px 0;
}

.qd-stat-card {
  width: calc((100% - 30px) / 4);
  max-width: 120px;
  min-width: 0;
  flex: 1 1 calc((100% - 30px) / 4);
  height: 60px;
  background: rgba(0, 45, 100, 0.3);
  border: 1px solid #0a4da1;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  cursor: pointer;
}

.qd-stat-info {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: visible;
}

.qd-icon-box {
  width: 35px;
  height: 35px;
  margin-right: 8px;
  /* border: 1px solid #1a6fb3; */
  /* clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); */
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: rgba(26, 111, 179, 0.2); */
  flex-shrink: 0;
}

.qd-stat-label {
  display: block;
  font-size: 10px;
  color: #a0c4ff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  position: relative;
  left: -8px;
  width: max-content;
  max-width: none;
}

.qd-stat-value {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
}

.qd-mini-loading-spinner {
  display: inline-block;
  vertical-align: middle;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 234, 255, 0.28);
  border-top-color: #00eaff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-right: 4px;
}

.qd-mini-loading-text {
  display: inline-block;
  vertical-align: middle;
  font-size: 10px;
  color: #9edfff;
}

/* 表格区域 */
.qd-table-section {
  border: 1px solid #0a4da1;
  background: rgba(0, 45, 100, 0.2);
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.qd-tabs {
  display: flex;
  border-bottom: 1px solid #0a4da1;
}

.qd-tab {
  padding: 8px 16px;
  cursor: pointer;
  background: rgba(10, 77, 161, 0.2);
  font-weight: bold;
  font-size: 11px;
  flex: 1;
  text-align: center;
}

.qd-tab.active {
  background: rgba(10, 77, 161, 0.6);
  border-bottom: 2px solid #00d2ff;
}

.qd-table-wrapper {
  /* padding: 6px; */
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.qd-table-wrapper.is-empty {
  flex: 1 1 auto;
  min-height: 0;
}

.qd-table-wrapper.is-empty .qd-data-table {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  min-width: 0;
}

.qd-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  --qd-row-height: 24px;
  th {
    text-align: center;
  }
}

.qd-data-table thead {
  display: block;
  width: 100%;
  flex-shrink: 0; /* 固定表头高度 */
}

.qd-data-table tbody {
  display: block;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.qd-data-table tbody.is-empty {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: hidden;
}

.qd-data-table tbody.has-scroll.is-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 关键：thead/tbody 分离滚动时，用 table 行布局保证列宽一致 */
.qd-data-table thead tr,
.qd-data-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.qd-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 400px;
}

.qd-data-table th {
  background: rgba(0, 85, 255, 0.3);
  color: #00d2ff;
  padding: 6px 4px;
  font-size: 11px; /* 与实时路况表头一致 */
  font-weight: normal;
  white-space: nowrap;
}

.qd-data-table td:first-child {
  font-size: 11px;
}

/* --- 区段名称单元格专项设置 --- */
.section-name-cell {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  text-align: left;
}

.qd-data-table td {
  padding: 6px 4px;
  border-bottom: 1px solid rgba(10, 77, 161, 0.3);
  font-size: 11px;
  color: #e0eaff;
  box-sizing: border-box;
  min-height: var(--qd-row-height);
  height: auto;
  line-height: 1.4;
  vertical-align: middle;
  word-break: break-all;
}

.qd-no-data-row {
  display: table !important;
  width: 100%;
  table-layout: auto;
  height: auto;
  min-height: 0;
  flex: 0 0 auto;
}

.qd-data-table td.qd-no-data-cell {
  width: 100% !important;
  display: table-cell !important;
  text-align: center;
  vertical-align: middle;
  color: rgba(255, 255, 255, 0.65);
  font-size: 16px !important;
  font-weight: 500;
  line-height: 1.4;
  height: auto;
  min-height: 0;
  padding: 0 !important;
  border-bottom: none !important;
}

/* 兜底：防止各表格的 nth-child 列宽规则覆盖“暂无数据”整行展示 */
.stranded-table td.qd-no-data-cell,
.stranded-detail-table td.qd-no-data-cell,
.exception-table td.qd-no-data-cell,
.exception-detail-table td.qd-no-data-cell {
  width: 100% !important;
  text-align: center !important;
}

/* --- 滞留表格列宽精确对齐 (thead & tbody) --- */
.col-section-name {
  width: 30%;
}
.col-count {
  width: 10%;
  text-align: center;
}
.col-upstream {
  width: 12%;
  text-align: center;
}
.col-downstream {
  width: 18%;
  text-align: center;
}
.col-time {
  width: 20%;
  text-align: center;
}
.col-action {
  width: 10%;
  text-align: right;
  color: #22d3ee;
}

/* 滞留详细表格列宽 */
.stranded-detail-table th:nth-child(1),
.stranded-detail-table td:nth-child(1) {
  width: 14%; /* 车牌号 */
  text-align: center;
}

.stranded-detail-table th:nth-child(2),
.stranded-detail-table td:nth-child(2) {
  width: 8%; /* 车辆类型 */
  text-align: center;
}

.stranded-detail-table th:nth-child(3),
.stranded-detail-table td:nth-child(3) {
  width: 18%; /* 上游门架通行时间 */
  text-align: center;
}

.stranded-detail-table th:nth-child(4),
.stranded-detail-table td:nth-child(4) {
  width: 18%; /* 下游预测通行时间 */
  text-align: center;
}

.stranded-detail-table th:nth-child(5),
.stranded-detail-table td:nth-child(5) {
  width: 14%; /* 滞留时间 */
  text-align: center;
}

.stranded-detail-table th:nth-child(6),
.stranded-detail-table td:nth-child(6) {
  width: 14%; /* 当前速度 */
  text-align: center;
}

.stranded-detail-table th:nth-child(7),
.stranded-detail-table td:nth-child(7) {
  width: 14%; /* 操作栏 */
  text-align: center;
}

/* --- 特情表格列宽精确对齐 (thead & tbody) --- */
.col-ex-name {
  width: 25%;
}
.col-ex-total {
  width: 15%;
  text-align: center;
}
.col-ex-car {
  width: 15%;
  text-align: center;
}
.col-ex-time {
  width: 12%;
  text-align: center;
}
.col-ex-truck {
  width: 15%;
  text-align: center;
}
.col-ex-action {
  width: 12%;
  text-align: center;
  color: #22d3ee;
}

/* 特情详细表格列宽 */
.exception-detail-table th:nth-child(1),
.exception-detail-table td:nth-child(1) {
  width: 18%; /* 门架名称 */
  text-align: left;
}

.exception-detail-table th:nth-child(2),
.exception-detail-table td:nth-child(2) {
  width: 24%; /* 错误描述 */
  text-align: left;
}

.exception-detail-table th:nth-child(3),
.exception-detail-table td:nth-child(3) {
  width: 12%; /* 车牌 */
  text-align: center;
}

.exception-detail-table th:nth-child(4),
.exception-detail-table td:nth-child(4) {
  width: 14%; /* 门架编码 */
  text-align: center;
}

.exception-detail-table th:nth-child(5),
.exception-detail-table td:nth-child(5) {
  width: 20%; /* 交易时间 */
  text-align: center;
}

.exception-detail-table th:nth-child(6),
.exception-detail-table td:nth-child(6) {
  width: 12%; /* 操作栏 */
  text-align: center;
}

.qd-action-col {
  color: #00eaff !important;
  cursor: pointer;
  text-decoration: underline;
  text-align: center;
}

.qd-center-col {
  text-align: center;
}

/* 加载遮罩层样式 */
.qd-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.qd-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qd-loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 234, 255, 0.3);
  border-top-color: #00eaff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.qd-loading-text {
  color: #00eaff;
  font-size: 14px;
  font-weight: bold;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 图标样式 */
.qd-icon {
  width: 70px;
  height: 70px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* 具体图标 */
.icon-0 {
  background-image: url(/src/assets/buttom-none-icon.png);
}
.icon-1 {
  background-image: url(/src/assets/buttom-star-decoration-icon.png);
}

.icon-2 {
  background-image: url(/src/assets/buttom-hourglass-decoration-icon.png);
}

.icon-3 {
  background-image: url(/src/assets/buttom-warning-icon.png);
}

/* 优化滚动条样式（与实时路况组件一致） */
.qd-data-table tbody::-webkit-scrollbar {
  width: 6px;
}

.qd-data-table tbody::-webkit-scrollbar-thumb {
  background: #003a8c;
  border-radius: 3px;
}

.qd-data-table tbody::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
</style>
