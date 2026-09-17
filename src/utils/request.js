import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: '', // 基础 URL，使用默认配置
  timeout: 120000, // 请求超时时间（120s）
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等认证信息
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response;
    // console.log('响应数据:', res);
    // 可以根据后端返回的数据结构进行统一处理
    if (res.status !== 200) {
      // 处理错误情况
      // console.error('响应错误:', res.message || '未知错误');
      return Promise.reject(new Error(res || '未知错误'));
    } else {
      // 交通事件接口需要保留顶层统计字段（other/shigu/yanghu/zaihai）
      if (
        res.config &&
        typeof res.config.url === 'string' &&
        res.config.url.includes('/trafficEvent/getTrafficEventInfo') &&
        res.data &&
        typeof res.data === 'object'
      ) {
        return res.data;
      }

      // console.log('res:');
      // console.log(res);
      if (res.data && res.data.statistic !== undefined) {
        return res.data;
      }
      // 安全访问 res.data.data，处理可能的 mock 数据结构
      if (
        res.data &&
        typeof res.data === 'object' &&
        res.data.data !== undefined
      ) {
        return res.data.data;
      }
      // 如果是 mock 数据格式，直接返回 res.data
      if (
        res.data &&
        res.data.code !== undefined &&
        res.data.message !== undefined
      ) {
        // 对于 mock 数据，如果它本身包含 data 字段，则返回 res.data.data，否则返回 res.data
        return res.data.data !== undefined ? res.data.data : res.data;
      }
      return res.data.data;
    }
  },
  (error) => {
    console.error('响应错误:', error);
    return Promise.reject(error);
  }
);

export default service;
