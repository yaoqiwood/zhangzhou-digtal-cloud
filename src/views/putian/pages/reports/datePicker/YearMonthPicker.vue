<template>
  <div ref="monthPickerRef" class="month-picker-wrap">
    <button class="month-picker-trigger" @click="toggleMonthCard">
      <span>{{ selectedMonthText }}</span>
      <span class="picker-arrow" :class="{ open: showMonthCard }">▾</span>
    </button>
    <div v-if="showMonthCard" class="month-picker-card">
      <div class="month-picker-head">
        <button class="year-nav-btn" @click="pickerYear = pickerYear - 1">‹</button>
        <span class="picker-year-text">{{ pickerYear }}年</span>
        <button class="year-nav-btn" @click="pickerYear = pickerYear + 1">›</button>
      </div>
      <div class="month-grid">
        <button
          v-for="month in monthOptions"
          :key="month"
          class="month-item"
          :class="{ active: isMonthActive(month) }"
          @click="selectMonth(month)"
        >
          {{ month }}月
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

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const monthPickerRef = ref(null);
const showMonthCard = ref(false);

const parsedYearMonth = computed(() => {
  const [yearPart, monthPart] = String(props.modelValue || '').split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const now = new Date();
  return {
    year: Number.isFinite(year) && year > 0 ? year : now.getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : 1,
  };
});

const currentYear = computed(() => parsedYearMonth.value.year);
const currentMonthNumber = computed(() => parsedYearMonth.value.month);
const pickerYear = ref(currentYear.value);

const selectedMonthText = computed(
  () => `${currentYear.value}年${currentMonthNumber.value}月`
);

const isMonthActive = (month) => {
  return pickerYear.value === currentYear.value && month === currentMonthNumber.value;
};

const selectMonth = (month) => {
  const monthValue = String(month).padStart(2, '0');
  emit('update:modelValue', `${pickerYear.value}-${monthValue}`);
  showMonthCard.value = false;
};

const toggleMonthCard = () => {
  pickerYear.value = currentYear.value;
  showMonthCard.value = !showMonthCard.value;
};

const handleDocumentClick = (event) => {
  if (
    monthPickerRef.value &&
    !monthPickerRef.value.contains(event.target)
  ) {
    showMonthCard.value = false;
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
.month-picker-wrap {
  position: relative;
  z-index: 40;
}

.month-picker-trigger {
  min-width: 132px;
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

.month-picker-card {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 2000;
  width: 196px;
  box-sizing: border-box;
  border: 1px solid rgba(102, 163, 255, 0.66);
  background: linear-gradient(180deg, rgba(10, 33, 82, 0.98) 0%, rgba(7, 24, 60, 0.99) 100%);
  box-shadow: inset 0 0 0 1px rgba(132, 187, 255, 0.16), 0 12px 28px rgba(2, 8, 28, 0.58);
  border-radius: 8px;
  padding: 10px;
  overflow: hidden;
}

.month-picker-trigger:hover,
.month-picker-trigger:focus,
.month-picker-trigger:focus-visible,
.month-picker-trigger:active {
  border-color: rgba(151, 200, 255, 0.75);
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(174, 214, 255, 0.2), 0 0 12px rgba(65, 142, 255, 0.34);
}

.month-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.picker-year-text {
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
  transition: none;
}

.year-nav-btn:hover,
.year-nav-btn:focus,
.year-nav-btn:focus-visible,
.year-nav-btn:active {
  border-color: rgba(147, 201, 255, 0.74);
  outline: none;
  box-shadow: 0 0 8px rgba(67, 138, 246, 0.32);
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.month-item {
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
  white-space: nowrap;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  box-shadow: none;
  transition: none;
}

.month-item.active {
  border-color: rgba(145, 206, 255, 0.9);
  background: linear-gradient(180deg, rgba(64, 135, 255, 0.52) 0%, rgba(38, 104, 226, 0.58) 100%);
  color: #f4f9ff;
  font-weight: 600;
}

.month-item:hover,
.month-item:focus,
.month-item:focus-visible,
.month-item:active {
  outline: none;
  box-shadow: none;
}
</style>
