<template>
  <div class="mlvp-container" :class="{ 'mlvp-visible': visible }">
    <div class="mlvp-header">
      <span class="mlvp-header-title">监控列表</span>
      <div class="mlvp-header-close" @click="hide">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
    <div class="mlvp-full-content">
      <div
        v-for="(video, index) in currentPageVideos"
        :key="video.cameraNum || index"
        class="mlvp-content"
      >
        <VideoPopupContent
          :camera-data="video"
          :index-num="index"
          :url="video.videoUrl"
          @play-video="(url) => emit('play-video', url)"
        />
      </div>
      <div v-if="videoList.length === 0 && loading" class="mlvp-content">
        <div class="loading-data">
          <div class="loading-spinner"></div>
          <span>正在加载中...</span>
        </div>
      </div>
      <div v-if="videoList.length === 0 && !loading" class="mlvp-content">
        <div class="no-data">暂无视频数据</div>
      </div>
    </div>

    <div v-if="videoList.length > 0" class="mlvp-pagination">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        上一页
      </button>
      <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import VideoPopupContent from './popup/VideoPopupContent.vue';
import { REGION_IDS } from '@/utils/constants';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api';
import { get } from '@/utils/http';

// 定义 props
const props = defineProps({
  listData: {
    type: Array,
    default: () => [],
  },
  visible: {
    type: Boolean,
    default: false,
  },
  // 接收来自父组件的参数
  params: {
    type: Object,
    default: () => ({}),
  },
});

// 响应式数据
const videoList = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(3);
// 请求代次（核心解耦手段）：
// - 每次触发一次“新的视频加载任务”（打开弹层 / 参数变化）就 +1
// - 所有异步请求都携带当时的 seq
// - 请求返回时先校验 seq 是否仍是最新
//   若不是，说明该返回属于“旧任务”（用户可能已切换到新详情），直接丢弃，不污染当前 UI
// 这样可以彻底避免“晚到的旧响应覆盖新数据”的串包问题。
const requestSeq = ref(0);
const VIDEO_URL_CONCURRENCY = 2;

// 计算属性
const totalPages = computed(() =>
  Math.ceil(videoList.value.length / pageSize.value)
);
const currentPageVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return videoList.value.slice(start, end);
});

// 定义事件
const emit = defineEmits(['close', 'update:visible', 'play-video']);

// 隐藏组件的方法
const hide = () => {
  emit('update:visible', false);
  emit('close');
};

const normalizeVideoList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const buildPlayableUrl = (urlResponse) => {
  const originalUrl = String(urlResponse?.data?.url || '').trim();
  if (!originalUrl) return null;
  const urlSuffix = originalUrl.includes('openUrl/')
    ? originalUrl.split('openUrl/')[1]
    : '';
  if (!urlSuffix) return null;
  return `ws://35.39.30.226:559/openUrl/${urlSuffix}`;
};

const normalizeCameraNums = (cameraNums) => {
  if (!Array.isArray(cameraNums)) return [];
  const seen = new Set();
  return cameraNums
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.cameraNum || '').trim();
      }
      return '';
    })
    .filter((cameraNum) => {
      if (!cameraNum || seen.has(cameraNum)) return false;
      seen.add(cameraNum);
      return true;
    });
};

const getVideoSourceData = (params) => {
  const currentData = params?.data;
  if (currentData?.originalData && typeof currentData.originalData === 'object') {
    return currentData.originalData;
  }
  if (currentData && typeof currentData === 'object') {
    return currentData;
  }
  return {};
};

const normalizeRoadDirection = (value) => {
  const directionText = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!directionText) return '';
  if (directionText === '1' || directionText === '2') return directionText;
  if (directionText.includes('A')) return '1';
  if (directionText.includes('B')) return '2';
  return '';
};

const normalizePileNum = (value) => {
  const pileText = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!pileText) return '';
  const digitText = pileText.replace(/\D/g, '');
  return digitText || '';
};

const buildEventVideoListParams = (params) => {
  const sourceData = getVideoSourceData(params);
  const roadCode = String(sourceData?.route ?? params?.roadCode ?? '').trim();
  const kmStartPileNum = normalizePileNum(sourceData?.kmStart ?? params?.kmStart);
  const kmEndPileNum = normalizePileNum(sourceData?.kmEnd ?? params?.kmEnd);
  const pileNum =
    kmStartPileNum ||
    kmEndPileNum ||
    String(params?.pileNum ?? '')
      .trim()
      .replace(/\D/g, '');
  const roadDirection = normalizeRoadDirection(
    sourceData?.direction ?? params?.roadDirection
  );

  if (!roadCode || !pileNum || !roadDirection) {
    return null;
  }

  return {
    roadCode,
    pileNum,
    roadDirection,
    oneSideCount: '5',
  };
};

const withConcurrency = async (items, concurrency, worker) => {
  const queue = Array.isArray(items) ? items.slice() : [];
  const limit = Math.max(1, Number(concurrency) || 1);
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      await worker(current);
    }
  });
  await Promise.all(runners);
};

const loadVideoUrlsForPage = async (page = 1, seq = requestSeq.value) => {
  // 阶段二：按页补齐 URL（重请求）。
  // 这里故意不在“拿列表”阶段就全量请求 URL，
  // 而是只请求用户当前页能看见的 3 条（pageSize=3），
  // 目的是把请求压力从“瞬时洪峰”变成“按需渐进”，给其他业务接口让路。
  if (!props.visible || seq !== requestSeq.value) return;

  const start = (page - 1) * pageSize.value;
  const end = start + pageSize.value;
  const pageVideos = videoList.value.slice(start, end);
  const pendingVideos = pageVideos.filter(
    (video) => !video?._urlLoaded && !video?._urlLoading && video?.cameraNum
  );
  if (pendingVideos.length === 0) return;

  await withConcurrency(
    pendingVideos,
    VIDEO_URL_CONCURRENCY,
    async (video) => {
      // 代次校验：只允许“当前任务”更新状态。
      if (!video || seq !== requestSeq.value) return;
      video._urlLoading = true;
      try {
        const urlResponse = await get(FUZHOU_API_URLS.video.getVideoUrl, {
          cameraNum: video.cameraNum,
          origid: REGION_IDS.FUZHOU,
        });
        // await 返回后再次校验，防止请求过程中用户已经切换详情。
        if (seq !== requestSeq.value) return;
        video.videoUrl = buildPlayableUrl(urlResponse);
      } catch (error) {
        if (seq !== requestSeq.value) return;
        console.error(`获取摄像头 ${video.cameraNum} 的URL失败:`, error);
        video.videoUrl = null;
      } finally {
        if (seq !== requestSeq.value) return;
        video._urlLoaded = true;
        video._urlLoading = false;
      }
    }
  );
};

const loadVideoList = async () => {
  // 阶段一：先拿“列表元数据”（相对轻量）。
  // 关键目标：让监控列表尽快渲染出来（哪怕 URL 还没齐），
  // 这样不会把“详情弹窗/其他接口”的响应体感拖慢。
  const seq = requestSeq.value + 1;
  requestSeq.value = seq;
  loading.value = true;
  videoList.value = [];

  try {
    const hasCameraNumsParam = Object.prototype.hasOwnProperty.call(
      props.params || {},
      'cameraNums'
    );
    const cameraNums = normalizeCameraNums(props.params?.cameraNums);
    if (hasCameraNumsParam) {
      videoList.value = cameraNums.map((cameraNum) => ({
        cameraNum,
        videoUrl: null,
        _urlLoaded: false,
        _urlLoading: false,
      }));
      loading.value = false;
      await loadVideoUrlsForPage(currentPage.value, seq);
      if (seq !== requestSeq.value) return;
      setTimeout(() => {
        void loadVideoUrlsForPage(currentPage.value + 1, seq);
      }, 160);
      return;
    }

    const eventVideoParams = buildEventVideoListParams(props.params);
    if (eventVideoParams) {
      const response = await get(FUZHOU_API_URLS.video.getVideoList, {
        ...eventVideoParams,
        origid: REGION_IDS.FUZHOU,
      });
      if (seq !== requestSeq.value) return;

      videoList.value = normalizeVideoList(response).map((video) => ({
        ...video,
        videoUrl: null,
        _urlLoaded: false,
        _urlLoading: false,
      }));
      loading.value = false;

      await loadVideoUrlsForPage(currentPage.value, seq);
      if (seq !== requestSeq.value) return;
      setTimeout(() => {
        void loadVideoUrlsForPage(currentPage.value + 1, seq);
      }, 160);
      return;
    }

    const baseParams = {
      pileNum: props.params.pileNum || '0',
      roadDirection: props.params.roadDirection || '1',
      oneSideCount: props.params.oneSideCount || '9999',
    };

    const roadFilters = [
      {
        roadCode: 'G1517',
        cameraNames: ['AK12', 'AK38', 'AK48', 'AK65', 'AK77'],
      },
      { roadCode: 'G1523', cameraNames: ['AK81', 'AK96', 'AK109'] },
    ];

    const responses = await Promise.all(
      roadFilters.map((item) =>
        get(FUZHOU_API_URLS.video.getVideoList, {
          ...baseParams,
          roadCode: item.roadCode,
          origid: REGION_IDS.FUZHOU,
        })
      )
    );
    // 列表请求返回时做代次校验，旧任务直接废弃。
    if (seq !== requestSeq.value) return;

    const list = responses.flatMap((response, index) => {
      const roadList = normalizeVideoList(response);
      const { cameraNames } = roadFilters[index];
      return roadList.filter((video) =>
        cameraNames.some((keyword) =>
          String(video?.cameraName || '').includes(keyword)
        )
      );
    });

    videoList.value = list.map((video) => ({
      ...video,
      videoUrl: null,
      _urlLoaded: false,
      _urlLoading: false,
    }));
    loading.value = false;

    // 阶段二（当前页优先）：先补齐当前页 URL，让用户第一屏尽快可播放。
    await loadVideoUrlsForPage(currentPage.value, seq);
    if (seq !== requestSeq.value) return;
    // 阶段三（低优先级预热）：延迟预热下一页，避免和其他业务请求抢占同一时刻连接池。
    setTimeout(() => {
      void loadVideoUrlsForPage(currentPage.value + 1, seq);
    }, 160);
  } catch (error) {
    if (seq !== requestSeq.value) return;
    console.error('获取视频列表失败:', error);
    videoList.value = [];
    loading.value = false;
  } finally {
    if (seq === requestSeq.value) {
      loading.value = false;
    }
  }
};

// 监听 visible 属性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      console.log('VideoColumns 显示，参数：', props.params);
      currentPage.value = 1;
      void loadVideoList();
      return;
    }
    // 弹层关闭：直接推进代次，让所有在途请求“逻辑失效”。
    // 不需要硬中断底层请求，也能保证旧结果不会再回写页面。
    requestSeq.value += 1;
    loading.value = false;
  }
);

watch(
  () => props.params,
  () => {
    if (!props.visible) return;
    // 参数变化等同“新任务”：重新走 阶段一 -> 阶段二/三。
    currentPage.value = 1;
    void loadVideoList();
  },
  { deep: true }
);

// 监听 videoList 变化，重置页码
watch(
  () => videoList.value.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
  }
);

watch(
  () => currentPage.value,
  (page) => {
    if (!props.visible) return;
    // 用户翻页时按需补这一页 URL，不做全量回填。
    void loadVideoUrlsForPage(page, requestSeq.value);
    // 轻量预热下一页，提升连续翻页体验。
    setTimeout(() => {
      void loadVideoUrlsForPage(page + 1, requestSeq.value);
    }, 120);
  }
);
</script>

<style scoped lang="less">
/* 核心配色变量 */
@mlvp-accent: #00d8ff; /* 亮蓝色 */
@mlvp-bg: #04122c; /* 深蓝色背景 */
@mlvp-card-bg: rgba(7, 34, 70, 0.6);

.mlvp-full-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
  gap: 15px;
}

.mlvp-container {
  width: 424px;
  height: 92%;
  background-color: #0b2555;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  color: #fff;
  // font-family: 'Microsoft YaHei', sans-serif;
  opacity: 0.95;
  position: fixed;
  left: 0;
  top: 0;
  transform: translateX(-100%);
  transition: transform 0.5s ease;
  z-index: 1001;
}

.mlvp-visible {
  transform: translateX(0);
}

.mlvp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  &-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }

  &-close {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    &:hover {
      color: @mlvp-accent;
    }
  }
}

.mlvp-content {
  // flex: 0 0 auto;
  overflow-y: auto;
  display: flex;
  justify-content: center;

  /* 隐藏默认滚动条，自定义纤细样式 */
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: @mlvp-accent;
    border-radius: 10px;
  }
}

.mlvp-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  margin-top: auto;
  border-top: 1px solid rgba(0, 216, 255, 0.2);
}

.pagination-btn {
  padding: 6px 16px;
  background: rgba(0, 216, 255, 0.2);
  border: 1px solid rgba(0, 216, 255, 0.4);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 216, 255, 0.4);
    border-color: @mlvp-accent;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.pagination-info {
  color: #fff;
  font-size: 14px;
  min-width: 60px;
  text-align: center;
}

.no-data,
.loading-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #fff;
  font-size: 16px;
}

.loading-data {
  color: #ccc;
  flex-direction: column;
  gap: 15px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 216, 255, 0.2);
  border-top-color: #00d8ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.mlvp-card {
  position: relative;
  background: @mlvp-card-bg;
  border: 1px solid rgba(0, 216, 255, 0.2);
  margin-bottom: 20px;
  padding: 12px;
  box-sizing: border-box;

  /* 四角科技感线条 */
  &-border {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid @mlvp-accent;

    &--tl {
      top: -1px;
      left: -1px;
      border-right: none;
      border-bottom: none;
    }
    &--tr {
      top: -1px;
      right: -1px;
      border-left: none;
      border-bottom: none;
    }
    &--bl {
      bottom: -1px;
      left: -1px;
      border-right: none;
      border-top: none;
    }
    &--br {
      bottom: -1px;
      right: -1px;
      border-left: none;
      border-top: none;
    }
  }

  &-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;
  }

  &-name {
    font-size: 18px;
    font-weight: bold;
    color: #ffffff;
  }

  &-id {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
    transform: scale(0.9);
    transform-origin: right bottom;
  }
}

.mlvp-video-area {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(0, 216, 255, 0.3);
  background: #000;
  overflow: hidden;

  .mlvp-video-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
  }

  .mlvp-video-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 38px;
    height: 38px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #fff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;

    &-icon {
      width: 0;
      height: 0;
      border-top: 7px solid transparent;
      border-bottom: 7px solid transparent;
      border-left: 11px solid #fff;
      margin-left: 4px;
    }

    &:hover {
      background: rgba(0, 216, 255, 0.6);
      border-color: @mlvp-accent;
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  .mlvp-video-zoom {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
      background: @mlvp-accent;
    }
  }
}
</style>
