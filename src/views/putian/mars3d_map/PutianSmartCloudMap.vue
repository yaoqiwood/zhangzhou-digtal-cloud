<template>
  <div id="mars3dContainer" class="mars3d-container"></div>
</template>

<script setup>
import { onMounted } from 'vue';
import 'mars3d-cesium/Build/Cesium/Widgets/widgets.css';
import 'mars3d/mars3d.css';
import * as mars3d from 'mars3d';

mars3d.Token.updateTianditu(['6d2498e45edb7d8cda1f4c999d190e6f']);

onMounted(() => {
  // 1. 初始化地图配置
  const mapOptions = {
    basemaps: [
      {
        name: '天地图电子',
        type: 'tdt',
        layer: 'vec',
        // key: '2f66024c900e4a33b6b7b712a5f2830f', // 新的天地图 TK 值
        show: true,
        // 使用滤镜让地图变灰/变暗，突出上层矢量数据
        filter: {
          brightness: 0.6,
          contrast: 1.2,
          grayscale: 0.8,
          invert: false,
        },
      },
    ],
    scene: {
      center: { lat: 31.75, lng: 117.25, alt: 35000, heading: 0, pitch: -70 },
      fxaa: true, // 开启抗锯齿
    },
  };

  const map = new mars3d.Map('mars3dContainer', mapOptions);

  // 2. 创建矢量图层
  const graphicLayer = new mars3d.layer.GraphicLayer();
  map.addLayer(graphicLayer);

  // ---------------------------------------------------
  // 核心功能实现
  // ---------------------------------------------------

  // [模拟区域划分] - 实际建议加载 GeoJSON 文件
  const addArea = (points, color) => {
    const graphic = new mars3d.graphic.PolygonEntity({
      positions: points,
      style: {
        color: color,
        opacity: 0.2,
        outline: true,
        outlineColor: '#ffffff',
        outlineWidth: 2,
        clampToGround: true,
      },
    });
    graphicLayer.addGraphic(graphic);
  };

  // [模拟流光道路] - 图片中那种发光的粗线条
  const addFlowLine = (points, color) => {
    const graphic = new mars3d.graphic.PolylineEntity({
      positions: points,
      style: {
        width: 8,
        material: mars3d.MaterialUtil.createMaterialProperty(
          mars3d.MaterialType.LineFlow,
          {
            color: color,
            image: 'https://v.mars3d.cn/img/textures/line-color-yellow.png', // 建议替换为本地贴图
            speed: 15,
          }
        ),
      },
    });
    graphicLayer.addGraphic(graphic);
  };

  // [模拟 Div 标注] - 图片中的标签
  const addMarker = (position, text, color) => {
    const graphic = new mars3d.graphic.DivGraphic({
      position: position,
      style: {
        html: `<div style="background:${color}; color:#fff; padding:4px 10px; border-radius:4px; font-size:12px; white-space:nowrap;">
                ${text}
               </div>`,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      },
    });
    graphicLayer.addGraphic(graphic);
  };

  // 3. 填充示例数据 (合肥市附近坐标)
  // 添加一个流光道路
  addFlowLine(
    [
      [117.15, 31.85],
      [117.25, 31.8],
      [117.4, 31.82],
    ],
    '#00ffff'
  );

  // 添加一个彩色区域
  addArea(
    [
      [117.1, 31.9],
      [117.3, 31.9],
      [117.3, 31.75],
      [117.1, 31.75],
    ],
    '#3388ff'
  );

  // 添加一个标签
  addMarker([117.25, 31.8], '核心交通枢纽', '#ff4400');
});
</script>

<style scoped>
.mars3d-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #000; /* 兜底背景色 */
}
</style>
