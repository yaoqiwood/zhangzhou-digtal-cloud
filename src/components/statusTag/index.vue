<template>
  <div class="status-tag" :class="[`is-${type}`]">
    <span class="status-dot"></span>
    <span class="status-text">
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>

<script setup>
defineProps({
  // 状态类型：'active' (已启用) 或 'inactive' (未启用)
  type: {
    type: String,
    default: 'active',
  },
  // 标签文字
  label: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  border-radius: 100px; /* 胶囊形状 */
  background-color: #041036; /* 统一的半透明深色背景 */
  font-size: 14px;
  user-select: none;
  transition: all 0.3s ease;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  transition: all 0.3s ease;
}

/* --- 已启用状态 --- */
.is-active {
  color: #ffffff;
}
.is-active .status-dot {
  background-color: #00ff88;
  /* 核心发光效果 */
  box-shadow:
    0 0 8px #00ff88,
    0 0 2px #00ff88;
}

/* --- 未启用状态 --- */
.is-inactive {
  color: #11367b; /* 调暗文字颜色 */
}
.is-inactive .status-dot {
  background-color: #08112f;
  box-shadow: none;
}

/* 简单的悬停反馈 */
.status-tag:hover {
  background-color: rgba(255, 255, 255, 0.12);
}
</style>
