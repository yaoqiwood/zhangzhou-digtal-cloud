<template>
  <!-- 弹窗内容 -->
  <div class="vp-content">
    <!-- 标题栏 -->
    <div class="vp-header">
      <!-- <span class="vp-title-label">摄像头编号</span> -->
      <div class="vp-title">
        <!-- <span class="vp-title-value">{{ cameraData.cameraNum }}</span> -->
      </div>
      <!-- <button class="vp-close-btn" @click="$emit('close')">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button> -->
    </div>

    <!-- 视频播放区域 -->
    <div class="vp-video-container">
      <!-- 视频预览图 -->
      <div class="vp-video-preview">
        <!-- 显示摄像头名称 -->
        <!-- <div class="vp-camera-name">{{ cameraData.cameraName }}</div> -->

        <HikVideoPlayer :index-num="indexNum" :url="url" />
      </div>

      <!-- 交通信号灯图标 -->
      <!-- <div class="vp-traffic-light">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import HikVideoPlayer from '../video/HikVideoPlayer.vue';
// 定义props
const props = defineProps({
  cameraData: {
    type: Object,
    required: true,
  },
  indexNum: Number,
  url: String,
});

// 定义事件
const emit = defineEmits(['fetch-video-url', 'play-video']);

// 响应式数据
// const videoUrl = ref(null);

// 播放点击处理
const handlePlayClick = async () => {
  if (!props.cameraData || !props.cameraData.cameraNum) {
    console.error('缺少摄像头编号');
    return;
  }

  // 触发父组件获取视频URL
  const url = await emit('fetch-video-url', props.cameraData.cameraNum);
  if (url) {
    // 发送播放视频的事件到父组件
    emit('play-video', url);
  }
};

// 停止播放处理
// const handleStopClick = () => {
//   videoUrl.value = null;
// };

// 获取默认图片
const getDefaultImage = (roadCode, pileNum) => {
  // 根据道路编码和桩号生成默认图片URL
  return ``;
};
</script>

<style scoped lang="less">
.vp-content {
  width: 92%; // 改为适应父容器宽度
  height: 277px;
  background-image: url('@/assets/popup/video-popup-bg@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative; // 改为相对定位
}

.vp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  color: #fff;
  font-size: 16px;
  position: relative;
  top: 10px;
}

.vp-title {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  // left: 50%;
  transform: translateX(-50%);
}

.vp-title-label {
  color: #87ceeb;
  font-weight: bold;
}

.vp-title-value {
  font-size: 18px;
  font-weight: bold;
}

.vp-close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;

  &:hover {
    color: #87ceeb;
  }
}

.vp-video-container {
  flex: 1;
  position: relative;
  padding: 20px;
  height: 80%;
}

.vp-video-preview {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  background-color: #000;
  top: -15px;
}

.vp-camera-name {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  color: #fff;
  font-size: 14px;
  text-align: center;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vp-video-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vp-play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #fff;

  &:hover {
    background-color: rgba(0, 102, 255, 0.7);
    border-color: #87ceeb;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.vp-traffic-light {
  position: absolute;
  top: 30px;
  right: 30px;
  width: 30px;
  height: 30px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
