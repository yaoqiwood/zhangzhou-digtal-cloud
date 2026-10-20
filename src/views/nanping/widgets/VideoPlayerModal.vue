<template>
  <div class="video-modal-overlay" @click="handleOverlayClick">
    <div class="video-modal-container" @click.stop>
      <div class="video-modal-header">
        <span class="video-modal-title">视频播放 (海康 H5Player)</span>
        <div class="video-modal-controls">
          <button class="video-control-btn" @click="handleFullscreen">
            全屏
          </button>
          <button class="video-modal-close" @click="closeModal">关闭</button>
        </div>
      </div>

      <div class="video-player-wrapper">
        <div
          :id="playerContainerId + props.indexNum"
          class="video-player-container"
        ></div>
      </div>

      <div class="video-player-controls">
        <div class="control-buttons">
          <button class="control-btn" @click="togglePlayPause">
            {{ isPlaying ? '停止' : '播放' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  onBeforeUnmount,
} from 'vue';

const props = defineProps({
  visible: Boolean,
  currentUrl: String,
  indexNum: Number,
});

const emit = defineEmits(['update:visible', 'close']);

// 1. 修正：player 应该是一个普通的变量（非响应式），因为它是一个复杂的 SDK 实例
let player = null;
const playerContainerId = 'hik-player-container' + props.indexNum;
const isPlaying = ref(false);

const IS_MOVE_DEVICE = document.body.clientWidth < 992;

// 2. 修正：监听 props 的正确写法
watch(
  () => props.currentUrl,
  (newUrl) => {
    if (newUrl && props.visible) {
      realplay(newUrl);
    }
  }
);

// 监听可见性，打开时初始化或播放
watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        if (!player) {
          createPlayer();
        }
      });
    } else {
      stopPlay();
    }
  }
);

/**
 * 初始化海康播放器
 */
const createPlayer = () => {
  // 注意：此处 player 是普通变量，不加 .value
  player = new window.JSPlugin({
    szId: playerContainerId,
    szBasePath: '/h5player/',
    iMaxSplit: 1,
    iCurrentSplit: 0, // 单窗口通常为 0
    bSupporDoubleClickFull: true,
    openDebug: false,
    oStyle: {
      borderSelect: '#409EFF',
    },
  });

  // 事件回调
  player.JS_SetWindowControlCallback({
    windowEventSelect: (iWndIndex) => console.log('选中窗口: ', iWndIndex),
    pluginErrorHandler: (iWndIndex, iErrorCode, oError) => {
      console.error('播放器错误: ', iErrorCode, oError);
      isPlaying.value = false;
    },
    windowFullCcreenChange: (bFull) => console.log('全屏状态: ', bFull),
    performanceLack: () => {
      console.warn('性能不足');
      stopPlay();
    },
  });

  // 调整尺寸并尝试自动播放
  player.JS_Resize(800, 450); // 建议与父容器尺寸匹配
  if (props.currentUrl) {
    realplay(props.currentUrl);
  }
};

const realplay = (url) => {
  if (!player || !url) return;

  // 海康 JS_Play 参数：url, { 模式, 身份令牌等 }, 窗口索引
  player.JS_Play(url, { playURL: url, mode: 0 }, 0).then(
    () => {
      console.log('播放成功');
      isPlaying.value = true;
    },
    (e) => {
      console.error('播放失败', e);
      isPlaying.value = false;
    }
  );
};

const stopPlay = () => {
  if (player) {
    player.JS_StopRealPlayAll().then(() => {
      isPlaying.value = false;
    });
  }
};

const closeModal = () => {
  stopPlay();
  emit('update:visible', false);
  emit('close');
};

const handleOverlayClick = () => closeModal();

// 切换播放/停止
const togglePlayPause = () => {
  if (isPlaying.value) {
    stopPlay();
  } else {
    realplay(props.currentUrl);
  }
};

// 全屏处理
const handleFullscreen = () => {
  if (player) {
    player.JS_FullScreenDisplay(true);
  }
};

onMounted(() => {
  if (props.visible) {
    console.log('正在加载播放器...');

    nextTick(() => createPlayer());
  }
});

onBeforeUnmount(() => {
  stopPlay();
});
</script>

<style lang="less" scoped>
/* 遮罩层 */
.video-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 弹窗容器 */
.video-modal-container {
  background: #1a1a1a;
  border-radius: 8px;
  width: 800px;
  max-width: 1728px; /* 90vw @ 1920 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.video-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
}

.video-modal-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.video-modal-controls {
  display: flex;
  gap: 8px;
}

.video-control-btn,
.video-modal-close {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.video-control-btn {
  background: #409eff;
  color: #fff;
}

.video-modal-close {
  background: #f56c6c;
  color: #fff;
}

/* 播放器包装器 - 关键：必须有固定高度 */
.video-player-wrapper {
  width: 100%;
  height: 450px;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-player-container {
  width: 100%;
  height: 100%;
  background: #000;
  /* 海康插件会在内部生成 canvas，确保容器有宽高 */
  display: block;
  position: relative;
}

/* 底部控制栏 */
.video-player-controls {
  padding: 12px 16px;
  background: #2a2a2a;
  border-top: 1px solid #333;
}

.control-buttons {
  display: flex;
  justify-content: center;
}

.control-btn {
  padding: 8px 24px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.control-btn:hover {
  background: #66b1ff;
}

/* 使用 :deep 穿透组件样式限制 */
:deep(.video-player-container canvas) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}
:deep(.video-player-container .sub-wnd) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}
:deep(.video-player-container .play-window) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.video-player-container > div) {
  display: block !important;
}
</style>
