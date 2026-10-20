<template>
  <div class="station-flow-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <label class="date-label">日期:</label>
        <YearMonthDayPicker v-model="selectedDate" />
        <button
          class="btn query-btn"
          :disabled="isLoading"
          @click="handleQuery"
        >
          查询
        </button>
        <button class="btn download-btn">下载</button>
      </div>
    </div>

    <div class="content-scroll">
      <div class="table-wrap">
        <table ref="reportTableRef" class="report-table">
          <thead>
            <tr ref="headerRow1Ref">
              <th rowspan="2">序号</th>
              <th rowspan="2">时间</th>
              <th rowspan="2">单位</th>
              <th colspan="3">车流量（辆）</th>
              <th rowspan="2">省内通行费收入（万元）</th>
            </tr>
            <tr>
              <th>入口</th>
              <th>出口</th>
              <th>合计</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in tableRows"
              :key="`${row.unit_name}-${rowIndex}`"
              :class="{ 'summary-row': isSummaryRow(row) }"
            >
              <td>{{ rowIndex + 1 }}</td>
              <template v-if="isSummaryRow(row)">
                <td colspan="2">{{ formatCell(row.unit_name) }}</td>
              </template>
              <template v-else>
                <td>{{ formatCell(row.shiftdate) }}</td>
                <td>{{ formatCell(row.unit_name) }}</td>
              </template>
              <td>{{ formatCell(row.encnt) }}</td>
              <td>{{ formatCell(row.excnt) }}</td>
              <td>{{ formatCell(row.cnt) }}</td>
              <td>{{ formatCell(row.pay_p) }}</td>
            </tr>
            <tr v-if="!tableRows.length">
              <td colspan="7">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import http from '@/utils/http';
import { API_URLS } from '@/utils/apiUrls';
import YearMonthDayPicker from './datePicker/YearMonthDayPicker.vue';

const getTodayText = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const selectedDate = ref(getTodayText());
const reportTableRef = ref(null);
const headerRow1Ref = ref(null);
const isLoading = ref(false);
const tableRows = ref([]);
let tableResizeObserver = null;

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const isSummaryRow = (row) => String(row?.unit_name || '').includes('本日合计');

const normalizeRows = (response) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && Array.isArray(response.rows)) return response.rows;
  if (response && response.data && Array.isArray(response.data.rows)) {
    return response.data.rows;
  }
  return [];
};

const fetchStationRoadSimpleFlow = async () => {
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getStationRoadSimpleFlow,
      {
        nowTime: selectedDate.value,
      }
    );
    tableRows.value = normalizeRows(response);
  } catch (error) {
    console.error('获取收费站路段流量简表失败:', error);
    tableRows.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchStationRoadSimpleFlow();
};

const syncStickyHeaderOffsets = () => {
  if (!reportTableRef.value || !headerRow1Ref.value) return;
  const row1Height = headerRow1Ref.value.offsetHeight || 0;
  reportTableRef.value.style.setProperty(
    '--header-row-2-top',
    `${row1Height}px`
  );
};

onMounted(async () => {
  await nextTick();
  syncStickyHeaderOffsets();
  await fetchStationRoadSimpleFlow();
  if (typeof ResizeObserver !== 'undefined' && reportTableRef.value) {
    tableResizeObserver = new ResizeObserver(() => {
      syncStickyHeaderOffsets();
    });
    tableResizeObserver.observe(reportTableRef.value);
  }
  window.addEventListener('resize', syncStickyHeaderOffsets);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncStickyHeaderOffsets);
  tableResizeObserver?.disconnect();
  tableResizeObserver = null;
});
</script>

<style lang="less" scoped>
.station-flow-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.toolbar {
  position: relative;
  z-index: 3;
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

.date-label {
  color: #fff;
  //font-size: 26px;
  font-weight: 400;
}

.btn {
  width: 90px;
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
  overflow-y: auto;
}

.table-wrap {
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
}

.report-table {
  --sticky-top: 1px;
  --header-row-2-top: 48px;
  width: 100%;
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
  padding: 14px 6px;
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

.summary-row td {
  background: #f3f4f6;
  color: #1f3347;
  font-weight: 600;
}
</style>
