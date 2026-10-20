<template>
  <div ref="datePickerRef" class="date-picker-wrap">
    <button class="date-picker-trigger" @click="toggleDateCard">
      <span>{{ selectedDateText }}</span>
      <span class="picker-arrow" :class="{ open: showDateCard }">▾</span>
    </button>
    <div v-if="showDateCard" class="date-picker-card">
      <div class="date-picker-head">
        <button class="year-nav-btn" @click="changeYear(-1)">‹</button>
        <span class="picker-year-text">{{ pickerYear }}年</span>
        <button class="year-nav-btn" @click="changeYear(1)">›</button>
      </div>
      <div class="date-picker-head month-head">
        <button class="year-nav-btn" @click="changeMonth(-1)">‹</button>
        <span class="picker-month-text">{{ pickerMonth }}月</span>
        <button class="year-nav-btn" @click="changeMonth(1)">›</button>
      </div>
      <div class="weekday-row">
        <span v-for="week in weekLabels" :key="week" class="weekday-item">
          {{ week }}
        </span>
      </div>
      <div class="day-grid">
        <button
          v-for="day in dayCells"
          :key="day.key"
          class="day-item"
          :class="{
            active: isDayActive(day),
            'is-other-month': day.type !== 'current',
          }"
          @click="selectDay(day)"
        >
          {{ day.day }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
const datePickerRef = ref(null);
const showDateCard = ref(false);

const pad2 = (value) => String(value).padStart(2, '0');
const formatDate = (year, month, day) =>
  `${year}-${pad2(month)}-${pad2(day)}`;

const parsedDate = computed(() => {
  const [yearPart, monthPart, dayPart] = String(props.modelValue || '').split(
    '-'
  );
  const now = new Date();
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  return {
    year: Number.isFinite(year) && year > 0 ? year : now.getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1,
    day: Number.isFinite(day) && day >= 1 && day <= 31 ? day : now.getDate(),
  };
});

const currentYear = computed(() => parsedDate.value.year);
const currentMonth = computed(() => parsedDate.value.month);
const currentDay = computed(() => parsedDate.value.day);

const pickerYear = ref(currentYear.value);
const pickerMonth = ref(currentMonth.value);

const selectedDateText = computed(
  () => `${currentYear.value}年${currentMonth.value}月${currentDay.value}日`
);

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const dayCells = computed(() => {
  const daysInCurrentMonth = getDaysInMonth(pickerYear.value, pickerMonth.value);
  const startWeekday = new Date(pickerYear.value, pickerMonth.value - 1, 1).getDay();
  const prevMonthYear = pickerMonth.value === 1 ? pickerYear.value - 1 : pickerYear.value;
  const prevMonth = pickerMonth.value === 1 ? 12 : pickerMonth.value - 1;
  const prevMonthDays = getDaysInMonth(prevMonthYear, prevMonth);

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    if (index < startWeekday) {
      const day = prevMonthDays - startWeekday + index + 1;
      cells.push({
        key: `prev-${prevMonthYear}-${prevMonth}-${day}`,
        type: 'prev',
        day,
        dateValue: formatDate(prevMonthYear, prevMonth, day),
      });
      continue;
    }

    const dayIndex = index - startWeekday + 1;
    if (dayIndex <= daysInCurrentMonth) {
      cells.push({
        key: `current-${pickerYear.value}-${pickerMonth.value}-${dayIndex}`,
        type: 'current',
        day: dayIndex,
        dateValue: formatDate(pickerYear.value, pickerMonth.value, dayIndex),
      });
      continue;
    }

    const nextMonthYear = pickerMonth.value === 12 ? pickerYear.value + 1 : pickerYear.value;
    const nextMonth = pickerMonth.value === 12 ? 1 : pickerMonth.value + 1;
    const day = dayIndex - daysInCurrentMonth;
    cells.push({
      key: `next-${nextMonthYear}-${nextMonth}-${day}`,
      type: 'next',
      day,
      dateValue: formatDate(nextMonthYear, nextMonth, day),
    });
  }
  return cells;
});

const isDayActive = (dayCell) => {
  return dayCell.dateValue === formatDate(currentYear.value, currentMonth.value, currentDay.value);
};

const selectDay = (dayCell) => {
  emit('update:modelValue', dayCell.dateValue);
  showDateCard.value = false;
};

const changeYear = (step) => {
  pickerYear.value += step;
};

const changeMonth = (step) => {
  let year = pickerYear.value;
  let month = pickerMonth.value + step;
  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }
  pickerYear.value = year;
  pickerMonth.value = month;
};

const toggleDateCard = () => {
  pickerYear.value = currentYear.value;
  pickerMonth.value = currentMonth.value;
  showDateCard.value = !showDateCard.value;
};

const handleDocumentClick = (event) => {
  if (datePickerRef.value && !datePickerRef.value.contains(event.target)) {
    showDateCard.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<style lang="less" scoped>
.date-picker-wrap {
  position: relative;
  z-index: 40;
}

.date-picker-trigger {
  min-width: 160px;
  height: 42px;
  border: 1px solid rgba(121, 176, 255, 0.62);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(21, 56, 122, 0.92) 0%, rgba(16, 45, 99, 0.94) 100%);
  color: #e4efff;
  font-size: 14px;
  font-weight: 600;
  padding: 0 10px 0 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  user-select: none;
  -webkit-user-select: none;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(156, 203, 255, 0.16), 0 0 10px rgba(61, 128, 236, 0.28);
  transition: none;
  overflow: hidden;
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

.date-picker-card {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 2000;
  width: 260px;
  box-sizing: border-box;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  padding: 10px;
  overflow: hidden;
}

.date-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.month-head {
  margin-bottom: 10px;
}

.picker-year-text,
.picker-month-text {
  font-size: 14px;
  font-weight: 600;
  color: #d6e8ff;
}

.year-nav-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(112, 171, 255, 0.56);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(25, 58, 122, 0.94) 0%, rgba(17, 45, 97, 0.96) 100%);
  color: #deedff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  user-select: none;
  -webkit-user-select: none;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  box-shadow: none;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 6px;
  width: 100%;
  box-sizing: border-box;
  gap: 6px;
}

.weekday-item {
  text-align: center;
  color: #b9d3f7;
  font-size: 12px;
  line-height: 1;
  padding: 4px 0;
  min-width: 0;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
}

.day-item {
  height: 30px;
  width: 100%;
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
  border: 1px solid rgba(104, 162, 246, 0.44);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(20, 49, 105, 0.9) 0%, rgba(13, 36, 79, 0.95) 100%);
  color: #d2e6ff;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  box-shadow: none;
}

.day-item.is-other-month {
  color: #7f96bd;
}

.day-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
  font-weight: 600;
}
</style>
