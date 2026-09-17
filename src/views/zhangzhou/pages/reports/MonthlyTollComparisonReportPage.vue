<template>
  <div class="daily-billing-page">
    <div class="toolbar">
      <div class="toolbar-title">月征费比较表 </div>
      <div class="toolbar-actions">
        <YearMonthPicker v-model="selectedMonth" />
        <button class="btn query-btn" :disabled="isLoading" @click="handleQuery">
          查询
        </button>
        <button class="btn download-btn" :disabled="!tableRows.length" @click="downloadReport">
          下载
        </button>
      </div>
    </div> 

    <div class="content-scroll">
      <div class="table-wrap">
        <div ref="tableScrollRef" class="table-scroll">
          <table class="report-table">
            <thead>
              <tr>
                <th
                  v-for="group in reportColumnGroups"
                  :key="group.label"
                  :colspan="group.columns.length"
                >
                  {{ group.label }}
                </th>
              </tr>
              <tr>
                <th v-for="column in reportColumns" :key="column.key">
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in pagedRows"
                :key="`${row.belongOrg || 'org'}-${row.station || index}`"
              >
                <td v-for="column in reportColumns" :key="column.key">
                  {{ formatColumnValue(row, column) }}
                </td>
              </tr>
              <tr v-if="isNoData" class="no-data-row">
                <td :colspan="reportColumns.length">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-pagination">
          <label class="page-size-control">
            <span>每页最多</span>
            <select v-model.number="pageSize" class="page-size-select">
              <option
                v-for="option in pageSizeOptions"
                :key="option"
                :value="option"
              >
                {{ option }} 条
              </option>
            </select>
          </label>
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage = currentPage - 1"
          >
            上一页
          </button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button
            class="page-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage = currentPage + 1"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <VxeTable
      ref="exportTableRef"
      v-show="false"
      :data="tableRows"
      :export-config="{ enabled: true }"
    >
      <VxeColgroup
        v-for="group in reportColumnGroups"
        :key="group.label"
        :title="group.label"
      >
        <VxeColumn
          v-for="column in group.columns"
          :key="column.key"
          :field="column.key"
          :title="column.label"
          :export-method="({ row }) => formatColumnValue(row, column)"
        />
      </VxeColgroup>
    </VxeTable>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { VxeColgroup, VxeColumn, VxeTable, VxeUI } from 'vxe-table';
import VxeUIPluginExportXLSX from '@vxe-ui/plugin-export-xlsx';
import ExcelJS from 'exceljs';
import http from '@/utils/http';
import { API_URLS } from '@/utils/apiUrls';
import YearMonthPicker from './datePicker/YearMonthPicker.vue';

VxeUI.use(VxeUIPluginExportXLSX, { ExcelJS });

const getDefaultMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const selectedMonth = ref(getDefaultMonth());
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const isLoading = ref(false);
const tableRows = ref([]);
const tableScrollRef = ref(null);
const exportTableRef = ref(null);

const AUTO_SCROLL_SPEED = 20;
let autoScrollFrameId = null;
let previousFrameTime = null;
let scrollDirection = 1;
let tableResizeObserver = null;

const percentKeys = new Set([
  'momDaily', 'yoyDaily', 'yoyYtdToll', 'cargoRatio', 'etcCargoRatio',
  'tpayCargoRatio', 'momCargoPerVeh', 'passengerRatio', 'etcPassengerRatio',
  'tpayPassengerRatio', 'momPassengerPerVeh', 'cashRatio', 'epayRatio',
  'tpayRatio', 'greenExmpRatio', 'actualRate', 'momDailyTraffic',
  'yoyDailyTraffic', 'yoyYtdTraffic', 'exitCargoRatio', 'lmExitCargoRatio',
  'momExitCargoRatio', 'exitPassengerRatio', 'lmExitPassengerRatio',
  'momExitPassengerRatio', 'entryETCRate', 'exitETCRate', 'nonCashRate',
  'greenVehRatio',
]);
const countKeys = new Set([
  'traffic', 'ytdTraffic', 'dailyTraffic', 'lmDailyTraffic', 'lyDailyTraffic',
  'lyYtdTraffic', 'entryTraffic', 'ytdEntryTraffic', 'exitTraffic',
  'ytdExitTraffic', 'tollVeh', 'ytdTollVeh', 'exmpVeh', 'ytdExmpVeh',
  'holExmpVeh', 'ytdHolExmpVeh', 'exitTollCargo', 'exitFreeCargo',
  'exitCargo', 'ytdExitCargo', 'exitTollPassenger', 'exitFreePassenger',
  'exitPassenger', 'ytdExitPassenger', 'entryETC', 'exitEpay', 'etcTotal',
  'exitETCLane', 'ytdExitETCLane', 'cashPayVeh', 'greenVeh', 'ytdGreenVeh',
  'dailyGreenVeh',
]);
const makeColumns = (columns) => columns.map(([key, label]) => ({
  key,
  label,
  type: key === 'station' ? 'text' : percentKeys.has(key) ? 'percent' : countKeys.has(key) ? 'count' : 'money',
}));

// 2025.12 以后原表 A:CY 的主报表字段。重复站名和元/万元、辆/万辆次换算列不展示。
const reportColumnGroups = [
  {
    label: '收费收入',
    columns: makeColumns([
      ['station', '站名'], ['nationalIncome', '全国收入（元）'], ['provincialIncome', '省内车道收入（元）'],
      ['refundInterest', '退补款、溢款、利息（元）'], ['tollIncome', '通行费收入（元）'], ['cashPay', '现金支付（元）'],
      ['ytdCashPay', '本年累计现金支付（元）'], ['epay', '电子支付（元）'], ['ytdEpay', '本年累计电子支付（元）'],
      ['tpay', '第三方支付（元）'], ['ytdTpay', '本年累计第三方支付（元）'], ['dailyAvg', '省内日均（元）'],
      ['lmDailyAvg', '上月日均收入（元）'], ['momDaily', '与上月日均比（%）'], ['lyDailyAvg', '上年同期日均（元）'],
      ['yoyDaily', '与上年同期日均比（%）'], ['ytdToll', '本年累计（元）'], ['excessShortfall', '超额/缺口（元）'],
      ['lyYtdToll', '上年同期累计收入（元）'], ['yoyYtdToll', '与上年同期累计比（%）'], ['actualRate', '实征率（%）'],
    ]),
  },
  {
    label: '车型收入',
    columns: makeColumns([
      ['cargoIncome', '省内货专收入（元）'], ['ytdCargoIncome', '年累计省内货专收入（元）'], ['cargoRatio', '货车收入占比（%）'],
      ['etcCargoIncome', 'ETC货专收入（元）'], ['etcCargoRatio', 'ETC货专收入占比（%）'], ['tpayCargoIncome', '第三方支付货专收入（元）'],
      ['tpayCargoRatio', '第三方支付货专占货专比（%）'], ['cargoPerVeh', '货专单车收费额（元）'], ['lmCargoPerVeh', '上月货专单车收费额（元）'],
      ['momCargoPerVeh', '与上月货专单车比（%）'], ['passengerIncome', '省内客车收入（元）'], ['ytdPassengerIncome', '年累计省内客车收入（元）'],
      ['passengerRatio', '客车收入占比（%）'], ['etcPassengerIncome', 'ETC客车收入（元）'], ['etcPassengerRatio', 'ETC客车收入占客车比（%）'],
      ['tpayPassengerIncome', '第三方支付客车收入（元）'], ['tpayPassengerRatio', '第三方支付客车占客车比（%）'],
      ['passengerPerVeh', '客车单车收费额（元）'], ['lmPassengerPerVeh', '上月客车单车收费额（元）'], ['momPassengerPerVeh', '与上月客车单车比（%）'],
    ]),
  },
  {
    label: '支付与免征',
    columns: makeColumns([
      ['cashRatio', '现金收入占比（%）'], ['epayRatio', '电子收入占比（%）'], ['tpayRatio', '第三方收入占比（%）'],
      ['greenExmpAmt', '绿通车免征金额（元）'], ['ytdGreenExmp', '本年累计绿通车（元）'], ['greenExmpRatio', '绿通免费额占比（%）'],
      ['exmpAmt', '本月免征车金额（元）'], ['ytdExmpAmt', '本年累计免征车金额（元）'],
    ]),
  },
  {
    label: '车流量',
    columns: makeColumns([
      ['traffic', '本月车流量（辆）'], ['ytdTraffic', '本年累计车流量（辆）'], ['dailyTraffic', '日均车流量（辆）'],
      ['lmDailyTraffic', '上月日均车流量（辆）'], ['momDailyTraffic', '与上月日均比（%）'], ['lyDailyTraffic', '上年同期日均（辆）'],
      ['yoyDailyTraffic', '与上年同期比（%）'], ['lyYtdTraffic', '上年同期累计（辆）'], ['yoyYtdTraffic', '与上年同期累计比（%）'],
    ]),
  },
  {
    label: '进出与车型',
    columns: makeColumns([
      ['entryTraffic', '本月入口车流（辆）'], ['ytdEntryTraffic', '本年累计入口车流（辆）'], ['exitTraffic', '本月出口车流（辆）'],
      ['ytdExitTraffic', '本年累计出口车流（辆）'], ['tollVeh', '本月收费车（辆）'], ['ytdTollVeh', '本年累计收费车（辆）'],
      ['exmpVeh', '本月免征车（辆）'], ['ytdExmpVeh', '本年累计免征车（辆）'], ['holExmpVeh', '节假日免征车（辆）'],
      ['ytdHolExmpVeh', '本年累计节假日免征车（辆）'], ['exitTollCargo', '本月出口收费货专（辆）'],
      ['exitFreeCargo', '本月出口免费货专（辆）'], ['exitCargo', '本月出口货专（辆）'], ['ytdExitCargo', '本年累计出口货专（辆）'],
      ['exitCargoRatio', '出口货车占比（%）'], ['lmExitCargoRatio', '上月出口货专占比（%）'], ['momExitCargoRatio', '出口货专占比增减（%）'],
      ['exitTollPassenger', '本月出口收费客车（辆）'], ['exitFreePassenger', '本月出口免费客车（辆）'],
      ['exitPassenger', '本月出口客车（辆）'], ['ytdExitPassenger', '本年累计出口客车（辆）'],
      ['exitPassengerRatio', '出口客车占比（%）'], ['lmExitPassengerRatio', '上月出口客车占比（%）'], ['momExitPassengerRatio', '出口客车占比增减（%）'],
    ]),
  },
  {
    label: 'ETC与绿通',
    columns: makeColumns([
      ['entryETC', '本月入口ETC车次（辆）'], ['exitEpay', '本月出口电子支付车次（辆）'], ['etcTotal', '本月出入口ETC通行车次合计'],
      ['entryETCRate', '入口ETC使用率（%）'], ['exitETCLane', '本月出口ETC车道车次（辆）'], ['ytdExitETCLane', '本年累计出口ETC车道车次（辆）'],
      ['exitETCRate', '出口ETC使用率（%）'], ['cashPayVeh', '现金支付车次（辆）'], ['nonCashRate', '非现金支付率（%）'],
      ['greenVeh', '本月绿通车次（辆）'], ['ytdGreenVeh', '本年累计绿通车次（辆）'], ['dailyGreenVeh', '本月日均绿通车次（辆）'],
      ['greenVehRatio', '绿通车占比（%）'],
    ]),
  },
];
const reportColumns = reportColumnGroups.flatMap((group) => group.columns);

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return String(value).trim() || '--';
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(/[,\s%]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const formatAmount = (value) => {
  const number = toFiniteNumber(value);
  return number !== null
    ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    : '--';
};

const formatPercent = (value) => {
  const number = toFiniteNumber(value);
  return number !== null ? `${number.toFixed(2)}%` : '--';
};

const formatCount = (value) => {
  const number = toFiniteNumber(value);
  return number !== null
    ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    : '--';
};

const formatColumnValue = (row, column) => {
  const value = row[column.key];
  if (column.type === 'text') return formatCell(value);
  if (column.type === 'percent') return formatPercent(value);
  if (column.type === 'count') return formatCount(value);
  return formatAmount(value);
};

const buildQueryRange = (monthValue) => {
  const [year, month] = String(monthValue || '').split('-');
  if (!year || !month) return null;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  return {
    startTime: `${year}-${month}-01 00:00:00`,
    stopTime: `${year}-${month}-${String(lastDay).padStart(2, '0')} 23:59:59`,
    belongOrg: '1591',
  };
};

const normalizeRows = (response) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && Array.isArray(response.rows)) return response.rows;
  return [];
};

const totalPages = computed(
  () => Math.max(1, Math.ceil(tableRows.value.length / pageSize.value))
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableRows.value.slice(start, start + pageSize.value);
});
const isNoData = computed(() => tableRows.value.length === 0);

watch(pageSize, () => {
  currentPage.value = 1;
});

const stopAutoScroll = () => {
  if (autoScrollFrameId !== null) {
    cancelAnimationFrame(autoScrollFrameId);
    autoScrollFrameId = null;
  }
  previousFrameTime = null;
};

const runAutoScroll = (timestamp) => {
  const container = tableScrollRef.value;
  if (!container || document.hidden) {
    stopAutoScroll();
    return;
  }

  const maxScrollLeft = container.scrollWidth - container.clientWidth;
  if (maxScrollLeft <= 0) {
    stopAutoScroll();
    return;
  }

  if (previousFrameTime !== null) {
    const elapsedSeconds = (timestamp - previousFrameTime) / 1000;
    const nextScrollLeft = container.scrollLeft + scrollDirection * AUTO_SCROLL_SPEED * elapsedSeconds;

    if (nextScrollLeft >= maxScrollLeft) {
      container.scrollLeft = maxScrollLeft;
      scrollDirection = -1;
    } else if (nextScrollLeft <= 0) {
      container.scrollLeft = 0;
      scrollDirection = 1;
    } else {
      container.scrollLeft = nextScrollLeft;
    }
  }

  previousFrameTime = timestamp;
  autoScrollFrameId = requestAnimationFrame(runAutoScroll);
};

const startAutoScroll = () => {
  stopAutoScroll();
  const container = tableScrollRef.value;
  if (!container || document.hidden || container.scrollWidth <= container.clientWidth) return;
  autoScrollFrameId = requestAnimationFrame(runAutoScroll);
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopAutoScroll();
  } else {
    startAutoScroll();
  }
};

const fetchReportData = async () => {
  const queryRange = buildQueryRange(selectedMonth.value);
  if (!queryRange) {
    tableRows.value = [];
    return;
  }
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getReportData,
      queryRange
    );
    tableRows.value = normalizeRows(response);
    currentPage.value = 1;
    await nextTick();
    startAutoScroll();
  } catch (error) {
    console.error('获取月征费比较表数据失败:', error);
    tableRows.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchReportData();
};

const downloadReport = async () => {
  if (!exportTableRef.value) return;
  await exportTableRef.value.exportData({
    type: 'xlsx',
    filename: `${selectedMonth.value}-月征费比较表`,
    sheetName: '月征费比较表',
    data: tableRows.value,
    isHeader: true,
    isColgroup: true,
    isTitle: true,
    useStyle: true,
    message: false,
  });
};

onMounted(() => {
  tableResizeObserver = new ResizeObserver(startAutoScroll);
  tableResizeObserver.observe(tableScrollRef.value);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  fetchReportData();
});

onBeforeUnmount(() => {
  stopAutoScroll();
  tableResizeObserver?.disconnect();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style lang="less" scoped>
.daily-billing-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.toolbar {
  position: relative;
  z-index: 10;
  min-height: 56px;
  border: 1px solid rgba(71, 129, 231, 0.65);
  background: linear-gradient(180deg, rgba(9, 34, 81, 0.94) 0%, rgba(8, 27, 65, 0.96) 100%);
  box-shadow: 0 0 8px rgba(41, 116, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  border-radius: 8px;
  overflow: visible;
}

.toolbar::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(89, 148, 255, 0) 0%, rgba(89, 148, 255, 0.95) 50%, rgba(89, 148, 255, 0) 100%);
}

.toolbar-title {
  color: #f4f8ff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-shadow: 0 0 8px rgba(129, 187, 255, 0.35);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  order: -1;
  color: #dce9ff;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.chart-toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.chart-toggle-slider {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: #93a7cb;
  position: relative;
  transition: background-color 0.2s ease;
}

.chart-toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.chart-toggle-input:checked + .chart-toggle-slider {
  background: #3e90ff;
}

.chart-toggle-input:checked + .chart-toggle-slider::after {
  transform: translateX(18px);
}

.chart-toggle-text {
  line-height: 1;
}

.btn {
  width: 54px;
  height: 42px;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.query-btn {
  border: 1px solid rgba(133, 183, 255, 0.65);
  background: linear-gradient(180deg, #285cb8 0%, #234fa1 100%);
  box-shadow: 0 0 6px rgba(65, 132, 255, 0.15);
}

.download-btn {
  border: 1px solid rgba(133, 183, 255, 0.65);
  background: linear-gradient(180deg, #2d64c5 0%, #2456ae 100%);
  box-shadow: 0 0 6px rgba(65, 132, 255, 0.15);
}

.content-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-wrap {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
  overflow: hidden !important;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: auto;
}

.report-table {
  --sticky-top: 0px;
  --header-row-2-top: 48px;
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.report-table th,
.report-table td {
  border-right: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  font-size: 13px;
  min-width: 112px;
  padding: 12px 6px;
  box-sizing: border-box;
}

.report-table th:first-child,
.report-table td:first-child {
  border-left: 1px solid #d6d6d6;
}

.report-table thead tr:first-child th {
  border-top: 1px solid #d6d6d6;
}

.report-table th {
  background: #efefef;
  font-size: 16px;
  font-weight: 600;
}

.report-table thead th {
  position: sticky;
  background: #efefef;
  background-clip: padding-box;
}

.report-table thead tr:nth-child(1) th {
  top: var(--sticky-top);
  z-index: 6;
}

.report-table thead tr:nth-child(2) th {
  top: calc(var(--header-row-2-top) + var(--sticky-top));
  z-index: 5;
}

.report-table td {
  font-size: 14px;
}

.no-data-row td {
  color: #888;
}

.summary-row td {
  background: #f3f4f6;
  color: #1f3347;
  font-weight: 600;
}

.table-pagination {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 14px;
  border-top: 1px solid #d8d8d8;
}

.page-btn {
  min-width: 68px;
  height: 32px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:disabled {
  color: #999;
  background: #f2f2f2;
  border-color: #dddddd;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.page-size-control {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.page-size-select {
  width: 72px;
  height: 32px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  font-size: 14px;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
}

.chart-wrap {
  position: relative;
  border: 1px solid rgba(71, 129, 231, 0.72);
  background: linear-gradient(180deg, rgba(8, 36, 88, 0.95) 0%, rgba(5, 25, 69, 0.97) 100%);
  box-shadow: inset 0 0 0 1px rgba(114, 175, 255, 0.22), 0 0 24px rgba(25, 87, 211, 0.28);
  border-radius: 10px;
  padding: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-wrap::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(130, 181, 255, 0) 0%, rgba(130, 181, 255, 0.95) 50%, rgba(130, 181, 255, 0) 100%);
  box-shadow: 0 0 14px rgba(130, 181, 255, 0.65);
}

.chart-title {
  position: relative;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #f2f7ff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(128, 184, 255, 0.32);
  border-bottom: 1px solid rgba(74, 133, 234, 0.35);
  background: linear-gradient(90deg, rgba(18, 53, 116, 0.86) 0%, rgba(18, 53, 116, 0.2) 72%, rgba(18, 53, 116, 0) 100%);
}

.chart-title::after {
  content: '';
  position: absolute;
  left: 16px;
  bottom: -1px;
  width: 280px;
  height: 2px;
  background: linear-gradient(90deg, rgba(144, 197, 255, 0.95) 0%, rgba(144, 197, 255, 0) 100%);
  box-shadow: 0 0 10px rgba(132, 187, 255, 0.5);
}

.trend-chart {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 320px;
  background:
    radial-gradient(circle at 50% 32%, rgba(55, 117, 255, 0.16) 0%, rgba(55, 117, 255, 0) 55%),
    linear-gradient(180deg, rgba(24, 62, 128, 0.18) 0%, rgba(7, 33, 87, 0) 100%);
}
</style>
