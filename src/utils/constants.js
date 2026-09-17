// src/utils/constants.js

/**
 * 地区 ID 常量
 */
export const REGION_IDS = {
  // 莆田地区 ID
  PUTIAN: 1594,
  // 福州地区 ID
  FUZHOU: 1591
};

/**
 * 请求类型常量
 */
export const REQUEST_TYPES = {
  // 收费信息请求类型
  FEE_INFO: 1,
};

/**
 * 莆田服务区常量
 */
export const PUTIAN_SERVICE_AREAS = {
  CAIXIYAN: {
    name: '菜溪岩服务区',
    areaA: 'A088',
    areaB: 'B088',
  },
  DAJI: {
    name: '大济服务区',
    areaA: 'A074',
    areaB: 'A074', //暂时用 A （接口问题
  },
  BAISHA: {
    name: '白沙服务区',
    areaA: 'A102',
    areaB: 'B102',
  },
  SHANXIANG: {
    name: '善乡服务区',
    areaA: 'A075',
    areaB: 'B075',
  },
};

// 导出默认值
export default {
  REGION_IDS,
  REQUEST_TYPES,
  PUTIAN_SERVICE_AREAS,
};
