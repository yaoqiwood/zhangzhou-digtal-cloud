<template>
  <div class="mp-content">
    <div class="mpc-box">
      <div class="mp-content_header_flex">
        <div class="mpch_title">{{ data.sub_name }} 的详情</div>
        <div class="mpch_close_btn" @click="onClose">X</div>
      </div>
      <div class="mp-content_sec_title">
        <span class="mll-tag-route">L桩号：{{ routeInfo }}</span>
        <statusTag style="margin-left: 5px" type="active">已启用</statusTag>
        <!-- <statusTag type="inactive">未启用</statusTag> -->
      </div>
      <div class="mp-content_detail">
        <div class="mpc-status-dashboard mpc-dashboard-main">
          <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">车位总数（个）</span>
              <span class="mpc-number">{{ totalParkingSpaces }}</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">服务区面积(m²)</span>
              <span class="mpc-number">{{ serviceAreaSize }}</span>
            </div>
            <div class="mpc-info-column">
              <span class="mpc-label">停车场面积(m²)</span>
              <span class="mpc-number">{{ parkingAreaSize }}</span>
            </div>
          </div>
        </div>

        <div
          class="mpc-status-dashboard mpc-dashboard-secondary"
          style="margin-top: 10px"
        >
          <div class="mpc-card-item mpc-info-group">
            <div
              class="mpc-info-column"
              style="text-align: left; padding-left: 5px; height: 72px"
            >
              <span class="mpc-label">服务设施</span>
              <span class="mpc-number" style="font-size: 11px">{{
                facilities
              }}</span>
            </div>
          </div>
        </div>

        <div
          class="mpc-status-dashboard mpc-dashboard-secondary"
          style="margin-top: 10px"
        >
          <!-- <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">车位总数</span>
              <span class="mpc-number">{{ totalParkingSpaces }}</span>
              <span class="mpc-unit">辆</span>
            </div>
          </div> -->
          <!-- <div class="mpc-card-item mpc-info-group">
            <div class="mpc-info-column">
              <span class="mpc-label">充电站总数</span>
              <span class="mpc-number">{{ totalChargingStations }}</span>
              <span class="mpc-unit">个</span>
            </div>
          </div> -->
        </div>
      </div>
      <div class="mcp_chart">
        <ServiceChart :data="data" />
      </div>
    </div>
  </div>
</template>

<script>
import statusTag from '@/components/statusTag/index.vue';
// import PopTrafficDashboard from '../PopTrafficDashboard.vue';
import ServiceChart from '../chart/ServiceChart.vue';
import { API_URLS } from '@/utils/apiUrls';
import http from '@/utils/http';
import { PUTIAN_SERVICE_AREAS } from '@/utils/constants.js';

export default {
  name: 'TrafficInfoPopup',
  components: {
    statusTag,
    // PopTrafficDashboard,
    ServiceChart,
  },
  props: {
    title: { type: String, default: '信息' },
    data: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      active: 'active',
      // 服务区基本信息
      serviceAreaInfo: {
        server_area_no: '',
        serviceareaname: '',
        road_no: '',
        direction: '',
        cover_area: '',
        park_area: '',
        all_park: '',
        introduce: '',
        area_ability: '',
        all_charging: '',
        big_car_park: '',
        small_car_park: '',
        truck_park: '',
        dangerous_park: '',
        special_park: '',
        barrier_free_park: '',
        new_energy_park: '',
      },
    };
  },
  emits: ['close'],
  computed: {
    routeInfo() {
      if (this.data.route_no && this.data.route_name) {
        return `${this.data.route_no}${this.data.route_name}`;
      }
      return this.data.route_name || this.data.route_no || '-';
    },
    serviceAreaSize() {
      return this.data.service_area_size || '-';
    },
    parkingAreaSize() {
      return this.data.parking_area_size || '-';
    },
    facilities() {
      return this.serviceAreaInfo.introduce || this.data.content || '-';
    },
    // 服务区所在路线
    routeInfo() {
      if (this.serviceAreaInfo.road_no) {
        return this.serviceAreaInfo.road_no;
      }
      if (this.data.route_no && this.data.route_name) {
        return `${this.data.route_no}${this.data.route_name}`;
      }
      return this.data.route_name || this.data.route_no || '-';
    },
    // 服务区面积
    serviceAreaSize() {
      return (
        this.serviceAreaInfo.cover_area || this.data.service_area_size || '-'
      );
    },
    // 停车场面积
    parkingAreaSize() {
      return (
        this.serviceAreaInfo.park_area || this.data.parking_area_size || '-'
      );
    },
    // 车位总数
    totalParkingSpaces() {
      return this.serviceAreaInfo.all_park || '300';
    },
    // 充电桩总数
    totalChargingStations() {
      return this.serviceAreaInfo.all_charging || '200';
    },
  },
  mounted() {
    // 组件挂载后的初始化操作
    console.log('TrafficInfoPopup 组件已挂载');
    console.log('弹窗标题:', this.title);
    console.log('弹窗数据:', this.data);
    // 获取服务区基本信息
    this.fetchServiceAreaBaseInfo();
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    // 根据 sub_name 获取服务区代码
    getServiceAreaCode(subName, direction) {
      // console.log('获取服务区代码，subName:', subName, 'direction:', direction);

      // 遍历所有服务区，找到匹配的服务区
      for (const [key, serviceArea] of Object.entries(PUTIAN_SERVICE_AREAS)) {
        // 检查 sub_name 是否包含服务区名称
        if (subName && subName.includes(serviceArea.name)) {
          console.log('找到匹配的服务区:', serviceArea.name);

          // 根据 direction 判断是 A 区还是 B 区
          if (direction === 'A') {
            console.log('使用 A 区代码:', serviceArea.areaA);
            return serviceArea.areaA;
          } else if (direction === 'B') {
            console.log('使用 B 区代码:', serviceArea.areaB);
            return serviceArea.areaB;
          }
        }
      }

      console.warn('未找到匹配的服务区代码');
      return null;
    },
    // 获取服务区基本信息
    async fetchServiceAreaBaseInfo() {
      try {
        if (!this.data || !this.data.sub_name || !this.data.direction) {
          console.warn('缺少必要参数: sub_name 或 direction');
          return;
        }
        // console.log('this.data:');
        // console.log(this.data);
        // 获取服务区代码
        const serviceAreaCode = this.getServiceAreaCode(
          this.data.sub_name,
          this.data.direction
        );

        if (!serviceAreaCode) {
          console.error('无法获取服务区代码');
          return;
        }

        // console.log(
        //   '调用获取服务区基本信息接口，参数 serviceAreaCode:',
        //   serviceAreaCode
        // );

        const response = await http.get(
          API_URLS.putian_highway.getServiceAreaBaseInfo,
          { serviceAreaCode }
        );

        // console.log('获取到的服务区基本信息:', response);

        // 处理数据并更新
        if (response && response.length > 0) {
          this.serviceAreaInfo = {
            ...this.serviceAreaInfo,
            ...response[0],
          };
          console.log('this.serviceAreaInfo:');
          console.log(this.serviceAreaInfo);
        }
      } catch (error) {
        console.error('获取服务区基本信息失败:', error);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.mpc-box {
  height: 55%;
  margin: 3.5% 7% 0 7%;

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
        /* 核心近处光晕 */ 0 0 10px rgba(255, 255, 255, 0.5),
        /* 中层扩散 */ 0 0 20px rgba(173, 216, 230, 0.3); /* 外层淡蓝色虚化 */

      filter: blur(0.5px);
      opacity: 0.9;
    }
  }
  .mp-content_sec_title {
    color: #418adb;
    font-weight: bold;

    .mll-tag-route {
      display: inline-block;
      background: #28a745;
      color: #fff;
      font-size: 12px;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #ffffff55;
    }
  }

  .mp-content_detail {
    margin-top: 5px;

    .mpc-status-dashboard {
      display: flex;
      gap: 12px;
      font-family: 'Microsoft YaHei', sans-serif;

      // 公用卡片容器
      .mpc-card-item {
        background: #0a2a68;
        border: 1px solid #1a428a;
        border-radius: 4px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
      }

      // 左侧三个信息的组合容器
      .mpc-info-group {
        flex: 2;
        padding: 3px 0;
        justify-content: space-around;

        .mpc-info-column {
          text-align: center;
          position: relative;
          flex: 1;

          .mpc-number {
            font-size: 20px;
            font-weight: 500;
            color: #ffffff;
            margin-right: 4px;
            font-family: Arial, Helvetica, sans-serif;
          }

          .mpc-unit {
            font-size: 13px;
            color: #418adb;
            margin-top: 4px;
          }
          // 新增：针对第一列“门架类型”缩小比例
          &:first-child {
            flex: 1; // 将比例缩小，其他两列会相对变宽
          }
          &:nth-child(1) {
            flex: 1.2; // 将比例缩小，其他两列会相对变宽
          }

          &:nth-child(3) {
            flex: 0.8; // 将比例缩小，其他两列会相对变宽
          }

          // 中间的垂直分割线
          &:not(:last-child)::after {
            content: '';
            position: absolute;
            right: 0;
            top: 20%;
            height: 60%;
            width: 1px;
            background: linear-gradient(
              to bottom,
              transparent,
              #1a428a,
              transparent
            );
          }

          .mpc-label {
            font-size: 11px;
            color: #418adb;
            margin-bottom: 6px;
            display: block;
            white-space: nowrap;
          }

          .mpc-value {
            font-size: 11px;
            color: #ffffff;
            font-weight: bold;
            display: block;
          }
        }
      }

      // 右侧大数字展示卡片
      .mpc-data-display {
        flex: 1;
        padding: 0 0px;
        justify-content: center;
        align-items: center;

        .mpc-number {
          font-size: 25px;
          font-weight: 500;
          color: #ffffff;
          margin-right: 4px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .mpc-unit {
          font-size: 13px;
          color: #418adb;
          margin-top: 4px;
        }
      }
    }
  }
  .mcp_chart {
    margin-top: 10px;
    height: 88%;
  }
}
</style>
