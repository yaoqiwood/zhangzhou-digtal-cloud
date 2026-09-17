import request from './request';
import mockService from './mockService';
import { ENABLE_1591_APIS } from '../settings/apiSwitches.js';

const ORG_ID_KEYS = ['origid', 'orgid', 'orgId', 'belongOrg', 'belongOrgId'];

const isDisabled1591Request = (payload = {}) =>
  !ENABLE_1591_APIS &&
  ORG_ID_KEYS.some((key) => String(payload?.[key] ?? '').trim() === '1591');

const disabled1591Response = () => Promise.resolve([]);

/**
 * 检查 URL 是否为完整的 URL
 * @param {string} url - URL 字符串
 * @returns {boolean}
 */
function isFullUrl(url) {
  return /^https?:\/\//i.test(url);
}

/**
 * 封装 GET 请求
 * @param {string} url - 请求地址
 * @param {object} params - 请求参数
 * @param {object} config - 其他配置
 * @returns {Promise}
 */
export function get(url, params = {}, config = {}) {
  // 1591 接口暂时停用，保留调用结构，后续打开开关即可恢复。
  if (isDisabled1591Request(params)) return disabled1591Response();

  // 检查是否有mock数据
  const mockData = mockService.getMockData(url);
  if (mockData && mockService.getEnabled()) {
    // 如果有mock数据且mock服务启用，直接返回mock数据
    // 检查是否是复杂嵌套结构 (如getVideoUrl接口)
    if (
      mockData.data &&
      mockData.data.code !== undefined &&
      mockData.data.data !== undefined
    ) {
      // 返回内部的data数据
      return Promise.resolve(mockData.data);
    } else {
      // 返回普通的mock数据结构
      return Promise.resolve(
        mockData.data !== undefined ? mockData.data : mockData
      );
    }
  }

  // 如果是完整的 URL，直接使用，不与 baseURL 拼接
  if (isFullUrl(url)) {
    return request({
      url,
      method: 'get',
      params,
      baseURL: '', // 清空 baseURL
      ...config,
    });
  }
  // 否则，使用默认的 baseURL
  return request({
    url,
    method: 'get',
    params,
    ...config,
  });
}

/**
 * 封装 POST 请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体数据
 * @param {object} config - 其他配置
 * @returns {Promise}
 */
export function post(url, data = {}, config = {}) {
  // 1591 接口暂时停用，保留调用结构，后续打开开关即可恢复。
  if (isDisabled1591Request(data)) return disabled1591Response();

  // 如果是完整的 URL，直接使用，不与 baseURL 拼接
  // 检查是否有mock数据
  const mockData = mockService.getMockData(url);
  if (mockData && mockService.getEnabled()) {
    // 如果有mock数据且mock服务启用，直接返回mock数据
    return Promise.resolve(
      mockData.data !== undefined ? mockData.data : mockData
    );
  }
  if (isFullUrl(url)) {
    return request({
      url,
      method: 'post',
      data,
      baseURL: '', // 清空 baseURL
      ...config,
    });
  }
  // 否则，使用默认的 baseURL
  return request({
    url,
    method: 'post',
    data,
    ...config,
  });
}

/**
 * 封装 PUT 请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体数据
 * @param {object} config - 其他配置
 * @returns {Promise}
 */
export function put(url, data = {}, config = {}) {
  // 1591 接口暂时停用，保留调用结构，后续打开开关即可恢复。
  if (isDisabled1591Request(data)) return disabled1591Response();

  // 检查是否有mock数据
  const mockData = mockService.getMockData(url);
  if (mockData && mockService.getEnabled()) {
    // 如果有mock数据且mock服务启用，直接返回mock数据
    // 检查是否是复杂嵌套结构 (如getVideoUrl接口)
    if (
      mockData.data &&
      mockData.data.code !== undefined &&
      mockData.data.data !== undefined
    ) {
      // 返回内部的data数据
      return Promise.resolve(mockData.data);
    } else {
      // 返回普通的mock数据结构
      return Promise.resolve(
        mockData.data !== undefined ? mockData.data : mockData
      );
    }
  }
  // 如果是完整的 URL，直接使用，不与 baseURL 拼接
  if (isFullUrl(url)) {
    return request({
      url,
      method: 'put',
      data,
      baseURL: '', // 清空 baseURL
      ...config,
    });
  }
  // 否则，使用默认的 baseURL
  return request({
    url,
    method: 'put',
    data,
    ...config,
  });
}

/**
 * 封装 DELETE 请求
 * @param {string} url - 请求地址
 * @param {object} params - 请求参数
 * @param {object} config - 其他配置
 * @returns {Promise}
 */
export function del(url, params = {}, config = {}) {
  // 1591 接口暂时停用，保留调用结构，后续打开开关即可恢复。
  if (isDisabled1591Request(params)) return disabled1591Response();

  // 检查是否有mock数据
  const mockData = mockService.getMockData(url);
  if (mockData && mockService.getEnabled()) {
    // 如果有mock数据且mock服务启用，直接返回mock数据
    // 检查是否是复杂嵌套结构 (如getVideoUrl接口)
    if (
      mockData.data &&
      mockData.data.code !== undefined &&
      mockData.data.data !== undefined
    ) {
      // 返回内部的data数据
      return Promise.resolve(mockData.data);
    } else {
      // 返回普通的mock数据结构
      return Promise.resolve(
        mockData.data !== undefined ? mockData.data : mockData
      );
    }
  }
  // 如果是完整的 URL，直接使用，不与 baseURL 拼接
  if (isFullUrl(url)) {
    return request({
      url,
      method: 'delete',
      params,
      baseURL: '', // 清空 baseURL
      ...config,
    });
  }
  // 否则，使用默认的 baseURL
  return request({
    url,
    method: 'delete',
    params,
    ...config,
  });
}

/**
 * 封装文件上传
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {object} config - 其他配置
 * @returns {Promise}
 */
export function upload(url, formData, config = {}) {
  // 如果是完整的 URL，直接使用，不与 baseURL 拼接
  if (isFullUrl(url)) {
    return request({
      url,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      baseURL: '', // 清空 baseURL
      ...config,
    });
  }
  // 否则，使用默认的 baseURL
  return request({
    url,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config,
  });
}

// 默认导出所有方法
export default {
  get,
  post,
  put,
  del,
  upload,
};
