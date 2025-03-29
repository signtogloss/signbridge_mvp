/**
 * useTextToASLVideo.js
 * 文本到手语视频一体化WebSocket Hook
 */

import { useState, useCallback } from 'react';
import useWebSocket from './useWebSocket';

/**
 * 文本到手语视频一体化Hook
 * @param {Object} options - 配置选项
 * @param {string} options.wsUrl - WebSocket服务器URL
 * @param {boolean} options.autoConnect - 是否自动连接
 * @returns {Object} 文本到视频状态和控制方法
 */
const useTextToASLVideo = (options = {}) => {
  const {
    wsUrl,
    autoConnect = true
  } = options;

  const [videoUrl, setVideoUrl] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [gloss, setGloss] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [error, setError] = useState(null);

  // 处理服务器返回的JSON消息
  const handleMessage = useCallback((message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.status === 'processing') {
        setVideoId(data.video_id);
        setGloss(data.gloss || '');
        setStatus('processing');
      } else if (data.status === 'success') {
        setVideoId(data.video_id);
        setGloss(data.gloss || '');
        setStatus('success'); // 视频数据将在下一个二进制消息中到达
      } else if (data.status === 'error') {
        setError(data.message || '生成视频失败');
        setStatus('error');
      }
    } catch (err) {
      setError(`处理服务器消息失败: ${err.message}`);
      setStatus('error');
      console.error('处理服务器消息失败:', err);
    }
  }, []);

  // 处理二进制视频数据
  const handleBinaryMessage = useCallback((data) => {
    try {
      // 创建Blob对象
      const videoBlob = new Blob([data], { type: 'video/mp4' });
      // 创建URL
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setStatus('success');
    } catch (err) {
      setError(`处理视频数据失败: ${err.message}`);
      setStatus('error');
      console.error('处理视频数据失败:', err);
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
    onBinaryMessage: handleBinaryMessage,
    onError: (_, errorMsg) => {
      setError(errorMsg);
      setStatus('error');
    }
  });

  // 发送文本生成视频
  const generateVideoFromText = useCallback((text) => {
    if (!text) {
      setError('文本不能为空');
      setStatus('error');
      return false;
    }

    setStatus('processing');
    setError(null);
    setVideoUrl(null);
    setVideoId(null);
    setGloss('');

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

  // 清理资源
  const cleanup = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoId(null);
    setGloss('');
    setStatus('idle');
    setError(null);
  }, [videoUrl]);

  return {
    videoUrl,
    videoId,
    gloss,
    status,
    isProcessing: status === 'processing',
    isSuccess: status === 'success',
    error: error || wsError,
    isConnected,
    generateVideoFromText,
    cleanup,
    disconnect
  };
};

export default useTextToASLVideo;