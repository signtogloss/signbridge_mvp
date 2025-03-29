/**
 * useWebSocket.js
 * 通用WebSocket连接Hook，用于管理WebSocket连接的生命周期和状态
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 通用WebSocket Hook
 * @param {string} url - WebSocket连接URL
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoConnect - 是否自动连接
 * @param {number} options.reconnectInterval - 重连间隔(毫秒)
 * @param {number} options.maxReconnectAttempts - 最大重连次数
 * @param {Function} options.onMessage - 消息处理回调
 * @param {Function} options.onBinaryMessage - 二进制消息处理回调
 * @param {Function} options.onOpen - 连接打开回调
 * @param {Function} options.onClose - 连接关闭回调
 * @param {Function} options.onError - 错误处理回调
 * @returns {Object} WebSocket状态和控制方法
 */
const useWebSocket = (url, options = {}) => {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage = () => {},
    onBinaryMessage = () => {},
    onOpen = () => {},
    onClose = () => {},
    onError = () => {}
  } = options;

  const [status, setStatus] = useState('CLOSED'); // CONNECTING, OPEN, CLOSING, CLOSED
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  // 创建WebSocket连接
  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      
      // 清除之前的重连计时器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setStatus('CONNECTING');
      setError(null);

      const ws = new WebSocket(url);
      // 设置二进制类型为ArrayBuffer
      ws.binaryType = 'arraybuffer';
      
      ws.onopen = (event) => {
        setStatus('OPEN');
        reconnectAttemptsRef.current = 0;
        onOpen(event);
      };

      ws.onmessage = (event) => {
        // 处理二进制数据
        if (event.data instanceof ArrayBuffer) {
          onBinaryMessage(event.data);
        } else {
          // 处理文本数据
          onMessage(event.data);
        }
      };

      ws.onerror = (event) => {
        const errorMsg = '连接错误';
        setError(errorMsg);
        onError(event, errorMsg);
      };

      ws.onclose = (event) => {
        setStatus('CLOSED');
        onClose(event);

        // 尝试重连
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus('CLOSED');
      setError(`连接失败: ${err.message}`);
      onError(err, `连接失败: ${err.message}`);
    }
  }, [url, maxReconnectAttempts, reconnectInterval, onOpen, onMessage, onBinaryMessage, onClose, onError]);

  // 发送文本消息
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  // 发送二进制数据
  const sendBinary = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // 关闭连接
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      setStatus('CLOSING');
      wsRef.current.close();
    }
    
    // 清除重连计时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    status,
    error,
    isConnected: status === 'OPEN',
    isConnecting: status === 'CONNECTING',
    connect,
    disconnect,
    sendMessage,
    sendBinary
  };
};

export default useWebSocket;