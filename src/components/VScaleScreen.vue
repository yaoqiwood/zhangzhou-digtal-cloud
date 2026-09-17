<template>
  <div class="scale-screen-wrapper">
    <div
      ref="containerRef"
      class="scale-screen-container"
      :style="containerStyle"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

// 定义props
const props = defineProps({
  width: {
    type: [String, Number],
    default: 1920,
  },
  height: {
    type: [String, Number],
    default: 1080,
  },
  enableResize: {
    type: Boolean,
    default: true,
  },
  keepAspectRatio: {
    type: Boolean,
    default: true,
  },
  horizontalStretch: {
    type: Boolean,
    default: false,
  },
});

// 容器引用
const containerRef = ref(null);

// 容器样式
const containerStyle = ref({});
let resizeObserver = null;
let rafId = 0;

// 计算缩放比例
const calcScale = () => {
  if (!containerRef.value) return;

  const wrapper = containerRef.value.parentElement;
  if (!wrapper) return;

  const parentWidth = wrapper.clientWidth;
  const parentHeight = wrapper.clientHeight;

  const w = parseInt(props.width);
  const h = parseInt(props.height);

  const scaleX = parentWidth / w;
  const scaleY = parentHeight / h;
  const uniformScale = Math.min(scaleX, scaleY);

  const finalScaleX = props.keepAspectRatio
    ? props.horizontalStretch
      ? scaleX
      : uniformScale
    : scaleX;
  const finalScaleY = props.keepAspectRatio ? uniformScale : scaleY;
  const offsetX = (parentWidth - w * finalScaleX) / 2;
  const offsetY = (parentHeight - h * finalScaleY) / 2;

  // 应用缩放
  containerStyle.value = {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${finalScaleX}, ${finalScaleY})`,
    transformOrigin: 'left top',
    '--screen-scale-x': `${finalScaleX}`,
    '--screen-scale-y': `${finalScaleY}`,
    '--screen-stretch-ratio': `${finalScaleX > 0 ? finalScaleY / finalScaleX : 1}`,
    position: 'absolute',
    top: 0,
    left: 0,
  };
};

const scheduleCalcScale = () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    calcScale();
    rafId = 0;
  });
};

// 监听窗口大小变化
const handleResize = () => {
  if (!props.enableResize) return;
  scheduleCalcScale();
};

// 组件挂载后计算缩放
onMounted(() => {
  if (props.enableResize) {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (window.ResizeObserver && containerRef.value?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.value.parentElement);
    }
  }
  nextTick(() => {
    scheduleCalcScale();
  });
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('orientationchange', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
});

watch(
  () => [props.width, props.height, props.keepAspectRatio, props.horizontalStretch],
  () => {
    nextTick(() => {
      scheduleCalcScale();
    });
  },
);

// 暴露calcScale方法
defineExpose({
  calcScale,
});
</script>

<style scoped>
.scale-screen-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.scale-screen-container {
  transition: transform 0.3s ease;
  will-change: transform;
}
</style>
