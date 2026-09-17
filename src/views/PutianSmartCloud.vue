<script setup>
import { useRouter } from 'vue-router';
import PutianSmartCloudMap from './mars3d_map/PutianSmartCloudMap.vue';

const router = useRouter();

// 跳转到首页
const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <PutianSmartCloudMap />
</template>

<style scoped>
.smart-cloud-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #02091b 0%, #0a1930 100%);
  overflow: hidden;
  position: relative;
}

.ui-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: linear-gradient(to bottom, rgba(0, 70, 173, 0.8), transparent);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  border-bottom: 1px solid rgba(0, 255, 255, 0.3);
  padding: 0 20px;
}

.nav-button {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.5);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-button:hover {
  background: rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.header-title {
  color: #fff;
  font-size: clamp(18px, 3vw, 24px);
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 15px #00ffff;
}

.main-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 60px;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
}

.hero-section h1 {
  color: #00ffff;
  font-size: clamp(36px, 6vw, 48px);
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.hero-section p {
  color: #fff;
  font-size: clamp(18px, 3vw, 24px);
  margin-bottom: 20px;
  opacity: 0.8;
}

.description {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.description p {
  color: #a0cfff;
  font-size: clamp(16px, 2vw, 18px);
  opacity: 0.9;
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  width: 80%;
  max-width: 1200px;
  margin-top: 40px;
}

.feature-card {
  background: rgba(10, 25, 48, 0.8);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  border-color: rgba(0, 255, 255, 0.5);
}

.feature-card h3 {
  color: #00ffff;
  font-size: clamp(18px, 2vw, 20px);
  margin-bottom: 15px;
}

.feature-card p {
  color: #a0cfff;
  font-size: clamp(14px, 1.5vw, 16px);
  line-height: 1.6;
  opacity: 0.8;
}

/* 响应式调整 - 小屏幕设备 */
@media (max-width: 768px) {
  .ui-header {
    height: 50px;
  }

  .header-title {
    font-size: 18px;
  }

  .nav-button {
    padding: 6px 12px;
    font-size: 12px;
  }

  .hero-section h1 {
    font-size: 36px;
  }

  .hero-section p {
    font-size: 18px;
  }

  .features-section {
    width: 90%;
    gap: 20px;
  }

  .feature-card {
    padding: 20px;
  }
}

/* 响应式调整 - 大屏幕设备 */
@media (min-width: 1440px) {
  .features-section {
    gap: 40px;
  }

  .feature-card {
    padding: 40px;
  }

  .feature-card h3 {
    font-size: 24px;
  }

  .feature-card p {
    font-size: 18px;
  }
}
</style>
