<template>
  <div
    class="notification-modal"
    :class="{ clickable }"
    role="alert"
    @click="clickable && $emit('click')"
  >
    <button class="close-btn" type="button" @click.stop="$emit('close')">
      ×
    </button>
    <div class="alert-content">
      <span class="alert-time">{{ displayAlertTime }}</span>
      <div class="alert-message-wrap">
        <div class="alert-message-track">
          <div class="alert-message-group">
            <span
              v-for="index in marqueeMessageRepeatCount"
              :key="`message-primary-${index}`"
              class="alert-message"
            >
              {{ displayAlertMessage }}
            </span>
          </div>
          <div class="alert-message-group" aria-hidden="true">
            <span
              v-for="index in marqueeMessageRepeatCount"
              :key="`message-duplicate-${index}`"
              class="alert-message"
            >
              {{ displayAlertMessage }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

defineOptions({
  name: 'NotificationModal',
});

defineEmits(['close', 'click']);

const props = defineProps({
  alertTime: {
    type: String,
    default: '2026-01-12 12:00',
  },
  alertMessage: {
    type: String,
    default: '路线号桩号发生事件：施工养护',
  },
  clickable: {
    type: Boolean,
    default: false,
  },
});

const lastValidAlertTime = ref(props.alertTime || '2026-01-12 12:00');
const lastValidAlertMessage = ref(
  props.alertMessage || '路线号桩号发生事件：施工养护'
);

watch(
  () => props.alertTime,
  (value) => {
    if (String(value || '').trim()) {
      lastValidAlertTime.value = value;
    }
  },
  { immediate: true }
);

watch(
  () => props.alertMessage,
  (value) => {
    if (String(value || '').trim()) {
      lastValidAlertMessage.value = value;
    }
  },
  { immediate: true }
);

const displayAlertTime = computed(
  () => props.alertTime || lastValidAlertTime.value
);
const displayAlertMessage = computed(
  () => props.alertMessage || lastValidAlertMessage.value
);
const marqueeMessageRepeatCount = 3;
</script>

<style scoped lang="less">
.notification-modal {
  position: fixed;
  top: 82px;
  left: 50%;
  transform: translateX(-50%);
  width: 820px;
  height: 112px;
  background-image: url('@/assets/system/warning-alert-bg@2x.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1301;
  overflow: hidden;
  cursor: default;
}

.notification-modal.clickable {
  cursor: pointer;
}

.close-btn {
  position: absolute;
  top: 6px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.alert-content {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 2px;
  height: 52px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding-right: 26px;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  overflow: hidden;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

.notification-modal.clickable .alert-content,
.notification-modal.clickable .alert-message-wrap,
.notification-modal.clickable .alert-message,
.notification-modal.clickable .alert-time {
  cursor: pointer;
}

.alert-time {
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  font-size: 20px;
  transform: translate(10px, 5px);

  // text-overflow: ellipsis;
}

.alert-message-wrap {
  min-width: 0;
  width: 98%;
  overflow: hidden;
  white-space: nowrap;
  transform: translate(18px, 5px);
}

.alert-message-track {
  display: flex;
  align-items: center;
  width: max-content;
  white-space: nowrap;
  will-change: transform;
  animation: alert-message-marquee 110s linear infinite;
}

.alert-message-group {
  display: inline-flex;
  align-items: center;
  flex: none;
  white-space: nowrap;
}

.alert-message {
  display: inline-block;
  white-space: nowrap;
  flex: none;
}

.alert-message + .alert-message {
  margin-left: 96px;
}

.alert-message-group::after {
  content: '';
  display: block;
  width: 96px;
  flex: none;
}

@keyframes alert-message-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
