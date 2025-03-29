import React, { useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import WS_CONFIG from '../config/websocket';

const WebSocketDebugger = () => {
  const [wsUrl, setWsUrl] = useState(WS_CONFIG.TEXT_TO_SPEECH.url);
  
  const { 
    status, 
    error, 
    isConnected, 
    connect, 
    disconnect 
  } = useWebSocket(wsUrl, {
    autoConnect: false,
    onOpen: () => console.log('WebSocket连接成功'),
    onClose: () => console.log('WebSocket连接关闭'),
    onError: (_, err) => console.error('WebSocket错误:', err)
  });

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>WebSocket连接调试</h3>
      <div>
        <label>WebSocket URL: </label>
        <input 
          type="text" 
          value={wsUrl} 
          onChange={(e) => setWsUrl(e.target.value)}
          style={{ width: '500px', marginRight: '10px' }}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={connect} disabled={isConnected}>连接</button>
        <button onClick={disconnect} disabled={!isConnected} style={{ marginLeft: '10px' }}>断开</button>
      </div>
      <div style={{ marginTop: '10px' }}>
        <p>连接状态: {status}</p>
        {error && <p style={{ color: 'red' }}>错误: {error}</p>}
      </div>
    </div>
  );
};

export default WebSocketDebugger;