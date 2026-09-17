<template>
  <div class="variable-message-sign-popup">
    <div class="mp-content">
      <div class="mpc-box">
        <div class="mp-content_header_flex">
          <div class="mpch_title">{{ popupTitle }}</div>
          <div class="mpch_close_btn" @click="onClose">X</div>
        </div>
        <div class="mp-content_sec_title">
          <span>{{ routeInfo }}</span>
        </div>
        <div class="mp-content_detail" v-if="false">
          <div class="variable-message-sign-grid">
            <div
              v-for="item in infoRows"
              :key="item.label"
              class="variable-message-sign-row"
            >
              <span class="variable-message-sign-label">{{ item.label }}</span>
              <span class="variable-message-sign-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'VariableMessageSignPopup',
});

const props = defineProps({
  title: { type: String, default: '情报板' },
  data: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['close']);

const formatValue = (value) => {
  const text = String(value ?? '').trim();
  return text || '-';
};

const popupTitle = computed(() => {
  const data = props.data || {};
  return (
    data.name ||
    data.alias ||
    data.board_name ||
    data.boardName ||
    data.vms_name ||
    data.vmsName ||
    `${props.title || '情报板'}详情`
  );
});

const routeInfo = computed(() => {
  const data = props.data || {};
  const route = data.route_no || data.road_no || data.routeName || '';
  const pile = data.pile_no || data.pileNo || data.stake_no || '';
  if (route && pile) return `${route} ${pile}`;
  return route || pile || '情报板点位';
});

const infoRows = computed(() => {
  const data = props.data || {};
  return [
    {
      label: '点位名称',
      value: formatValue(popupTitle.value),
    },
    {
      label: '路线编号',
      value: formatValue(data.route_no || data.road_no || data.routeName),
    },
    {
      label: '桩号',
      value: formatValue(data.pile_no || data.pileNo || data.stake_no),
    },
    {
      label: '方向',
      value: formatValue(data.direction || data.roadway || data.orientation),
    },
    {
      label: '编号',
      value: formatValue(data.fid || data.id || data.code),
    },
    {
      label: '所属机构',
      value: formatValue(data.org_name || data.dept_name || data.city),
    },
  ];
});

const onClose = () => {
  emit('close');
};
</script>

<style scoped lang="less">
.variable-message-sign-popup {
  width: 420px;
  height: auto;
  color: #ffffff;
  font-size: 12px;
  box-sizing: border-box;
}

.mp-content {
  width: 100%;
  height: auto;
  background: #06245a;
  border: 1px solid #1a428a;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
}

.mpc-box {
  padding: 22px 28px 26px;
  box-sizing: border-box;
}

.mp-content_header_flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  gap: 18px;
}

.mpch_title {
  min-width: 0;
  font-size: 20px;
  line-height: 1.35;
  word-break: break-all;
}

.mpch_close_btn {
  flex: 0 0 auto;
  font-size: 20px;
  cursor: pointer;
  font-family: Arial, sans-serif;
  text-shadow:
    0 0 5px rgba(255, 255, 255, 0.8),
    0 0 10px rgba(255, 255, 255, 0.5),
    0 0 20px rgba(173, 216, 230, 0.3);
  filter: blur(0.5px);
  opacity: 0.9;
}

.mp-content_sec_title {
  margin-top: 6px;
  color: #418adb;
  font-weight: bold;
  line-height: 1.5;
  word-break: break-all;
}

.mp-content_detail {
  margin-top: 14px;
}

.variable-message-sign-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.variable-message-sign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 0 12px;
  background: #0a2a68;
  border: 1px solid #1a428a;
  border-radius: 4px;
  box-sizing: border-box;
}

.variable-message-sign-label {
  flex: 0 0 82px;
  color: #418adb;
  white-space: nowrap;
}

.variable-message-sign-value {
  flex: 1;
  color: #ffffff;
  font-weight: bold;
  text-align: right;
  word-break: break-all;
}
</style>
