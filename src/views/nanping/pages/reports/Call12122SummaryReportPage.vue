<template>
  <div class="call-summary-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <label class="month-label" for="summaryMonth">月份:</label>
        <input
          id="summaryMonth"
          v-model="selectedMonth"
          type="month"
          class="month-select"
        />
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
            <th rowspan="2" class="first-col">话务总量</th>
            <th colspan="2">{{ monthTitle }}</th>
            <th>同比</th>
            <th>日均环比</th>
          </tr>
          <tr>
            <th>总量</th>
            <th>日均</th>
            <th>当月比去年同期增减</th>
            <th>当月比上月同期增减</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.total }}</td>
            <td>{{ row.dailyAvg }}</td>
            <td>{{ row.yoy }}</td>
            <td>{{ row.mom }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const selectedMonth = ref('2026-01');
const isLoading = ref(false);

const tableRows = [
  { name: '12122接听量', total: '', dailyAvg: '', yoy: '', mom: '' },
  { name: '系统拨出量', total: '', dailyAvg: '', yoy: '', mom: '' },
  { name: '12122接拨量', total: '', dailyAvg: '', yoy: '', mom: '' },
];

const monthTitle = computed(() => {
  const [year, month] = selectedMonth.value.split('-');
  if (!year || !month) return 'xxxx年xx月';
  return `${year}年${Number(month)}月`;
});

const handleQuery = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
  } finally {
    isLoading.value = false;
  }
};

const handleDownload = () => {};
</script>

<style lang="less" scoped>
.call-summary-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
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

.month-label {
  font-size: 14px;
  color: #dce9ff;
  line-height: 1;
}

.month-select {
  width: 130px;
  height: 42px;
  border: 1px solid rgba(121, 176, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(21, 56, 122, 0.92) 0%, rgba(16, 45, 99, 0.94) 100%);
  color: #e4efff;
  font-size: 14px;
  padding: 0 10px;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(156, 203, 255, 0.16), 0 0 10px rgba(61, 128, 236, 0.28);
}

.month-select::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.7;
}

.btn {
  min-width: 82px;
  height: 42px;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  padding: 0 14px;
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
  margin-top: 12px;
  border: 1px solid #cfd3d9;
  background: #f2f3f5;
  overflow: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.report-table th,
.report-table td {
  border: 1px solid #c7cbd0;
  text-align: center;
  color: #5a616c;
  font-size: 14px;
  padding: 10px 8px;
  line-height: 1.2;
}

.report-table th {
  background: #eceef1;
  font-weight: 600;
}

.report-table .first-col {
  width: 12%;
}

.report-table td {
  height: 40px;
  background: #f3f4f6;
}

@media (max-width: 1600px) {
  .month-select,
  .btn {
    height: 38px;
  }
}
</style>
