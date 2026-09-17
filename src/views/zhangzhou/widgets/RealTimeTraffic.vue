<template>
  <div
    class="realtime-traffic-dashboard"
    :class="{ expanded, 'three-panel-mode': isThreePanelMode }"
    style="position: relative"
  >
    <div class="realtime-traffic-grid">
      <div class="realtime-traffic-stat-card">
        <div class="realtime-traffic-icon-wrapper">
          <i class="realtime-traffic-icon smooth"></i>
        </div>
        <div class="realtime-traffic-status">畅通</div>
        <div class="realtime-traffic-value">{{ smoothCount }}</div>
      </div>

      <div
        class="realtime-traffic-stat-card"
        :class="{ active: activeCardFilter === 'jammed' }"
        @click="handleJammedCardClick"
      >
        <div class="realtime-traffic-icon-wrapper">
          <i class="realtime-traffic-icon jammed"></i>
        </div>
        <div class="realtime-traffic-status">拥堵</div>
        <div class="realtime-traffic-value">{{ jammedCount }}</div>
      </div>

      <div
        class="realtime-traffic-stat-card"
        :class="{
          active: activeCardFilter === 'slow',
          'slow-active': activeCardFilter === 'slow',
        }"
        @click="handleSlowCardClick"
      >
        <div class="realtime-traffic-icon-wrapper">
          <i class="realtime-traffic-icon slow-moving"></i>
        </div>
        <div class="realtime-traffic-status">缓行</div>
        <div class="realtime-traffic-value">
          {{ slowCount }}
        </div>
      </div>

      <div class="realtime-traffic-chart-container">
        <div ref="chartRef" class="realtime-traffic-chart"></div>
        <!-- <div class="realtime-traffic-chart-label">拥堵事件占比</div> -->
      </div>
    </div>

    <div
      class="realtime-traffic-table-container"
      v-if="shouldRenderTrafficTable"
      :class="{ 'is-empty': formattedTrafficData.length === 0 }"
    >
      <div
        class="realtime-traffic-table-wrapper"
        :class="{ 'is-empty': formattedTrafficData.length === 0 }"
      >
        <!-- 表头部分 -->
        <table class="realtime-traffic-table-header">
          <thead>
            <tr>
              <th class="type-cell">类型</th>
              <th class="section-name-cell">区段名称</th>
              <th class="mileage-cell">桩号</th>
              <th class="speed-cell">
                <span>平均车速</span>
                <span class="threshold-label">阈值</span>
              </th>
              <th class="flow-cell">
                <span>车流量</span>
                <span class="threshold-label">阈值</span>
              </th>
              <th class="time-cell">时间</th>
              <th class="action-cell">操作栏</th>
            </tr>
          </thead>
        </table>
        <!-- 表体部分，可滚动 -->
        <div
          ref="scrollContainerRef"
          class="realtime-traffic-table-body-wrapper"
          :class="{ 'is-empty': formattedTrafficData.length === 0 }"
        >
          <table class="realtime-traffic-table-body">
            <tbody
              :class="{
                'has-scroll': true,
                expanded: expanded,
                'other-hidden': isOtherComponentsHidden,
                'is-empty': formattedTrafficData.length === 0,
              }"
            >
              <tr
                v-for="(item, index) in formattedTrafficData"
                :key="index"
                class="realtime-traffic-table-row"
                :class="{ 'is-highlighted': isHighlightedRoadRow(item) }"
                :data-road-signature="item.roadSignature || ''"
              >
                <td class="type-cell">{{ item.trafficType }}</td>
                <td class="section-name-cell">{{ item.sectionName }}</td>
                <td class="mileage-cell">{{ item.mileage }}</td>
                <td class="speed-cell">
                  <span>{{ item.avgSpeed }}</span>
                  <span class="threshold-value">{{ item.avgSpeedMax }}</span>
                </td>
                <td class="flow-cell">
                  <span>{{ item.flow }}</span>
                  <span class="threshold-value">{{ item.trafficFlowMax }}</span>
                </td>
                <td class="time-cell">{{ formatTime(item.time) }}</td>
                <td class="action-cell">
                  <button
                    class="realtime-traffic-detail-btn"
                    @click="openDetailPopup(item)"
                  >
                    详情
                  </button>
                </td>
              </tr>
              <tr
                v-if="showTrafficNoDataRow"
                class="realtime-traffic-no-data-row"
              >
                <td colspan="7" class="realtime-traffic-no-data-cell">
                  暂无数据
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="loading || (props.externalLoading && props.showExternalLoading)"
      class="loading-mask"
    >
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { REGION_IDS } from '@/utils/constants';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api';
import http from '@/utils/http';
import { getNow } from '@/utils/tools';

const chartRef = ref(null);
let chart = null;
const loading = ref(false);
const scrollContainerRef = ref(null);
const tableFilter = ref('all');
const lastTableScrollTop = ref(0);
const highlightDrivenFilterActive = ref(false);
const hasLoadedTrafficTable = ref(false);
const trafficThresholdMap = ref({});
const pendingThresholdFlagIds = new Set();

// 响应式数据：只保留最基础的源数据
const localTrafficData = ref([]); // 接口获取的拥堵数据
const localCongestionEventList = ref([]); // 接口获取的缓行区段数据
const ptTopoCount = ref(0); // 拓扑总数

// 定义组件接收的props
const props = defineProps({
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
  // 区段重点车辆管理卡片是否可见
  isSectionVehicleManagementVisible: {
    type: Boolean,
    default: true,
  },
  // 交通数据（缓行数据）
  trafficData: {
    type: Array,
    default: () => [],
  },
  // 拥堵事件列表
  congestionEventList: {
    type: Array,
    default: () => [],
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
  highlightRoadSignature: {
    type: String,
    default: '',
  },
  highlightRoadType: {
    type: String,
    default: '',
  },
});

// 定义组件的事件
const emit = defineEmits([
  'update-ratios',
  'update-table-length',
  'show-video-columns',
  'show-traffic-jam-detail',
  'jam-road-updated',
]);

// 拥堵数：来自接口
const jammedCount = computed(() => localTrafficData.value.length);

// 归一化路况类型，兼容不同接口字段
const normalizeTrafficType = (item) => {
  const rawType = String(item?.type ?? '').toLowerCase();
  const rawStatus = String(item?.status ?? '').toLowerCase();
  const rawEventType = String(item?.eventType ?? '').toLowerCase();
  const merged = `${rawType}|${rawStatus}|${rawEventType}`;

  if (merged.includes('拥堵') || rawType === '0' || rawStatus === '0') {
    return 'jammed';
  }
  if (merged.includes('缓行') || rawType === '1' || rawStatus === '1') {
    return 'slow';
  }
  return 'unknown';
};

const normalizeSignaturePart = (value) => String(value ?? '').trim();

const getTrafficFlagId = (item) =>
  String(item?.Flagid || item?.flagId || '').trim();

const parseNodesFromFlagId = (flagId) => {
  const [fromnode = '', tonode = '', ...rest] = String(flagId || '')
    .split('-')
    .map((item) => item.trim());

  if (!fromnode || !tonode || rest.length > 0) return null;
  return { fromnode, tonode };
};

const readFirstDefined = (source, keys) => {
  if (!source || typeof source !== 'object') return '';
  const key = keys.find(
    (item) => source[item] !== undefined && source[item] !== null
  );
  return key ? source[key] : '';
};

const normalizeThresholdInfo = (rawData) => {
  const candidates = [
    rawData,
    rawData?.data,
    rawData?.data?.data,
    rawData?.data?.data?.[0],
    rawData?.data?.[0],
    rawData?.rows?.[0],
    rawData?.list?.[0],
  ].filter(Boolean);

  const threshold =
    candidates.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        (readFirstDefined(item, ['avgSpeedMax', 'avg_speed_max']) !== '' ||
          readFirstDefined(item, ['trafficFlowMax', 'traffic_flow_max']) !== '')
    ) || {};

  return {
    avgSpeedMax: readFirstDefined(threshold, ['avgSpeedMax', 'avg_speed_max']),
    trafficFlowMax: readFirstDefined(threshold, [
      'trafficFlowMax',
      'traffic_flow_max',
    ]),
  };
};

const fetchTrafficThresholds = async (flagIds = []) => {
  const uniqueFlagIds = Array.from(new Set(flagIds))
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const requestFlagIds = uniqueFlagIds.filter((flagId) => {
    if (
      trafficThresholdMap.value[flagId] ||
      pendingThresholdFlagIds.has(flagId)
    ) {
      return false;
    }
    return Boolean(parseNodesFromFlagId(flagId));
  });

  if (requestFlagIds.length === 0) return;

  requestFlagIds.forEach((flagId) => pendingThresholdFlagIds.add(flagId));

  const results = await Promise.allSettled(
    requestFlagIds.map(async (flagId) => {
      const nodes = parseNodesFromFlagId(flagId);
      const data = await http.get(FUZHOU_API_URLS.threshold.getThreadholdInfo, {
        fromnode: nodes.fromnode,
        tonode: nodes.tonode,
        origid: REGION_IDS.ZHANGZHOU,
      });
      return [flagId, normalizeThresholdInfo(data)];
    })
  );

  requestFlagIds.forEach((flagId) => pendingThresholdFlagIds.delete(flagId));

  const nextMap = { ...trafficThresholdMap.value };
  results.forEach((result) => {
    if (result.status !== 'fulfilled') {
      console.error('获取实时路况阈值失败:', result.reason);
      return;
    }
    const [flagId, thresholdInfo] = result.value;
    nextMap[flagId] = thresholdInfo;
  });
  trafficThresholdMap.value = nextMap;
};

const getRoadConditionSignature = (item) => {
  if (!item || typeof item !== 'object') return '';
  const primary = item?.Flagid ?? item?.flagId ?? item?.id;
  const type = normalizeTrafficType(item);
  const section = normalizeSignaturePart(
    item?.sectionName ||
      item?.routeName ||
      `${item?.fromName || ''}${item?.toname ? `-${item.toname}` : ''}`
  );
  const stakeNum = normalizeSignaturePart(
    item?.stakeNum || item?.mileage || item?.kmStart
  );
  const happenTime = normalizeSignaturePart(
    item?.startTime || item?.time || item?.happenTime
  );
  const avgSpeed = normalizeSignaturePart(item?.avgSpeedRaw ?? item?.avgSpeed);
  const flow = normalizeSignaturePart(item?.flow);
  const status =
    type === 'jammed'
      ? '0'
      : type === 'slow'
        ? '1'
        : normalizeSignaturePart(item?.status);
  const primaryText = normalizeSignaturePart(primary);
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
  if (signatureParts.every((part) => !part)) return '';
  return `road:${signatureParts.join('|')}`;
};

const normalizeCongestionEventList = (rawData) => {
  const source = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : [];

  return source.map((item) => ({
    ...item,
    Flagid: item?.Flagid || item?.flagId || '',
    flagId: item?.flagId || item?.Flagid || '',
    type: '1',
    status: '1',
    eventType: item?.congestionStatus || '缓行',
    congestionStatus: item?.congestionStatus || '缓行',
    sectionName: item?.sectionName || '',
    mileage:
      item?.mileage || item?.stakeNum || item?.Flagid || item?.flagId || '-',
    stakeNum: item?.stakeNum || item?.Flagid || item?.flagId || '',
    avgSpeed: item?.avgSpeed ?? null,
    flow: item?.flow ?? item?.totalVehicles ?? 0,
    time: item?.time || '',
  }));
};

const slowTrafficSource = computed(() => {
  if (localCongestionEventList.value.length > 0) {
    return localCongestionEventList.value;
  }
  if (
    Array.isArray(props.congestionEventList) &&
    props.congestionEventList.length > 0
  ) {
    return normalizeCongestionEventList(props.congestionEventList);
  }
  if (Array.isArray(props.trafficData) && props.trafficData.length > 0) {
    return normalizeCongestionEventList(props.trafficData);
  }
  return [];
});

// 仅保留缓行数据；若无法识别状态则回退到原始列表（保持兼容）
const slowOnlyTrafficData = computed(() => {
  const source = slowTrafficSource.value;
  // 统一规则：非拥堵都计入缓行
  return source.filter((item) => normalizeTrafficType(item) !== 'jammed');
});

const normalizedSlowTrafficData = computed(() => {
  return slowTrafficSource.value;
});

// 缓行数：来自缓行区段接口（失败时回退到父组件传值）
const slowCount = computed(() => slowOnlyTrafficData.value.length);
const activeCardFilter = computed(() =>
  highlightDrivenFilterActive.value ? 'all' : tableFilter.value
);
const isThreePanelMode = computed(
  () =>
    !props.expanded &&
    props.isTrafficEventVisible &&
    props.isSectionVehicleManagementVisible
);
// 畅通数：总数 - 拥堵 - 缓行 (确保不小于0)
const smoothCount = computed(() => {
  const count = ptTopoCount.value - jammedCount.value - slowCount.value;
  return count > 0 ? count : 0;
});

// 计算各个状态的百分比
const trafficRatios = computed(() => {
  const total = Number(ptTopoCount.value || 0);
  if (total <= 0) {
    return { smooth: 0, jammed: 0, slow: 0 };
  }

  const smooth = Math.round((smoothCount.value / total) * 100);
  const jammed = Math.round((jammedCount.value / total) * 100);
  const slow = Math.round((slowCount.value / total) * 100);

  return {
    smooth: Math.max(0, Math.min(100, smooth)),
    jammed: Math.max(0, Math.min(100, jammed)),
    slow: Math.max(0, Math.min(100, slow)),
  };
});

// 组装饼图数据
const dynamicChartData = computed(() => [
  {
    value: trafficRatios.value.smooth,
    name: '畅通',
    itemStyle: { color: '#4ade80' },
  },
  {
    value: trafficRatios.value.jammed,
    name: '拥堵',
    itemStyle: { color: '#f87171' },
  },
  {
    value: trafficRatios.value.slow,
    name: '缓行',
    itemStyle: { color: '#fb923c' },
  },
]);

// 格式化时间，只显示时分秒
const formatTime = (timeStr) => {
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
};

const normalizeVideoListByFlags = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const isTimeoutOr500Error = (error) => {
  const status = Number(error?.response?.status ?? error?.status ?? 0);
  if (status === 500) return true;

  const code = String(error?.code ?? '').toUpperCase();
  const message = String(error?.message ?? '').toLowerCase();

  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  if (message.includes('timeout') || message.includes('超时')) return true;
  return false;
};

// 打开拥堵详情弹窗
const openDetailPopup = async (item) => {
  const flagid = String(item?.Flagid || item?.flagId || item?.mileage || '').trim();

  if (!flagid) {
    emit('show-video-columns', {
      type: 'traffic',
      data: item,
      source: 'RealTimeTraffic',
      flagid: '',
      flagId: '',
      Flagid: '',
      cameraNums: [],
    });
    emit('show-traffic-jam-detail', item);
    return;
  }

  try {
    const response = await http.get(FUZHOU_API_URLS.video.getVideoListByFlags, {
      flagid,
      origid: REGION_IDS.ZHANGZHOU,
    });
    const cameraNums = normalizeVideoListByFlags(response)
      .map((camera) => String(camera?.cameraNum || '').trim())
      .filter(Boolean);

    emit('show-video-columns', {
      type: 'traffic',
      data: item,
      source: 'RealTimeTraffic',
      flagid,
      flagId: flagid,
      Flagid: flagid,
      cameraNums,
    });
  } catch (error) {
    console.error('根据区段获取视频列表失败:', error);
    emit('show-video-columns', {
      type: 'traffic',
      data: item,
      source: 'RealTimeTraffic',
      flagid,
      flagId: flagid,
      Flagid: flagid,
      cameraNums: [],
    });
  }
  // 触发父组件显示拥堵详情弹窗
  emit('show-traffic-jam-detail', item);
};

// 当前选中的数据
const selectedData = ref(null);
const handleJammedCardClick = () => {
  tableFilter.value = tableFilter.value === 'jammed' ? 'all' : 'jammed';
};
const handleSlowCardClick = () => {
  tableFilter.value = tableFilter.value === 'slow' ? 'all' : 'slow';
};

// 测试注入逻辑已停用，组件仅展示真实接口返回数据。

// 监听数据变化，自动更新图表和同步父组件
watch(
  dynamicChartData,
  (newVal) => {
    if (newVal) {
      updateChart();
      // 默认选中第一项
      if (!selectedData.value) selectedData.value = newVal[0];

      // 通知父组件
      emit('update-ratios', {
        ...trafficRatios.value,
        totalCount: ptTopoCount.value,
      });
    }
  },
  { deep: true }
);

// 获取实时交通数据（并行请求）
const fetchTrafficData = async (options = {}) => {
  const { showLoading = true } = options;
  if (showLoading) {
    loading.value = true;
  }
  const previousScrollTop = Number(scrollContainerRef.value?.scrollTop || 0);
  lastTableScrollTop.value = previousScrollTop;
  try {
    // 分开请求，避免单个接口失败导致全部统计异常
    const countTask = http.get(FUZHOU_API_URLS.traffic.getPTTopoCount, {
      origid: REGION_IDS.ZHANGZHOU,
    });
    const jamTask = http.get(FUZHOU_API_URLS.traffic.getJamRoads, {
      nowTime: getNow(),
      eventType: '0,1',
      origid: REGION_IDS.ZHANGZHOU,
    });
    // 缓行区段列表由 Home.vue 统一请求并通过 props 下发，
    // 这里不再重复触发 congestionEventList，避免同一刷新链路内重复请求。
    const [countResult, jamResult] = await Promise.allSettled([
      countTask,
      jamTask,
    ]);

    // 处理总数
    if (
      countResult.status === 'fulfilled' &&
      Array.isArray(countResult.value) &&
      countResult.value[0]
    ) {
      ptTopoCount.value = Number(countResult.value[0].total || 0);
    } else if (
      countResult.status === 'rejected' &&
      isTimeoutOr500Error(countResult.reason)
    ) {
      // 仅在 500 或超时时使用兜底值
      ptTopoCount.value = 199;
    } else {
      ptTopoCount.value = 0;
    }

    // 处理拥堵列表（兼容 http 封装后可能返回数组或对象）
    let mappedJamList = [];
    if (jamResult.status === 'fulfilled') {
      const jamRaw = jamResult.value;
      const jamList = Array.isArray(jamRaw)
        ? jamRaw
        : Array.isArray(jamRaw?.data?.data)
          ? jamRaw.data.data
          : [];

      mappedJamList = jamList.map((item) => ({
        id: item.id,
        Flagid: item.Flagid || item.flagId || '',
        flagId: item.flagId || item.Flagid || '',
        startTime: item.startTime,
        endTime: item.endTime,
        ennode: item.ennode,
        exnode: item.exnode,
        fromName: item.fromName,
        toname: item.toname,
        status: item.status,
        type: item.type || '拥堵',
        avgSpeed: item.avgSpeed,
        flow: item.flow,
        stakeNum: item.stakeNum,
        Path: item.Path,
        sectionName: `${item.fromName || ''}${item.toname ? `-${item.toname}` : ''}`,
        mileage: item.stakeNum || '',
        time: item.startTime || '',
      }));
    }

    localTrafficData.value = mappedJamList;
    // 回传给父组件用于统一通知判断
    const jamRoadConditionList = mappedJamList.map((item) => ({
      Flagid:
        item?.Flagid ||
        item?.flagId ||
        item?.id ||
        `${item.sectionName || 'jam'}-${item.stakeNum || ''}-${item.startTime || ''}`,
      sectionName:
        item?.sectionName ||
        `${item?.fromName || ''}${item?.toname ? `-${item.toname}` : ''}`,
      stakeNum: item?.stakeNum || '',
      avgSpeed: item?.avgSpeed,
      flow: item?.flow,
      startTime: item?.startTime || '',
      time: item?.startTime || '',
      type: '0',
      status: '0',
      eventType: '拥堵',
    }));
    emit('jam-road-updated', jamRoadConditionList);

    await nextTick();
    if (!props.highlightRoadSignature && scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = lastTableScrollTop.value;
    }
  } catch (error) {
    console.error('获取实时交通数据失败:', error);
  } finally {
    hasLoadedTrafficTable.value = true;
    if (showLoading) {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  }
};

// 计算属性：格式化交通数据以匹配表格结构
const formattedTrafficData = computed(() => {
  const jamRows = localTrafficData.value.map((item) => ({
    ...item,
    trafficType: '拥堵',
  }));
  // 点击“拥堵”后，仅显示拥堵列表
  const allData =
    tableFilter.value === 'jammed'
      ? jamRows
      : tableFilter.value === 'slow'
        ? slowOnlyTrafficData.value.map((item) => ({
            ...item,
            trafficType: '缓行',
          }))
        : [
            ...jamRows,
            ...normalizedSlowTrafficData.value.map((item) => ({
              ...item,
              trafficType: '缓行',
            })),
          ];

  return allData.map((item) => {
    return {
      // 保留原始数据字段
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      ennode: item.ennode,
      exnode: item.exnode,
      fromName: item.fromName,
      toname: item.toname,
      status: item.status,
      type: item.type || '拥堵',
      avgSpeed: item.avgSpeed,
      avgSpeedRaw:
        item.avgSpeed === null ||
        item.avgSpeed === undefined ||
        item.avgSpeed === ''
          ? ''
          : String(item.avgSpeed),
      flow: item.flow,
      stakeNum: item.stakeNum,
      Path: item.Path,
      flagId: item.Flagid || item.flagId || '',
      Flagid: item.Flagid || item.flagId || '',

      // 表格显示所需字段
      sectionName:
        item.sectionName ||
        `${item.fromName || ''}${item.toname ? `-${item.toname}` : ''}`,
      mileage: item.mileage || item.stakeNum || '',
      avgSpeed:
        item.avgSpeed === null ||
        item.avgSpeed === undefined ||
        item.avgSpeed === ''
          ? '-'
          : `${item.avgSpeed}km/h`,
      avgSpeedMax:
        trafficThresholdMap.value[getTrafficFlagId(item)]?.avgSpeedMax ?? '-',
      flow: String(item.flow ?? item.totalVehicles ?? 0), // 车流量转换为字符串
      trafficFlowMax:
        trafficThresholdMap.value[getTrafficFlagId(item)]?.trafficFlowMax ??
        '-',
      time: item.time || item.startTime || '',
      trafficType: item.trafficType || '缓行',
      roadSignature: getRoadConditionSignature(item),
    };
  });
});

watch(
  formattedTrafficData,
  (rows) => {
    const flagIds = rows.map((item) => getTrafficFlagId(item)).filter(Boolean);
    fetchTrafficThresholds(flagIds);
  },
  { immediate: true }
);

const shouldRenderTrafficTable = computed(
  () => formattedTrafficData.value.length > 0
);

watch(
  formattedTrafficData,
  (rows) => {
    emit('update-table-length', Array.isArray(rows) ? rows.length : 0);
  },
  { immediate: true }
);

const showTrafficNoDataRow = computed(
  () => hasLoadedTrafficTable.value && formattedTrafficData.value.length === 0
);

const buildFormattedTrafficRow = (item, trafficType = '缓行') => ({
  // 保留原始数据字段
  id: item?.id,
  startTime: item?.startTime,
  endTime: item?.endTime,
  ennode: item?.ennode,
  exnode: item?.exnode,
  fromName: item?.fromName,
  toname: item?.toname,
  status: item?.status,
  type: item?.type || '拥堵',
  avgSpeed: item?.avgSpeed,
  avgSpeedRaw:
    item?.avgSpeed === null ||
    item?.avgSpeed === undefined ||
    item?.avgSpeed === ''
      ? ''
      : String(item.avgSpeed),
  flow: item?.flow,
  stakeNum: item?.stakeNum,
  Path: item?.Path,
  flagId: item?.Flagid || item?.flagId || '',
  Flagid: item?.Flagid || item?.flagId || '',

  // 表格显示所需字段
  sectionName:
    item?.sectionName ||
    `${item?.fromName || ''}${item?.toname ? `-${item.toname}` : ''}`,
  mileage: item?.mileage || item?.stakeNum || '',
  avgSpeed:
    item?.avgSpeed === null ||
    item?.avgSpeed === undefined ||
    item?.avgSpeed === ''
      ? '-'
      : `${item.avgSpeed}km/h`,
  avgSpeedMax:
    trafficThresholdMap.value[getTrafficFlagId(item)]?.avgSpeedMax ?? '-',
  flow: String(item?.flow ?? item?.totalVehicles ?? 0),
  trafficFlowMax:
    trafficThresholdMap.value[getTrafficFlagId(item)]?.trafficFlowMax ?? '-',
  time: item?.time || item?.startTime || '',
  trafficType,
  roadSignature: getRoadConditionSignature(item),
});

const allFormattedTrafficData = computed(() => {
  const jamRows = localTrafficData.value.map((item) =>
    buildFormattedTrafficRow(item, '拥堵')
  );
  const slowRows = normalizedSlowTrafficData.value.map((item) =>
    buildFormattedTrafficRow(item, '缓行')
  );
  return [...jamRows, ...slowRows];
});

const openDetailByRoadSignature = async (roadSignature, fallbackItem = null) => {
  const signature = String(roadSignature || '').trim();
  if (!signature) return false;

  await nextTick();
  await nextTick();

  let matchedItem = formattedTrafficData.value.find(
    (item) => String(item?.roadSignature || '') === signature
  );

  if (!matchedItem) {
    matchedItem = allFormattedTrafficData.value.find(
      (item) => String(item?.roadSignature || '') === signature
    );
  }

  if (!matchedItem && fallbackItem && typeof fallbackItem === 'object') {
    matchedItem = {
      ...fallbackItem,
      roadSignature: String(fallbackItem?.roadSignature || signature),
      trafficType:
        fallbackItem?.trafficType ||
        (props.highlightRoadType === 'jammed' ? '拥堵' : '缓行'),
    };
  }

  if (!matchedItem) return false;
  await openDetailPopup(matchedItem);
  return true;
};

const isHighlightedRoadRow = (item) => {
  const currentSignature = String(item?.roadSignature || '');
  const targetSignature = String(props.highlightRoadSignature || '');
  return Boolean(
    currentSignature && targetSignature && currentSignature === targetSignature
  );
};

const getSafeSelectorValue = (value) => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return String(value).replace(/["\\]/g, '\\$&');
};

const scrollHighlightedRowIntoView = async () => {
  if (!props.highlightRoadSignature) return;
  await nextTick();
  const container = scrollContainerRef.value;
  if (!container) return;
  const selectorValue = getSafeSelectorValue(props.highlightRoadSignature);
  const targetRow = container.querySelector(
    `[data-road-signature="${selectorValue}"]`
  );
  if (!targetRow) return;

  const rowTop = targetRow.offsetTop;
  const rowHeight = targetRow.offsetHeight || 0;
  const containerHeight = container.clientHeight || 0;
  const targetScrollTop = Math.max(
    0,
    rowTop - containerHeight / 2 + rowHeight / 2
  );

  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  });
  lastTableScrollTop.value = targetScrollTop;
};

watch(
  () => props.highlightRoadSignature,
  async (newVal) => {
    if (!newVal) {
      if (
        highlightDrivenFilterActive.value &&
        (tableFilter.value === 'slow' || tableFilter.value === 'jammed')
      ) {
        tableFilter.value = 'all';
      }
      highlightDrivenFilterActive.value = false;
      return;
    }
    highlightDrivenFilterActive.value = true;
    tableFilter.value =
      props.highlightRoadType === 'jammed'
        ? 'jammed'
        : props.highlightRoadType === 'slow'
          ? 'slow'
          : 'all';
    await scrollHighlightedRowIntoView();
  }
);

watch(
  formattedTrafficData,
  async () => {
    if (!props.highlightRoadSignature) return;
    await scrollHighlightedRowIntoView();
  },
  { deep: true }
);

// 计算是否有其他组件被隐藏
const isOtherComponentsHidden = computed(() => {
  return (
    !props.isTrafficEventVisible || !props.isSectionVehicleManagementVisible
  );
});

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);

  // 基础配置只写一次
  chart.setOption({
    grid: {
      left: '0%',
      right: '25%',
      top: '5%',
      bottom: '15%',
      containLabel: true,
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 18,
      itemHeight: 6,
      itemGap: 8,
      textStyle: {
        color: '#fff',
        fontSize: 9,
      },
      data: ['畅通', '拥堵', '缓行'],
    },
    series: [
      {
        name: '路况占比',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['35%', '45%'],
        avoidLabelOverlap: false,
        padAngle: 2,
        itemStyle: {
          borderRadius: 2,
        },
        label: {
          show: true,
          position: 'center',
        },
      },
    ],
  });

  // 添加点击事件监听
  chart.on('click', (params) => {
    if (params.data) {
      selectedData.value = params.data;
      updateChart();
    }
  });

  // 响应式调整
  window.addEventListener('resize', () => chart?.resize());

  // 初始更新
  updateChart();
};

// 更新图表
const updateChart = () => {
  if (!chart) return;

  chart.setOption({
    series: [
      {
        data: dynamicChartData.value,
        label: {
          formatter: () => {
            const target =
              dynamicChartData.value.find(
                (item) => item.name === selectedData.value?.name
              ) || dynamicChartData.value[2];
            if (!target) return '';
            return `{value|${target.value}%}\n{name|${target.name}}`;
          },
          rich: {
            value: {
              fontSize: 14,
              fontWeight: 'bold',
              color: '#fff',
              lineHeight: 18,
            },
            name: {
              fontSize: 8,
              color: '#ccc',
            },
          },
        },
      },
    ],
  });
};

// 生命周期
onMounted(() => {
  initChart();
});

// 暴露给父组件的方法
defineExpose({
  // 刷新交通数据
  refreshTrafficData: (options = {}) => fetchTrafficData(options),
  // 获取路况占比
  getTrafficRatios: () => trafficRatios.value,
  // 根据路况签名直接打开详情（通知点击联动）
  openDetailByRoadSignature,
});

onUnmounted(() => {
  window.removeEventListener('resize', () => chart?.resize());
  chart?.dispose();
});
</script>

<style lang="less" scoped>
/* 主容器 */
.realtime-traffic-dashboard {
  /* padding: 10px; */
  /* background-color: #001529; */
  color: white;
  font-family: sans-serif;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
}

/* 网格布局 */
.realtime-traffic-grid {
  display: grid;
  grid-template-columns: 80px 80px 80px 1fr;
  gap: 8px;
  margin-bottom: 6px;
  grid-auto-rows: 74px;
  flex-shrink: 0; /* 固定高度，不收缩 */
}

.realtime-traffic-dashboard.three-panel-mode .realtime-traffic-grid {
  grid-auto-rows: 58px;
  margin-bottom: 4px;
}

/* 统计卡片 */
.realtime-traffic-stat-card {
  border: 1px solid #003a8c;
  background-color: #001b3a;
  padding: 6px 8px;
  text-align: center;
  box-shadow: inset 0 0 15px rgba(0, 58, 140, 0.3);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.realtime-traffic-dashboard.three-panel-mode .realtime-traffic-stat-card {
  padding: 4px 6px;
}

.realtime-traffic-stat-card:hover {
  filter: brightness(1.2);
  cursor: pointer;
}

.realtime-traffic-stat-card.active {
  border-color: rgba(248, 113, 113, 0.8);
  background-color: rgba(120, 28, 28, 0.45);
  box-shadow: inset 0 0 18px rgba(248, 113, 113, 0.35);
}

.realtime-traffic-stat-card.active.slow-active {
  border-color: rgba(251, 146, 60, 0.8);
  background-color: rgba(124, 45, 18, 0.45);
  box-shadow: inset 0 0 18px rgba(251, 146, 60, 0.35);
}

/* 图标容器 */
.realtime-traffic-icon-wrapper {
  margin-bottom: 2px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图标样式 */
.realtime-traffic-icon {
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* 畅通图标 */
.realtime-traffic-icon.smooth {
  background-image: url(/src/assets/icon-smooth@2x.png);
}

/* 拥堵图标 */
.realtime-traffic-icon.jammed {
  background-image: url(/src/assets/jamed@2x.png);
}

/* 缓行图标 */
.realtime-traffic-icon.slow-moving {
  background-image: url(/src/assets/slow-moving@2x.png);
}

/* 状态文本 */
.realtime-traffic-status {
  font-size: 8px;
  margin-bottom: 2px;
}

/* 数值文本 */
.realtime-traffic-value {
  font-size: 12px;
  font-weight: bold;
}

.realtime-traffic-stat-card:nth-child(1) .realtime-traffic-status {
  color: #4ade80;
}

/* 拥堵状态 */
.realtime-traffic-stat-card:nth-child(2) .realtime-traffic-status {
  color: #f87171;
}

/* 缓行状态 */

.realtime-traffic-stat-card:nth-child(3) .realtime-traffic-status {
  color: #fb923c;
}

/* 图表容器 */
.realtime-traffic-chart-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0px 5px;
  background: radial-gradient(
    circle at 35% 40%,
    rgba(0, 58, 140, 0.2) 0%,
    transparent 70%
  );
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 图表 */
.realtime-traffic-chart {
  width: 100%;
  height: 96px;
  min-height: 96px;
  transform: translateY(-6px);
}

.realtime-traffic-dashboard.three-panel-mode .realtime-traffic-chart {
  height: 70px;
  min-height: 70px;
  transform: translateY(-4px);
}

/* 图表标签 */
.realtime-traffic-chart-label {
  font-size: 9px;
  color: #60a5fa;
  text-align: left;
  width: 100%;
  margin-left: 30px;
  padding-bottom: 10px;
  position: relative;
  bottom: 35px;
}

/* 表格容器：参考 SectionVehicle 的 qd-table-section */
.realtime-traffic-table-container {
  /* background-color: #001b3a; */
  border: 1px solid #003a8c;
  background: rgba(0, 27, 58, 0.6);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 表格滚动区域包装：参考 qd-table-wrapper */
.realtime-traffic-table-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.realtime-traffic-table-wrapper.is-empty {
  height: auto;
}

/* 表头表格 */
.realtime-traffic-table-header,
.realtime-traffic-table-body {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

/* 定义每一列的宽度（百分比相加需为100%） */
.section-name-cell {
  width: 22%;
}

.type-cell {
  width: 10%;
  text-align: center;
}

.mileage-cell {
  width: 13%;
  text-align: center;
}

.speed-cell {
  width: 13%;
  text-align: center;
}

.flow-cell {
  width: 12%;
  text-align: center;
}

.time-cell {
  width: 16%;
  text-align: center;
}

.action-cell {
  width: 14%;
  text-align: center;
}

/* 表体滚动容器 */
.realtime-traffic-table-body-wrapper {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  min-height: 0;
  scrollbar-gutter: stable;
}

.realtime-traffic-table-body-wrapper.is-empty {
  flex: 0 0 auto;
  overflow-y: hidden;
}

/* 默认状态下的表体高度 */
.realtime-traffic-table-body-wrapper {
  flex: 1; /* 填充剩余空间 */
  min-height: 0; /* 确保flex子元素能够正确收缩 */
}

/* 展开状态下表体高度 */
.realtime-traffic-dashboard.expanded .realtime-traffic-table-body-wrapper {
  flex: 1; /* 填充剩余空间 */
}

/* 其他组件隐藏时的表体高度 */
.realtime-traffic-table-body-wrapper .other-hidden {
  flex: 1; /* 填充剩余空间 */
}

/* 处理表格行的过渡效果 */
.realtime-traffic-table-row {
  transition: all 0.3s ease;
  display: table-row;
  width: 100%;
}

/* 表头 */
.realtime-traffic-table-container th {
  background-color: #003a8c;
  color: #93c5fd;
  padding: 6px 10px;
  font-weight: medium;
  white-space: nowrap;
  text-align: center;
  font-size: 11px;
}

.realtime-traffic-dashboard.three-panel-mode
  .realtime-traffic-table-container
  th {
  padding: 4px 8px;
}

/* 表格单元格 */
.realtime-traffic-table-container td {
  box-sizing: border-box;
  padding: 8px 10px;
  border-bottom: 1px solid #003a8c;
  font-size: 11px;
  vertical-align: middle;
  cursor: default;
}

.realtime-traffic-dashboard.three-panel-mode
  .realtime-traffic-table-container
  td {
  padding: 5px 8px;
}

/* 处理区段名称的换行展示 */
.realtime-traffic-table-container td.section-name-cell {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
  height: auto;
  padding: 8px 10px;
  overflow: visible;
  text-overflow: clip;
}

.realtime-traffic-dashboard.three-panel-mode
  .realtime-traffic-table-container
  td.section-name-cell {
  padding: 5px 8px;
}

.realtime-traffic-table-container td.mileage-cell {
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
  overflow: hidden;
}

.realtime-traffic-table-container th .threshold-label,
.realtime-traffic-table-container td .threshold-value {
  display: block;
  color: #60a5fa;
  line-height: 1.35;
}

.realtime-traffic-table-container th .threshold-label {
  font-weight: normal;
}

.realtime-traffic-table-container td.time-cell {
  opacity: 0.7;
}

/* 表格行 */
.realtime-traffic-table-row {
  transition: all 0.3s ease;
}

.realtime-traffic-table-row:hover {
  background-color: #002766;
}

.realtime-traffic-no-data-row {
  display: table-row;
  width: 100%;
  height: 104px;
}

.realtime-traffic-table-body td.realtime-traffic-no-data-cell {
  width: 100%;
  display: table-cell !important;
  text-align: center;
  vertical-align: middle;
  color: rgba(255, 255, 255, 0.65);
  font-size: 16px !important;
  font-weight: 500;
  line-height: 1.4;
  height: 104px;
  padding: 0 !important;
  border-bottom: none !important;
}

.realtime-traffic-table-row.is-highlighted {
  background: linear-gradient(
    90deg,
    rgba(251, 146, 60, 0.32) 0%,
    rgba(124, 45, 18, 0.42) 100%
  );
  box-shadow: inset 3px 0 0 #fb923c;
}

.realtime-traffic-table-row.is-highlighted td {
  color: #fff2e8;
  font-weight: 600;
}

/* 详情按钮 */
.realtime-traffic-detail-btn {
  font-size: 12px;
  color: #22d3ee;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.realtime-traffic-detail-btn:hover {
  color: #67e8f9;
}

/* 加载蒙层 */
.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 21, 41, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999;
  border-radius: 4px;
}

/* 旋转器 */
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(34, 211, 238, 0.2);
  border-top: 3px solid #22d3ee;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 12px;
  font-size: 13px;
  color: #22d3ee;
  letter-spacing: 1px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 优化滚动条样式 */
.realtime-traffic-table-body-wrapper::-webkit-scrollbar {
  width: 6px;
}

.realtime-traffic-table-body-wrapper::-webkit-scrollbar-thumb {
  background: #003a8c;
  border-radius: 3px;
}

.realtime-traffic-table-body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
</style>
