<template>
  <div class="hik-video-player-wrapper">
    <div :id="playerContainerId" class="hik-video-player-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const props = defineProps({
  url: {
    type: String,
    default: '',
  },
  indexNum: {
    type: Number,
    default: 0,
  },
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 450,
  },
  autoPlay: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['play', 'stop', 'error', 'fullscreenChange']);

let player = null;
const playerContainerId = 'hik-player-container-' + props.indexNum;
const isPlaying = ref(false);

watch(
  () => props.url,
  (newUrl) => {
    if (newUrl) {
      realplay(newUrl);
    }
  }
);

watch(
  () => [props.width, props.height],
  () => {
    if (player) {
      player.JS_Resize(props.width, props.height);
      if (player.JS_DestroyWnd) {
        player.JS_DestroyWnd();
      }
      // 3. 将变量置空，断开引用便于 GC 回收
      player = null;
    }
  }
);

const createPlayer = () => {
  player = new window.JSPlugin({
    szId: playerContainerId,
    szBasePath: '/h5player/',
    iMaxSplit: 1,
    iCurrentSplit: 0,
    bMultiMode: true,
    bSupporDoubleClickFull: true,
    bSupportWebGL: true,
    openDebug: false,
    oStyle: {
      borderSelect: '#409EFF',
    },
  });

  player.JS_SetWindowControlCallback({
    windowEventSelect: (iWndIndex) => console.log('选中窗口: ', iWndIndex),
    pluginErrorHandler: (iWndIndex, iErrorCode, oError) => {
      console.error('播放器错误: ', iErrorCode, oError);
      isPlaying.value = false;
      emit('error', { iWndIndex, iErrorCode, oError });
    },
    windowFullCcreenChange: (bFull) => {
      console.log('全屏状态: ', bFull);
      emit('fullscreenChange', bFull);
    },
    performanceLack: () => {
      console.warn('性能不足');
      // if (player) {
      //   // play = null;
      //   stopPlay();
      //   // player.JS_SetSkipFrame(0, 2); // 性能不足时，跳更多的帧
      // }
    },
  });

  player.JS_Resize(props.width, props.height);

  console.log('props.url:', props.url);
  if (props.autoPlay && props.url) {
    realplay(props.url);
  }
};

const realplay = (url) => {
  if (!player || !url) return;

  player.JS_Play(url, { playURL: url, mode: 0 }, 0).then(
    () => {
      console.log('播放成功');
      isPlaying.value = true;
      emit('play', url);
    },
    (e) => {
      console.error('播放失败', e);
      isPlaying.value = false;
      emit('error', e);
    }
  );
};

const stopPlay = () => {
  if (player) {
    player.JS_StopRealPlayAll().then(() => {
      isPlaying.value = false;
      // emit('stop');
    });
  }
};

const togglePlayPause = () => {
  if (isPlaying.value) {
    stopPlay();
  } else {
    realplay(props.url);
  }
};

const handleFullscreen = () => {
  if (player) {
    player.JS_FullScreenDisplay(true);
  }
};

const resizePlayer = (width, height) => {
  if (player) {
    player.JS_Resize(width, height);
  }
};

onMounted(() => {
  nextTick(() => {
    createPlayer();
  });
});

onBeforeUnmount(() => {
  // stopPlay();
  if (player) {
    player.JS_StopRealPlayAll();
    player = null;
    console.log('释放成功');
  }
});

defineExpose({
  play: realplay,
  stop: stopPlay,
  togglePlayPause,
  handleFullscreen,
  resizePlayer,
  isPlaying,
});
</script>

<style lang="less" scoped>
.hik-video-player-wrapper {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hik-video-player-container {
  width: 100%;
  height: 100%;
  background: #000;
  display: block;
  position: relative;
}

:deep(.hik-video-player-container canvas) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.hik-video-player-container .sub-wnd) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.hik-video-player-container .play-window) {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.hik-video-player-container > div) {
  display: block !important;
}

:deep(.hik-video-player-container > .parent-wnd) {
  width: 100% !important;
  height: 100% !important;
}
</style>
