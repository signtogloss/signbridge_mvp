/**
 * useTextToGloss.js
 * 文本转ASL Gloss WebSocket Hook
 */

import { useState, useCallback } from 'react';
import useWebSocket from './useWebSocket';

/**
 * 文本转ASL Gloss Hook
 * @param {Object} options - 配置选项
 * @param {string} options.wsUrl - WebSocket服务器URL
 * @param {boolean} options.autoConnect - 是否自动连接
 * @returns {Object} 文本转ASL Gloss状态和控制方法
 */
const useTextToGloss = (options = {}) => {
  const {
    wsUrl,
    autoConnect = true
  } = options;

  const [gloss, setGloss] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState(null);

  // 处理服务器返回的Gloss文本
  const handleMessage = useCallback((message) => {
    try {
      // 检查是否是错误消息
      if (message.startsWith('[Text→Gloss WS Error]')) {
        setError(message);
        setStatus('error');
        return;
      }
      
      // 设置Gloss结果
      setGloss(message);
      setStatus('success');
    } catch (err) {
      setError(`处理Gloss数据失败: ${err.message}`);
      setStatus('error');
      console.error('处理Gloss数据失败:', err);
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
    onMessage: handleMessage,
    onError: (_, errorMsg) => {
      setError(errorMsg);
      setStatus('error');
    }
  });

  // 发送文本生成ASL Gloss
  const generateGloss = useCallback((text) => {
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

  // 清理状态
  const reset = useCallback(() => {
    setGloss('');
    setStatus('idle');
    setError(null);
  }, []);

  return {
    gloss,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    error: error || wsError,
    isConnected,
    generateGloss,
    reset,
    disconnect
  };
};

export default useTextToGloss;