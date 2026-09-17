<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="billing-agent-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-agent-modal-title"
      @click.self="closeModal"
    >
      <section class="billing-agent-modal__content">
        <header class="billing-agent-modal__header">
          <h2 id="billing-agent-modal-title">收费报表智能体</h2>
          <button
            type="button"
            class="billing-agent-modal__close"
            aria-label="关闭收费报表智能体"
            title="关闭"
            @click="closeModal"
          >
            &times;
          </button>
        </header>
        <iframe
          class="billing-agent-modal__frame"
          :src="chatUrl"
          title="收费报表智能体"
        ></iframe>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const chatUrl = 'http://35.83.2.25:32300/product/llm/chat/d9olu1n9vlng5r5gkfmg';

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.modelValue) {
    closeModal();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="less">
.billing-agent-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 3vw, 48px);
  background: rgba(1, 11, 30, 0.72);
}

.billing-agent-modal__content {
  width: min(1240px, 100%);
  height: min(820px, 100%);
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #55d9ff;
  border-radius: 8px;
  background: #071b38;
  box-shadow: 0 0 30px rgba(85, 217, 255, 0.28);
}

.billing-agent-modal__header {
  height: 48px;
  flex: 0 0 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 18px;
  border-bottom: 1px solid rgba(85, 217, 255, 0.52);
  background: rgba(11, 65, 119, 0.74);
}

.billing-agent-modal__header h2 {
  margin: 0;
  color: #e4fcff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.billing-agent-modal__close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #e4fcff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.billing-agent-modal__close:hover {
  border-color: rgba(228, 252, 255, 0.7);
  background: rgba(228, 252, 255, 0.16);
}

.billing-agent-modal__close:focus-visible {
  outline: 2px solid #e4fcff;
  outline-offset: 2px;
}

.billing-agent-modal__frame {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #fff;
}

@media (max-width: 640px) {
  .billing-agent-modal {
    padding: 10px;
  }

  .billing-agent-modal__content {
    height: 100%;
  }
}
</style>
