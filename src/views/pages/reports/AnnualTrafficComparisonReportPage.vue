<template>
  <div class="annual-traffic-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <div ref="yearPickerRef" class="picker">
          <button class="select-control trigger" @click="togglePicker('year')">
            <span>{{ selectedYear }}年</span>
            <span class="picker-arrow" :class="{ open: openPicker === 'year' }"
              >▾</span
            >
          </button>
          <div v-if="openPicker === 'year'" class="year-card">
            <button
              v-for="year in yearOptions"
              :key="year"
              class="year-item"
              :class="{ active: selectedYear === year }"
              @click="selectYear(year)"
            >
              {{ year }}
            </button>
          </div>
        </div>

        <div ref="holidayPickerRef" class="picker">
          <button
            class="select-control trigger holiday-trigger"
            @click="togglePicker('holiday')"
          >
            <span>{{ selectedHoliday }}</span>
            <span
              class="picker-arrow"
              :class="{ open: openPicker === 'holiday' }"
              >▾</span
            >
          </button>
          <div v-if="openPicker === 'holiday'" class="holiday-card">
            <button
              v-for="holiday in holidayOptions"
              :key="holiday"
              class="holiday-item"
              :class="{ active: selectedHoliday === holiday }"
              @click="selectHoliday(holiday)"
            >
              {{ holiday }}
            </button>
          </div>
        </div>

        <button class="btn query-btn" :disabled="isLoading" @click="handleQuery">
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
              <th rowspan="2">年份</th>
              <th rowspan="2">具体时间</th>
              <th rowspan="2">类型</th>
              <th rowspan="2">入口车次</th>
              <th colspan="3">出口车次</th>
              <th rowspan="2">出入口总车次</th>
              <th rowspan="2">免征车（一类客车）</th>
            </tr>
            <tr>
              <th>客车</th>
              <th>货专车</th>
              <th>总车次</th>
            </tr>
          </thead>
          <tbody v-for="section in pagedSections" :key="section.key">
              <tr>
                <template v-if="section.type === 'year'">
                  <td rowspan="2">{{ section.year }}年</td>
                  <td rowspan="2">
                    {{ section.range }}<br />({{ section.daysText }})
                  </td>
                </template>
                <td v-else colspan="2" rowspan="2">{{ section.compareTitle }}</td>
                <td>{{ section.rows[0].label }}</td>
                <td>{{ section.rows[0].entry }}</td>
                <td>{{ section.rows[0].passenger }}</td>
                <td>{{ section.rows[0].freight }}</td>
                <td>{{ section.rows[0].totalExit }}</td>
                <td>{{ section.rows[0].total }}</td>
                <td>{{ section.rows[0].free }}</td>
              </tr>
              <tr>
                <td>{{ section.rows[1].label }}</td>
                <td>{{ section.rows[1].entry }}</td>
                <td>{{ section.rows[1].passenger }}</td>
                <td>{{ section.rows[1].freight }}</td>
                <td>{{ section.rows[1].totalExit }}</td>
                <td>{{ section.rows[1].total }}</td>
                <td>{{ section.rows[1].free }}</td>
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
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import http from '@/utils/http';
import { API_URLS } from '@/utils/apiUrls';

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const selectedHoliday = ref('国庆');
const yearOptions = Array.from({ length: 131 }, (_, i) => 1970 + i).reverse();
const holidayOptions = ['春节', '清明节', '劳动节', '中秋', '国庆'];

const openPicker = ref('');
const yearPickerRef = ref(null);
const holidayPickerRef = ref(null);
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const isLoading = ref(false);

const createEmptyRow = (label) => ({
  label,
  entry: '--',
  passenger: '--',
  freight: '--',
  totalExit: '--',
  total: '--',
  free: '--',
  _entryNum: 0,
  _passengerNum: 0,
  _freightNum: 0,
  _totalExitNum: 0,
  _totalNum: 0,
  _freeNum: 0,
});

const createEmptyYearSection = (year) => ({
  year,
  range: '--',
  daysText: '--',
  rows: [createEmptyRow('合计'), createEmptyRow('日均')],
});

const currentYearSection = ref(createEmptyYearSection(selectedYear.value));
const previousYearSection = ref(createEmptyYearSection(selectedYear.value - 1));

const togglePicker = (type) => {
  openPicker.value = openPicker.value === type ? '' : type;
};

const selectYear = (year) => {
  selectedYear.value = year;
  openPicker.value = '';
};

const selectHoliday = (holiday) => {
  selectedHoliday.value = holiday;
  openPicker.value = '';
};

const normalizeHolidayName = (holiday) => {
  const source = String(holiday || '');
  if (source === '劳动节') {
    return '五一';
  }
  if (source === '清明节' || source === '端午节') {
    return source.replace('节', '');
  }
  return source;
};

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const text = String(value).replace(/,/g, '').trim();
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
};

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const percent = (newValue, oldValue) => {
  if (!Number.isFinite(oldValue) || oldValue === 0) return '--';
  if (!Number.isFinite(newValue)) return '--';
  const ratio = ((newValue - oldValue) / oldValue) * 100;
  return `${ratio.toFixed(2)}%`;
};

const calcRangeDays = (timeField) => {
  const text = String(timeField || '').trim();
  if (!text.includes('~')) return 0;
  const [start, end] = text.split('~').map((item) => item.trim());
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const days = Math.floor((endDate - startDate) / (24 * 3600 * 1000)) + 1;
  return days > 0 ? days : 0;
};

const calcDaysText = (timeField) => {
  const days = calcRangeDays(timeField);
  return days > 0 ? `${days}天` : '--';
};

const normalizeType = (type) => String(type || '').replace(/\s/g, '');

const normalizeApiRow = (item, forcedLabel = '') => ({
  label: forcedLabel || formatCell(item.c_type),
  entry: formatCell(item.en_cnt_sum),
  passenger: formatCell(item.carcnt_sum),
  freight: formatCell(item.alltrunkcnt_sum),
  totalExit: formatCell(item.ex_cnt_sum),
  total: formatCell(item.cnt),
  free: formatCell(item.ex_cnt_free_sum),
  timeField: formatCell(item.time_field),
  _entryNum: toNumber(item.en_cnt_sum),
  _passengerNum: toNumber(item.carcnt_sum),
  _freightNum: toNumber(item.alltrunkcnt_sum),
  _totalExitNum: toNumber(item.ex_cnt_sum),
  _totalNum: toNumber(item.cnt),
  _freeNum: toNumber(item.ex_cnt_free_sum),
});

const normalizeYearRows = (response) => {
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

  const normalized = list.map((item) => {
    const cType = normalizeType(item.c_type);
    const label = cType.includes('日均')
      ? '日均'
      : cType.includes('合计')
        ? '合计'
        : formatCell(item.c_type);
    return normalizeApiRow(item, label);
  });

  const totalRow =
    normalized.find((item) => item.label === '合计') ||
    (normalized[0]
      ? { ...normalized[0], label: '合计' }
      : createEmptyRow('合计'));

  let dailyRow = normalized.find((item) => item.label === '日均');
  if (!dailyRow) {
    const days = calcRangeDays(totalRow.timeField);
    const divisor = days > 0 ? days : 1;
    dailyRow = {
      ...totalRow,
      label: '日均',
      entry: String(Math.round(totalRow._entryNum / divisor)),
      passenger: String(Math.round(totalRow._passengerNum / divisor)),
      freight: String(Math.round(totalRow._freightNum / divisor)),
      totalExit: String(Math.round(totalRow._totalExitNum / divisor)),
      total: String(Math.round(totalRow._totalNum / divisor)),
      free: String(Math.round(totalRow._freeNum / divisor)),
      _entryNum: totalRow._entryNum / divisor,
      _passengerNum: totalRow._passengerNum / divisor,
      _freightNum: totalRow._freightNum / divisor,
      _totalExitNum: totalRow._totalExitNum / divisor,
      _totalNum: totalRow._totalNum / divisor,
      _freeNum: totalRow._freeNum / divisor,
    };
  }

  return [totalRow, dailyRow];
};

const fetchYearSection = async (year) => {
  const response = await http.get(
    API_URLS.putian_highway.getHolidayTollYearlyComparison,
    {
      year,
      holidayName: normalizeHolidayName(selectedHoliday.value),
    }
  );
  const rows = normalizeYearRows(response);
  const range = rows.find((item) => item.timeField && item.timeField !== '--')?.timeField || '--';
  return {
    year,
    range,
    daysText: calcDaysText(range),
    rows,
  };
};

const fetchTableData = async () => {
  const baseYear = selectedYear.value;
  const compareYear = baseYear - 1;
  isLoading.value = true;
  try {
    const [currentData, previousData] = await Promise.all([
      fetchYearSection(baseYear),
      fetchYearSection(compareYear),
    ]);
    currentYearSection.value = currentData;
    previousYearSection.value = previousData;
    currentPage.value = 1;
  } catch (error) {
    console.error('获取年度对比数据失败:', error);
    currentYearSection.value = createEmptyYearSection(baseYear);
    previousYearSection.value = createEmptyYearSection(compareYear);
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchTableData();
};

const compareRows = computed(() => {
  const currentMap = new Map(
    currentYearSection.value.rows.map((row) => [row.label, row])
  );
  const previousMap = new Map(
    previousYearSection.value.rows.map((row) => [row.label, row])
  );
  return ['合计', '日均'].map((label) => {
    const currentRow = currentMap.get(label) || createEmptyRow(label);
    const previousRow = previousMap.get(label) || createEmptyRow(label);
    return {
      label,
      entry: percent(currentRow._entryNum, previousRow._entryNum),
      passenger: percent(currentRow._passengerNum, previousRow._passengerNum),
      freight: percent(currentRow._freightNum, previousRow._freightNum),
      totalExit: percent(currentRow._totalExitNum, previousRow._totalExitNum),
      total: percent(currentRow._totalNum, previousRow._totalNum),
      free: percent(currentRow._freeNum, previousRow._freeNum),
    };
  });
});

const handleDocumentClick = (event) => {
  const inYear = yearPickerRef.value?.contains(event.target);
  const inHoliday = holidayPickerRef.value?.contains(event.target);
  if (!inYear && !inHoliday) openPicker.value = '';
};

const scrollToActive = async () => {
  await nextTick();
  if (openPicker.value === 'year') {
    yearPickerRef.value
      ?.querySelector('.year-item.active')
      ?.scrollIntoView({ block: 'center' });
  }
};

watch(openPicker, (v) => {
  if (v === 'year') scrollToActive();
});

const tableSections = computed(() => [
  {
    key: `current-${selectedYear.value}`,
    type: 'year',
    year: selectedYear.value,
    range: currentYearSection.value.range,
    daysText: currentYearSection.value.daysText,
    rows: currentYearSection.value.rows,
  },
  {
    key: `previous-${selectedYear.value - 1}`,
    type: 'year',
    year: selectedYear.value - 1,
    range: previousYearSection.value.range,
    daysText: previousYearSection.value.daysText,
    rows: previousYearSection.value.rows,
  },
  {
    key: `compare-${selectedYear.value}-${selectedYear.value - 1}`,
    type: 'compare',
    compareTitle: `${selectedYear.value}年与${selectedYear.value - 1}年同比`,
    rows: compareRows.value,
  },
]);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(tableSections.value.length / pageSize.value))
);
const pagedSections = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableSections.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  fetchTableData();
});

onBeforeUnmount(() =>
  document.removeEventListener('click', handleDocumentClick)
);
</script>

<style lang="less" scoped>
.annual-traffic-page {
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

.picker {
  position: relative;
}

.select-control {
  height: 42px;
  border: 1px solid rgba(121, 176, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(21, 56, 122, 0.92) 0%, rgba(16, 45, 99, 0.94) 100%);
  color: #e4efff;
  font-size: 14px;
  font-weight: 600;
  padding: 0 10px;
  box-shadow: inset 0 0 0 1px rgba(156, 203, 255, 0.16), 0 0 10px rgba(61, 128, 236, 0.28);
}

.trigger {
  width: 132px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 30px 0 10px;
  cursor: pointer;
  text-align: center;
}

.holiday-trigger {
  width: 132px;
  text-align: center;
}

.trigger > span:first-child {
  width: 100%;
  text-align: center;
}

.picker-arrow {
  font-size: 28px;
  color: #d8e9ff;
  transform: translateY(-2px);
  transition: color 0.2s ease;
}

.picker-arrow.open {
  color: #8bc2ff;
}

.year-card,
.holiday-card {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 120px;
  padding: 8px;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  z-index: 2000;
  display: grid;
  gap: 6px;
}

.year-card {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 220px;
  height: 220px;
  padding: 10px;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  overflow-y: auto;
  z-index: 2000;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #3e90ff rgba(20, 45, 92, 0.65);
}

.year-card::-webkit-scrollbar {
  width: 8px;
}

.year-card::-webkit-scrollbar-track {
  background: rgba(20, 45, 92, 0.65);
  border-radius: 6px;
}

.year-card::-webkit-scrollbar-thumb {
  background: #3e90ff;
  border-radius: 6px;
}

.holiday-card {
  width: 120px;
  padding: 8px;
  display: grid;
  gap: 6px;
}

.year-item,
.holiday-item {
  height: 32px;
  border: 1px solid rgba(104, 162, 246, 0.44);
  background: linear-gradient(180deg, rgba(20, 49, 105, 0.9) 0%, rgba(13, 36, 79, 0.95) 100%);
  color: #d2e6ff;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.year-item.active,
.holiday-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
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
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  overflow: hidden;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.report-table th,
.report-table td {
  border: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  font-size: 14px;
  padding: 10px 6px;
}

.report-table th {
  background: #efefef;
  font-size: 16px;
  font-weight: 600;
}

.report-table thead th {
  position: sticky;
  background: #efefef;
}

.report-table thead tr:nth-child(1) th {
  top: 0;
  z-index: 5;
}

.report-table thead tr:nth-child(2) th {
  top: 48px;
  z-index: 4;
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
</style>
