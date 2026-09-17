<template>
  <Transition name="map-search-input-notice">
    <div
      v-if="visible && displayMessage"
      class="map-search-input-notice"
      role="status"
    >
      <span class="map-search-input-notice__mark"></span>
      <span class="map-search-input-notice__message">{{ displayMessage }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'MapSearchInputNotice',
});

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
});

const displayMessage = computed(() => props.message.trim());
</script>

<style lang="less" scoped>
.map-search-input-notice {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 1403;
  width: max-content;
  min-width: 100%;
  max-width: 250px;
  min-height: 30px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border: 1px solid rgba(0, 255, 255, 0.48);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(5, 25, 55, 0.96);
  box-shadow:
    0 0 12px rgba(0, 204, 255, 0.32),
    inset 0 0 12px rgba(0, 255, 255, 0.08);
  box-sizing: border-box;
  pointer-events: auto;
}

.map-search-input-notice__mark {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ffff;
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.7);
}

.map-search-input-notice__message {
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-search-input-notice-enter-active,
.map-search-input-notice-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.map-search-input-notice-enter-from,
.map-search-input-notice-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
