// const FRESH_TIME = 10 * 60 * 1000;
const FRESH_TIME = 2 * 60 * 1000; // 统一刷新时间

// 统一数据刷新时间配置（毫秒）
export const REFRESH_INTERVALS = {
  REALTIME_TRAFFIC: FRESH_TIME,
  TRAFFIC_EVENT_INFO: 5 * 60 * 1000, // 交通事件信息固定 5 分钟
  NOTIFICATION_DURATION: 5 * 60 * 1000, // 通知停留时长（5分钟）
  SECTION_VEHICLE_MANAGEMENT: FRESH_TIME, // 区段重点车辆管理刷新时间
  TRAFFIC_FLOW_PANEL: FRESH_TIME, // 流量面板刷新时间
  CHARGE_STATS: FRESH_TIME, // 收费统计刷新时间
  CALL_ANALYSIS_CHART: FRESH_TIME, // 话务分析刷新时间
};

// 统一自动刷新开关
export const REFRESH_SWITCHES = {
  GLOBAL: true,
  REALTIME_TRAFFIC: true,
  TRAFFIC_EVENT_INFO: true,
  SECTION_VEHICLE_MANAGEMENT: true,
  TRAFFIC_FLOW_PANEL: true,
  CHARGE_STATS: true,
  CALL_ANALYSIS_CHART: true,
};

export default {
  REFRESH_INTERVALS,
  REFRESH_SWITCHES,
};
