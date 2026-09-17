// API URL 常量集
export const API_URLS = {
  // 收费相关 URLs
  putian_highway: {
    getFeeInfo: '/api/function/getshoufeiapi', // 收费站金额统计信息
    getStationRank: '/api/function/getFeeCard', // 收费站统计
    getRealTimeTrafficFlow: '/api/function/getRealTimeTrafficFlow', // 实时流量
    // getIndexDatas: '/api/jieban/getIndexDatas', // 首页指标数据
    getPredictFlow: '/api/function/getPredictFlow', // 预测流量
    predictFlow: '/api/function/predictFlow', // 门架预测流量（新）
    // getVehJamStatus: '/api/function/getVehJamStatus', // 旧：堵塞信息等（这是个复核接口），暂注释保留以便后续接口替换
    getStationWindowsDetail: '/api/function/getStationWindowsDetail', // 收费站弹窗详情
    getGantryBasicInfo: '/api/function/getGantryBasicInfo', //门架弹窗基础信息
    getTeQingSection: '/api/function/getTeQingSection', //特情区
    getTeQingList: '/api/function/getTeQingList', // 特情详情
    getRetentionInfo: '/api/function/getRetentionInfo', // 滞留车辆弹窗基本信息
    getFeeInfoDetail: '/api/function/getFeeInfo', // 流量占比API
    getTeQingChartByPlate: '/api/function/getTeQingChartByPlate', // 特情柱状图图表
    getTrafficEventInfo: '/api/function/getTrafficFromChangwei', // getTrafficEventInfo 交通事件
    getGantryFlowBar: '/api/function/getGantryFlowBar', //门架流量柱状堆叠图
    getEventData: '/api/jieban/getEventData', // 车辆历史和速度图表接口
    getEnStationFlow: '/api/function/getEnStationFlow', //'收费站入口弹窗信息'
    getExStationFlow: '/api/function/getExStationFlow', // 收费站出口弹窗信息
    getTrafficTypeInfo: '/api/function/getTrafficTypeInfo', // 流量类型弹窗信息
    getTrafficCaseInfo: '/api/function/getTrafficCaseInfo', //莆田话务弹窗信息
    getServiceWindowInfo: '/api/function/getServiceWindowInfo', // 获取服务区弹窗信息
    getServiceAreaBaseInfo: '/api/function/getServiceAreaBaseInfo', //  获取服务区基本信息
    getJamRoads: '/api/function/getJamRoads', //getJamRoads //获取拥堵路段信息
    getCongestionEventList: '/api/function/congestionEventList', // 获取缓行区段列表
    getRoadConditionList: '/api/function/roadConditionList', // 获取实时路况列表
    setPositionByNode: '/api/function/setPositionByNode', // 根据节点获取路段位置线
    getThreadholdInfo: '/api/function/getThreadholdInfo', // 获取区段阈值信息
    getAllPositionByNode: '/api/function/getAllPositionByNode', // 获取全部路况节点点位
    getSectionMgmtList: '/api/function/sectionMgmtList', // 获取区段重点车辆管理列表
    getVehicleList: '/api/function/vehicleList', // 获取滞留车辆详情列表
    getPTTopoCount: '/api/function/getPTTopoCount', // getPTTopoCount 获取总的莆田拓扑总数
    getErrorInfoByPlate: '/api/vehicle/getErrorInfoByPlate', // getErrorInfoByPlate 获取指定车牌的路径
    exportGantryFlowExcel: '/api/function/exportGantryFlowExcel', // 门架流量月报表导出
    getMonthGantryFlow: '/api/jieban/getMonthGantryFlow', // 门架流量月报表
    getDailyStationFlow: '/api/jieban/getDailyStationFlow', // 每日收费流量报表
    getReportData: '/api/function/getReportData', // 智慧云月征费比较报表
    getHolidayTollComparison: '/api/jieban/getHolidayTollComparison', // 节假日通行费与流量对比报表
    getHolidayTollYearlyComparison:
      '/api/jieban/getHolidayTollYearlyComparison', // 节假日年度通行费与车流同比
    getDailyStationToll: '/api/jieban/getDailyStationToll', // 节假日收费站每日流量排名
    getHolidayStationRankYearlyCompare:
      '/api/jieban/getHolidayStationRankYearlyCompare', // 节假日收费站峰值同比
    getHolidayStationDayComparison:
      '/api/jieban/getHolidayStationDayComparison', // 节前一天与假期首日收费站对比
    getTop4StationHourlyFlow: '/api/jieban/getTop4StationHourlyFlow', // 节假日4站点逐小时流量
    getStationRoadSimpleFlow: '/api/jieban/getStationRoadSimpleFlow', // 收费站路段流量简表
    getServiceAreaSimpleFlow: '/api/jieban/getServiceAreaSimpleFlow', // 服务区流量简表
    getDetailTollData: '/api/jieban/getDetailTollData', // 收费明细通行费数据

    // getEventData: '/api/function/getEventData', //门架弹窗详情信息
  },

  // 视频相关
  video: {
    getVideoList: '/api/video/getVideoList',
    getVideoListByFlags: '/api/video/getVideoListByFlags',
    getVideoUrl: '/api/video/getVideoUrl',
  },

  // 其他模块...
};

// 导出默认值
export default {
  API_URLS,
};
