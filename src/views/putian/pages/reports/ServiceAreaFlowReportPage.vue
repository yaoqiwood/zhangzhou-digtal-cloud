<template>
  <div class="service-area-flow-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <label class="field-label">日期:</label>
        <YearMonthDayPicker v-model="selectedDate" />

        <button class="btn query-btn" :disabled="isLoading" @click="handleQuery">
          查询
        </button>
        <button class="btn download-btn" @click="handleDownload">下载</button>
      </div>
    </div>

    <div class="table-wrap">
      <table class="report-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>服务区</th>
            <th>时间</th>
            <th>入区流量</th>
            <th>出区流量</th>
            <th>合计流量</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in pagedRows"
            :key="`${row.nodename || 'row'}-${index}`"
          >
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ formatCell(row.nodename) }}</td>
            <td>{{ formatShiftdate(row.shiftdate) }}</td>
            <td>{{ formatCell(row.en_cnt) }}</td>
            <td>{{ formatCell(row.ex_cnt) }}</td>
            <td>{{ formatCell(row.cnt) }}</td>
          </tr>
          <tr v-if="!pagedRows.length">
            <td colspan="6">暂无数据</td>
          </tr>
        </tbody>
      </table>
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

const displayRows = computed(() => tableRows.value);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(displayRows.value.length / pageSize.value))
);
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return displayRows.value.slice(start, start + pageSize.value);
});
watch(pageSize, () => {
  currentPage.value = 1;
});
watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value;
});

const fetchServiceAreaSimpleFlow = async () => {
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getServiceAreaSimpleFlow,
      {
        nowTime: `${selectedDate.value} 00:00:00`,
        shiftdate: selectedDate.value,
      }
    );
    tableRows.value = normalizeRows(response);
    currentPage.value = 1;
  } catch (error) {
    console.error('获取服务区流量简表失败:', error);
    tableRows.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = async () => {
  await fetchServiceAreaSimpleFlow();
};

const handleDownload = () => {
  // 保留下载按钮交互位，后续接真实导出逻辑。
};

onMounted(() => {
  fetchServiceAreaSimpleFlow();
});
</script>

<style lang="less" scoped>
.service-area-flow-page {
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

.field-label {
  color: #fff;
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
  border: 1px solid #d9d9d9;
  background: #fff;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  color: #555;
  font-size: 14px;
}

.report-table th,
.report-table td {
  border: 1px solid #e5e5e5;
  text-align: center;
  padding: 12px 8px;
}

.report-table th {
  background: #f5f5f5;
  color: #666;
  font-weight: 600;
}

.table-pagination {
  margin-top: auto;
  padding: 10px 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.page-btn {
  min-width: 72px;
  height: 30px;
  border: 1px solid #d0d0d0;
  background: #fff;
  color: #555;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.page-btn:disabled {
  color: #aaa;
  cursor: not-allowed;
  background: #f5f5f5;
}

.page-info {
  color: #666;
  font-size: 13px;
}

.page-size-control {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 13px;
  white-space: nowrap;
}

.page-size-select {
  width: 72px;
  height: 30px;
  border: 1px solid #d0d0d0;
  background: #fff;
  color: #555;
  font-size: 13px;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
}
</style>
