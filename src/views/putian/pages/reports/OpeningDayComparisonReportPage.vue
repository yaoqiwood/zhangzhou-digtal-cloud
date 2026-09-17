<template>
  <div class="opening-day-page">
    <div class="toolbar">
      <div class="toolbar-title">数据列表</div>
      <div class="toolbar-actions">
        <div ref="yearPickerRef" class="year-picker">
          <button class="select-control year-trigger" @click="toggleYearCard">
            <span>{{ selectedYear }}年</span>
            <span class="picker-arrow" :class="{ open: showYearCard }">▾</span>
          </button>
          <div v-if="showYearCard" class="year-card">
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

        <div ref="holidayPickerRef" class="holiday-picker">
          <button
            class="select-control holiday-trigger"
            @click="toggleHolidayCard"
          >
            <span>{{ selectedHoliday }}</span>
            <span class="picker-arrow" :class="{ open: showHolidayCard }"
              >▾</span
            >
          </button>
          <div v-if="showHolidayCard" class="holiday-card">
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
        <table ref="reportTableRef" class="report-table">
          <thead>
            <tr ref="headerRow1Ref">
              <th rowspan="3">收费站名称</th>
              <th colspan="3">({{ previousYear }}) 年流量</th>
              <th colspan="3">{{ selectedYear }}年流量</th>
            </tr>
            <tr ref="headerRow2Ref">
              <th>节前一天</th>
              <th>假期首日</th>
              <th rowspan="2">环比增长</th>
              <th>节前一天</th>
              <th>假期首日</th>
              <th rowspan="2">环比增长</th>
            </tr>
            <tr>
              <th>{{ previousYearDateLabels.prevDay }}</th>
              <th>{{ previousYearDateLabels.firstDay }}</th>
              <th>{{ currentYearDateLabels.prevDay }}</th>
              <th>{{ currentYearDateLabels.firstDay }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in pagedRows" :key="`${row.stationName}-${idx}`">
              <td>{{ row.stationName }}</td>
              <td>{{ row.prevDayBefore }}</td>
              <td>{{ row.prevOpeningDay }}</td>
              <td>{{ row.prevMom }}</td>
              <td>{{ row.currDayBefore }}</td>
              <td>{{ row.currOpeningDay }}</td>
              <td>{{ row.currMom }}</td>
            </tr>
            <tr v-if="!pagedRows.length">
              <td colspan="7">暂无数据</td>
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import http from '@/utils/http';
import { API_URLS } from '@/utils/apiUrls';

const selectedYear = ref(new Date().getFullYear());
const selectedHoliday = ref('国庆');

const previousYear = computed(() => Number(selectedYear.value) - 1);
const yearOptions = Array.from({ length: 131 }, (_, i) => 1970 + i).reverse();
const holidayOptions = ['春节', '清明', '五一', '国庆'];
const showYearCard = ref(false);
const showHolidayCard = ref(false);
const yearPickerRef = ref(null);
const holidayPickerRef = ref(null);
const springFestivalCache = new Map();

const reportTableRef = ref(null);
const headerRow1Ref = ref(null);
const headerRow2Ref = ref(null);
let tableResizeObserver = null;
const currentPage = ref(1);
const pageSizeOptions = [50, 75, 100];
const pageSize = ref(pageSizeOptions[0]);
const tableRows = ref([]);
const isLoading = ref(false);

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

const toggleYearCard = () => {
  showHolidayCard.value = false;
  showYearCard.value = !showYearCard.value;
};

const selectYear = (year) => {
  selectedYear.value = year;
  showYearCard.value = false;
};

const toggleHolidayCard = () => {
  showYearCard.value = false;
  showHolidayCard.value = !showHolidayCard.value;
};

const selectHoliday = (holiday) => {
  selectedHoliday.value = holiday;
  showHolidayCard.value = false;
};

const normalizeHolidayName = (holiday) => {
  const source = String(holiday || '');
  if (source === '清明节' || source === '劳动节' || source === '端午节') {
    return source.replace('节', '');
  }
  return source;
};

const getSpringFestivalStartDate = (year) => {
  if (springFestivalCache.has(year)) {
    return new Date(springFestivalCache.get(year));
  }
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const start = new Date(year, 0, 1);
    const end = new Date(year, 2, 15);
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const lunar = formatter.format(date);
      if (lunar.includes(`${year}年正月1`)) {
        const result = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        springFestivalCache.set(year, result.getTime());
        return result;
      }
    }
  } catch (error) {
    console.warn('春节日期计算失败，使用默认日期', error);
  }
  const fallback = new Date(year, 0, 28);
  springFestivalCache.set(year, fallback.getTime());
  return fallback;
};

const getQingmingDate = (year) => {
  const y = year % 100;
  const day = Math.floor(y * 0.2422 + 4.81) - Math.floor(y / 4);
  return new Date(year, 3, day);
};

const getHolidayStartDate = (year, holidayName) => {
  if (holidayName === '国庆') return new Date(year, 9, 1);
  if (holidayName === '五一') return new Date(year, 4, 1);
  if (holidayName === '清明') return getQingmingDate(year);
  if (holidayName === '春节') return getSpringFestivalStartDate(year);
  return new Date(year, 0, 1);
};

const formatMonthDay = (date) => `${date.getMonth() + 1}.${date.getDate()}`;

const buildDateLabels = (year, holidayName) => {
  const firstDayDate = getHolidayStartDate(year, holidayName);
  const prevDayDate = new Date(firstDayDate);
  prevDayDate.setDate(firstDayDate.getDate() - 1);
  return {
    prevDay: formatMonthDay(prevDayDate),
    firstDay: formatMonthDay(firstDayDate),
  };
};

const previousYearDateLabels = computed(() =>
  buildDateLabels(previousYear.value, selectedHoliday.value)
);
const currentYearDateLabels = computed(() =>
  buildDateLabels(Number(selectedYear.value), selectedHoliday.value)
);

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '--';
  return value;
};

const normalizeRows = (response) => {
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

  return list.map((item) => ({
    stationName: formatCell(item.stationname),
    prevDayBefore: formatCell(item.last_year_last_day_cnt),
    prevOpeningDay: formatCell(item.last_year_this_day_cnt),
    prevMom: formatCell(item.percantage_ly),
    currDayBefore: formatCell(item.last_day_cnt),
    currOpeningDay: formatCell(item.this_day_cnt),
    currMom: formatCell(item.percantage),
  }));
};

const fetchHolidayStationDayComparison = async () => {
  isLoading.value = true;
  try {
    const response = await http.get(
      API_URLS.putian_highway.getHolidayStationDayComparison,
      {
        year: selectedYear.value,
        holidayName: normalizeHolidayName(selectedHoliday.value),
      }
    );
    tableRows.value = normalizeRows(response);
    currentPage.value = 1;
  } catch (error) {
    console.error('获取节前节首日对比数据失败:', error);
    tableRows.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleQuery = () => {
  fetchHolidayStationDayComparison();
};

const handleDocumentClick = (event) => {
  if (yearPickerRef.value && !yearPickerRef.value.contains(event.target)) {
    showYearCard.value = false;
  }
  if (
    holidayPickerRef.value &&
    !holidayPickerRef.value.contains(event.target)
  ) {
    showHolidayCard.value = false;
  }
};

const syncStickyHeaderOffsets = () => {
  if (!reportTableRef.value || !headerRow1Ref.value || !headerRow2Ref.value)
    return;
  const row1Height = headerRow1Ref.value.offsetHeight || 0;
  const row2Height = headerRow2Ref.value.offsetHeight || 0;
  reportTableRef.value.style.setProperty(
    '--header-row-2-top',
    `${row1Height}px`
  );
  reportTableRef.value.style.setProperty(
    '--header-row-3-top',
    `${row1Height + row2Height}px`
  );
};

onMounted(async () => {
  await nextTick();
  syncStickyHeaderOffsets();
  await fetchHolidayStationDayComparison();
  document.addEventListener('click', handleDocumentClick);
  if (typeof ResizeObserver !== 'undefined' && reportTableRef.value) {
    tableResizeObserver = new ResizeObserver(() => {
      syncStickyHeaderOffsets();
    });
    tableResizeObserver.observe(reportTableRef.value);
  }
  window.addEventListener('resize', syncStickyHeaderOffsets);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', syncStickyHeaderOffsets);
  tableResizeObserver?.disconnect();
  tableResizeObserver = null;
});

watch(showYearCard, async (visible) => {
  if (!visible) return;
  await nextTick();
  const selectedBtn = yearPickerRef.value?.querySelector('.year-item.active');
  selectedBtn?.scrollIntoView({ block: 'center' });
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});
</script>

<style scoped lang="less">
.opening-day-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-width: 0;
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

.year-picker {
  position: relative;
}

.year-trigger {
  width: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
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

.year-item {
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
  text-align: center;
}

.year-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
}

.holiday-picker {
  position: relative;
}

.holiday-trigger {
  width: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

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

.holiday-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
}

.btn {
  width: 74px;
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
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #d8d8d8;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.report-table {
  --header-row-2-top: 44px;
  --header-row-3-top: 88px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.report-table th,
.report-table td {
  border-right: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  text-align: center;
  color: #555;
  font-size: 14px;
  padding: 10px 8px;
  box-sizing: border-box;
  white-space: normal;
  word-break: break-word;
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
  font-weight: 600;
}

.report-table thead th {
  position: sticky;
  background: #efefef;
  background-clip: padding-box;
  line-height: 1.35;
}

.report-table thead tr:nth-child(1) th {
  top: 0;
  z-index: 6;
}

.report-table thead tr:nth-child(2) th {
  top: var(--header-row-2-top);
  z-index: 5;
}

.report-table thead tr:nth-child(3) th {
  top: var(--header-row-3-top);
  z-index: 4;
}

.report-table td {
  background: #f7f7f7;
  height: 56px;
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
