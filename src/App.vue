<script setup>
// App.vue 作为路由容器：仅在首页启用缩放容器
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <v-scale-screen
      v-if="route.meta.scaleScreen"
      :width="BASE_WIDTH"
      :height="BASE_HEIGHT"
      :keep-aspect-ratio="true"
      :horizontal-stretch="true"
    >
      <component :is="Component" />
    </v-scale-screen>
    <component :is="Component" v-else />
  </router-view>
</template>

<style>
/* 全局样式重置，确保全屏显示 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  background-color: #02091b;
}

#app {
  width: 100%;
  height: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
}
</style>
