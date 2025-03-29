/**
 * useSpeechToText.js
 * 实时语音识别WebSocket Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from './useWebSocket';

// 调试日志函数
const DEBUG = true;
const log = (...args) => {
  if (DEBUG) {
    console.log('[SpeechToText]', ...args);
  }
};

/**
 * 实时语音识别Hook
 * @param {Object} options - 配置选项
 * @param {string} options.wsUrl - WebSocket服务器URL
 * @param {boolean} options.autoConnect - 是否自动连接
 * @param {number} options.sampleRate - 音频采样率
 * @param {number} options.chunkDuration - 每个音频块的持续时间(毫秒)
 * @returns {Object} 语音识别状态和控制方法
 */
const useSpeechToText = (options = {}) => {
  const {
    wsUrl,
    autoConnect = false,
    sampleRate = 16000,
    chunkDuration = 300 // 每300毫秒发送一次音频数据
  } = options;

  const [recognizedText, setRecognizedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  
  // 处理WebSocket消息
  const handleMessage = useCallback((message) => {
    try {
      // 服务器返回的是纯文本
      log('收到识别结果:', message);
      setRecognizedText(message);
    } catch (err) {
      console.error('处理识别结果失败:', err);
    }
  }, []);

  // 初始化WebSocket连接
  const { 
    status, 
    error: wsError, 
    isConnected,
    connect, 
    disconnect, 
    sendBinary 
  } = useWebSocket(wsUrl, {
    autoConnect,
    onMessage: handleMessage,
    onOpen: () => {
      log('WebSocket连接已建立, URL:', wsUrl);
      setError(null);
    },
    onClose: (event) => {
      log('WebSocket连接已关闭, 代码:', event.code, '原因:', event.reason);
    },
    onError: (_, errorMsg) => {
      log('WebSocket错误:', errorMsg);
      setError(errorMsg);
    }
  });

  // 开始录音并发送到WebSocket
  const startRecognition = useCallback(async () => {
    log('开始语音识别, 当前连接状态:', isConnected ? '已连接' : '未连接');
    log('WebSocket URL:', wsUrl);
    
    if (!isConnected) {
      log('尝试建立WebSocket连接...');
      connect();
      // 等待连接建立
      await new Promise(resolve => {
        const checkConnection = () => {
          if (isConnected) {
            log('WebSocket连接已建立');
            resolve();
          } else {
            log('等待WebSocket连接...');
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      audioContextRef.current = audioContext;

      // 创建音频处理节点
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      // 处理音频数据
      processor.onaudioprocess = (e) => {
        if (isConnected && isRecording) {
          const inputData = e.inputBuffer.getChannelData(0);
          // 转换为16位整数
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.min(1, Math.max(-1, inputData[i])) * 0x7FFF;
          }
          // 发送音频数据
          sendBinary(pcmData.buffer);
        }
      };

      // 连接节点
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(`麦克风访问失败: ${err.message}`);
      console.error('麦克风访问失败:', err);
    }
  }, [isConnected, connect, sendBinary, isRecording]);

  // 停止录音
  const stopRecognition = useCallback(() => {
    log('停止语音识别');
    setIsRecording(false);
    
    // 停止音频流
    if (streamRef.current) {
      log('停止音频流');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // 关闭音频上下文
    if (audioContextRef.current) {
      log('关闭音频上下文');
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      stopRecognition();
      disconnect();
    };
  }, [stopRecognition, disconnect]);

  // 添加调试信息
  useEffect(() => {
    log('状态变化:', { 
      isConnected, 
      status, 
      isRecording, 
      error: error || wsError,
      wsUrl
    });
  }, [isConnected, status, isRecording, error, wsError, wsUrl]);

  return {
    recognizedText,
    isRecording,
    isConnected,
    status,
    error: error || wsError,
    wsUrl,  // 添加WebSocket URL以便调试
    startRecognition,
    stopRecognition
  };
};

export default useSpeechToText;