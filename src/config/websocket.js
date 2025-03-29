/**
 * websocket.js
 * WebSocket接口配置文件
 */

// 从环境变量获取WebSocket服务器基础URL，如果没有则使用默认值
// 注意：在React中，前端可访问的环境变量必须以REACT_APP_前缀开头
let WS_BASE_URL = process.env.REACT_APP_SIGNBRIDGE_BACKEND_URL || 'wss://your-ngrok-subdomain.ngrok.io';

// 调试信息：输出所有环境变量，帮助排查问题
console.log('所有环境变量:', process.env);

console.log('WebSocket基础URL(原始):', WS_BASE_URL);

// 确保URL以wss://或ws://开头
if (WS_BASE_URL && !WS_BASE_URL.startsWith('wss://') && !WS_BASE_URL.startsWith('ws://')) {
  // 将http://转换为ws://，https://转换为wss://
  if (WS_BASE_URL.startsWith('https://')) {
    const wsUrl = WS_BASE_URL.replace('https://', 'wss://');
    WS_BASE_URL = wsUrl;
  } else if (WS_BASE_URL.startsWith('http://')) {
    const wsUrl = WS_BASE_URL.replace('http://', 'ws://');
    WS_BASE_URL = wsUrl;
  } else {
    // 如果没有协议前缀，默认添加wss://
    WS_BASE_URL = `wss://${WS_BASE_URL}`;
  }
}

console.log('WebSocket基础URL(转换后):', WS_BASE_URL);

// WebSocket接口配置
const WS_CONFIG = {
  // 语音转文字接口
  SPEECH_TO_TEXT: {
    url: `${WS_BASE_URL}/ws/speech2text`,
    autoConnect: false, // 不自动连接，等用户点击开始按钮时连接
  },
  
  // 文本转语音接口
  TEXT_TO_SPEECH: {
    url: `${WS_BASE_URL}/ws/text2speech`,
    autoConnect: true, // 自动连接
  },
  
  // 文本转ASL Gloss接口
  TEXT_TO_GLOSS: {
    url: `${WS_BASE_URL}/ws/text2gloss`,
    autoConnect: true, // 自动连接
  },
  
  // ASL Gloss转视频接口
  GLOSS_TO_VIDEO: {
    url: `${WS_BASE_URL}/ws/generate`,
    autoConnect: true, // 自动连接
  },
  
  // 文本到手语视频一体化接口
  TEXT_TO_ASL_VIDEO: {
    url: `${WS_BASE_URL}/ws/text2generate`,
    autoConnect: true, // 自动连接
  }
};

export default WS_CONFIG;