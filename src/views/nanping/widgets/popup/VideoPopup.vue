<template>
  <div class="vp-container">
    <!-- 弹窗背景 -->
    <div class="vp-background"></div>

    <!-- 弹窗内容 -->
    <div class="vp-content">
      <!-- 标题栏 -->
      <div class="vp-header">
        <span class="vp-title-label">监控ID监控ID</span>
        <div class="vp-title">
          <span class="vp-title-value">监控001</span>
        </div>
        <button class="vp-close-btn" @click="$emit('close')">
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
        </button>
      </div>

      <!-- 视频播放区域 -->
      <div class="vp-video-container">
        <!-- 视频预览图 -->
        <div class="vp-video-preview">
          <!-- 这里可以替换为实际的视频流或图片 -->
          <img
            src="https://picsum.photos/800/450"
            alt="监控画面"
            class="vp-video-img"
          />

          <!-- 播放按钮 -->
          <div class="vp-play-btn">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        </div>

        <!-- 交通信号灯图标 -->
        <div class="vp-traffic-light">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 定义组件名称
defineOptions({
  name: 'VideoPopup',
});

// 定义事件
defineEmits(['close']);
</script>

<style scoped lang="less">
.vp-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002; /* 确保在其他弹窗之上 */
}

.vp-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.vp-content {
  position: relative;
  width: 90%;
  height: 315px;
  background-image: url('@/assets/popup/video-popup-bg@2x.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: absolute;
  left: -110%;
  top: 50%;
}

.vp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  color: #fff;
  font-size: 16px;
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
