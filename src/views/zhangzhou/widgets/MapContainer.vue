<template>
  <div>
    <div ref="mapContainerRef" :id="mapId" class="map-container"></div>
  </div>
</template>
<script>
import { createApp, nextTick } from 'vue'; // Vue 3
import proj4 from 'proj4';
const pgis_img =
  'http://35.80.236.142:8888/admin-api/Maps/FJS_vc_shense_0_18_2/JointMap?service=GetImage&zoom={z}&col={x}&row={y}&ak=0620aae950f94394ba7c4164100aa50b';
const pgis_img1 =
  'http://35.80.236.142:8888/admin-api/Maps/FJS_cia_0_18_2/JointMap?service=GetImage&zoom={z}&col={x}&row={y}&ak=0620aae950f94394ba7c4164100aa50b';
const pgis_vec =
  'http://35.80.236.142:8888/admin-api/Maps/htservices/gjdcd/JointMap/v0/{z}/{x}/{y}.png';
const poi_url =
  'http://35.80.236.142:8888/admin-api/Features/gis_gantry_fj/JointFeature';

import MapPopup from './MapPopup.vue';
import VariableMessageSignPopup from './popup/VariableMessageSignPopup.vue';
import serviceAreaIcon from '@/assets/icon-service-area_tag@2x.png';
import gantryAreaIcon from '@/assets/56px-etc-tag@2x.png';
import tollStationIcon from '@/assets/tool-station-icon-tag@2x.png';
import cameraIcon from '@/assets/camera-icon-tag@2x.png';
import variableMessageSignIcon from '@/assets/variable-message-sign@2x.png';
import slowingTagIcon from '@/assets/icon-slowing_tag@2x.png';
import jammedTagIcon from '@/assets/icon-jamed_tag@2x.png';
import trafficEventTagIcon from '@/assets/icon-warning_tag@2x.png';
import warningGantryIcon from '@/assets/red-warning-gantry.png';
import warningTollStationIcon from '@/assets/red-warning-tollstation@2x.png';

// GeoJSON 文件路径（放在 public 下）
const FUZHOU_GEOJSON_URL = '/350100_full.json';
const FUZHOU_GANTRY_HEX_WHERE =
  "gantry_hex in ('350135','340235','340D13','350D13','340D14','350D14','341704','351704','351703','341703','350239','340239','35023B','34023B','340D16','350D16','352B01','350235','342B01','340233','350233','340D27','350D27','350D25','340D25','340821','350821','340237','350237','351601','341601','35023D','34023F','35023F','34023D','340D11','350D11','350D0F','340D0F','350D0D','340409','340D0B','340D0D','342B03','350D07','350D09','352B03','340241','350232','340F0D','340135','340D09','350F0D','350F0F','340232','340137','340F0F','350D0B','350241','340D07','350137','350403','340403','35012F','340405','34012B','340D19','340401','350407','350401','350133','340D1B','35012D','34012F','35012B','34012D','350131','340131','340407','340133','350D19','350D1B','350405','340D1D','350D1D','34081F','340231','35081F','350D05','350D1F','340D05','34081D','340D03','35022F','35022B','340D01','34022B','340D20','350D03','350D01','350D20','34022D','34022F','340D1F','35022D','35081D','350231','340D23','350D23','340D21','350D21','350823','340827','350829','350827','340D17','340823','340829','340825','350D15','350825','340D15','350D17','342B05','352B05','35082B','34082B','340245','341807','340139','350F01','341801','351801','34180B','350F11','351805','340F15','341805','351803','350F15','35180B','351807','340F13','340F01','350139','340F11','340243','341803','350F13','350245','350243','34013A','35013A','34180D','35180D','351809','341809','350409','35040B','350863','350B17','340129','350129','340863','34040B','340B17','350225','34081B','350227','340819','350229','350819','340227','340229','340225','35081B','350242','350D22','34081A','35081A','350D06','340B26','34081C','35081C')";
const FUZHOU_SERVICE_AREA_WHERE =
  "(name LIKE '%长乐服务区%' OR name LIKE '%龙田服务区%' OR name LIKE '%关东服务区%' OR name LIKE '%洋里服务区%' OR name LIKE '%桂湖服务区%' OR name LIKE '%上街服务区%' OR name LIKE '%青口服务区%' OR name LIKE '%连江服务区%' OR name LIKE '%大往服务区%' OR name LIKE '%白樟服务区%' OR name LIKE '%竹岐服务区%' OR name LIKE '%三山服务区%' OR name LIKE '%青云山服务区%' OR name LIKE '%透堡服务区%' OR name LIKE '%罗源服务区%' OR name LIKE '%梧桐服务区%')";
const FUZHOU_TOLL_STATION_WHERE =
  "code in ('6608','6607','6606','6803','6802','6805','6804','6801','3006','3004','3001','3002','3005','3003','2708','2710','2709','2703','2902','2903','2702','2904','2705','2901','2905','2701','2707','2704','2706','2715','4303','4302','4304','2711','2712','4301','9404','9403','9401','9402','6706','2802','2803','6707','2716','2713','6601','6603','6605','6604','6602','6705','6701','6704','6702','6709','6710','6703','6708','4305')";
const FUZHOU_CAMERA_WHERE = "org_name LIKE '%福州%'";
const FUZHOU_HIDDEN_CAMERA_GIDS = new Set(['34384', '34302', '32790']);
const FUZHOU_VARIABLE_MESSAGE_SIGN_WHERE =
  "1=1 AND maint_stat LIKE '%福州%'";
const FUZHOU_TRACK_CENTER = [119.4490115, 25.9421335];
const FUZHOU_TRACK_BOUNDS = {
  minLng: 118.38209,
  maxLng: 120.515933,
  minLat: 25.24989,
  maxLat: 26.634377,
};
const CHINA_BOUNDS = {
  minLng: 73,
  maxLng: 136,
  minLat: 3,
  maxLat: 54,
};
const CGCS2000_PROJ_CANDIDATES = [
  {
    name: 'cgcs2000-gk-3-cm120',
    def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
  },
  {
    name: 'cgcs2000-gk-6-cm117',
    def: '+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
  },
  {
    name: 'cgcs2000-gk-6-cm123',
    def: '+proj=tmerc +lat_0=0 +lon_0=123 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
  },
];

export default {
  emits: ['road-condition-marker-click', 'traffic-event-marker-click'],
  props: {
    id: {
      type: String,
      default: 'map',
    },
    trackPolylines: {
      type: Array,
      default: () => [],
    },
    roadConditionMarkers: {
      type: Array,
      default: () => [],
    },
    trafficEventMarkers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      mapContainerRef: null,
      map: '',
      jmap: null,
      // 影像底图
      imgLayer: null,
      imgLayer1: null,
      // 矢量底图
      vecLayer: null,
      jointLayer: null,

      layer2: null,
      trajectoryLayer: null,
      trajectoryArrowLayer: null,
      trajectoryPointLayer: null,
      roadConditionMarkerLayer: null,
      trafficEventMarkerLayer: null,
      lastPolylineData: [],
      lastPolylineOptions: {},
      lastPolylineArrowChains: [],
      lastPolylineZoom: null,
      mapMoveEndHandler: null,
      arrowAnimationFrameId: null,
      arrowAnimationOffset: 0,
      arrowAnimationLastTime: 0,
      polylineArrowFlowSpeed: 0.00018,
      polylineDotFlowSpeed: 0.00003,
      // 拥堵轨迹可调参数（仅 motionSymbol === 'dot' 生效）
      trafficJamMotionConfig: {
        lineSize: 7, // 轨迹线宽（默认比普通轨迹更粗）
        dotSize: 8, // 白色圆点大小
        dotSpacing: 0.0036, // 圆点间距（越小越密）
        dotFlowSpeed: 0.00002, // 圆点流动速度（越小越慢）
      },
      // 行政区 GeoJSON features（福州市各区县）
      fuzhouFeatures: [],
      // 用于“外暗内亮”的遮罩层
      dimLayer: null,
      polygonLocation: undefined,
      serviceAreaLayer: null,
      radioValue: '0',
      latitude: '24.181133',
      longitude: '119.557321',
      // 组件内可直接调整：轨迹线宽
      polylineSize: 5,
      // 统一点位图标尺寸（普通点位 + 实时路况点位）
      pointIconWidth: 40,
      pointIconHeight: 40,
      popupApp: null, // 👈 添加这一行
      infoWindowContainer: null, // 👈 这个也建议加上（虽然不是必须）
      // 存储不同类型的点位对象，用于控制显示/隐藏
      graphicsByType: {
        gantry: [],
        service: [],
        tollStation: [],
        camera: [],
        variableMessageSign: [],
      },
      // 按类型拆分图层，保证显隐控制稳定生效
      pointLayersByType: {
        gantry: null,
        service: null,
        tollStation: null,
        camera: null,
        variableMessageSign: null,
      },
      warningGantryLayer: null,
      warningTollStationLayer: null,
      // 存储点位可见性状态
      graphicsVisibility: {
        gantry: true,
        service: true,
        tollStation: true,
        camera: false,
        variableMessageSign: true,
      },
      warningFocusVisibilitySnapshot: null,
      // 文本标注默认隐藏
      labelVisible: false,
      clusteredPointTypes: [
        'gantry',
        'tollStation',
        'camera',
        'variableMessageSign',
      ],
      pointClusterMaxZoom: 16.8,
      pointClusterLastZoomByType: {
        gantry: null,
        tollStation: null,
        camera: null,
        variableMessageSign: null,
      },
      pointClusterLastLevelKeyByType: {
        gantry: '',
        tollStation: '',
        camera: '',
        variableMessageSign: '',
      },
      pointClusterHierarchyByType: {
        gantry: null,
        tollStation: null,
        camera: null,
        variableMessageSign: null,
      },
      pointLayerZIndexSeed: 9000,
      roadConditionMarkerVisible: true,
      trafficEventMarkerVisible: true,
    };
  },
  computed: {
    mapId() {
      return this.id || 'map';
    },
  },
  components: {},
  watch: {
    trackPolylines: {
      handler() {
        this.syncTrackPolylines();
      },
      deep: true,
      immediate: true,
    },
    roadConditionMarkers: {
      handler() {
        // 点位图加载已注释，暂停实时路况点位同步
        // this.syncRoadConditionMarkers();
      },
      deep: true,
      immediate: true,
    },
    trafficEventMarkers: {
      handler() {
        this.syncTrafficEventMarkers();
      },
      deep: true,
      immediate: true,
    },
  },
  async mounted() {
    await nextTick();
    this.initMap(); // 初始化页面后直接初始化地图
  },

  methods: {
    setPolylineArrowFlowSpeed(speed = 0.00008) {
      const nextSpeed = Number(speed);
      if (!Number.isFinite(nextSpeed) || nextSpeed < 0) return;

      this.polylineArrowFlowSpeed = nextSpeed;
      this.lastPolylineOptions = {
        ...this.lastPolylineOptions,
        arrowFlowSpeed: nextSpeed,
      };

      if (
        Array.isArray(this.lastPolylineData) &&
        this.lastPolylineData.length > 0 &&
        this.lastPolylineOptions?.showDirectionArrows !== false
      ) {
        this.renderPolylineArrows(this.lastPolylineArrowChains, {
          ...this.lastPolylineOptions,
          flowOffset: this.arrowAnimationOffset,
        });
        this.startPolylineArrowAnimation();
      }
    },
    // 对外暴露：动态调整拥堵轨迹参数
    // 可传字段：lineSize / dotSize / dotSpacing / dotFlowSpeed
    setTrafficJamMotionConfig(config = {}) {
      if (!config || typeof config !== 'object') return;

      const nextConfig = { ...this.trafficJamMotionConfig };
      const lineSize = Number(config.lineSize);
      const dotSize = Number(config.dotSize);
      const dotSpacing = Number(config.dotSpacing);
      const dotFlowSpeed = Number(config.dotFlowSpeed);

      if (Number.isFinite(lineSize) && lineSize > 0) {
        nextConfig.lineSize = lineSize;
      }
      if (Number.isFinite(dotSize) && dotSize > 0) {
        nextConfig.dotSize = dotSize;
      }
      if (Number.isFinite(dotSpacing) && dotSpacing > 0) {
        nextConfig.dotSpacing = dotSpacing;
      }
      if (Number.isFinite(dotFlowSpeed) && dotFlowSpeed >= 0) {
        nextConfig.dotFlowSpeed = dotFlowSpeed;
      }

      this.trafficJamMotionConfig = nextConfig;

      // 若当前正显示拥堵轨迹，实时重绘生效
      const hasDotMotion =
        Array.isArray(this.lastPolylineData) &&
        this.lastPolylineData.some((item) => item?.motionSymbol === 'dot');
      if (hasDotMotion) {
        this.setPolylines(this.lastPolylineData, {
          showDirectionArrows: false,
          motionSymbol: 'dot',
          size: this.trafficJamMotionConfig.lineSize,
          dotSize: this.trafficJamMotionConfig.dotSize,
          dotSpacing: this.trafficJamMotionConfig.dotSpacing,
          dotFlowSpeed: this.trafficJamMotionConfig.dotFlowSpeed,
        });
      }
    },
    hideGantry() {
      this.setGraphicsVisibility('gantry', false);
    },
    showGantry() {
      this.setGraphicsVisibility('gantry', true);
    },
    toggleGantry() {
      this.toggleGraphicsVisibility('gantry');
    },
    hideService() {
      this.setGraphicsVisibility('service', false);
    },
    showService() {
      this.setGraphicsVisibility('service', true);
    },
    toggleService() {
      this.toggleGraphicsVisibility('service');
    },
    hideTollStation() {
      this.setGraphicsVisibility('tollStation', false);
    },
    showTollStation() {
      this.setGraphicsVisibility('tollStation', true);
    },
    toggleTollStation() {
      this.toggleGraphicsVisibility('tollStation');
    },
    hideCamera() {
      this.setGraphicsVisibility('camera', false);
    },
    showCamera() {
      this.setGraphicsVisibility('camera', true);
    },
    toggleCamera() {
      this.toggleGraphicsVisibility('camera');
    },
    hideVariableMessageSign() {
      this.setGraphicsVisibility('variableMessageSign', false);
    },
    showVariableMessageSign() {
      this.setGraphicsVisibility('variableMessageSign', true);
    },
    toggleVariableMessageSign() {
      this.toggleGraphicsVisibility('variableMessageSign');
    },
    hideRoadConditionMarker() {
      this.setRoadConditionMarkerVisibility(false);
    },
    showRoadConditionMarker() {
      this.setRoadConditionMarkerVisibility(true);
    },
    toggleRoadConditionMarker() {
      this.setRoadConditionMarkerVisibility(!this.roadConditionMarkerVisible);
    },
    setRoadConditionMarkerVisibility(visible) {
      this.roadConditionMarkerVisible = Boolean(visible);
      // 点位图加载已注释，显隐切换仅保留状态同步
      // this.syncRoadConditionMarkers();
      console.log(
        `roadConditionMarker 点位${this.roadConditionMarkerVisible ? '显示' : '隐藏'}`
      );
    },
    getRoadConditionMarkerVisibility() {
      return this.roadConditionMarkerVisible;
    },
    hideTrafficEventMarker() {
      this.setTrafficEventMarkerVisibility(false);
    },
    showTrafficEventMarker() {
      this.setTrafficEventMarkerVisibility(true);
    },
    toggleTrafficEventMarker() {
      this.setTrafficEventMarkerVisibility(!this.trafficEventMarkerVisible);
    },
    setTrafficEventMarkerVisibility(visible) {
      this.trafficEventMarkerVisible = Boolean(visible);
      // 点位图加载已注释，显隐切换仅保留状态同步
      // this.syncTrafficEventMarkers();
      console.log(
        `trafficEventMarker 点位${this.trafficEventMarkerVisible ? '显示' : '隐藏'}`
      );
    },
    getTrafficEventMarkerVisibility() {
      return this.trafficEventMarkerVisible;
    },
    //地图初始化加载,
    async initMap() {
      try {
        // 检查 joint 对象是否存在
        if (!window.joint) {
          console.error('joint 对象未加载');
          return;
        }

        // 检查容器元素是否存在
        const container = this.$refs.mapContainerRef;
        if (!container) {
          console.error(`地图容器元素 ${this.mapId} 不存在`);
          return;
        }

        this.jmap = new joint.JMap(container.id || this.mapId, {
          // 将镜头初始化位置向左移动一些（经度减小），并稍微向上移动一点（纬度增加）
          center: [119.2, 26.02],
          zoom: 9.6, // 视角切到福州区域
          maxZoom: 18, // 最大缩放
          minZoom: 9.2, // 最小缩放

          // 禁用不需要的控件
          // slider: false, // 禁用滑块控件
          // rotate: false, // 禁用旋转控件
          // graphicsCollectionControl: true, // 禁用图层控制
          // control: false, // 禁用所有控件
          // graphicsCollection: [
          //   {
          //     // 名称
          //     name: '门架',
          //     id: 'test',
          //     // 服务地址
          //     url: 'http://35.80.236.142:8888/admin-api/Features/gis_gantry_fj/JointFeature?ak=0620aae950f94394ba7c4164100aa50b',
          //     // 上图标注
          //     label: 'gantry',
          //     // 样式配置, 详细配置可查看文档: joint.GraphicUtil.getGraphic里的symbolStyle参数
          //     style: {
          //       type: 'picturemarkersymbol', // 图片类型
          //       url: gantryAreaIcon, // 使用服务区图标
          //       width: 30, // 宽高
          //       height: 30,
          //     },
          //     query: {
          //       // 查询条件
          //       where:
          //         FUZHOU_GANTRY_HEX_WHERE,
          //       resultRecordCount: 100000,
          //     },
          //   },
          //   // 服务区图层
          //   {
          //     // 名称
          //     name: '服务区',
          //     id: 'firstMap',
          //     // 服务地址
          //     url: 'http://35.80.236.142:8888/admin-api/Features/gis_service_area_fj/JointFeature?ak=0620aae950f94394ba7c4164100aa50b',
          //     // 上图标注
          //     label: 'mc',
          //     // 样式配置
          //     style: {
          //       type: 'picturemarkersymbol', // 图片类型
          //       url: serviceAreaIcon, // 使用服务区图标
          //       width: 30, // 宽高
          //       height: 30,
          //     },
          //     query: {
          //       // 查询条件
          //       where: FUZHOU_SERVICE_AREA_WHERE,
          //       resultRecordCount: 100000,
          //     },
          //   },
          //   // 可以在这里添加更多图层配置
          // ],
        });

        // 检查 jmap 是否成功创建
        if (!this.jmap) {
          console.error('创建 joint.JMap 实例失败');
          return;
        }

        await this.jmap.init();

        // 检查 init 后 jmap 是否仍然存在
        if (!this.jmap) {
          console.error('初始化 joint.JMap 失败');
          return;
        }

        this.imgLayer = new joint.TiledMapLayer(pgis_img);
        this.imgLayer1 = new joint.TiledMapLayer(pgis_img1);

        this.vecLayer = new joint.CusTilesLayer(pgis_vec);

        this.imgLayer1.hide();

        // this.jointLayer = new joint.JointGraphicsLayer({
        //   label: true,
        //   labelOffset: [0, -40],
        //   lblTxt: 'mc',
        // });

        // 手动创建“服务区”图层
        // this.serviceAreaLayer = new joint.JointGraphicsLayer();
        // await serviceAreaLayer.init();
        // this.jmap.addLayer(this.jointLayer);

        this.jmap.addLayer(this.imgLayer);
        this.jmap.addLayer(this.vecLayer);
        this.jmap.addLayer(this.imgLayer1);
        // this.jmap.addLayer(this.serviceAreaLayer);

        let layer2 = new joint.GraphicsLayer();
        this.jmap.addLayer(layer2);
        this.layer2 = layer2;
        this.bindPolylineZoomRefresh();

        // 轨迹图层需先于点位图层创建，保证门架图标始终覆盖在轨迹线上方
        this.ensurePolylineLayer();

        // 当前恢复门架、服务区、收费站、摄像头、情报板点位图层
        this.pointLayersByType.gantry = new joint.GraphicsLayer();
        this.pointLayersByType.service = new joint.GraphicsLayer();
        this.pointLayersByType.tollStation = new joint.GraphicsLayer();
        this.pointLayersByType.camera = new joint.GraphicsLayer();
        this.pointLayersByType.variableMessageSign = new joint.GraphicsLayer();
        this.warningGantryLayer = new joint.GraphicsLayer();
        this.warningTollStationLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(this.pointLayersByType.gantry);
        this.jmap.addLayer(this.pointLayersByType.service);
        this.jmap.addLayer(this.pointLayersByType.tollStation);
        this.jmap.addLayer(this.pointLayersByType.camera);
        this.jmap.addLayer(this.pointLayersByType.variableMessageSign);
        this.jmap.addLayer(this.warningGantryLayer);
        this.jmap.addLayer(this.warningTollStationLayer);
        this.resetPointLayerZIndex();

        // ===== 修改开始：新增福州市外暗色遮罩图层 =====
        // 创建暗色遮罩图层（比边界线图层更靠上）
        const dimLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(dimLayer);
        this.dimLayer = dimLayer;
        // ===== 修改结束 =====

        // 加载福州行政区 GeoJSON 并绘制边界与遮罩
        await this.loadFuzhouGeojson();
        this.drawFuzhouBoundaryAndMask();
        this.syncTrackPolylines();
        await this.loadGantryFeatures();
        await this.loadServiceFeatures();
        await this.loadTollStationFeatures();
        await this.loadCameraFeatures();
        await this.loadVariableMessageSignFeatures();
        this.bringPointLayerTypeToTop('gantry');
        // 福州页交通事件改为使用 getTrafficFromChangwei 后，恢复事件点位上图。
        this.syncTrafficEventMarkers();
        this.bringTrajectoryPointLayerToTop();
        // this.bringRoadConditionMarkerLayerToTop();
        this.bringTrafficEventMarkerLayerToTop();
      } catch (error) {
        console.error('地图初始化失败:', error);
      }

      // 创建 InfoWindow 容器
      this.infoWindowContainer = document.createElement('div');
      this.infoWindowContainer.style.width = '500px';
      this.infoWindowContainer.style.height = '575px';

      // 确保 jmap 存在且已初始化
      if (this.jmap && this.jmap.customInfoWindowByHTML) {
        // 告诉 Joint 使用这个容器作为自定义弹窗
        this.jmap.customInfoWindowByHTML({
          dom: this.infoWindowContainer,
          offset: this.getInfoWindowOffset(false),
        });
      } else {
        console.error('jmap 未正确初始化，无法设置自定义弹窗');
        return;
      }

      // 保存当前实例引用
      const self = this;

      // 绑定地图点击事件
      this.jmap.onMapClick = function (evt) {
        self.jmap.getMap().infoWindow.hide();
        const graphic = self.jmap.getCurrentGraphic(evt);
        if (!graphic) return;

        const attrs =
          graphic?.values_?.attributes ||
          graphic?.get?.('attributes') ||
          graphic?.attributes ||
          {};
        if (attrs.isTrafficEventMarker) {
          self.$emit('traffic-event-marker-click', attrs);
          return;
        }
        // if (attrs.isRoadConditionMarker) {
        //   self.$emit('road-condition-marker-click', attrs);
        //   return;
        // }
        const geom = graphic.getGeometry(); // 建议用 getGeometry() 适配不同类型

        // 获取坐标点
        let coord;
        if (geom.getType() === 'Point') {
          coord = geom.getCoordinates();
        } else {
          // 线或面取中心点
          coord = geom.getInteriorPoint
            ? geom.getInteriorPoint().getCoordinates()
            : geom.getClosestPoint(evt.coordinate);
        }
        if (attrs.isPointCluster || attrs.isCameraCluster) {
          const rawMap = self.jmap?.getMap?.();
          const view = rawMap?.getView?.();
          const currentZoom = Number(view?.getZoom?.());
          const nextZoom = Number.isFinite(currentZoom)
            ? Math.min(18, currentZoom + 1.3)
            : 14;
          try {
            if (view?.animate) {
              view.animate({
                center: coord,
                zoom: nextZoom,
                duration: 260,
              });
            } else if (view?.setCenter && view?.setZoom) {
              view.setCenter(coord);
              view.setZoom(nextZoom);
            }
          } catch (error) {
            console.warn('聚合点缩放失败:', error);
          }
          return;
        }

        // 卸载旧实例
        if (self.popupApp) {
          self.popupApp.unmount();
          self.infoWindowContainer.innerHTML = ''; // 清空容器
        }

        console.log(attrs);
        if (!attrs.pop_type) {
          return;
        }
        const popupData = { ...attrs };
        if (attrs.pop_type === 'camera') {
          popupData.camera_num =
            attrs.camera_num ??
            attrs.cameraNum ??
            attrs.camera_no ??
            attrs.cameraNo ??
            '';
        }
        const isVariableMessageSign =
          attrs.pop_type === 'variableMessageSign';
        self.configureInfoWindowForPopup(isVariableMessageSign);
        const popupProps = isVariableMessageSign
          ? {
              title: self.getLayerType(attrs),
              data: popupData,
              onClose: () => {
                self.jmap.getMap().infoWindow.hide();
              },
            }
          : {
              title: self.getLayerType(attrs),
              type: attrs.pop_type,
              data: popupData,
              disableDrag: true,
              onClose: () => {
                self.jmap.getMap().infoWindow.hide();
              },
            };

        // 创建并挂载
        self.popupApp = createApp(
          isVariableMessageSign ? VariableMessageSignPopup : MapPopup,
          popupProps
        );

        // 关键：mount 到一个干净的 div 中
        self.popupApp.mount(self.infoWindowContainer);

        // 这里的 resize 很重要，要给够空间显示 ECharts
        // self.jmap.getMap().infoWindow.resize(380, 420);
        self.jmap.getMap().infoWindow.show(coord, 'bottom-center');
      };

      // await this.loadRemoteFeatures();
    },

    /**
     * 加载福州市行政区 GeoJSON 数据
     */
    async loadFuzhouGeojson() {
      try {
        const res = await fetch(FUZHOU_GEOJSON_URL);
        if (!res.ok) {
          console.error('加载福州 GeoJSON 失败:', res.statusText);
          return;
        }
        const geojson = await res.json();
        if (!geojson || !Array.isArray(geojson.features)) {
          console.error('福州 GeoJSON 数据格式不正确:', geojson);
          return;
        }
        this.fuzhouFeatures = geojson.features;
      } catch (e) {
        console.error('请求福州 GeoJSON 发生错误:', e);
      }
    },

    /**
     * 绘制福州边界线，并叠加外部暗色遮罩
     */
    drawFuzhouBoundaryAndMask() {
      if (!this.jmap || !this.layer2 || !this.fuzhouFeatures.length) {
        return;
      }

      const layer2 = this.layer2;
      const dimLayer = this.dimLayer;
      // 重绘前清理边界层与遮罩层
      if (layer2.clear) {
        layer2.clear();
      }
      if (dimLayer && dimLayer.clear) {
        dimLayer.clear();
      }

      // -----------------------------
      // 1. 绘制福州各区县边界线
      // -----------------------------
      const features = this.fuzhouFeatures;

      // 用于后续计算包络矩形
      let minLng = Infinity;
      let maxLng = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;

      // 收集环线用于“外暗内亮”反向遮罩
      const fuzhouOuterRings = [];
      const boundaryLineDefs = [];

      const closeRing = (ring) => {
        if (!Array.isArray(ring) || ring.length < 3) return null;
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (!first || !last) return null;
        if (first[0] === last[0] && first[1] === last[1]) {
          return ring;
        }
        return [...ring, first];
      };

      const getSignedArea = (ring) => {
        if (!Array.isArray(ring) || ring.length < 3) return 0;
        let area = 0;
        for (let i = 0; i < ring.length - 1; i++) {
          const [x1, y1] = ring[i];
          const [x2, y2] = ring[i + 1];
          area += x1 * y2 - x2 * y1;
        }
        return area / 2;
      };

      features.forEach((feat) => {
        const geom = feat.geometry || {};
        const props = feat.properties || {};
        const type = geom.type;
        const coords = geom.coordinates;

        if (!coords) return;

        const handleRing = (ring) => {
          if (!Array.isArray(ring) || !ring.length) return;
          const normalizedRing = closeRing(ring);
          if (!normalizedRing) return;

          // 记录包络范围
          normalizedRing.forEach((pt) => {
            const [lng, lat] = pt;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          });

          fuzhouOuterRings.push(normalizedRing);

          boundaryLineDefs.push({ ring: normalizedRing, props });
        };

        if (type === 'MultiPolygon') {
          // coordinates: [ polygon[], polygon[] ... ]
          coords.forEach((polygon) => {
            if (Array.isArray(polygon) && polygon[0]) {
              // 只用外环
              handleRing(polygon[0]);
            }
          });
        } else if (type === 'Polygon') {
          if (Array.isArray(coords) && coords[0]) {
            handleRing(coords[0]);
          }
        }
      });

      // 边界线延后绘制，保证不被遮罩压暗
      const drawBoundaryLines = (targetLayer) => {
        if (!targetLayer) return;
        boundaryLineDefs.forEach(({ ring, props }) => {
          try {
            const line = new joint.LineString(ring);
            const graphic = joint.GraphicUtil.getGraphic({
              geometry: line,
              symbolType: 'linesymbol',
              symbolStyle: {
                style: 'solid',
                size: 3,
                color: '#29ce82',
                alpha: 1,
              },
              infoTemplate: null,
              attributes: props,
            });
            targetLayer.add(graphic);
          } catch (error) {
            console.error('添加福州边界线失败:', error);
          }
        });
      };

      // -----------------------------
      // 2. 叠加“福州外暗色”遮罩
      // -----------------------------
      if (!dimLayer) return;
      if (
        !isFinite(minLng) ||
        !isFinite(maxLng) ||
        !isFinite(minLat) ||
        !isFinite(maxLat)
      ) {
        return;
      }

      // 优先使用“反向多环”精确遮罩
      // 优先尝试：外环 + 福州边界洞（精确到行政区边界）
      try {
        const worldOuterRing = [
          [-180, -85],
          [180, -85],
          [180, 85],
          [-180, 85],
          [-180, -85],
        ];

        const normalizedOuterRing =
          getSignedArea(worldOuterRing) < 0
            ? worldOuterRing
            : [...worldOuterRing].reverse();
        const normalizedHoleRings = fuzhouOuterRings.map((ring) =>
          getSignedArea(ring) > 0 ? ring : [...ring].reverse()
        );

        const inverseRings = [normalizedOuterRing, ...normalizedHoleRings];
        const maskPolygon = new joint.Polygon(inverseRings);
        const maskGraphic = joint.GraphicUtil.getGraphic({
          geometry: maskPolygon,
          symbolType: 'fillsymbol',
          symbolStyle: {
            color: '#000000',
            alpha: 0.55,
          },
          infoTemplate: null,
          attributes: {},
        });
        dimLayer.add(maskGraphic);
        drawBoundaryLines(dimLayer);
        return;
      } catch (e) {
        console.warn('反向多环遮罩失败，降级为矩形遮罩:', e);
      }

      // 反向多环失败时回退为矩形遮罩
      // 回退：包络矩形遮罩（保证兼容）
      const padding = 0.5;
      const outerMinLng = minLng - padding;
      const outerMaxLng = maxLng + padding;
      const outerMinLat = minLat - padding;
      const outerMaxLat = maxLat + padding;
      const outerRing = [
        [outerMinLng, outerMinLat],
        [outerMaxLng, outerMinLat],
        [outerMaxLng, outerMaxLat],
        [outerMinLng, outerMaxLat],
        [outerMinLng, outerMinLat],
      ];

      try {
        const outerPolygon = new joint.Polygon(outerRing);
        const outerGraphic = joint.GraphicUtil.getGraphic({
          geometry: outerPolygon,
          symbolType: 'fillsymbol',
          symbolStyle: {
            color: '#000000',
            alpha: 0.6,
          },
          infoTemplate: null,
          attributes: {},
        });
        dimLayer.add(outerGraphic);
        drawBoundaryLines(dimLayer);
      } catch (e) {
        console.error('添加外部暗色遮罩失败:', e);
        drawBoundaryLines(layer2);
      }
    },
    parsePathCoordinates(path) {
      let rawPoints = [];
      if (Array.isArray(path)) {
        rawPoints = path;
      } else if (typeof path === 'string') {
        const trimmedPath = path.trim();
        if (!trimmedPath) return [];

        try {
          const parsed = JSON.parse(trimmedPath);
          rawPoints = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          rawPoints = trimmedPath
            .split(/\s*,\s*/)
            .map((segment) => segment.trim())
            .filter(Boolean);
        }
      } else {
        return [];
      }

      const normalizedPoints = rawPoints
        .map((item) => {
          if (
            Array.isArray(item) &&
            item.length >= 2 &&
            Number.isFinite(Number(item[0])) &&
            Number.isFinite(Number(item[1]))
          ) {
            return [Number(item[0]), Number(item[1])];
          }

          if (typeof item === 'string') {
            const trimmed = item.trim();
            if (!trimmed) return null;

            const [lng, lat] = trimmed.split(/\s+/);
            if (Number.isFinite(Number(lng)) && Number.isFinite(Number(lat))) {
              return [Number(lng), Number(lat)];
            }
          }

          return null;
        })
        .filter((item) => Array.isArray(item) && item.length >= 2);
      if (normalizedPoints.length === 0) return [];

      const transformer =
        this.resolveTrackCoordinateTransformer(normalizedPoints);
      try {
        return normalizedPoints
          .map((point) => transformer(point))
          .filter(
            (point) =>
              Array.isArray(point) &&
              point.length >= 2 &&
              Number.isFinite(Number(point[0])) &&
              Number.isFinite(Number(point[1]))
          );
      } catch (error) {
        console.error('轨迹坐标转换失败:', error, path);
        return [];
      }
    },
    parseTrackPointCoordinates(point) {
      if (point === null || point === undefined) return [];

      const parseObjectPoint = (value) => {
        const lng = Number(value?.lng ?? value?.lon ?? value?.longitude);
        const lat = Number(value?.lat ?? value?.latitude);
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          return [[lng, lat]];
        }
        return [];
      };

      if (Array.isArray(point)) {
        // [lng, lat]
        if (
          point.length >= 2 &&
          Number.isFinite(Number(point[0])) &&
          Number.isFinite(Number(point[1]))
        ) {
          return this.parsePathCoordinates([point]);
        }
        // [[lng, lat], ...]
        if (point.length > 0 && Array.isArray(point[0])) {
          return this.parsePathCoordinates(point);
        }
      }

      if (typeof point === 'object') {
        const objectPoints = parseObjectPoint(point);
        return objectPoints.length > 0
          ? this.parsePathCoordinates(objectPoints)
          : [];
      }

      if (typeof point !== 'string') return [];

      const trimmed = point.trim();
      if (!trimmed) return [];

      // 优先 JSON 解析
      try {
        const parsed = JSON.parse(trimmed);
        return this.parseTrackPointCoordinates(parsed);
      } catch (error) {
        // 非 JSON，继续按文本规则解析
      }

      // 兼容 "lng,lat" / "lng lat" / "lng,lat;lng,lat" 等格式
      const pairs = trimmed
        .split(/[;|]/)
        .map((segment) => segment.trim())
        .filter(Boolean)
        .map((segment) => {
          const tokens = segment
            .split(/[,\s]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          if (tokens.length < 2) return null;
          const lng = Number(tokens[0]);
          const lat = Number(tokens[1]);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
          return [lng, lat];
        })
        .filter(Boolean);

      return pairs.length > 0 ? this.parsePathCoordinates(pairs) : [];
    },
    resolveTrackCoordinateTransformer(points = []) {
      const validPoints = Array.isArray(points) ? points : [];
      if (validPoints.length === 0) {
        return (point) => [Number(point?.[0]), Number(point?.[1])];
      }

      const strategies = [
        {
          name: 'wgs84-direct',
          convert: ([x, y]) => [x, y],
        },
        {
          name: 'wgs84-swapped',
          convert: ([x, y]) => [y, x],
        },
        ...this.createProjectedTrackStrategies(),
      ];

      let bestStrategy = strategies[0];
      let bestScore = -Infinity;

      strategies.forEach((strategy) => {
        const score = this.scoreTrackCoordinateStrategy(validPoints, strategy);
        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      });

      return (point) => {
        const x = Number(point?.[0]);
        const y = Number(point?.[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const converted = bestStrategy.convert([x, y]);
        if (!this.isValidLngLatPoint(converted)) return null;
        return converted;
      };
    },
    createProjectedTrackStrategies() {
      const strategies = [];
      CGCS2000_PROJ_CANDIDATES.forEach((candidate) => {
        const inverseConvert = proj4(candidate.def, 'EPSG:4326');
        strategies.push({
          name: `${candidate.name}-xy`,
          convert: ([x, y]) => {
            const projected = this.normalizeProjectedPair(x, y);
            return projected ? inverseConvert.forward(projected) : null;
          },
        });
        strategies.push({
          name: `${candidate.name}-yx`,
          convert: ([x, y]) => {
            const projected = this.normalizeProjectedPair(y, x);
            return projected ? inverseConvert.forward(projected) : null;
          },
        });
      });
      return strategies;
    },
    normalizeProjectedPair(easting, northing) {
      const x = Number(easting);
      const y = Number(northing);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

      const normalizedX = this.stripGaussZonePrefix(x);
      if (!Number.isFinite(normalizedX)) return null;

      if (Math.abs(normalizedX) > 1000000 || Math.abs(y) > 10000000) {
        return null;
      }

      return [normalizedX, y];
    },
    stripGaussZonePrefix(value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) return NaN;
      const absValue = Math.abs(numericValue);
      if (absValue < 1000000) return numericValue;

      const zoneFactor = Math.floor(absValue / 1000000);
      const stripped = absValue - zoneFactor * 1000000;
      if (stripped >= 100000 && stripped <= 900000) {
        return Math.sign(numericValue) * stripped;
      }
      return numericValue;
    },
    scoreTrackCoordinateStrategy(points = [], strategy) {
      if (!strategy || typeof strategy.convert !== 'function') return -Infinity;

      const sample = points.slice(0, 8);
      let validCount = 0;
      let fuzhouCount = 0;
      let chinaCount = 0;
      let totalDistancePenalty = 0;

      sample.forEach((point) => {
        const converted = strategy.convert([
          Number(point?.[0]),
          Number(point?.[1]),
        ]);
        if (!this.isValidLngLatPoint(converted)) return;

        validCount += 1;
        if (this.isPointInsideBounds(converted, CHINA_BOUNDS)) {
          chinaCount += 1;
        }
        if (this.isPointInsideBounds(converted, FUZHOU_TRACK_BOUNDS)) {
          fuzhouCount += 1;
        }

        const lng = Number(converted[0]);
        const lat = Number(converted[1]);
        totalDistancePenalty += Math.hypot(
          lng - FUZHOU_TRACK_CENTER[0],
          lat - FUZHOU_TRACK_CENTER[1]
        );
      });

      if (validCount === 0) return -Infinity;

      return (
        validCount * 20 +
        chinaCount * 10 +
        fuzhouCount * 50 -
        totalDistancePenalty
      );
    },
    isValidLngLatPoint(point) {
      if (!Array.isArray(point) || point.length < 2) return false;
      const lng = Number(point[0]);
      const lat = Number(point[1]);
      return (
        Number.isFinite(lng) &&
        Number.isFinite(lat) &&
        Math.abs(lng) <= 180 &&
        Math.abs(lat) <= 90
      );
    },
    isPointInsideBounds(point, bounds) {
      if (!this.isValidLngLatPoint(point) || !bounds) return false;
      const lng = Number(point[0]);
      const lat = Number(point[1]);
      return (
        lng >= bounds.minLng &&
        lng <= bounds.maxLng &&
        lat >= bounds.minLat &&
        lat <= bounds.maxLat
      );
    },
    isSameTrackPoint(pointA, pointB, tolerance = 1e-6) {
      const ax = Number(pointA?.[0]);
      const ay = Number(pointA?.[1]);
      const bx = Number(pointB?.[0]);
      const by = Number(pointB?.[1]);
      if (
        !Number.isFinite(ax) ||
        !Number.isFinite(ay) ||
        !Number.isFinite(bx) ||
        !Number.isFinite(by)
      ) {
        return false;
      }
      return Math.hypot(ax - bx, ay - by) <= tolerance;
    },
    buildPolylineMetrics(coordinates = []) {
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return {
          totalLength: 0,
          segments: [],
        };
      }

      const segments = [];
      let travelled = 0;

      for (let i = 1; i < coordinates.length; i += 1) {
        const start = coordinates[i - 1];
        const end = coordinates[i];
        const x1 = Number(start?.[0]);
        const y1 = Number(start?.[1]);
        const x2 = Number(end?.[0]);
        const y2 = Number(end?.[1]);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        if (!Number.isFinite(length) || length <= 0) continue;

        segments.push({
          start: [x1, y1],
          end: [x2, y2],
          length,
          startDistance: travelled,
          endDistance: travelled + length,
          direction: [dx / length, dy / length],
        });
        travelled += length;
      }

      return {
        totalLength: travelled,
        segments,
      };
    },
    buildPolylineArrowChains(segments = []) {
      const chains = [];
      let currentChain = null;

      segments.forEach((segment) => {
        const coordinates = Array.isArray(segment?.coordinates)
          ? segment.coordinates
          : [];
        if (coordinates.length < 2) return;

        const normalizedCoords = coordinates.map((point) => [
          Number(point[0]),
          Number(point[1]),
        ]);

        if (!currentChain) {
          currentChain = normalizedCoords.slice();
          return;
        }

        const currentEnd = currentChain[currentChain.length - 1];
        const nextStart = normalizedCoords[0];
        const nextEnd = normalizedCoords[normalizedCoords.length - 1];

        if (this.isSameTrackPoint(currentEnd, nextStart)) {
          currentChain.push(...normalizedCoords.slice(1));
          return;
        }

        if (this.isSameTrackPoint(currentEnd, nextEnd)) {
          currentChain.push(...normalizedCoords.slice(0, -1).reverse());
          return;
        }

        const metrics = this.buildPolylineMetrics(currentChain);
        chains.push({
          coordinates: currentChain,
          totalLength: metrics.totalLength,
          segments: metrics.segments,
        });
        currentChain = normalizedCoords.slice();
      });

      if (currentChain?.length >= 2) {
        const metrics = this.buildPolylineMetrics(currentChain);
        chains.push({
          coordinates: currentChain,
          totalLength: metrics.totalLength,
          segments: metrics.segments,
        });
      }

      return chains.filter((item) => item.totalLength > 0);
    },
    ensurePolylineLayer() {
      if (!this.jmap) return;
      if (!this.trajectoryLayer) {
        this.trajectoryLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(this.trajectoryLayer);
      }
      if (!this.trajectoryArrowLayer) {
        this.trajectoryArrowLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(this.trajectoryArrowLayer);
      }
      if (!this.trajectoryPointLayer) {
        this.trajectoryPointLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(this.trajectoryPointLayer);
      }
      if (!this.roadConditionMarkerLayer) {
        this.roadConditionMarkerLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(this.roadConditionMarkerLayer);
      }
      if (!this.trafficEventMarkerLayer) {
        this.trafficEventMarkerLayer = new joint.GraphicsLayer();
        this.jmap.addLayer(this.trafficEventMarkerLayer);
      }
    },
    bringTrajectoryPointLayerToTop() {
      if (!this.jmap || !this.trajectoryPointLayer) return;

      const pointLayer = this.trajectoryPointLayer;
      let moved = false;

      try {
        if (typeof pointLayer.setZIndex === 'function') {
          pointLayer.setZIndex(9999);
          moved = true;
        }
      } catch (error) {
        console.warn('设置缓行拥堵 tag 图层 zIndex 失败:', error);
      }
      if (moved) return;

      try {
        const rawLayer =
          pointLayer.getLayer?.() ||
          pointLayer.layer ||
          pointLayer.olLayer ||
          pointLayer._layer;
        if (rawLayer && typeof rawLayer.setZIndex === 'function') {
          rawLayer.setZIndex(9999);
          moved = true;
        }
      } catch (error) {
        console.warn('设置底层缓行拥堵 tag 图层 zIndex 失败:', error);
      }
      if (moved) return;

      try {
        if (
          typeof this.jmap.removeLayer === 'function' &&
          typeof this.jmap.addLayer === 'function'
        ) {
          this.jmap.removeLayer(pointLayer);
          this.jmap.addLayer(pointLayer);
        }
      } catch (error) {
        console.warn('调整缓行拥堵 tag 图层顺序失败:', error);
      }
    },
    bringRoadConditionMarkerLayerToTop() {
      if (!this.jmap || !this.roadConditionMarkerLayer) return;

      const markerLayer = this.roadConditionMarkerLayer;
      let moved = false;

      try {
        if (typeof markerLayer.setZIndex === 'function') {
          markerLayer.setZIndex(10001);
          moved = true;
        }
      } catch (error) {
        console.warn('设置实时路况 tag 图层 zIndex 失败:', error);
      }
      if (moved) return;

      try {
        const rawLayer =
          markerLayer.getLayer?.() ||
          markerLayer.layer ||
          markerLayer.olLayer ||
          markerLayer._layer;
        if (rawLayer && typeof rawLayer.setZIndex === 'function') {
          rawLayer.setZIndex(10001);
          moved = true;
        }
      } catch (error) {
        console.warn('设置底层实时路况 tag 图层 zIndex 失败:', error);
      }
      if (moved) return;

      try {
        if (
          typeof this.jmap.removeLayer === 'function' &&
          typeof this.jmap.addLayer === 'function'
        ) {
          this.jmap.removeLayer(markerLayer);
          this.jmap.addLayer(markerLayer);
        }
      } catch (error) {
        console.warn('调整实时路况 tag 图层顺序失败:', error);
      }
    },
    bringTrafficEventMarkerLayerToTop() {
      if (!this.jmap || !this.trafficEventMarkerLayer) return;

      const markerLayer = this.trafficEventMarkerLayer;
      let moved = false;

      try {
        if (typeof markerLayer.setZIndex === 'function') {
          markerLayer.setZIndex(10002);
          moved = true;
        }
      } catch (error) {
        console.warn('设置交通事件 tag 图层 zIndex 失败:', error);
      }
      if (moved) return;

      try {
        const rawLayer =
          markerLayer.getLayer?.() ||
          markerLayer.layer ||
          markerLayer.olLayer ||
          markerLayer._layer;
        if (rawLayer && typeof rawLayer.setZIndex === 'function') {
          rawLayer.setZIndex(10002);
          moved = true;
        }
      } catch (error) {
        console.warn('设置底层交通事件 tag 图层 zIndex 失败:', error);
      }
      if (moved) return;

      try {
        if (
          typeof this.jmap.removeLayer === 'function' &&
          typeof this.jmap.addLayer === 'function'
        ) {
          this.jmap.removeLayer(markerLayer);
          this.jmap.addLayer(markerLayer);
        }
      } catch (error) {
        console.warn('调整交通事件 tag 图层顺序失败:', error);
      }
    },
    normalizeRoadConditionMarkerType(item = {}) {
      const rawType = String(
        item?.type || item?.eventType || item?.status || ''
      )
        .trim()
        .toLowerCase();
      if (rawType.includes('拥堵') || rawType === '0') return 'jammed';
      if (rawType.includes('缓行') || rawType === '1') return 'slow';
      return '';
    },
    getRoadConditionMarkerIcon(item = {}) {
      return this.normalizeRoadConditionMarkerType(item) === 'jammed'
        ? jammedTagIcon
        : slowingTagIcon;
    },
    // 绘制实时路况图标
    syncRoadConditionMarkers() {
      this.ensurePolylineLayer();
      if (!this.roadConditionMarkerLayer) return;

      this.roadConditionMarkerLayer.clear();
      if (!this.roadConditionMarkerVisible) return;
      const source = Array.isArray(this.roadConditionMarkers)
        ? this.roadConditionMarkers
        : [];

      source.forEach((item) => {
        const pointCoordinates = this.parseTrackPointCoordinates(item?.point);
        pointCoordinates.forEach((coordinate) => {
          const [lng, lat] = coordinate || [];
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          try {
            const pointGraphic = joint.GraphicUtil.getGraphic({
              geometry: new joint.Point([lng, lat]),
              symbolType: 'picturemarkersymbol',
              symbolStyle: {
                url: this.getRoadConditionMarkerIcon(item),
                width: this.pointIconWidth,
                height: this.pointIconHeight,
              },
              infoTemplate: null,
              attributes: {
                ...(item || {}),
                isRoadConditionMarker: true,
              },
            });
            this.roadConditionMarkerLayer?.add(pointGraphic);
          } catch (error) {
            console.warn('实时路况 point 图标绘制失败:', error, item?.point);
          }
        });
      });
      this.bringRoadConditionMarkerLayerToTop();
    },
    getTrafficEventMarkerCoordinates(item = {}) {
      const directLng = Number(item?.lon ?? item?.lng ?? item?.longitude);
      const directLat = Number(item?.lat ?? item?.latitude);
      if (Number.isFinite(directLng) && Number.isFinite(directLat)) {
        return [[directLng, directLat]];
      }
      return this.parseTrackPointCoordinates(
        item?.point ?? item?.location ?? item?.coord
      );
    },
    getTrafficEventFocusCoordinate(item = {}) {
      const targetSignature = String(
        item?.eventSignature || item?.originalData?.eventSignature || ''
      ).trim();

      const matchedMarker = targetSignature
        ? (this.trafficEventMarkers || []).find(
            (marker) =>
              String(marker?.eventSignature || '').trim() === targetSignature
          ) || null
        : null;

      const candidateList = [
        matchedMarker,
        item,
        item?.originalData,
        matchedMarker?.originalData,
      ];

      for (const candidate of candidateList) {
        const coordinates = this.getTrafficEventMarkerCoordinates(candidate);
        if (Array.isArray(coordinates) && coordinates.length > 0) {
          const [lng, lat] = coordinates[0] || [];
          if (Number.isFinite(Number(lng)) && Number.isFinite(Number(lat))) {
            return [Number(lng), Number(lat)];
          }
        }
      }

      return null;
    },
    focusTrafficEventMarker(item = {}, options = {}) {
      if (!this.jmap) return false;

      const coordinate = this.getTrafficEventFocusCoordinate(item);
      if (!Array.isArray(coordinate) || coordinate.length < 2) return false;

      const rawMap = this.jmap.getMap?.();
      const view = rawMap?.getView?.();
      const currentZoom = Number(
        view?.getZoom?.() ?? this.jmap?.getZoom?.() ?? this.jmap?.getLevel?.()
      );
      const targetZoom = Number(options.zoom ?? 15.2);
      const nextZoom = Number.isFinite(currentZoom)
        ? Math.max(currentZoom, targetZoom)
        : targetZoom;

      this.bringTrafficEventMarkerLayerToTop();

      try {
        if (view?.animate) {
          view.animate({
            center: coordinate,
            zoom: nextZoom,
            duration: options.duration ?? 480,
          });
          return true;
        }

        if (view?.setCenter) {
          view.setCenter(coordinate);
        } else if (typeof this.jmap.setCenter === 'function') {
          this.jmap.setCenter(coordinate);
        } else if (typeof this.jmap.centerAt === 'function') {
          this.jmap.centerAt(coordinate);
        }

        if (view?.setZoom) {
          view.setZoom(nextZoom);
        } else if (typeof this.jmap.setZoom === 'function') {
          this.jmap.setZoom(nextZoom);
        }

        return true;
      } catch (error) {
        console.warn('交通事件点位聚焦失败:', error, item);
        return false;
      }
    },
    getTrafficEventAnchorScreenPoint(item = {}, options = {}) {
      if (!this.jmap) return null;

      const coordinate = this.getTrafficEventFocusCoordinate(item);
      if (!Array.isArray(coordinate) || coordinate.length < 2) return null;

      try {
        const rawMap = this.jmap.getMap?.();
        const pixel = rawMap?.getPixelFromCoordinate?.(coordinate);
        const x = Number(Array.isArray(pixel) ? pixel[0] : undefined);
        const y = Number(Array.isArray(pixel) ? pixel[1] : undefined);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const margin = Math.max(0, Number(options.margin) || 0);
        const markerHalfWidth = Math.max(
          12,
          Math.round((Number(this.pointIconWidth) || 24) / 2)
        );
        const markerHalfHeight = Math.max(
          16,
          Math.round((Number(this.pointIconHeight) || 32) / 2)
        );

        return {
          x,
          y,
          bounds: {
            left: x - markerHalfWidth - margin,
            top: y - markerHalfHeight - margin,
            right: x + markerHalfWidth + margin,
            bottom: y + markerHalfHeight + margin,
          },
        };
      } catch (error) {
        console.warn('交通事件锚点屏幕坐标计算失败:', error, item);
        return null;
      }
    },
    syncTrafficEventMarkers() {
      this.ensurePolylineLayer();
      if (!this.trafficEventMarkerLayer) return;

      this.trafficEventMarkerLayer.clear();
      if (!this.trafficEventMarkerVisible) return;
      const source = Array.isArray(this.trafficEventMarkers)
        ? this.trafficEventMarkers
        : [];

      source.forEach((item) => {
        const pointCoordinates = this.getTrafficEventMarkerCoordinates(item);
        pointCoordinates.forEach((coordinate) => {
          const [lng, lat] = coordinate || [];
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          try {
            const pointGraphic = joint.GraphicUtil.getGraphic({
              geometry: new joint.Point([lng, lat]),
              symbolType: 'picturemarkersymbol',
              symbolStyle: {
                url: trafficEventTagIcon,
                width: this.pointIconWidth,
                height: this.pointIconHeight,
              },
              infoTemplate: null,
              attributes: {
                ...(item || {}),
                isTrafficEventMarker: true,
              },
            });
            this.trafficEventMarkerLayer?.add(pointGraphic);
          } catch (error) {
            console.warn('交通事件 point 图标绘制失败:', error, item);
          }
        });
      });
      this.bringTrafficEventMarkerLayerToTop();
    },
    clearPolylines() {
      this.ensurePolylineLayer();
      this.lastPolylineData = [];
      this.lastPolylineOptions = {};
      this.lastPolylineZoom = this.getCurrentMapZoom();
      this.lastPolylineArrowChains = [];
      this.stopPolylineArrowAnimation();
      if (this.trajectoryLayer?.clear) {
        this.trajectoryLayer.clear();
      }
      if (this.trajectoryArrowLayer?.clear) {
        this.trajectoryArrowLayer.clear();
      }
      if (this.trajectoryPointLayer?.clear) {
        this.trajectoryPointLayer.clear();
      }
    },
    getCurrentMapZoom() {
      try {
        const rawMap = this.jmap?.getMap?.();
        const view = rawMap?.getView?.();
        const zoom = view?.getZoom?.();
        return Number.isFinite(zoom) ? zoom : null;
      } catch (error) {
        console.warn('获取地图缩放级别失败:', error);
        return null;
      }
    },
    getZoomAdaptiveArrowOptions(options = {}) {
      const currentZoom = this.getCurrentMapZoom();
      const baseZoom = Number(options.arrowBaseZoom ?? 13.2);
      const arrowScale = Number(options.arrowScale ?? 1.35);
      const zoomDelta =
        Number.isFinite(currentZoom) && Number.isFinite(baseZoom)
          ? baseZoom - currentZoom
          : 0;
      const geoScale = Math.min(3.6, Math.max(0.35, 2 ** zoomDelta));
      const sizeScale = Math.min(2.1, Math.max(0.9, 1 + zoomDelta * 0.2));
      const strokeScale = Math.min(1.35, Math.max(0.45, 1 - zoomDelta * 0.22));

      const scaledSpacing = Number(options.arrowSpacing) * geoScale;
      const scaledLength = Number(options.arrowLength) * geoScale * arrowScale;
      const scaledWidth = Number(options.arrowWidth) * geoScale * arrowScale;
      const scaledMinLength =
        Number(options.arrowMinLength) * geoScale * arrowScale;
      const scaledMinWidth =
        Number(options.arrowMinWidth) * geoScale * arrowScale;
      const scaledMinSize = Math.max(
        2,
        Math.round(
          Number(options.arrowMinSize) *
            strokeScale *
            Math.min(1.15, arrowScale)
        )
      );

      return {
        ...options,
        currentZoom,
        arrowSpacing: Number.isFinite(scaledSpacing) ? scaledSpacing : 0.0032,
        arrowLength: Number.isFinite(scaledLength) ? scaledLength : 0.00069,
        arrowWidth: Number.isFinite(scaledWidth) ? scaledWidth : 0.00049,
        arrowMinLength: Number.isFinite(scaledMinLength)
          ? scaledMinLength
          : 0.00065,
        arrowMinWidth: Number.isFinite(scaledMinWidth)
          ? scaledMinWidth
          : 0.00025,
        arrowMinSize: scaledMinSize,
        arrowSizeFactor:
          Number(options.arrowSizeFactor) *
          Math.min(1.35, Math.max(0.38, strokeScale)),
      };
    },
    bindPolylineZoomRefresh() {
      const rawMap = this.jmap?.getMap?.();
      if (!rawMap?.on || this.mapMoveEndHandler) return;

      this.mapMoveEndHandler = () => {
        const zoom = this.getCurrentMapZoom();
        if (
          !Array.isArray(this.lastPolylineData) ||
          this.lastPolylineData.length === 0 ||
          !Number.isFinite(zoom) ||
          zoom === this.lastPolylineZoom
        ) {
          this.refreshVisiblePointClustersForZoom(zoom, false);
          return;
        }
        this.drawPolylines(this.lastPolylineData, {
          ...this.lastPolylineOptions,
          clearFirst: true,
        });
        this.refreshVisiblePointClustersForZoom(zoom, false);
      };

      rawMap.on('moveend', this.mapMoveEndHandler);
    },
    getPolylineTotalLength(coordinates = []) {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return 0;
      let total = 0;
      for (let i = 1; i < coordinates.length; i += 1) {
        const prev = coordinates[i - 1];
        const curr = coordinates[i];
        const dx = Number(curr?.[0]) - Number(prev?.[0]);
        const dy = Number(curr?.[1]) - Number(prev?.[1]);
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue;
        total += Math.hypot(dx, dy);
      }
      return total;
    },
    getPointAndDirectionOnPolyline(coordinates = [], distance = 0) {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
      let travelled = 0;
      for (let i = 1; i < coordinates.length; i += 1) {
        const start = coordinates[i - 1];
        const end = coordinates[i];
        const dx = Number(end?.[0]) - Number(start?.[0]);
        const dy = Number(end?.[1]) - Number(start?.[1]);
        const segmentLength = Math.hypot(dx, dy);
        if (!Number.isFinite(segmentLength) || segmentLength <= 0) continue;
        if (travelled + segmentLength >= distance) {
          const remain = distance - travelled;
          const ratio = remain / segmentLength;
          const px = Number(start[0]) + dx * ratio;
          const py = Number(start[1]) + dy * ratio;
          const ux = dx / segmentLength;
          const uy = dy / segmentLength;
          return {
            point: [px, py],
            direction: [ux, uy],
          };
        }
        travelled += segmentLength;
      }
      const secondLast = coordinates[coordinates.length - 2];
      const last = coordinates[coordinates.length - 1];
      const dx = Number(last?.[0]) - Number(secondLast?.[0]);
      const dy = Number(last?.[1]) - Number(secondLast?.[1]);
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length <= 0) return null;
      return {
        point: [Number(last[0]), Number(last[1])],
        direction: [dx / length, dy / length],
      };
    },
    getPointAndDirectionOnPreparedPolyline(segments = [], distance = 0) {
      if (!Array.isArray(segments) || segments.length === 0) return null;

      const targetDistance = Math.max(0, Number(distance) || 0);
      for (let i = 0; i < segments.length; i += 1) {
        const segment = segments[i];
        if (segment.endDistance < targetDistance) continue;

        const remain = targetDistance - segment.startDistance;
        const ratio =
          segment.length > 0
            ? Math.min(1, Math.max(0, remain / segment.length))
            : 0;

        return {
          point: [
            segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
            segment.start[1] + (segment.end[1] - segment.start[1]) * ratio,
          ],
          direction: segment.direction,
        };
      }

      const lastSegment = segments[segments.length - 1];
      return {
        point: lastSegment.end,
        direction: lastSegment.direction,
      };
    },
    addArrowChevronGraphic(
      point,
      direction,
      color,
      alpha,
      arrowSize,
      arrowLength,
      arrowHalfWidth
    ) {
      const [x, y] = point || [];
      const [ux, uy] = direction || [];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      if (!Number.isFinite(ux) || !Number.isFinite(uy)) return false;

      const px = -uy;
      const py = ux;
      const backX = x - ux * arrowLength;
      const backY = y - uy * arrowLength;
      const left = [backX + px * arrowHalfWidth, backY + py * arrowHalfWidth];
      const tip = [x, y];
      const right = [backX - px * arrowHalfWidth, backY - py * arrowHalfWidth];

      try {
        const leftArm = joint.GraphicUtil.getGraphic({
          geometry: new joint.LineString([left, tip]),
          symbolType: 'linesymbol',
          symbolStyle: {
            style: 'solid',
            size: arrowSize,
            color,
            alpha,
          },
          infoTemplate: null,
          attributes: { isDirectionArrow: true },
        });
        const rightArm = joint.GraphicUtil.getGraphic({
          geometry: new joint.LineString([right, tip]),
          symbolType: 'linesymbol',
          symbolStyle: {
            style: 'solid',
            size: arrowSize,
            color,
            alpha,
          },
          infoTemplate: null,
          attributes: { isDirectionArrow: true },
        });
        this.trajectoryArrowLayer?.add(leftArm);
        this.trajectoryArrowLayer?.add(rightArm);
        return true;
      } catch (error) {
        console.warn('方向箭头 chevron 绘制失败:', error);
        return false;
      }
    },
    addDirectionalArrows(
      coordinates = [],
      {
        alpha = 1,
        lineSize = 6,
        flowOffset = 0,
        applyHeadFade = false,
        applyTailFade = false,
        totalLength,
        preparedSegments = [],
        arrowSpacing,
        arrowColor = '#ffffff',
        arrowLengthFactor = 0.55,
        arrowMinLength = 0.00065,
        arrowWidthFactor = 0.42,
        arrowMinWidth = 0.00025,
        arrowLength,
        arrowWidth,
        arrowSizeFactor = 0.42,
        arrowMinSize = 3,
      }
    ) {
      if (!this.trajectoryArrowLayer || coordinates.length < 2) return;
      const lineTotalLength = Number(totalLength);
      const effectiveTotalLength =
        Number.isFinite(lineTotalLength) && lineTotalLength > 0
          ? lineTotalLength
          : this.getPolylineTotalLength(coordinates);
      if (!Number.isFinite(effectiveTotalLength) || effectiveTotalLength <= 0)
        return;

      const spacingValue = Number(arrowSpacing);
      const spacing =
        Number.isFinite(spacingValue) && spacingValue > 0
          ? spacingValue
          : 0.0012;

      const safeLineSize = Math.max(4, Number(lineSize) || 6);
      const maxArrowCount = 72;
      const startOffset = Math.min(spacing, effectiveTotalLength * 0.2);
      const endLimit = effectiveTotalLength - startOffset;
      const travelRange = endLimit - startOffset;

      if (endLimit <= startOffset) {
        const distance = Math.min(
          effectiveTotalLength,
          Math.max(0, effectiveTotalLength / 2 + Number(flowOffset || 0))
        );
        const pointData =
          this.getPointAndDirectionOnPreparedPolyline(
            preparedSegments,
            distance
          ) || this.getPointAndDirectionOnPolyline(coordinates, distance);
        if (pointData) {
          const customArrowLength = Number(arrowLength);
          const effectiveArrowLength =
            Number.isFinite(customArrowLength) && customArrowLength > 0
              ? customArrowLength
              : Math.max(
                  spacing * Number(arrowLengthFactor),
                  Number(arrowMinLength)
                );
          const customArrowWidth = Number(arrowWidth);
          const effectiveArrowWidth =
            Number.isFinite(customArrowWidth) && customArrowWidth > 0
              ? customArrowWidth
              : Math.max(
                  effectiveArrowLength * Number(arrowWidthFactor),
                  Number(arrowMinWidth)
                );
          const effectiveArrowSize = Math.max(
            Number(arrowMinSize),
            Math.round(safeLineSize * Number(arrowSizeFactor))
          );
          this.addArrowChevronGraphic(
            pointData.point,
            pointData.direction,
            arrowColor,
            alpha,
            effectiveArrowSize,
            effectiveArrowLength,
            effectiveArrowWidth
          );
        }
        return;
      }

      const cycleOffset =
        travelRange > 0
          ? ((Number(flowOffset) % travelRange) + travelRange) % travelRange
          : 0;
      const arrowCount = Math.min(
        maxArrowCount,
        Math.max(1, Math.floor(travelRange / spacing) + 1)
      );
      const distances = [];
      const renderDistance = (distance) => {
        const pointData =
          this.getPointAndDirectionOnPreparedPolyline(
            preparedSegments,
            distance
          ) || this.getPointAndDirectionOnPolyline(coordinates, distance);
        if (!pointData) return;
        const customArrowLength = Number(arrowLength);
        const effectiveArrowLength =
          Number.isFinite(customArrowLength) && customArrowLength > 0
            ? customArrowLength
            : Math.max(
                spacing * Number(arrowLengthFactor),
                Number(arrowMinLength)
              );
        const customArrowWidth = Number(arrowWidth);
        const effectiveArrowWidth =
          Number.isFinite(customArrowWidth) && customArrowWidth > 0
            ? customArrowWidth
            : Math.max(
                effectiveArrowLength * Number(arrowWidthFactor),
                Number(arrowMinWidth)
              );
        const effectiveArrowSize = Math.max(
          Number(arrowMinSize),
          Math.round(safeLineSize * Number(arrowSizeFactor))
        );
        const progress =
          travelRange > 0 ? (distance - startOffset) / travelRange : 0.5;
        let fadeAlpha = Number(alpha);

        if (applyHeadFade && progress < 0.2) {
          fadeAlpha *= 0.35 + (progress / 0.2) * 0.65;
        }
        if (applyTailFade && progress > 0.8) {
          fadeAlpha *= 0.35 + ((1 - progress) / 0.2) * 0.65;
        }
        fadeAlpha = Math.max(0.35, Math.min(Number(alpha), fadeAlpha));

        this.addArrowChevronGraphic(
          pointData.point,
          pointData.direction,
          arrowColor,
          fadeAlpha,
          effectiveArrowSize,
          effectiveArrowLength,
          effectiveArrowWidth
        );
      };

      for (let i = 0; i < arrowCount; i += 1) {
        const distance =
          startOffset + ((i * spacing + cycleOffset) % travelRange);
        distances.push(distance);
      }

      distances.sort((a, b) => a - b);
      distances.forEach(renderDistance);
    },
    createDotDataUri(color = '#ffffff') {
      const fill = encodeURIComponent(color || '#ffffff');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${fill}"/></svg>`;
      return `data:image/svg+xml;utf8,${svg}`;
    },
    addFlowDotGraphic(point, { dotColor = '#ffffff', dotSize = 7 } = {}) {
      const [x, y] = point || [];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      try {
        const graphic = joint.GraphicUtil.getGraphic({
          geometry: new joint.Point([x, y]),
          symbolType: 'picturemarkersymbol',
          symbolStyle: {
            url: this.createDotDataUri(dotColor),
            width: Number(dotSize) || 7,
            height: Number(dotSize) || 7,
          },
          infoTemplate: null,
          attributes: { isFlowDot: true },
        });
        this.trajectoryArrowLayer?.add(graphic);
      } catch (error) {
        console.warn('轨迹流动圆点绘制失败:', error);
      }
    },
    renderPolylineDots(chains = this.lastPolylineArrowChains, options = {}) {
      this.ensurePolylineLayer();
      this.trajectoryArrowLayer?.clear?.();
      if (!Array.isArray(chains) || chains.length === 0) return;

      const {
        flowOffset = 0,
        dotColor = '#ffffff',
        dotSize = 7,
        dotSpacing = 0.0048,
      } = options;
      const spacing = Math.max(0.0003, Number(dotSpacing) || 0.0048);

      chains.forEach((chain) => {
        const coordinates = Array.isArray(chain?.coordinates)
          ? chain.coordinates
          : [];
        if (coordinates.length < 2) return;

        const totalLength = Number(chain?.totalLength);
        if (!Number.isFinite(totalLength) || totalLength <= 0) return;

        const startOffset = Math.min(spacing, totalLength * 0.15);
        const endLimit = totalLength - startOffset;
        const travelRange = endLimit - startOffset;
        if (travelRange <= 0) return;

        const cycleOffset =
          ((Number(flowOffset) % travelRange) + travelRange) % travelRange;
        const dotCount = Math.min(
          64,
          Math.max(1, Math.floor(travelRange / spacing))
        );

        for (let i = 0; i < dotCount; i += 1) {
          const distance =
            startOffset + ((i * spacing + cycleOffset) % travelRange);
          const pointData =
            this.getPointAndDirectionOnPreparedPolyline(
              chain.segments,
              distance
            ) || this.getPointAndDirectionOnPolyline(coordinates, distance);
          if (!pointData?.point) continue;
          this.addFlowDotGraphic(pointData.point, { dotColor, dotSize });
        }
      });
    },
    renderPolylineArrows(chains = this.lastPolylineArrowChains, options = {}) {
      this.ensurePolylineLayer();
      this.trajectoryArrowLayer?.clear?.();
      if (!Array.isArray(chains) || chains.length === 0) return;

      const {
        size = Number(this.polylineSize) || 8,
        alpha = 1,
        showDirectionArrows = true,
        arrowSpacing = 0.0062,
        arrowColor = '#ffffff',
        arrowLengthFactor = 0.55,
        arrowMinLength = 0.00065,
        arrowWidthFactor = 0.42,
        arrowMinWidth = 0.00025,
        arrowLength = 0.0009,
        arrowWidth = 0.00065,
        arrowSizeFactor = 0.58,
        arrowMinSize = 4,
        arrowBaseZoom = 13.2,
        arrowScale = 1.35,
        flowOffset = 0,
      } = options;

      if (!showDirectionArrows) return;

      const adaptiveArrowOptions = this.getZoomAdaptiveArrowOptions({
        arrowSpacing,
        arrowColor,
        arrowLengthFactor,
        arrowMinLength,
        arrowWidthFactor,
        arrowMinWidth,
        arrowLength,
        arrowWidth,
        arrowSizeFactor,
        arrowMinSize,
        arrowBaseZoom,
        arrowScale,
      });
      this.lastPolylineZoom = adaptiveArrowOptions.currentZoom;

      chains.forEach((chain, index) => {
        const coordinates = Array.isArray(chain?.coordinates)
          ? chain.coordinates
          : [];
        if (coordinates.length < 2) return;

        this.addDirectionalArrows(coordinates, {
          alpha,
          lineSize: size,
          flowOffset,
          applyHeadFade: index === 0,
          applyTailFade: index === chains.length - 1,
          totalLength: chain.totalLength,
          preparedSegments: chain.segments,
          arrowSpacing: adaptiveArrowOptions.arrowSpacing,
          arrowColor: adaptiveArrowOptions.arrowColor,
          arrowLengthFactor: adaptiveArrowOptions.arrowLengthFactor,
          arrowMinLength: adaptiveArrowOptions.arrowMinLength,
          arrowWidthFactor: adaptiveArrowOptions.arrowWidthFactor,
          arrowMinWidth: adaptiveArrowOptions.arrowMinWidth,
          arrowLength: adaptiveArrowOptions.arrowLength,
          arrowWidth: adaptiveArrowOptions.arrowWidth,
          arrowSizeFactor: adaptiveArrowOptions.arrowSizeFactor,
          arrowMinSize: adaptiveArrowOptions.arrowMinSize,
        });
      });
    },
    renderPolylineMotion(chains = this.lastPolylineArrowChains, options = {}) {
      const motionSymbol = options.motionSymbol === 'dot' ? 'dot' : 'arrow';
      if (motionSymbol === 'dot') {
        this.renderPolylineDots(chains, options);
        return;
      }
      this.renderPolylineArrows(chains, options);
    },
    startPolylineArrowAnimation() {
      this.stopPolylineArrowAnimation();
      if (
        !Array.isArray(this.lastPolylineData) ||
        this.lastPolylineData.length === 0 ||
        (this.lastPolylineOptions?.motionSymbol !== 'dot' &&
          this.lastPolylineOptions?.showDirectionArrows === false)
      ) {
        return;
      }

      const step = (timestamp) => {
        if (!this.jmap || !this.trajectoryArrowLayer) return;

        if (!this.arrowAnimationLastTime) {
          this.arrowAnimationLastTime = timestamp;
        }

        const elapsed = timestamp - this.arrowAnimationLastTime;
        const delta = Math.min(34, Math.max(12, elapsed || 16.67));
        this.arrowAnimationLastTime = timestamp;

        const isDotMotion = this.lastPolylineOptions?.motionSymbol === 'dot';
        const baseSpacing = Number(
          isDotMotion
            ? (this.lastPolylineOptions?.dotSpacing ?? 0.0048)
            : (this.lastPolylineOptions?.arrowSpacing ?? 0.0032)
        );
        const speed = Number(
          isDotMotion
            ? (this.lastPolylineOptions?.dotFlowSpeed ??
                this.polylineDotFlowSpeed)
            : (this.lastPolylineOptions?.arrowFlowSpeed ??
                this.polylineArrowFlowSpeed)
        );
        const spacing =
          baseSpacing > 0 ? baseSpacing : isDotMotion ? 0.0048 : 0.0032;
        const frameOffset = Math.min(
          speed * (delta / 16.67),
          spacing * (isDotMotion ? 0.04 : 0.08)
        );
        this.arrowAnimationOffset += frameOffset;
        if (this.arrowAnimationOffset > spacing * 1000) {
          this.arrowAnimationOffset = this.arrowAnimationOffset % spacing;
        }

        this.renderPolylineMotion(this.lastPolylineArrowChains, {
          ...this.lastPolylineOptions,
          flowOffset: this.arrowAnimationOffset,
        });

        this.arrowAnimationFrameId = requestAnimationFrame(step);
      };

      this.arrowAnimationFrameId = requestAnimationFrame(step);
    },
    stopPolylineArrowAnimation() {
      if (this.arrowAnimationFrameId) {
        cancelAnimationFrame(this.arrowAnimationFrameId);
        this.arrowAnimationFrameId = null;
      }
      this.arrowAnimationLastTime = 0;
      this.arrowAnimationOffset = 0;
    },
    // data: [{ path: string | number[][], ... }]
    // options: { clearFirst?: boolean, colors?: string[], size?: number, alpha?: number, style?: string, showDirectionArrows?: boolean, arrowSpacing?: number, arrowColor?: string, arrowLengthFactor?: number, arrowMinLength?: number, arrowWidthFactor?: number, arrowMinWidth?: number, arrowLength?: number, arrowWidth?: number, arrowSizeFactor?: number, arrowMinSize?: number }
    // 统一调整大小（箭头）
    drawPolylines(data = [], options = {}) {
      this.ensurePolylineLayer();
      if (!this.trajectoryLayer) return;

      const sourceData = Array.isArray(data) ? data : [];
      const firstDotMotionItem = sourceData.find(
        (item) => item?.motionSymbol === 'dot'
      );
      const motionSymbol =
        options.motionSymbol || firstDotMotionItem?.motionSymbol || 'arrow';
      const dotColor =
        options.dotColor || firstDotMotionItem?.dotColor || '#ffffff';
      const dotSize = Number(
        options.dotSize ?? firstDotMotionItem?.dotSize ?? 7
      );
      const dotSpacing = Number(
        options.dotSpacing ?? firstDotMotionItem?.dotSpacing ?? 0.0048
      );
      const dotFlowSpeed = Number(
        options.dotFlowSpeed ??
          firstDotMotionItem?.dotFlowSpeed ??
          this.polylineDotFlowSpeed
      );

      const {
        clearFirst = true,
        // colors = ['#ff1f1f'],
        colors = ['#fec06a'],
        size = Number(this.polylineSize) || 8,
        alpha = 1,
        style = 'solid',
        showDirectionArrows = true,
        arrowSpacing = 0.0032,
        arrowColor = '#8bfbfa',
        arrowLengthFactor = 0.55,
        arrowMinLength = 0.00065,
        arrowWidthFactor = 0.42,
        arrowMinWidth = 0.00025,
        // 箭头长
        arrowLength = 0.0009,
        // 箭头宽
        arrowWidth = 0.00065,
        arrowSizeFactor = 0.58,
        arrowMinSize = 4,
        arrowBaseZoom = 13.2,
        arrowScale = 1.35,
        arrowFlowSpeed = this.polylineArrowFlowSpeed,
      } = options;

      this.lastPolylineData = Array.isArray(data) ? data.slice() : [];
      this.lastPolylineOptions = {
        ...options,
        motionSymbol,
        dotColor,
        dotSize,
        dotSpacing,
        dotFlowSpeed,
        arrowFlowSpeed,
      };
      this.lastPolylineZoom = this.getCurrentMapZoom();
      const parsedSegments = [];

      if (clearFirst) {
        this.trajectoryLayer.clear();
        this.trajectoryArrowLayer?.clear?.();
        this.trajectoryPointLayer?.clear?.();
      }
      if (!Array.isArray(data)) return;

      data.forEach((item, index) => {
        const coordinates = this.parsePathCoordinates(item?.path);
        if (coordinates.length < 2) return;
        parsedSegments.push({ item, coordinates });

        const line = new joint.LineString(coordinates);
        const isDashedType = String(item?.type ?? '') === '0';
        const customColor = String(item?.lineColor || '').trim();
        const color = customColor
          ? customColor
          : isDashedType
            ? '#37c2ff'
            : colors[index % colors.length];
        const lineStyle = isDashedType ? 'dashed' : style;
        console.log('lineStyle:', lineStyle);
        const graphic = joint.GraphicUtil.getGraphic({
          geometry: line,
          symbolType: 'linesymbol',
          symbolStyle: {
            style: lineStyle,
            size,
            color,
            alpha,
          },
          infoTemplate: null,
          attributes: item || {},
        });
        this.trajectoryLayer.add(graphic);

        const pointCoordinates = this.parseTrackPointCoordinates(item?.point);
        pointCoordinates.forEach((coordinate) => {
          const [lng, lat] = coordinate || [];
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          try {
            const pointGraphic = joint.GraphicUtil.getGraphic({
              geometry: new joint.Point([lng, lat]),
              symbolType: 'picturemarkersymbol',
              symbolStyle: {
                url: slowingTagIcon,
                width: this.pointIconWidth,
                height: this.pointIconHeight,
              },
              infoTemplate: null,
              attributes: {
                ...(item || {}),
                isTrackPointMarker: true,
              },
            });
            this.trajectoryPointLayer?.add(pointGraphic);
          } catch (error) {
            console.warn('轨迹 point 图标绘制失败:', error, item?.point);
          }
        });
      });

      this.lastPolylineArrowChains =
        this.buildPolylineArrowChains(parsedSegments);
      this.renderPolylineMotion(this.lastPolylineArrowChains, {
        ...options,
        motionSymbol,
        dotColor,
        dotSize,
        dotSpacing,
        dotFlowSpeed,
      });
      this.bringTrajectoryPointLayerToTop();
      this.startPolylineArrowAnimation();
    },
    setPolylines(data = [], options = {}) {
      this.drawPolylines(data, { ...options, clearFirst: true });
    },
    getPolylinesBounds(data = []) {
      if (!Array.isArray(data) || data.length === 0) return null;

      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      data.forEach((item) => {
        const coords = this.parsePathCoordinates(item?.path);
        coords.forEach((pt) => {
          const lng = Number(pt?.[0]);
          const lat = Number(pt?.[1]);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });

      if (
        !Number.isFinite(minLng) ||
        !Number.isFinite(minLat) ||
        !Number.isFinite(maxLng) ||
        !Number.isFinite(maxLat)
      ) {
        return null;
      }

      return { minLng, minLat, maxLng, maxLat };
    },
    // 将地图镜头聚焦到轨迹范围
    focusPolylines(data = [], options = {}) {
      if (!this.jmap) return;
      const bounds = this.getPolylinesBounds(data);
      if (!bounds) return;

      const { minLng, minLat, maxLng, maxLat } = bounds;
      const lngSpan = Math.max(maxLng - minLng, 0.0026);
      const latSpan = Math.max(maxLat - minLat, 0.0026);
      const paddingRatio = Number(options.paddingRatio ?? 0.3);
      const padLng = lngSpan * paddingRatio;
      const padLat = latSpan * paddingRatio;
      const extent = [
        minLng - padLng,
        minLat - padLat,
        maxLng + padLng,
        maxLat + padLat,
      ];

      try {
        const rawMap = this.jmap.getMap?.();
        const view = rawMap?.getView?.();
        if (view?.fit) {
          view.fit(extent, {
            size: rawMap?.getSize?.(),
            padding: options.padding || [56, 56, 56, 56],
            duration: options.duration ?? 500,
            maxZoom: options.maxZoom ?? 13.5,
          });
          return;
        }
      } catch (error) {
        console.warn('轨迹 fit 视图失败，尝试中心点定位:', error);
      }

      const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
      try {
        if (typeof this.jmap.setCenter === 'function') {
          this.jmap.setCenter(center);
        } else if (typeof this.jmap.centerAt === 'function') {
          this.jmap.centerAt(center);
        }
      } catch (error) {
        console.warn('轨迹中心点定位失败:', error);
      }
    },
    getPolylineAnchorScreenPoint(data = [], options = {}) {
      if (!this.jmap || !Array.isArray(data) || data.length === 0) return null;

      const chainList = data
        .map((item) => {
          const coordinates = this.parsePathCoordinates(item?.path);
          if (coordinates.length < 2) return null;
          return {
            coordinates,
            totalLength: this.getPolylineTotalLength(coordinates),
          };
        })
        .filter((item) => item && item.totalLength > 0);

      if (chainList.length === 0) return null;

      const targetChain = chainList.reduce((prev, current) =>
        (current.totalLength || 0) > (prev.totalLength || 0) ? current : prev
      );
      const middleDistance = (targetChain.totalLength || 0) / 2;
      const anchorData =
        this.getPointAndDirectionOnPolyline(
          targetChain.coordinates,
          middleDistance
        ) || null;
      const coordinate = anchorData?.point;
      if (!Array.isArray(coordinate) || coordinate.length < 2) return null;

      try {
        const rawMap = this.jmap.getMap?.();
        const pixel = rawMap?.getPixelFromCoordinate?.(coordinate);
        const x = Number(Array.isArray(pixel) ? pixel[0] : undefined);
        const y = Number(Array.isArray(pixel) ? pixel[1] : undefined);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const screenPoints = chainList
          .flatMap((chain) => chain.coordinates || [])
          .map((point) => rawMap?.getPixelFromCoordinate?.(point))
          .map((screenPoint) => [
            Number(Array.isArray(screenPoint) ? screenPoint[0] : NaN),
            Number(Array.isArray(screenPoint) ? screenPoint[1] : NaN),
          ])
          .filter(
            (screenPoint) =>
              Number.isFinite(screenPoint[0]) && Number.isFinite(screenPoint[1])
          );

        let bounds = null;
        if (screenPoints.length > 0) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          screenPoints.forEach(([sx, sy]) => {
            if (sx < minX) minX = sx;
            if (sx > maxX) maxX = sx;
            if (sy < minY) minY = sy;
            if (sy > maxY) maxY = sy;
          });
          if (
            Number.isFinite(minX) &&
            Number.isFinite(minY) &&
            Number.isFinite(maxX) &&
            Number.isFinite(maxY)
          ) {
            bounds = {
              left: minX,
              top: minY,
              right: maxX,
              bottom: maxY,
              width: Math.max(0, maxX - minX),
              height: Math.max(0, maxY - minY),
            };
          }
        }

        const margin = Number(options.margin ?? 12);
        const mapSize = rawMap?.getSize?.();
        const mapWidth = Number(
          Array.isArray(mapSize) && mapSize.length > 0 ? mapSize[0] : NaN
        );
        const mapHeight = Number(
          Array.isArray(mapSize) && mapSize.length > 1 ? mapSize[1] : NaN
        );
        const maxX = Number.isFinite(mapWidth) ? mapWidth - margin : x;
        const maxY = Number.isFinite(mapHeight) ? mapHeight - margin : y;
        return {
          x: Math.min(Math.max(margin, x), Math.max(margin, maxX)),
          y: Math.min(Math.max(margin, y), Math.max(margin, maxY)),
          lng: Number(coordinate[0]),
          lat: Number(coordinate[1]),
          bounds,
        };
      } catch (error) {
        console.warn('计算轨迹屏幕锚点失败:', error);
        return null;
      }
    },
    syncTrackPolylines() {
      if (!this.jmap) return;
      if (
        Array.isArray(this.trackPolylines) &&
        this.trackPolylines.length > 0
      ) {
        const hasDotMotion = this.trackPolylines.some(
          (item) => item?.motionSymbol === 'dot'
        );
        if (hasDotMotion) {
          this.setPolylines(this.trackPolylines, {
            showDirectionArrows: false,
            motionSymbol: 'dot',
            size: this.trafficJamMotionConfig.lineSize,
            dotSize: this.trafficJamMotionConfig.dotSize,
            dotSpacing: this.trafficJamMotionConfig.dotSpacing,
            dotFlowSpeed: this.trafficJamMotionConfig.dotFlowSpeed,
          });
        } else {
          this.setPolylines(this.trackPolylines);
        }
        this.focusPolylines(this.trackPolylines);
      } else {
        this.clearPolylines();
      }
    },
    getLayerType(attrs) {
      if (attrs.pop_type === 'camera') return '摄像头';
      if (attrs.pop_type === 'variableMessageSign') return '情报板';
      if (attrs.gantry_hex) return '门架';
      if (attrs.mc_id || (attrs.name && attrs.name.includes('服务区')))
        return '服务区';
      if (attrs.toll_id || (attrs.name && attrs.name.includes('收费站')))
        return '收费站';
      return '点位';
    },
    getType(attrs) {
      if (attrs.pop_type === 'camera') return 'camera';
      if (attrs.pop_type === 'variableMessageSign')
        return 'variableMessageSign';
      if (attrs.gantry_hex) return 'gantry';
      if (attrs.mc_id || (attrs.name && attrs.name.includes('服务区')))
        return 'service';
      if (attrs.toll_id || (attrs.name && attrs.name.includes('收费站')))
        return 'tollStation';
      return '';
    },
    getInfoWindowOffset(isVariableMessageSign = false) {
      return isVariableMessageSign ? [0, -24] : [0, 400];
    },
    configureInfoWindowForPopup(isVariableMessageSign = false) {
      if (!this.infoWindowContainer) return;

      this.infoWindowContainer.style.width = isVariableMessageSign
        ? '420px'
        : '500px';
      this.infoWindowContainer.style.height = isVariableMessageSign
        ? 'auto'
        : '575px';

      const offset = this.getInfoWindowOffset(isVariableMessageSign);
      const infoWindow = this.jmap?.getMap?.()?.infoWindow;
      if (typeof infoWindow?.setOffset === 'function') {
        infoWindow.setOffset(offset);
        return;
      }
      if (this.jmap?.customInfoWindowByHTML) {
        this.jmap.customInfoWindowByHTML({
          dom: this.infoWindowContainer,
          offset,
        });
      }
    },
    // 在 methods 中添加
    async loadRemoteFeatures() {
      // 1. 加载门架数据
      try {
        await this.loadGantryFeatures();
        // 2. 加载服务区数据
        await this.loadServiceFeatures();
        // 3. 加载收费站数据
        await this.loadTollStationFeatures();

        // 4. 加载摄像头点位数据
        await this.loadCameraFeatures();

        // 5. 加载情报板点位数据
        await this.loadVariableMessageSignFeatures();
      } catch (err) {
        console.error('加载远程点位失败:', err);
      }
    },
    async loadGantryFeatures() {
      const gantryUrl =
        'http://35.80.236.142:8888/admin-api/Features/gis_gantry_fj/JointFeature?ak=0620aae950f94394ba7c4164100aa50b&where=' +
        encodeURIComponent(FUZHOU_GANTRY_HEX_WHERE) +
        '&resultRecordCount=100000';

      const res = await fetch(gantryUrl);
      const data = await res.json();

      if (this.pointLayersByType.gantry?.clear) {
        this.pointLayersByType.gantry.clear();
      }
      this.graphicsByType.gantry = [];
      this.addFeaturesToLayer(data, 'gantry');
    },
    async loadServiceFeatures() {
      const serviceUrl =
        'http://35.80.236.142:8888/admin-api/Features/gis_service_area_fj/JointFeature?ak=0620aae950f94394ba7c4164100aa50b&where=' +
        encodeURIComponent(FUZHOU_SERVICE_AREA_WHERE) +
        '&resultRecordCount=100000';

      const res = await fetch(serviceUrl);
      const data = await res.json();

      if (this.pointLayersByType.service?.clear) {
        this.pointLayersByType.service.clear();
      }
      this.graphicsByType.service = [];
      this.addFeaturesToLayer(data, 'service');
    },
    async loadTollStationFeatures() {
      const tollStationUrl =
        'http://35.80.236.142:8888/admin-api/Features/gis_toll_gate/JointFeature?ak=0620aae950f94394ba7c4164100aa50b&where=' +
        encodeURIComponent(FUZHOU_TOLL_STATION_WHERE) +
        '&resultRecordCount=100000';

      const res = await fetch(tollStationUrl);
      const data = await res.json();

      if (this.pointLayersByType.tollStation?.clear) {
        this.pointLayersByType.tollStation.clear();
      }
      this.graphicsByType.tollStation = [];
      this.addFeaturesToLayer(data, 'tollStation');
    },
    async loadCameraFeatures() {
      const cameraUrl =
        'http://35.80.236.142:8888/admin-api/Features/jksxt/JointFeature?ak=0620aae950f94394ba7c4164100aa50b&where=' +
        encodeURIComponent(FUZHOU_CAMERA_WHERE) +
        '&resultRecordCount=100000';

      const res = await fetch(cameraUrl);
      const data = await res.json();
      const features = Array.isArray(data?.features)
        ? data.features
        : Array.isArray(data?.data?.features)
          ? data.data.features
          : null;
      if (Array.isArray(features)) {
        const filteredFeatures = features.filter((feature) => {
          const attrs = feature?.attributes || feature?.properties || {};
          return !FUZHOU_HIDDEN_CAMERA_GIDS.has(String(attrs?.gid ?? '').trim());
        });
        if (Array.isArray(data?.features)) {
          data.features = filteredFeatures;
        } else if (Array.isArray(data?.data?.features)) {
          data.data.features = filteredFeatures;
        }
      }

      if (this.pointLayersByType.camera?.clear) {
        this.pointLayersByType.camera.clear();
      }
      this.graphicsByType.camera = [];
      this.addFeaturesToLayer(data, 'camera');
    },
    async loadVariableMessageSignFeatures() {
      const variableMessageSignUrl =
        'http://35.80.236.142:8888/admin-api/Features/gis_variable_information_board_fj/JointFeature?ak=0620aae950f94394ba7c4164100aa50b&where=' +
        encodeURIComponent(FUZHOU_VARIABLE_MESSAGE_SIGN_WHERE) +
        '&resultRecordCount=100000';

      const res = await fetch(variableMessageSignUrl);
      const data = await res.json();

      if (this.pointLayersByType.variableMessageSign?.clear) {
        this.pointLayersByType.variableMessageSign.clear();
      }
      this.graphicsByType.variableMessageSign = [];
      this.addFeaturesToLayer(data, 'variableMessageSign');
    },
    getIconByType(type) {
      if (type === 'gantry') return gantryAreaIcon;
      if (type === 'tollStation') return tollStationIcon;
      if (type === 'camera') return cameraIcon;
      if (type === 'variableMessageSign') return variableMessageSignIcon;
      return serviceAreaIcon;
    },
    getPointLayerByType(type) {
      return this.pointLayersByType[type] || this.layer2;
    },
    setLayerZIndex(layer, zIndex, warningLabel = '图层') {
      if (!this.jmap || !layer) return false;

      try {
        if (typeof layer.setZIndex === 'function') {
          layer.setZIndex(zIndex);
          return true;
        }
      } catch (error) {
        console.warn(`设置${warningLabel} zIndex 失败:`, error);
      }

      try {
        const rawLayer =
          layer.getLayer?.() || layer.layer || layer.olLayer || layer._layer;
        if (rawLayer && typeof rawLayer.setZIndex === 'function') {
          rawLayer.setZIndex(zIndex);
          return true;
        }
      } catch (error) {
        console.warn(`设置底层${warningLabel} zIndex 失败:`, error);
      }

      try {
        if (
          typeof this.jmap.removeLayer === 'function' &&
          typeof this.jmap.addLayer === 'function'
        ) {
          this.jmap.removeLayer(layer);
          this.jmap.addLayer(layer);
          return true;
        }
      } catch (error) {
        console.warn(`调整${warningLabel}顺序失败:`, error);
      }

      return false;
    },
    resetPointLayerZIndex() {
      const orderedTypes = [
        'service',
        'tollStation',
        'gantry',
        'variableMessageSign',
        'camera',
      ];
      orderedTypes.forEach((type, index) => {
        this.setLayerZIndex(
          this.pointLayersByType[type],
          this.pointLayerZIndexSeed + index,
          `${type} 点位图层`
        );
      });
    },
    bringPointLayerTypeToTop(type) {
      if (!this.pointLayersByType[type]) return false;

      this.resetPointLayerZIndex();
      return this.setLayerZIndex(
        this.pointLayersByType[type],
        this.pointLayerZIndexSeed + 99,
        `${type} 点位图层`
      );
    },
    // 按当前状态重建某一类点位图层（隐藏=清空，显示=重加）
    rebuildTypeLayer(type) {
      if (this.isClusteredPointType(type)) {
        this.rebuildPointLayerWithCluster(type);
        return;
      }
      const layer = this.getPointLayerByType(type);
      if (!layer || typeof layer.clear !== 'function') return;

      layer.clear();
      if (!this.graphicsVisibility[type]) return;

      const items = this.graphicsByType[type] || [];
      items.forEach((graphic) => {
        if (!graphic) return;
        if (graphic.__isLabel && !this.labelVisible) return;
        layer.add(graphic);
      });
    },
    getClusteredPointTypes() {
      return Array.isArray(this.clusteredPointTypes)
        ? this.clusteredPointTypes
        : [];
    },
    isClusteredPointType(type) {
      return this.getClusteredPointTypes().includes(type);
    },
    refreshVisiblePointClustersForZoom(zoom, force = false) {
      const currentZoom = Number(zoom);
      if (!Number.isFinite(currentZoom)) return;

      this.getClusteredPointTypes().forEach((type) => {
        if (!this.graphicsVisibility[type]) return;
        const lastZoom = Number(this.pointClusterLastZoomByType?.[type]);
        const zoomChanged =
          !Number.isFinite(lastZoom) || currentZoom !== lastZoom;
        if (force || zoomChanged) {
          this.renderPointClusterLevel(type, currentZoom, force);
        }
      });
    },
    getPointClusterCellSizeScale(type = '') {
      if (type === 'gantry') return 1.45;
      return 1;
    },
    getPointClusterLevelConfigs(type = '') {
      const cellSizeScale = this.getPointClusterCellSizeScale(type);
      return [
        {
          key: 'l0',
          maxZoom: 10.8,
          cellSize: Math.round(108 * cellSizeScale),
          sampleZoom: 10.8,
        },
        {
          key: 'l1',
          maxZoom: 11.6,
          cellSize: Math.round(92 * cellSizeScale),
          sampleZoom: 11.6,
        },
        {
          key: 'l2',
          maxZoom: 12.4,
          cellSize: Math.round(76 * cellSizeScale),
          sampleZoom: 12.4,
        },
        {
          key: 'l3',
          maxZoom: 13.2,
          cellSize: Math.round(62 * cellSizeScale),
          sampleZoom: 13.2,
        },
        {
          key: 'l4',
          maxZoom: 14.0,
          cellSize: Math.round(48 * cellSizeScale),
          sampleZoom: 14.0,
        },
        {
          key: 'l5',
          maxZoom: 14.8,
          cellSize: Math.round(36 * cellSizeScale),
          sampleZoom: 14.8,
        },
        {
          key: 'l6',
          maxZoom: 15.6,
          cellSize: Math.round(26 * cellSizeScale),
          sampleZoom: 15.6,
        },
        {
          key: 'l7',
          maxZoom: this.pointClusterMaxZoom,
          cellSize: Math.round(18 * cellSizeScale),
          sampleZoom: this.pointClusterMaxZoom,
        },
        { key: 'single', maxZoom: Infinity, cellSize: 0, sampleZoom: 18 },
      ];
    },
    resolvePointClusterLevel(type, zoom) {
      const currentZoom = Number(zoom);
      const configs = this.getPointClusterLevelConfigs(type);
      if (!Number.isFinite(currentZoom)) {
        return configs[0];
      }
      return (
        configs.find((item) => currentZoom <= Number(item.maxZoom)) ||
        configs[configs.length - 1]
      );
    },
    projectLngLatToWorldPixel(lng, lat, zoom = 12) {
      const xLng = Number(lng);
      const yLat = Number(lat);
      const z = Number(zoom);
      if (
        !Number.isFinite(xLng) ||
        !Number.isFinite(yLat) ||
        !Number.isFinite(z)
      ) {
        return null;
      }
      const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, yLat));
      const scale = 256 * 2 ** z;
      const x = ((xLng + 180) / 360) * scale;
      const sinLat = Math.sin((clampedLat * Math.PI) / 180);
      const y =
        (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    },
    buildPointClustersForLevel(graphics = [], levelConfig = {}) {
      const source = Array.isArray(graphics) ? graphics : [];
      const cellSize = Math.max(1, Number(levelConfig?.cellSize) || 0);
      if (source.length === 0) return [];
      if (cellSize <= 0) {
        return source.map((graphic) => ({
          type: 'single',
          graphic,
        }));
      }

      const sampleZoom = Number(levelConfig?.sampleZoom);
      const safeZoom = Number.isFinite(sampleZoom) ? sampleZoom : 12;
      const buckets = new Map();

      source.forEach((graphic) => {
        if (!graphic || graphic.__isLabel) return;
        const coordinate = graphic?.getGeometry?.()?.getCoordinates?.();
        if (!Array.isArray(coordinate) || coordinate.length < 2) return;
        const lng = Number(coordinate[0]);
        const lat = Number(coordinate[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
        const pixel = this.projectLngLatToWorldPixel(lng, lat, safeZoom);
        if (!pixel) return;

        const gx = Math.floor(pixel.x / cellSize);
        const gy = Math.floor(pixel.y / cellSize);
        const key = `${gx}_${gy}`;
        if (!buckets.has(key)) {
          buckets.set(key, {
            count: 0,
            sumLng: 0,
            sumLat: 0,
            firstGraphic: graphic,
          });
        }
        const bucket = buckets.get(key);
        bucket.count += 1;
        bucket.sumLng += lng;
        bucket.sumLat += lat;
      });

      return Array.from(buckets.values()).map((bucket) => {
        if (bucket.count <= 1) {
          return {
            type: 'single',
            graphic: bucket.firstGraphic,
          };
        }
        return {
          type: 'cluster',
          center: [bucket.sumLng / bucket.count, bucket.sumLat / bucket.count],
          count: bucket.count,
          firstAttrs: bucket.firstGraphic?.values_?.attributes || {},
        };
      });
    },
    createPointClusterGraphic(type, center = [], count = 0, firstAttrs = {}) {
      const [x, y] = center || [];
      if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y)))
        return null;
      try {
        return joint.GraphicUtil.getGraphic({
          geometry: new joint.Point([Number(x), Number(y)]),
          symbolType: 'picturemarkersymbol',
          symbolStyle: {
            // 聚合层级统一显示对应点位图标，数字通过旁边 textsymbol 体现
            url: this.getIconByType(type),
            width: this.pointIconWidth,
            height: this.pointIconHeight,
          },
          infoTemplate: null,
          attributes: {
            ...(firstAttrs || {}),
            pop_type: `${type}Cluster`,
            isPointCluster: true,
            isCameraCluster: type === 'camera',
            clusterType: type,
            clusterCount: Math.max(1, Number(count) || 1),
          },
        });
      } catch (error) {
        console.warn(`创建${type}聚合图标失败:`, error);
        return null;
      }
    },
    createPointClusterLabelGraphic(
      type,
      center = [],
      count = 0,
      firstAttrs = {}
    ) {
      const [x, y] = center || [];
      if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y)))
        return null;
      const safeCount = Math.max(1, Number(count) || 1);
      const label = safeCount > 999 ? '999+' : String(safeCount);
      const textSizePt = safeCount >= 100 ? 10 : 11;
      const textSize = `${textSizePt}pt`;
      const outlineSize = `${textSizePt + 2}pt`;
      try {
        const outlineGraphic = joint.GraphicUtil.getGraphic({
          geometry: new joint.Point([Number(x), Number(y)]),
          symbolType: 'textsymbol',
          symbolStyle: {
            text: label,
            size: outlineSize,
            color: '#000000',
            // 数字展示在摄像头图标右上侧
            xoffset: 22,
            yoffset: -12,
          },
          infoTemplate: null,
          attributes: {
            ...(firstAttrs || {}),
            pop_type: `${type}Cluster`,
            isPointCluster: true,
            isCameraCluster: type === 'camera',
            clusterType: type,
            clusterCount: safeCount,
          },
        });
        const labelGraphic = joint.GraphicUtil.getGraphic({
          geometry: new joint.Point([Number(x), Number(y)]),
          symbolType: 'textsymbol',
          symbolStyle: {
            text: label,
            size: textSize,
            color: '#ffffff',
            xoffset: 22,
            yoffset: -12,
          },
          infoTemplate: null,
          attributes: {
            ...(firstAttrs || {}),
            pop_type: `${type}Cluster`,
            isPointCluster: true,
            isCameraCluster: type === 'camera',
            clusterType: type,
            clusterCount: safeCount,
          },
        });
        outlineGraphic.__isClusterLabel = true;
        labelGraphic.__isClusterLabel = true;
        return [outlineGraphic, labelGraphic];
      } catch (error) {
        console.warn(`创建${type}聚合数字标注失败:`, error);
        return null;
      }
    },
    buildPointClusterHierarchy(type) {
      const sourceGraphics = (this.graphicsByType[type] || []).filter(
        (graphic) => graphic && !graphic.__isLabel
      );
      const levelConfigs = this.getPointClusterLevelConfigs(type);
      const hierarchy = {};
      levelConfigs.forEach((config) => {
        hierarchy[config.key] = this.buildPointClustersForLevel(
          sourceGraphics,
          config
        );
      });
      this.pointClusterHierarchyByType[type] = hierarchy;
      this.pointClusterLastLevelKeyByType[type] = '';
    },
    renderPointClusterLevel(
      type,
      zoom = this.getCurrentMapZoom(),
      force = false
    ) {
      const layer = this.getPointLayerByType(type);
      if (!layer || typeof layer.clear !== 'function') return;
      if (!this.graphicsVisibility[type]) {
        layer.clear();
        return;
      }
      if (!this.pointClusterHierarchyByType?.[type]) {
        this.buildPointClusterHierarchy(type);
      }
      const levelConfig = this.resolvePointClusterLevel(type, zoom);
      const levelKey = levelConfig?.key || 'single';
      if (!force && levelKey === this.pointClusterLastLevelKeyByType?.[type]) {
        this.pointClusterLastZoomByType[type] = Number.isFinite(Number(zoom))
          ? Number(zoom)
          : this.pointClusterLastZoomByType[type];
        return;
      }

      layer.clear();
      const levelItems = Array.isArray(
        this.pointClusterHierarchyByType?.[type]?.[levelKey]
      )
        ? this.pointClusterHierarchyByType[type][levelKey]
        : [];
      levelItems.forEach((item) => {
        if (item?.type === 'single' && item.graphic) {
          layer.add(item.graphic);
          return;
        }
        if (item?.type !== 'cluster') return;
        const clusterGraphic = this.createPointClusterGraphic(
          type,
          item.center,
          item.count,
          item.firstAttrs
        );
        if (clusterGraphic) {
          layer.add(clusterGraphic);
          const labelGraphic = this.createPointClusterLabelGraphic(
            type,
            item.center,
            item.count,
            item.firstAttrs
          );
          if (Array.isArray(labelGraphic)) {
            labelGraphic.forEach((graphic) => {
              if (graphic) {
                layer.add(graphic);
              }
            });
          } else if (labelGraphic) {
            layer.add(labelGraphic);
          }
        }
      });
      this.pointClusterLastLevelKeyByType[type] = levelKey;
      this.pointClusterLastZoomByType[type] = Number.isFinite(Number(zoom))
        ? Number(zoom)
        : this.pointClusterLastZoomByType[type];
    },
    rebuildPointLayerWithCluster(type) {
      this.renderPointClusterLevel(type, this.getCurrentMapZoom(), true);
    },
    resolveFeatureCoordinateTransformer(features = [], type = '') {
      if (type !== 'tollStation') {
        return (point) => {
          const x = Number(point?.[0]);
          const y = Number(point?.[1]);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
          return [x, y];
        };
      }

      const rawPoints = (Array.isArray(features) ? features : [])
        .map((feat) => {
          const geom = feat?.geometry || {};
          const attrs = feat?.attributes || feat?.properties || {};
          const x =
            geom?.x ??
            (Array.isArray(geom?.coordinates)
              ? geom.coordinates[0]
              : undefined) ??
            attrs?.lon ??
            attrs?.lng ??
            attrs?.longitude;
          const y =
            geom?.y ??
            (Array.isArray(geom?.coordinates)
              ? geom.coordinates[1]
              : undefined) ??
            attrs?.lat ??
            attrs?.latitude;
          if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) {
            return null;
          }
          return [Number(x), Number(y)];
        })
        .filter(Boolean);

      if (rawPoints.length === 0) {
        return (point) => {
          const x = Number(point?.[0]);
          const y = Number(point?.[1]);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
          return [x, y];
        };
      }

      return this.resolveTrackCoordinateTransformer(rawPoints);
    },
    addFeaturesToLayer(featureSet, type) {
      const features = featureSet?.features || featureSet?.data?.features;
      if (!Array.isArray(features)) return;
      const targetLayer = this.getPointLayerByType(type);
      const coordinateTransformer = this.resolveFeatureCoordinateTransformer(
        features,
        type
      );

      features.forEach((feat) => {
        const geom = feat.geometry;
        const attrs = { ...(feat.attributes || feat.properties || {}) };
        attrs.pop_type = type;
        if (type === 'camera') {
          attrs.camera_num =
            attrs.camera_num ??
            attrs.cameraNum ??
            attrs.camera_no ??
            attrs.cameraNo ??
            '';
          attrs.alias =
            attrs.alias ??
            attrs.chan_name ??
            attrs.camera_name ??
            attrs.name ??
            '';
        }
        if (type === 'variableMessageSign') {
          attrs.alias =
            attrs.alias ??
            attrs.name ??
            attrs.board_name ??
            attrs.boardName ??
            attrs.vms_name ??
            attrs.vmsName ??
            '';
        }
        let graphic, labelGraphic;

        const x =
          geom?.x ??
          (Array.isArray(geom?.coordinates)
            ? geom.coordinates[0]
            : undefined) ??
          attrs.lon ??
          attrs.lng ??
          attrs.longitude ??
          attrs.longtude;
        const y =
          geom?.y ??
          (Array.isArray(geom?.coordinates)
            ? geom.coordinates[1]
            : undefined) ??
          attrs.lat ??
          attrs.latitude;

        if (x !== undefined && y !== undefined) {
          const coordinate = coordinateTransformer([x, y]);
          const normalizedX = Number(coordinate?.[0]);
          const normalizedY = Number(coordinate?.[1]);
          if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
            return;
          }

          attrs.lon = normalizedX;
          attrs.lng = normalizedX;
          attrs.longitude = normalizedX;
          attrs.longtude = normalizedX;
          attrs.lat = normalizedY;
          attrs.latitude = normalizedY;

          // 点要素
          const point = new joint.Point([normalizedX, normalizedY]);

          // 图标
          graphic = joint.GraphicUtil.getGraphic({
            geometry: point,
            symbolType: 'picturemarkersymbol',
            symbolStyle: {
              url: this.getIconByType(type),
              width: this.pointIconWidth,
              height: this.pointIconHeight,
            },
            infoTemplate: null,
            attributes: attrs,
          });

          // 标注文字（可选）
          // labelGraphic = joint.GraphicUtil.getGraphic({
          //   geometry: point,
          //   symbolType: 'textsymbol',
          //   symbolStyle: {
          //     text: type === 'gantry' ? attrs.gantry_name : attrs.sub_name,
          //     size: '10pt',
          //     color: '#000',
          //     yoffset: -35,
          //   },
          //   attributes: attrs,
          // });
        }

        if (graphic) {
          graphic.__isLabel = false;
          if (
            !this.isClusteredPointType(type) &&
            this.graphicsVisibility[type]
          ) {
            targetLayer.add(graphic);
          }
          // 存储点位对象，用于后续控制显示/隐藏
          if (this.graphicsByType[type]) {
            this.graphicsByType[type].push(graphic);
          }
          if (labelGraphic) {
            labelGraphic.__isLabel = true;
            if (this.graphicsVisibility[type] && this.labelVisible) {
              targetLayer.add(labelGraphic);
            }
            if (this.graphicsByType[type]) {
              this.graphicsByType[type].push(labelGraphic);
            }
          }
        }
      });
      if (this.isClusteredPointType(type)) {
        this.buildPointClusterHierarchy(type);
        this.rebuildPointLayerWithCluster(type);
      }
    },
    normalizeNodeCode(value) {
      return String(value ?? '')
        .trim()
        .toUpperCase();
    },
    normalizeTollStationNodeCode(value) {
      return this.normalizeNodeCode(value).replace(/(EX|EN)/gi, '');
    },
    isTollStationNodeCode(code) {
      return /(EX|EN)/i.test(String(code || ''));
    },
    getNodeCodeByGraphic(type, attrs = {}) {
      if (type === 'gantry') {
        return this.normalizeNodeCode(
          attrs?.gantry_hex ?? attrs?.flagId ?? attrs?.flagid ?? attrs?.code
        );
      }
      if (type === 'tollStation') {
        return this.normalizeTollStationNodeCode(
          attrs?.code ??
            attrs?.flagId ??
            attrs?.flagid ??
            attrs?.toll_id ??
            attrs?.tollId ??
            attrs?.nodeCode
        );
      }
      return '';
    },
    getGraphicAttributes(graphic) {
      return (
        graphic?.values_?.attributes ||
        graphic?.get?.('attributes') ||
        graphic?.attributes ||
        {}
      );
    },
    findCameraGraphicsByAlias(keyword) {
      const normalizedKeyword = String(keyword ?? '')
        .trim()
        .toLowerCase();
      if (!normalizedKeyword) return [];

      return (this.graphicsByType.camera || []).filter((graphic) => {
        if (!graphic || graphic.__isLabel) return false;
        const attrs = this.getGraphicAttributes(graphic);
        const alias = String(attrs?.alias ?? '')
          .trim()
          .toLowerCase();
        return alias.includes(normalizedKeyword);
      });
    },
    findGantryGraphicsByName(keyword) {
      const normalizedKeyword = String(keyword ?? '')
        .trim()
        .toLowerCase();
      if (!normalizedKeyword) return [];

      return (this.graphicsByType.gantry || []).filter((graphic) => {
        if (!graphic || graphic.__isLabel) return false;
        const attrs = this.getGraphicAttributes(graphic);
        const gantryName = String(attrs?.gantry_name ?? '')
          .trim()
          .toLowerCase();
        return gantryName.includes(normalizedKeyword);
      });
    },
    findTollStationGraphicsByName(keyword) {
      const normalizedKeyword = String(keyword ?? '')
        .trim()
        .toLowerCase();
      if (!normalizedKeyword) return [];

      return (this.graphicsByType.tollStation || []).filter((graphic) => {
        if (!graphic || graphic.__isLabel) return false;
        const attrs = this.getGraphicAttributes(graphic);
        const name = String(attrs?.name ?? '')
          .trim()
          .toLowerCase();
        return name.includes(normalizedKeyword);
      });
    },
    findServiceGraphicsBySubName(keyword) {
      const normalizedKeyword = String(keyword ?? '')
        .trim()
        .toLowerCase();
      if (!normalizedKeyword) return [];

      return (this.graphicsByType.service || []).filter((graphic) => {
        if (!graphic || graphic.__isLabel) return false;
        const attrs = this.getGraphicAttributes(graphic);
        const subName = String(attrs?.sub_name ?? '')
          .trim()
          .toLowerCase();
        return subName.includes(normalizedKeyword);
      });
    },
    findVariableMessageSignGraphicsByName(keyword) {
      const normalizedKeyword = String(keyword ?? '')
        .trim()
        .toLowerCase();
      if (!normalizedKeyword) return [];

      return (this.graphicsByType.variableMessageSign || []).filter(
        (graphic) => {
          if (!graphic || graphic.__isLabel) return false;
          const attrs = this.getGraphicAttributes(graphic);
          const name = String(attrs?.name ?? '')
            .trim()
            .toLowerCase();
          return name.includes(normalizedKeyword);
        }
      );
    },
    searchCameraByAlias(keyword, options = {}) {
      const normalizedKeyword = String(keyword ?? '').trim();
      if (!normalizedKeyword) {
        return {
          found: false,
          reason: 'empty',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const results = this.findCameraGraphicsByAlias(normalizedKeyword);
      if (results.length === 0) {
        return {
          found: false,
          reason: 'not-found',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const targetGraphic = results[0];
      const coordinate = this.getGraphicCoordinate(targetGraphic);
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return {
          found: false,
          reason: 'missing-coordinate',
          keyword: normalizedKeyword,
          results,
        };
      }

      this.setGraphicsVisibility('camera', true);
      const focused = this.focusCoordinate(coordinate, {
        zoom: options.zoom ?? 17.2,
        duration: options.duration ?? 480,
      });

      return {
        found: true,
        keyword: normalizedKeyword,
        results,
        target: targetGraphic,
        attrs: this.getGraphicAttributes(targetGraphic),
        coordinate,
        focused,
      };
    },
    searchGantryByName(keyword, options = {}) {
      const normalizedKeyword = String(keyword ?? '').trim();
      if (!normalizedKeyword) {
        return {
          found: false,
          reason: 'empty',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const results = this.findGantryGraphicsByName(normalizedKeyword);
      if (results.length === 0) {
        return {
          found: false,
          reason: 'not-found',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const targetGraphic = results[0];
      const coordinate = this.getGraphicCoordinate(targetGraphic);
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return {
          found: false,
          reason: 'missing-coordinate',
          keyword: normalizedKeyword,
          results,
        };
      }

      this.setGraphicsVisibility('gantry', true);
      const focused = this.focusCoordinate(coordinate, {
        zoom: options.zoom ?? 17.2,
        duration: options.duration ?? 480,
      });

      return {
        found: true,
        keyword: normalizedKeyword,
        results,
        target: targetGraphic,
        attrs: this.getGraphicAttributes(targetGraphic),
        coordinate,
        focused,
      };
    },
    searchTollStationByName(keyword, options = {}) {
      const normalizedKeyword = String(keyword ?? '').trim();
      if (!normalizedKeyword) {
        return {
          found: false,
          reason: 'empty',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const results = this.findTollStationGraphicsByName(normalizedKeyword);
      if (results.length === 0) {
        return {
          found: false,
          reason: 'not-found',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const targetGraphic = results[0];
      const coordinate = this.getGraphicCoordinate(targetGraphic);
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return {
          found: false,
          reason: 'missing-coordinate',
          keyword: normalizedKeyword,
          results,
        };
      }

      this.setGraphicsVisibility('tollStation', true);
      const focused = this.focusCoordinate(coordinate, {
        zoom: options.zoom ?? 17.2,
        duration: options.duration ?? 480,
      });

      return {
        found: true,
        keyword: normalizedKeyword,
        results,
        target: targetGraphic,
        attrs: this.getGraphicAttributes(targetGraphic),
        coordinate,
        focused,
      };
    },
    searchServiceBySubName(keyword, options = {}) {
      const normalizedKeyword = String(keyword ?? '').trim();
      if (!normalizedKeyword) {
        return {
          found: false,
          reason: 'empty',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const results = this.findServiceGraphicsBySubName(normalizedKeyword);
      if (results.length === 0) {
        return {
          found: false,
          reason: 'not-found',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const targetGraphic = results[0];
      const coordinate = this.getGraphicCoordinate(targetGraphic);
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return {
          found: false,
          reason: 'missing-coordinate',
          keyword: normalizedKeyword,
          results,
        };
      }

      this.setGraphicsVisibility('service', true);
      const focused = this.focusCoordinate(coordinate, {
        zoom: options.zoom ?? 17.2,
        duration: options.duration ?? 480,
      });

      return {
        found: true,
        keyword: normalizedKeyword,
        results,
        target: targetGraphic,
        attrs: this.getGraphicAttributes(targetGraphic),
        coordinate,
        focused,
      };
    },
    searchVariableMessageSignByName(keyword, options = {}) {
      const normalizedKeyword = String(keyword ?? '').trim();
      if (!normalizedKeyword) {
        return {
          found: false,
          reason: 'empty',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const results =
        this.findVariableMessageSignGraphicsByName(normalizedKeyword);
      if (results.length === 0) {
        return {
          found: false,
          reason: 'not-found',
          keyword: normalizedKeyword,
          results: [],
        };
      }

      const targetGraphic = results[0];
      const coordinate = this.getGraphicCoordinate(targetGraphic);
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return {
          found: false,
          reason: 'missing-coordinate',
          keyword: normalizedKeyword,
          results,
        };
      }

      this.setGraphicsVisibility('variableMessageSign', true);
      const focused = this.focusCoordinate(coordinate, {
        zoom: options.zoom ?? 17.2,
        duration: options.duration ?? 480,
      });

      return {
        found: true,
        keyword: normalizedKeyword,
        results,
        target: targetGraphic,
        attrs: this.getGraphicAttributes(targetGraphic),
        coordinate,
        focused,
      };
    },
    findNodeGraphicByCode(nodeCode, type = 'gantry') {
      const normalizedCode =
        type === 'tollStation'
          ? this.normalizeTollStationNodeCode(nodeCode)
          : this.normalizeNodeCode(nodeCode);
      if (!normalizedCode) return null;

      const sourceGraphics = this.graphicsByType[type] || [];
      return (
        sourceGraphics.find((graphic) => {
          if (!graphic || graphic.__isLabel) return false;
          const attrs = this.getGraphicAttributes(graphic);
          return this.getNodeCodeByGraphic(type, attrs) === normalizedCode;
        }) || null
      );
    },
    getGraphicCoordinate(graphic) {
      const geometry = graphic?.getGeometry?.();
      const coordinates = geometry?.getCoordinates?.();
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        return [Number(coordinates[0]), Number(coordinates[1])];
      }
      return null;
    },
    focusCoordinate(coordinate, options = {}) {
      if (!this.jmap) return false;
      if (!Array.isArray(coordinate) || coordinate.length < 2) return false;

      const rawMap = this.jmap.getMap?.();
      const view = rawMap?.getView?.();
      const currentZoom = Number(
        view?.getZoom?.() ?? this.jmap?.getZoom?.() ?? this.jmap?.getLevel?.()
      );
      const targetZoom = Number(options.zoom ?? 15.8);
      const nextZoom = Number.isFinite(currentZoom)
        ? Math.max(currentZoom, targetZoom)
        : targetZoom;

      try {
        if (view?.animate) {
          view.animate({
            center: coordinate,
            zoom: nextZoom,
            duration: options.duration ?? 480,
          });
          return true;
        }

        if (view?.setCenter) {
          view.setCenter(coordinate);
        } else if (typeof this.jmap.setCenter === 'function') {
          this.jmap.setCenter(coordinate);
        } else if (typeof this.jmap.centerAt === 'function') {
          this.jmap.centerAt(coordinate);
        }

        if (view?.setZoom) {
          view.setZoom(nextZoom);
        } else if (typeof this.jmap.setZoom === 'function') {
          this.jmap.setZoom(nextZoom);
        }

        return true;
      } catch (error) {
        console.warn('地图坐标聚焦失败:', error, coordinate);
        return false;
      }
    },
    focusWarningNodeByCode(nodeCode, options = {}) {
      if (!this.jmap) return false;

      const normalizedCode = this.normalizeNodeCode(nodeCode);
      if (!normalizedCode) return false;

      const type = this.isTollStationNodeCode(normalizedCode)
        ? 'tollStation'
        : options.type || 'gantry';
      const targetGraphic = this.findNodeGraphicByCode(normalizedCode, type);
      const coordinate = this.getGraphicCoordinate(targetGraphic);
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return false;
      }

      this.highlightWarningNodesByCodes([normalizedCode]);
      return this.focusCoordinate(coordinate, options);
    },
    focusGantryByNodeCode(nodeCode, options = {}) {
      return this.focusWarningNodeByCode(nodeCode, {
        ...options,
        type: 'gantry',
      });
    },
    addWarningGraphicsByType(type, targetCodes = new Set(), options = {}) {
      if (!targetCodes || targetCodes.size === 0) return;
      const sourceGraphics = this.graphicsByType[type] || [];
      const targetLayer = options.layer;
      const targetIcon = options.icon;
      if (!targetLayer || !targetIcon) return;

      sourceGraphics.forEach((graphic) => {
        if (!graphic || graphic.__isLabel) return;
        const attrs = this.getGraphicAttributes(graphic);
        const nodeCode = this.getNodeCodeByGraphic(type, attrs);
        if (!nodeCode || !targetCodes.has(nodeCode)) return;

        const coordinates = graphic?.getGeometry?.()?.getCoordinates?.();
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const warningGraphic = joint.GraphicUtil.getGraphic({
          geometry: new joint.Point([
            Number(coordinates[0]),
            Number(coordinates[1]),
          ]),
          symbolType: 'picturemarkersymbol',
          symbolStyle: {
            url: targetIcon,
            width: this.pointIconWidth,
            height: this.pointIconHeight,
          },
          infoTemplate: null,
          attributes: {
            ...attrs,
            pop_type: type,
          },
        });
        targetLayer?.add?.(warningGraphic);
      });
    },
    highlightWarningNodesByCodes(nodeCodes = []) {
      if (!this.jmap) return;

      const normalizedCodes = (Array.isArray(nodeCodes) ? nodeCodes : [])
        .map((code) => this.normalizeNodeCode(code))
        .filter(Boolean);
      const targetSet = new Set(normalizedCodes);
      if (targetSet.size === 0) return;

      if (!this.warningFocusVisibilitySnapshot) {
        this.warningFocusVisibilitySnapshot = { ...this.graphicsVisibility };
      }

      Object.keys(this.graphicsVisibility).forEach((type) => {
        this.setGraphicsVisibility(type, false);
      });

      this.warningGantryLayer?.clear?.();
      this.warningTollStationLayer?.clear?.();

      const gantryCodes = new Set();
      const tollStationCodes = new Set();
      targetSet.forEach((code) => {
        if (this.isTollStationNodeCode(code)) {
          const normalizedCode = this.normalizeTollStationNodeCode(code);
          if (normalizedCode) {
            tollStationCodes.add(normalizedCode);
          }
        } else {
          gantryCodes.add(code);
        }
      });

      this.addWarningGraphicsByType('gantry', gantryCodes, {
        layer: this.warningGantryLayer,
        icon: warningGantryIcon,
      });
      this.addWarningGraphicsByType('tollStation', tollStationCodes, {
        layer: this.warningTollStationLayer,
        icon: warningTollStationIcon,
      });
    },
    // 兼容旧调用：默认按门架规则高亮
    highlightGantryByNodeCodes(nodeCodes = []) {
      this.highlightWarningNodesByCodes(nodeCodes);
    },
    restoreDefaultPointDisplay() {
      this.warningGantryLayer?.clear?.();
      this.warningTollStationLayer?.clear?.();

      const snapshot = this.warningFocusVisibilitySnapshot;
      this.warningFocusVisibilitySnapshot = null;

      if (!snapshot || typeof snapshot !== 'object') return;

      Object.keys(this.graphicsVisibility).forEach((type) => {
        const visible = snapshot[type];
        this.setGraphicsVisibility(type, visible !== false);
      });
    },
    // 对外 API：按类型控制远程点位图标显示/隐藏
    // type: 'gantry' | 'service' | 'tollStation' | 'camera' | 'variableMessageSign'
    // visible: true 显示, false 隐藏
    setRemoteFeatureVisible(type, visible) {
      this.setGraphicsVisibility(type, visible);
    },
    // 统一封装 API
    // action: 'show' | 'hide' | 'toggle'
    controlRemoteFeature(type, action = 'toggle') {
      if (action === 'show') {
        this.setGraphicsVisibility(type, true);
      } else if (action === 'hide') {
        this.setGraphicsVisibility(type, false);
      } else {
        this.toggleGraphicsVisibility(type);
      }
    },
    // 控制点位显示/隐藏
    setGraphicsVisibility(type, visible) {
      if (!(type in this.graphicsVisibility)) {
        console.warn(`点位类型 ${type} 不存在`);
        return;
      }

      this.graphicsVisibility[type] = visible;
      this.rebuildTypeLayer(type);

      console.log(`${type} 点位${visible ? '显示' : '隐藏'}`);
    },
    // 获取点位可见性状态
    getGraphicsVisibility(type) {
      return this.graphicsVisibility[type] || false;
    },
    // 切换点位显示/隐藏
    toggleGraphicsVisibility(type) {
      const currentVisibility = this.getGraphicsVisibility(type);
      this.setGraphicsVisibility(type, !currentVisibility);
    },
  },

  destroyed() {
    this.stopPolylineArrowAnimation();
    const rawMap = this.jmap?.getMap?.();
    if (rawMap?.un && this.mapMoveEndHandler) {
      try {
        rawMap.un('moveend', this.mapMoveEndHandler);
      } catch (error) {
        console.warn('解绑地图移动事件失败:', error);
      }
    }
    if (this.jmap) {
      try {
        this.jmap.destroy();
      } catch (error) {
        console.error('销毁地图失败:', error);
      }
    }
  },
};
</script>
<style lang="less">
#map,
#mars3dContainer {
  height: 100%;
  width: 100%;
  .map-container {
    height: 100%;
    width: 100%;
    position: relative;
  }

  /* 左上角工具条 */
  // .map-container-action {
  //   position: absolute;
  //   top: 10px;
  //   left: 10px;
  //   z-index: 1000;
  //   display: flex;
  //   gap: 8px;
  //   align-items: center;
  //   background: rgba(255, 255, 255, 0.9);
  //   padding: 6px 8px;
  //   border-radius: 4px;
  //   box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  // }

  /* 按钮组样式 */
  // .btn-group {
  //   display: flex;
  //   gap: 4px;
  // }
  // .btn-group button {
  //   padding: 4px 8px;
  //   font-size: 12px;
  //   border: 1px solid #dcdfe6;
  //   background: #fff;
  //   cursor: pointer;
  //   border-radius: 3px;
  //   transition: all 0.2s;
  // }
  // .btn-group button:hover {
  //   background: #409eff;
  //   color: #fff;
  //   border-color: #409eff;
  // }

  // /* 单选按钮样式 */
  // .radio-group {
  //   display: flex;
  //   gap: 8px;
  // }
  // .radio-group label {
  //   font-size: 12px;
  //   cursor: pointer;
  //   display: flex;
  //   align-items: center;
  //   gap: 4px;
  // }
}
/* 隐藏不需要的地图控件 */
.joint-graphics-collection {
  display: none !important;
}

.joint-zoom {
  display: none !important;
}

.joint-control {
  display: none !important;
}

#Joint-Graphics-Collection {
  display: none !important;
}
</style>
