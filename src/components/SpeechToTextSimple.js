import React, { useState, useRef, useCallback, useEffect } from "react";

/**
 * 语音转文字字幕组件 - 简化版（只做文件上传 -> 文字返回）
 * @param {string} props.wsUrl - 完整 WebSocket 服务器地址，如 wss://xxx.ngrok-free.app/ws/speech2text
 * @param {function} props.onTextRecognized - 识别结果回调
 */
const SpeechToTextSimple = ({ wsUrl = "", onTextRecognized }) => {
  // WebSocket 实例
  const wsRef = useRef(null);

  // 状态管理
  const [status, setStatus] = useState("CLOSED"); // CONNECTING, OPEN, CLOSING, CLOSED
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState("");
  const [error, setError] = useState(null);

  // 文件选择
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // 是否正在等待服务器识别结果
  const [isProcessing, setIsProcessing] = useState(false);

  // 识别到的文本结果
  const [recognizedText, setRecognizedText] = useState("等待识别结果...");

  // 日志输出
  const log = useCallback((...args) => {
    console.log("[SpeechToText]", ...args);
  }, []);

  /**
   * 连接 WebSocket
   */
  const connectWebSocket = useCallback(() => {
    // 如果已经是 OPEN，直接返回
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    setStatus("CONNECTING");
    setError(null);
    setConnectionInfo("正在连接到服务器...");

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        log("✅ WebSocket 已连接:", wsUrl);
        setStatus("OPEN");
        setIsConnected(true);
        setConnectionInfo("服务器连接成功");
      };

      // 收到后端返回的文本结果，就更新到 recognizedText
      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          const result = event.data;
          log("📝 收到识别结果:", result);
          setRecognizedText(result);

          // 如果有回调
          if (onTextRecognized) {
            onTextRecognized(result);
          }

          // 如果在等待处理中，结束
          if (isProcessing) {
            setIsProcessing(false);
            setConnectionInfo("识别完成");
          }
        }
      };

      ws.onerror = () => {
        log("❌ 连接错误");
        setError("连接错误");
        setConnectionInfo("连接错误");
      };

      ws.onclose = (event) => {
        log("🔌 WebSocket 连接已关闭, code:", event.code, "reason:", event.reason);
        setStatus("CLOSED");
        setIsConnected(false);
        setConnectionInfo("连接已断开");
      };

      wsRef.current = ws;
    } catch (err) {
      log("❌ 连接失败:", err);
      setStatus("CLOSED");
      setIsConnected(false);
      setError(`连接失败: ${err.message}`);
      setConnectionInfo(`连接失败: ${err.message}`);
    }
  }, [wsUrl, isProcessing, onTextRecognized, log]);

  /**
   * 断开 WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      setStatus("CLOSING");
      setConnectionInfo("正在断开连接...");
      wsRef.current.close();
    }
  }, []);

  /**
   * 发送文件到 WebSocket 服务器
   */
  const sendAudioFile = useCallback(
    async (file) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        log("⚠️ WebSocket 未连接，无法发送文件。");
        setConnectionInfo("请先连接到服务器");
        return;
      }

      log(`🎧 准备发送音频文件: ${file.name}, size: ${file.size} bytes`);
      setRecognizedText("等待识别结果..."); // 重置显示
      setIsProcessing(true);
      setError(null);
      setConnectionInfo(`正在发送文件: ${file.name}`);

      try {
        // 读取文件的二进制数据
        const arrayBuffer = await file.arrayBuffer();
        wsRef.current.send(arrayBuffer);
        log("🎉 音频文件已发送，等待服务器识别结果...");

        // 设置超时，如果服务器长时间没返回结果，就停止等待
        const timeoutId = setTimeout(() => {
          if (isProcessing) {
            log("⏲️ 识别超时");
            setIsProcessing(false);
            setError("识别超时，请重试");
            setConnectionInfo("识别超时");
          }
        }, 30000); // 30 秒超时

        // 超时清理
        return () => clearTimeout(timeoutId);
      } catch (err) {
        log("❌ 文件发送失败:", err);
        setError(`发送失败: ${err.message}`);
        setConnectionInfo(`发送失败: ${err.message}`);
        setIsProcessing(false);
      }
    },
    [isProcessing, log]
  );

  // 点击“连接 / 断开” 按钮
  const handleToggleConnection = () => {
    if (isConnected) {
      disconnectWebSocket();
    } else {
      connectWebSocket();
    }
  };

  // 点击“选择文件”按钮
  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 文件选择变更
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 点击“发送文件”按钮
  const handleSendFile = () => {
    if (selectedFile) {
      sendAudioFile(selectedFile);
    } else {
      setConnectionInfo("请先选择音频文件");
    }
  };

  // 组件卸载时，自动断开连接
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      {/* 连接/断开按钮 */}
      <button
        className={`btn ${isConnected ? "btn-danger" : "btn-primary"} w-100`}
        onClick={handleToggleConnection}
      >
        {isConnected ? "断开服务器连接" : "连接服务器"}
      </button>

      {/* 文件选择 & 发送 */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn-outline-primary" style={{ flex: 1 }} onClick={handleChooseFile}>
          选择音频文件
        </button>
        <button
          className="btn btn-success"
          style={{ flex: 1 }}
          onClick={handleSendFile}
          disabled={!isConnected || !selectedFile || isProcessing}
        >
          {isProcessing ? "处理中..." : "发送文件"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="audio/*"
          onChange={handleFileChange}
        />
      </div>

      {/* 显示已选文件 */}
      {selectedFile && (
        <small style={{ color: "#666" }}>
          已选文件: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
        </small>
      )}

      {/* 状态指示 */}
      <div style={{ marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {/* 小圆点指示连接状态 */}
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: isConnected ? "#28a745" : "#dc3545",
              display: "inline-block",
            }}
          ></span>
          <span>
            {isConnected ? "已连接" : "未连接"} ({status})
          </span>
        </div>
        {connectionInfo && <div style={{ color: "#17a2b8" }}>{connectionInfo}</div>}
        {error && <div style={{ color: "#dc3545" }}>{error}</div>}
      </div>

      {/* 识别结果区域 */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          minHeight: "100px",
          maxHeight: "200px",
          overflowY: "auto",
        }}
      >
        {recognizedText}
      </div>

      {/* WebSocket 地址 */}
      <small style={{ color: "#666" }}>WebSocket URL: {wsUrl}</small>
    </div>
  );
};

export default SpeechToTextSimple;
