/**
 * useTextToSpeech.js
 * 文本转语音WebSocket Hook
 */

import { useState, useCallback } from 'react';
import useWebSocket from './useWebSocket';

/**
 * 文本转语音Hook
 * @param {Object} options - 配置选项
 * @param {string} options.wsUrl - WebSocket服务器URL
 * @param {boolean} options.autoConnect - 是否自动连接
 * @returns {Object} 文本转语音状态和控制方法
 */
const useTextToSpeech = (options = {}) => {
  const {
    wsUrl,
    autoConnect = true
  } = options;

  const [audioUrl, setAudioUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState(null);

  // 处理二进制音频数据
  const handleBinaryMessage = useCallback((data) => {
    try {
      // 创建Blob对象
      const audioBlob = new Blob([data], { type: 'audio/wav' });
      // 创建URL
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setStatus('success');
    } catch (err) {
      setError(`处理音频数据失败: ${err.message}`);
      setStatus('error');
      console.error('处理音频数据失败:', err);
    }
  }, []);

  // 初始化WebSocket连接
  const { 
    error: wsError, 
    isConnected,
    connect, 
    disconnect, 
    sendMessage 
  } = useWebSocket(wsUrl, {
    autoConnect,
    onBinaryMessage: handleBinaryMessage,
    onError: (_, errorMsg) => {
      setError(errorMsg);
      setStatus('error');
    }
  });

  // 发送文本生成语音
  const generateSpeech = useCallback((text) => {
    if (!text) {
      setError('文本不能为空');
      setStatus('error');
      return false;
    }

    setStatus('loading');
    setError(null);

    // 如果未连接，先连接WebSocket
    if (!isConnected) {
      connect();
      // 等待连接建立后发送
      setTimeout(() => {
        if (isConnected) {
          sendMessage(text);
        } else {
          setError('WebSocket连接失败');
          setStatus('error');
        }
      }, 1000);
    } else {
      // 直接发送文本
      sendMessage(text);
    }

    return true;
  }, [isConnected, connect, sendMessage]);

  // 播放生成的语音
  const playAudio = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      return true;
    }
    return false;
  }, [audioUrl]);

  // 清理资源
  const cleanup = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setStatus('idle');
    setError(null);
  }, [audioUrl]);

  return {
    audioUrl,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    error: error || wsError,
    isConnected,
    generateSpeech,
    playAudio,
    cleanup,
    disconnect
  };
};

export default useTextToSpeech;