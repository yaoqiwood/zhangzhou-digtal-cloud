<template>
  <div class="api-tester-container">
    <h2>API 测试工具</h2>

    <!-- Mock服务控制 -->
    <div class="mock-control-section">
      <div class="config-row">
        <label>Mock服务:</label>
        <div class="mock-status">
          <span :class="['status-indicator', { active: isMockEnabled }]">
            {{ isMockEnabled ? '已启用' : '已禁用' }}
          </span>
        </div>
        <button
          class="toggle-mock-btn"
          :class="{
            'disable-mock': isMockEnabled,
            'enable-mock': !isMockEnabled,
          }"
          @click="toggleMockService"
        >
          {{ isMockEnabled ? '禁用Mock' : '启用Mock' }}
        </button>
      </div>
    </div>

    <!-- 保存的接口配置 -->
    <div class="api-config-section">
      <div class="config-row">
        <label>已保存的接口:</label>
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索接口名称或地址..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="clear-search-btn"
            @click="clearSearch"
          >
            ✕
          </button>
        </div>
      </div>
      <div class="config-row">
        <select v-model="selectedSavedConfig" @change="loadSavedConfig">
          <option value="">-- 选择已保存的接口 --</option>
          <option
            v-for="config in filteredConfigs"
            :key="config.id"
            :value="config.id"
          >
            {{ config.name }} ({{ config.method }} {{ config.endpoint }})
          </option>
        </select>

        <button class="new-btn" @click="newApiConfig">新建接口</button>
        <button
          class="delete-btn"
          v-if="selectedSavedConfig"
          @click="deleteSavedConfig"
        >
          删除配置
        </button>
      </div>
    </div>

    <!-- 基础配置 -->
    <div class="api-config-section">
      <div class="config-row">
        <label>配置名称:</label>
        <input type="text" v-model="configName" placeholder="输入配置名称" />

        <label>接口地址:</label>
        <input
          type="text"
          v-model="endpoint"
          placeholder="输入接口地址，例如 /api/user"
          class="endpoint-input"
        />

        <label>请求方法:</label>
        <select v-model="method">
          <option value="get">GET</option>
          <option value="post">POST</option>
          <option value="put">PUT</option>
          <option value="delete">DELETE</option>
        </select>

        <button class="test-btn" @click="testApi">测试接口</button>
        <button class="save-btn" @click="saveConfig">保存当前配置</button>
      </div>
    </div>

    <!-- 请求参数 -->
    <div class="api-params-section">
      <h3>请求参数</h3>
      <div class="params-container">
        <div class="params-tab">
          <button
            v-for="tab in paramsTabs"
            :key="tab"
            :class="['tab-btn', { active: activeParamsTab === tab }]"
            @click="activeParamsTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- 查询参数 -->
        <div v-if="activeParamsTab === 'Query'" class="params-content">
          <div
            v-for="(param, index) in queryParams"
            :key="index"
            class="param-row"
          >
            <input type="text" v-model="param.key" placeholder="参数名" />
            <input type="text" v-model="param.value" placeholder="参数值" />
            <button class="remove-param-btn" @click="removeQueryParam(index)">
              删除
            </button>
          </div>
          <button class="add-param-btn" @click="addQueryParam">添加参数</button>
        </div>

        <!-- 请求体 -->
        <div v-else-if="activeParamsTab === 'Body'" class="params-content">
          <textarea
            v-model="requestBody"
            placeholder="输入请求体 JSON 数据"
            class="body-textarea"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 请求结果 -->
    <div class="api-result-section">
      <h3>请求结果</h3>
      <div class="result-container">
        <div class="result-header">
          <span>状态码: {{ response.status }}</span>
          <span>响应时间: {{ response.time }}ms</span>
        </div>
        <div class="result-body">
          <div v-if="isLoading" class="loading-state">请求中......</div>
          <pre v-else>{{ formattedResponse }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { get, post, put, del } from '../utils/http';
import { API_URLS } from '../utils/apiUrls';
import mockService from '../utils/mockService';

// Mock服务控制
const isMockEnabled = ref(true); // 默认启用mock服务

// 基础配置
const endpoint = ref('');
const method = ref('get');
const configName = ref('');

// 请求参数
const paramsTabs = ['Query', 'Body'];
const activeParamsTab = ref('Query');
const queryParams = ref([]);
const requestBody = ref('{"name": "test", "value": "123"}');

// 保存的配置
const savedConfigs = ref([]);
const selectedSavedConfig = ref('');
const searchQuery = ref('');

// 过滤后的配置
const filteredConfigs = computed(() => {
  if (!searchQuery.value) {
    return savedConfigs.value;
  }

  const query = searchQuery.value.toLowerCase();
  return savedConfigs.value.filter(
    (config) =>
      config.name?.toLowerCase().includes(query) ||
      config.endpoint?.toLowerCase().includes(query) ||
      config.method?.toLowerCase().includes(query)
  );
});

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
};

// 从本地存储加载保存的配置
const loadSavedConfigs = () => {
  try {
    const saved = localStorage.getItem('apiTesterConfigs');
    if (saved) {
      // 确保以数组+JSON的形式加载
      const parsedConfigs = JSON.parse(saved);
      // 确保是数组格式
      if (Array.isArray(parsedConfigs)) {
        savedConfigs.value = parsedConfigs;
      } else {
        console.error('本地存储的配置格式错误，应为数组');
        savedConfigs.value = [];
      }
    }
  } catch (error) {
    console.error('加载保存的配置失败:', error);
    savedConfigs.value = [];
  }
};

// 保存配置到本地存储
const saveConfigsToLocal = () => {
  try {
    // 确保以数组+JSON的形式保存
    localStorage.setItem(
      'apiTesterConfigs',
      JSON.stringify(savedConfigs.value)
    );
  } catch (error) {
    console.error('保存配置到本地存储失败:', error);
  }
};

// 保存当前配置
const saveConfig = () => {
  if (!configName.value) {
    alert('请输入配置名称');
    return;
  }

  const configId = Date.now().toString();
  const newConfig = {
    id: configId,
    name: configName.value,
    endpoint: endpoint.value,
    method: method.value,
    queryParams: [...queryParams.value],
    requestBody: requestBody.value,
    activeParamsTab: activeParamsTab.value,
  };

  // 检查是否已存在同名配置
  const existingIndex = savedConfigs.value.findIndex(
    (config) => config.name === configName.value
  );
  if (existingIndex !== -1) {
    // 更新现有配置
    savedConfigs.value[existingIndex] = newConfig;
  } else {
    // 添加新配置
    savedConfigs.value.push(newConfig);
  }

  saveConfigsToLocal();
  selectedSavedConfig.value = configId;
  alert('配置保存成功');
};

// 加载保存的配置
const loadSavedConfig = () => {
  if (!selectedSavedConfig.value) return;

  const config = savedConfigs.value.find(
    (config) => config.id === selectedSavedConfig.value
  );
  if (config) {
    configName.value = config.name;
    endpoint.value = config.endpoint;
    method.value = config.method;
    // 确保 queryParams 是数组格式
    queryParams.value = Array.isArray(config.queryParams)
      ? [...config.queryParams]
      : [];
    requestBody.value = config.requestBody;
    activeParamsTab.value = config.activeParamsTab;
    // 加载配置后清除搜索，以便用户能看到所有配置
    searchQuery.value = '';
  }
};

// 删除保存的配置
const deleteSavedConfig = () => {
  if (!selectedSavedConfig.value) return;

  if (confirm('确定要删除此配置吗？')) {
    savedConfigs.value = savedConfigs.value.filter(
      (config) => config.id !== selectedSavedConfig.value
    );
    saveConfigsToLocal();
    selectedSavedConfig.value = '';
    alert('配置删除成功');
  }
};

// 新建接口配置
const newApiConfig = () => {
  // 清空当前配置
  configName.value = '';
  endpoint.value = '';
  method.value = 'get';
  queryParams.value = [];
  requestBody.value = '{"name": "test", "value": "123"}';
  activeParamsTab.value = 'Query';
  selectedSavedConfig.value = '';
  response.value = {
    status: '',
    time: '',
    data: null,
  };
};

// 初始化mock服务状态
const initMockState = () => {
  try {
    const storedState = localStorage.getItem('mockServiceEnabled');
    if (storedState !== null) {
      const enabled = JSON.parse(storedState);
      isMockEnabled.value = enabled;
      mockService.setEnabled(enabled);
    } else {
      // 默认状态
      isMockEnabled.value = mockService.getEnabled();
    }
  } catch (error) {
    console.error('读取mock服务状态失败:', error);
    isMockEnabled.value = mockService.getEnabled();
  }

  mockService.logInitStatus();
};

// 切换mock服务
const toggleMockService = () => {
  const newState = !isMockEnabled.value;
  isMockEnabled.value = newState;
  mockService.setEnabled(newState);

  // 保存状态到localStorage
  try {
    localStorage.setItem('mockServiceEnabled', JSON.stringify(newState));
  } catch (error) {
    console.error('保存mock服务状态失败:', error);
  }
};

// 组件挂载时加载保存的配置
onMounted(() => {
  loadSavedConfigs();
  initMockState(); // 初始化mock状态
  // 添加预设的视频列表接口配置
  addPresetVideoConfig();
});

// 添加预设的视频列表接口配置
const addPresetVideoConfig = () => {
  // 检查是否已存在该配置
  const exists = savedConfigs.value.some(
    (config) => config.name === '获取视频列表'
  );
  if (!exists) {
    const presetConfig = {
      id: 'video-list-' + Date.now(),
      name: '获取视频列表',
      endpoint: API_URLS.video.getVideoList,
      method: 'get',
      queryParams: [
        { key: 'roadCode', value: 'G15' },
        { key: 'pileNum', value: '295' },
        { key: 'roadDirection', value: '1' },
        { key: 'oneSideCount', value: '5' },
      ],
      requestBody: '{}',
      activeParamsTab: 'Query',
    };
    savedConfigs.value.push(presetConfig);
    saveConfigsToLocal();
  }

  // 添加获取视频URL的预设配置
  const existsVideoUrl = savedConfigs.value.some(
    (config) => config.name === '获取视频URL'
  );
  if (!existsVideoUrl) {
    const presetVideoUrlConfig = {
      id: 'video-url-' + Date.now(),
      name: '获取视频URL',
      endpoint: API_URLS.video.getVideoUrl,
      method: 'get',
      queryParams: [
        { key: 'cameraNum', value: '644ef9de-03e7-4b28-a881-9a8d132ec55c' },
      ],
      requestBody: '{}',
      activeParamsTab: 'Query',
    };
    savedConfigs.value.push(presetVideoUrlConfig);
    saveConfigsToLocal();
  }
};

// 响应结果
const response = ref({
  status: '',
  time: '',
  data: null,
});

// 加载状态
const isLoading = ref(false);

// 格式化响应数据
const formattedResponse = computed(() => {
  if (!response.value.data) return '';
  try {
    return JSON.stringify(response.value.data, null, 2);
  } catch (error) {
    return response.value.data;
  }
});

// 添加查询参数
const addQueryParam = () => {
  queryParams.value.push({ key: '', value: '' });
};

// 删除查询参数
const removeQueryParam = (index) => {
  queryParams.value.splice(index, 1);
};

// 构建请求 URL
const getFullUrl = () => {
  // 检查 endpoint 是否已经是完整的 URL
  if (
    endpoint.value &&
    (endpoint.value.startsWith('http://') ||
      endpoint.value.startsWith('https://'))
  ) {
    return endpoint.value;
  }
  // 否则，直接使用 endpoint 作为接口路径，让 http.js 去处理 URL 拼接
  return endpoint.value || '';
};

// 构建查询参数对象
const getQueryParams = () => {
  const params = {};
  queryParams.value.forEach((param) => {
    if (param.key) {
      params[param.key] = param.value;
    }
  });
  return params;
};

// 测试接口
const testApi = async () => {
  // 设置加载状态为 true
  isLoading.value = true;
  const url = getFullUrl();
  const startTime = Date.now();

  try {
    let result;
    const params = getQueryParams();

    // 根据请求方法调用对应的 API
    switch (method.value) {
      case 'get':
        result = await get(url, params);
        break;
      case 'post':
        const bodyData = requestBody.value ? JSON.parse(requestBody.value) : {};
        result = await post(url, bodyData, { params });
        break;
      case 'put':
        const putData = requestBody.value ? JSON.parse(requestBody.value) : {};
        result = await put(url, putData, { params });
        break;
      case 'delete':
        result = await del(url, params);
        break;
      default:
        result = await get(url, params);
    }

    const endTime = Date.now();
    response.value = {
      status: '200',
      time: endTime - startTime,
      data: result,
    };
  } catch (error) {
    const endTime = Date.now();
    response.value = {
      status: error.response?.status || '500',
      time: endTime - startTime,
      data: {
        error: error.message,
        details: error.response?.data || null,
      },
    };
  } finally {
    // 请求结束，设置加载状态为 false
    isLoading.value = false;
  }
};
</script>

<style scoped>
.api-tester-container {
  overflow: auto;
  padding: 20px;
  background-color: #0d1117;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  color: #e6edf3;
}

h2 {
  color: #ffffff;
  margin-bottom: 20px;
}

h3 {
  color: #f0f6fc;
  margin: 20px 0 10px;
}

/* Mock控制部分 */
.mock-control-section {
  background-color: #161b22;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
  border: 1px solid #30363d;
  border-left: 4px solid #238636; /* 绿色边框表示这是一个功能控制区域 */
}

.mock-status {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background-color: #495057;
  color: #8b949e;
}

.status-indicator.active {
  background-color: #238636;
  color: #ffffff;
}

.toggle-mock-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.toggle-mock-btn.enable-mock {
  background-color: #238636;
  color: white;
}

.toggle-mock-btn.enable-mock:hover {
  background-color: #2ea043;
}

.toggle-mock-btn.disable-mock {
  background-color: #da3633;
  color: white;
}

.toggle-mock-btn.disable-mock:hover {
  background-color: #f85149;
}

/* 配置部分 */
.api-config-section {
  background-color: #161b22;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
  border: 1px solid #30363d;
}

.config-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.config-row label {
  margin-right: 10px;
  font-weight: bold;
  min-width: 80px;
  color: #e6edf3;
}

.config-row input,
.config-row select {
  padding: 8px;
  border: 1px solid #30363d;
  border-radius: 4px;
  margin-right: 15px;
  margin-bottom: 10px;
  background-color: #0d1117;
  color: #e6edf3;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding-right: 30px;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.clear-search-btn:hover {
  color: #e6edf3;
}

.config-row input::placeholder,
.config-row select::placeholder {
  color: #8b949e;
}

.endpoint-input {
  flex: 1;
  min-width: 300px;
}

/* 搜索功能样式 */
.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
  margin-right: 15px;
}

.search-input {
  width: 100%;
  padding: 8px 30px 8px 8px;
  border: 1px solid #30363d;
  border-radius: 4px;
  background-color: #0d1117;
  color: #e6edf3;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 2px;
}

.clear-search-btn:hover {
  color: #e6edf3;
  background-color: #30363d;
}

.test-btn {
  background-color: #238636;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.test-btn:hover {
  background-color: #2ea043;
}

.save-btn {
  background-color: #1f6feb;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
}

.save-btn:hover {
  background-color: #316dca;
}

.new-btn {
  background-color: #1f6feb;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
}

.new-btn:hover {
  background-color: #316dca;
}

.delete-btn {
  background-color: #da3633;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.delete-btn:hover {
  background-color: #f85149;
}

/* 参数部分 */
.api-params-section {
  background-color: #161b22;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
  border: 1px solid #30363d;
}

.params-container {
  border: 1px solid #30363d;
  border-radius: 4px;
  overflow: hidden;
  background-color: #0d1117;
}

.params-tab {
  display: flex;
  background-color: #161b22;
  border-bottom: 1px solid #30363d;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: #e6edf3;
}

.tab-btn:hover {
  background-color: #21262d;
}

.tab-btn.active {
  border-bottom-color: #238636;
  background-color: #0d1117;
  font-weight: bold;
  color: #ffffff;
}

.params-content {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.param-row {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.param-row input {
  padding: 8px;
  border: 1px solid #30363d;
  border-radius: 4px;
  margin-right: 10px;
  flex: 1;
  background-color: #0d1117;
  color: #e6edf3;
}

.param-row input::placeholder {
  color: #8b949e;
}

.remove-param-btn {
  background-color: #da3633;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-param-btn:hover {
  background-color: #f85149;
}

.add-param-btn {
  background-color: #1f6feb;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.add-param-btn:hover {
  background-color: #316dca;
}

.body-textarea {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid #30363d;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  background-color: #0d1117;
  color: #e6edf3;
}

.body-textarea::placeholder {
  color: #8b949e;
}

/* 结果部分 */
.api-result-section {
  background-color: #161b22;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid #30363d;
}

.result-container {
  border: 1px solid #30363d;
  border-radius: 4px;
  overflow: hidden;
  background-color: #0d1117;
}

.result-header {
  background-color: #161b22;
  padding: 10px;
  border-bottom: 1px solid #30363d;
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #e6edf3;
}

.result-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  background-color: #0d1117;
}

.result-body pre {
  margin: 0;
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #7ee787;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #e6edf3;
  font-size: 16px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .config-row label {
    min-width: auto;
    margin-bottom: 5px;
  }

  .config-row input,
  .config-row select {
    width: 100%;
    margin-right: 0;
  }

  .endpoint-input {
    min-width: auto;
  }
}
</style>
