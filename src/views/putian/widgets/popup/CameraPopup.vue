<template>
  <div class="mp-content camera-popup-content">
    <div class="mpc-box">
      <div class="mp-content_header_flex">
        <div class="mpch_title">{{ popupTitle }}</div>
        <div class="mpch_close_btn" @click="onClose">X</div>
      </div>
      <div class="camera-player-panel">
        <div v-if="loading" class="camera-state">视频地址加载中...</div>
        <div v-else-if="errorMessage" class="camera-state error">
          {{ errorMessage }}
        </div>
        <div v-else-if="!videoUrl" class="camera-state">未获取到可播放地址</div>
        <div v-else class="camera-player-wrapper">
          <HikVideoPlayer
            :index-num="playerIndexNum"
            :url="videoUrl"
            :width="430"
            :height="250"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { API_URLS } from '@/utils/apiUrls.js';
import http from '@/utils/http.js';
import HikVideoPlayer from '../video/HikVideoPlayer.vue';

const props = defineProps({
  title: { type: String, default: '摄像头' },
  data: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['close']);

const loading = ref(false);
const errorMessage = ref('');
const videoUrl = ref('');
const requestSeq = ref(0);

const cameraNum = computed(() => {
  return String(
    props.data?.camera_num ??
      props.data?.cameraNum ??
      props.data?.camera_no ??
      props.data?.cameraNo ??
      ''
  ).trim();
});

const popupTitle = computed(() => {
  const name =
    props.data?.chan_name || props.data?.camera_name || props.data?.name || '';
  return name ? `${name}` : `${props.title || '摄像头'}详情`;
});
const playerIndexNum = computed(() => {
  // 避免和 VideoColumns 中 index(0,1,2...) 冲突，生成稳定且唯一的 id 尾号
  const source = cameraNum.value || popupTitle.value || 'camera-popup';
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return 1000 + (hash % 900000);
});

const onClose = () => {
  emit('close');
};

const normalizeListPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.list)) return payload.list;
  if (payload && typeof payload === 'object') {
    // 兼容对象返回：{ url: 'ws://...' } 或 { data: { ... } }
    if (payload.data && typeof payload.data === 'object') {
      return [payload.data];
    }
    return [payload];
  }
  return [];
};

const extractRawUrlFromItem = (item = {}) => {
  const candidates = [
    item.url,
    item.wsUrl,
    item.ws_url,
    item.videoUrl,
    item.video_url,
    item.playUrl,
    item.play_url,
    item.openUrl,
    item.open_url,
  ];
  const hit = candidates.find((value) => String(value || '').trim());
  return String(hit || '').trim();
};

const buildPlayableUrl = (rawUrl = '') => {
  // 与 VideoColumns 保持一致：统一抽取 openUrl 后缀并走固定可播网关
  const originalUrl = String(rawUrl || '').trim();
  if (!originalUrl) return '';
  const urlSuffix = originalUrl.includes('openUrl/')
    ? originalUrl.split('openUrl/')[1]
    : '';
  if (!urlSuffix) return '';
  return `ws://35.39.30.226:559/openUrl/${urlSuffix}`;
};

const fetchVideoUrlByCameraNum = async () => {
  const seq = requestSeq.value + 1;
  requestSeq.value = seq;

  const currentCameraNum = cameraNum.value;
  videoUrl.value = '';
  errorMessage.value = '';

  if (!currentCameraNum) {
    errorMessage.value = '缺少 camera_num 参数';
    return;
  }

  loading.value = true;
  try {
    const response = await http.get(API_URLS.video.getVideoUrl, {
      cameraNum: currentCameraNum,
    });
    if (seq !== requestSeq.value) return;

    const list = normalizeListPayload(response);
    const firstItem = list[0] || response || {};
    const rawUrl = extractRawUrlFromItem(firstItem);
    const wsUrl = buildPlayableUrl(rawUrl);

    if (!wsUrl) {
      errorMessage.value = '接口已返回，但未找到可播放的 ws 地址';
      videoUrl.value = '';
      return;
    }

    videoUrl.value = wsUrl;
  } catch (error) {
    if (seq !== requestSeq.value) return;
    console.error('获取摄像头播放地址失败:', error);
    errorMessage.value = '获取播放地址失败，请稍后重试';
  } finally {
    if (seq === requestSeq.value) {
      loading.value = false;
    }
  }
};

watch(
  () => cameraNum.value,
  () => {
    void fetchVideoUrlByCameraNum();
  },
  { immediate: true }
);
</script>

<style scoped lang="less">
.camera-popup-content {
  width: 97%;
  height: 97%;

  .mpc-box {
    height: 93%;
    margin: 7% 7% 0 7%;

    .mp-content_header_flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;

      .mpch_title {
        font-size: 20px;
      }

      .mpch_close_btn {
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
    }
  }

  .camera-player-panel {
    margin-top: 14px;
    width: 100%;
    height: calc(100% - 74px);
    background: rgba(3, 21, 54, 0.76);
    border: 1px solid rgba(77, 162, 255, 0.34);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    box-sizing: border-box;
  }

  .camera-player-wrapper {
    width: 100%;
    height: 100%;
  }

  :deep(.hik-video-player-wrapper) {
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep(.hik-video-player-container) {
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

  .camera-state {
    color: #d6eaff;
    font-size: 14px;
  }

  .camera-state.error {
    color: #ffb5b5;
  }
}
</style>
