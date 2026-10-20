<template>
  <div class="fee-detail-page">
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

    <div class="table-wrap">
      <div class="table-scroll">
        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="3">序号</th>
              <th rowspan="3">日期</th>
              <th rowspan="3">名称（站所）</th>
              <th colspan="4">车流量（辆）</th>
              <th colspan="5">通行费收入</th>
            </tr>
            <tr>
              <th rowspan="2">入口</th>
              <th colspan="3">出口车辆</th>
              <th rowspan="2">总收入</th>
              <th colspan="4">其中省内收入</th>
            </tr>
            <tr>
              <th>客车</th>
              <th>货车</th>
              <th>小计</th>
              <th>客车</th>
              <th>货车</th>
              <th>专车</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in pagedRows"
              :key="`${row.stationName || 'row'}-${index}`"
            >
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ formatCell(row.shiftdate) }}</td>
              <td>{{ formatCell(row.stationName) }}</td>
              <td>{{ formatCell(row.entry) }}</td>
              <td>{{ formatCell(row.exitPassenger) }}</td>
              <td>{{ formatCell(row.exitFreight) }}</td>
              <td>{{ formatCell(row.exitSubtotal) }}</td>
              <td>{{ formatCell(row.totalIncome) }}</td>
              <td>{{ formatCell(row.provincePassenger) }}</td>
              <td>{{ formatCell(row.provinceFreight) }}</td>
              <td>{{ formatCell(row.provinceSpecial) }}</td>
              <td>{{ formatCell(row.provinceSubtotal) }}</td>
            </tr>
            <tr v-if="!pagedRows.length">
              <td colspan="12">暂无数据</td>
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
        <span class="page-info"
          >第 {{ currentPage }} / {{ totalPages }} 页</span
        >
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
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
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
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const isLoading = ref(false);
const tableRows = ref([]);

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const formatShiftdate = (value) => {
  const text = String(value || '').trim();
  if (!text) return '--';
  if (text.includes(' ')) return text.split(' ')[0];
  return text.slice(0, 10) || text;
};

const normalizeRows = (response) => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && Array.isArray(response.rows)) return response.rows;
  if (response && response.data && Array.isArray(response.data.rows)) {
    return response.data.rows;
  }
  return [];
};

const toViewRows = (list) =>
  list.map((item) => ({
    shiftdate: formatShiftdate(item.shiftdate),
    stationName: item.nodename,
    entry: item.en_cnt,
    exitPassenger: item.carcnt,
    exitFreight: item.alltrunckcnt,
    exitSubtotal: item.ex_cnt,
    totalIncome: item.pay,
    provincePassenger: item.carpay_p,
    provinceFreight: item.trunkpay_p,
    provinceSpecial: item.specialpay_p,
    provinceSubtotal: item.pay_p,
  }));

const totalPages = computed(() =>
  Math.max(1, Math.ceil(tableRows.value.length / pageSize.value))
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableRows.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});

const fetchDetailTollData = async () => {
  isLoading.value = true;
  try {
    const response = await http.get(API_URLS.putian_highway.getDetailTollData, {
      nowTime: `${selectedDate.value} 00:00:00`,
    });
    tableRows.value = toViewRows(normalizeRows(response));
    currentPage.value = 1;
  } catch (error) {
    console.error('获取收费明细报表数据失败:', error);
    tableRows.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchDetailTollData();
};

onMounted(() => {
  fetchDetailTollData();
});
</script>

<style lang="less" scoped>
.fee-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  gap: 8px;
}

.date-label {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.btn {
  width: 86px;
  height: 42px;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
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

.table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #d8d8d8;
  background: #f8f8f8;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.report-table th,
.report-table td {
  border: 1px solid #d5d5d5;
  text-align: center;
  color: #555;
  padding: 10px 6px;
}

.report-table th {
  background: #ececec;
  font-size: 14px;
  font-weight: 600;
}

.report-table td {
  font-size: 14px;
  background: #f7f7f7;
}

.table-pagination {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 14px;
  border-top: 1px solid #d8d8d8;
  background: #f8f8f8;
}

.page-btn {
  min-width: 68px;
  height: 30px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0 10px;
  box-sizing: border-box;
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
  height: 30px;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  margin: 0;
  white-space: nowrap;
}

.page-size-control {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.page-size-select {
  width: 66px;
  height: 30px;
  border: 1px solid #c8c8c8;
  background: #fff;
  color: #444;
  font-size: 14px;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
}
</style>
