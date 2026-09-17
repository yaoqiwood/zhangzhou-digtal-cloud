// 福州数智云接口常量
// 数据来源：resources/福州数智云打勾接口清单.md

export const FUZHOU_API_URLS = {
  // 收费相关
  fee: {
    getShoufeiApi: '/api/function/getshoufeiapi', // 收费金额接口数据
    getFeeInfo: '/api/function/getFeeInfo', // 收费信息接口数据
    getFeeCard: '/api/function/getFeeCard', // 收费信息-收费站卡片信息
    getShoufeiRank: '/api/function/getShoufeiRank', // 收费详细数据
    getStationWindowsDetail: '/api/function/getStationWindowsDetail', // 收费站弹窗详情
    getExStationFlow: '/api/function/getExStationFlow', // 出口收费站流量
    getEnStationFlow: '/api/function/getEnStationFlow', // 入口收费站流量
  },

  // 门架相关
  gantry: {
    getGantryRank: '/api/function/getGantryRank', // 门架详细数据
    getGantryFlowBar: '/api/function/getGantryFlowBar', // 门架流量柱状堆叠图
  },

  // 服务区相关
  serviceArea: {
    getServiceWindowInfo: '/api/function/getServiceWindowInfo', // 服务区弹窗信息
    getServiceAreaBaseInfo: '/api/function/getServiceAreaBaseInfo', // 服务区基础数据
  },

  // 视频相关
  video: {
    getVideoUrl: '/api/video/getVideoUrl', // 获取视频 url
    getVideoList: '/api/video/getVideoList', // 获取视频列表
    getVideoListByFlags: '/api/video/getVideoListByFlags', // 通过 flagid 取视频列表
  },

  // 交通事件与路况相关
  traffic: {
    getTrafficEventInfo: '/trafficEvent/getTrafficEventInfo', // 交通事件（带后续信息）
    getPTTopoCount: '/api/function/getPTTopoCount', // 畅通比计算
    getJamRoads: '/api/function/getJamRoads', // 拥堵列表
    getEventData: '/api/jieban/getEventData', // 车辆历史和速度图接口
    setPositionByNode: '/api/function/setPositionByNode', // 输入入口和出口节点定位事故未知
  },

  // 阈值相关
  threshold: {
    updateSettingValue: '/api/function/updateSettingValue', // 上传阈值设置
    getThreadholdInfo: '/api/function/getThreadholdInfo', // 获取区段阈值
  },

  // 特情与重点车辆相关
  specialEvent: {
    getRetentionInfo: '/api/function/getRetentionInfo', // 弹窗历史交易区段表格
    getTeQingSection: '/api/function/getTeQingSection', // 收费特情区段
    getTeQingList: '/api/function/getTeQingList', // 收费特情区段内车辆列表
    getTeQingChartByPlate: '/api/function/getTeQingChartByPlate', // 特情弹窗-柱状堆叠图
    getErrorInfoByPlate: '/api/vehicle/getErrorInfoByPlate', // 滞留车辆路径
  },
};

export default FUZHOU_API_URLS;
