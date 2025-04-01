import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * SpeechToVideo
 * -------------
 * 接收后端返回的 JSON 状态消息和二进制视频数据，
 * 将 videoBase64 转成 Blob 或直接处理二进制数据生成可播放的 URL，
 * 同时展示状态日志信息。
 *
 * Props:
 *  - websocketUrl: string (WebSocket 服务器 URL)
 */
const SpeechToVideo = ({
  websocketUrl = "wss://8494-183-223-25-19.ngrok-free.app/ws/speech2video",
}) => {
  // 状态变量
  const [isRecording, setIsRecording] = useState(false);
  const [chunkDuration, setChunkDuration] = useState(1000); // 分片时长（ms）
  const [statusMessage, setStatusMessage] = useState("Click to start video generation");
  const [videoSrc, setVideoSrc] = useState("");
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [logs, setLogs] = useState([]); // 用于存储 JSON 状态日志

  // Refs
  const websocketRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const userClosingRef = useRef(false);

  /**
   * 将 Base64 字符串转换为 Blob 对象
   * @param {string} base64Data 
   * @param {string} mimeType 
   * @returns {Blob}
   */
  const base64ToBlob = (base64Data, mimeType = "video/mp4") => {
    const byteChars = atob(base64Data);
    const sliceSize = 1024;
    const byteArrays = [];

    for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
      const slice = byteChars.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: mimeType });
  };

  /****************************************************************
   * 1. WebSocket 连接与消息处理
   ****************************************************************/
  const setupWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(websocketUrl);
        // 设置 binaryType 为 arraybuffer
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
          setStatusMessage("Connected to video generation server.");
          resolve(ws);
        };

        ws.onclose = () => {
          if (userClosingRef.current) {
            setStatusMessage("WebSocket closed by user.");
          } else {
            setStatusMessage("Disconnected from the server.");
          }
          userClosingRef.current = false;
        };

        ws.onerror = () => {
          setStatusMessage("Error connecting to WebSocket.");
          reject(new Error("Error connecting to WebSocket"));
        };

        ws.onmessage = (event) => {
          // 判断 event.data 的类型
          if (typeof event.data === "string") {
            const trimmed = event.data.trim();
            // 如果字符串以 { 开头，则认为是 JSON 状态消息
            if (trimmed.startsWith("{")) {
              try {
                const data = JSON.parse(trimmed);
                // 将 JSON 状态消息追加到日志中
                setLogs((prev) => [...prev, data]);
                if (data.videoBase64) {
                  // 如果包含视频 Base64 数据
                  const blob = base64ToBlob(data.videoBase64, data.mimeType || "video/mp4");
                  const blobUrl = URL.createObjectURL(blob);
                  setVideoSrc(blobUrl);
                  setStatusMessage(`Received video, lag ${data.remaining_time_video || 0}s`);
                } else {
                  setStatusMessage(data.status || "");
                }
              } catch (err) {
                console.error("Error parsing JSON:", err);
              }
            } else {
              // 如果字符串不是 JSON，则可能是视频的二进制数据以字符串形式传来
              console.warn("Received non-JSON string; treating as binary data");
              const len = trimmed.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = trimmed.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: "video/mp4" });
              const blobUrl = URL.createObjectURL(blob);
              setVideoSrc(blobUrl);
              setStatusMessage("Received binary video data (as string)");
            }
          } else if (event.data instanceof ArrayBuffer) {
            // 如果收到 ArrayBuffer，则直接生成 Blob
            const blob = new Blob([event.data], { type: "video/mp4" });
            const blobUrl = URL.createObjectURL(blob);
            setVideoSrc(blobUrl);
            setStatusMessage("Received binary video data");
          } else if (event.data instanceof Blob) {
            const blobUrl = URL.createObjectURL(event.data);
            setVideoSrc(blobUrl);
            setStatusMessage("Received binary video data (Blob)");
          } else {
            console.error("Unsupported message type", event.data);
          }
        };

        websocketRef.current = ws;
      } catch (error) {
        setStatusMessage("Invalid WebSocket URL. Please check your config.");
        reject(error);
      }
    });
  }, [websocketUrl]);

  /****************************************************************
   * 2. 录音与波形绘制（保持不变）
   ****************************************************************/
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const mic = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = mic;
      mic.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(e.data);
        }
      };
      mediaRecorder.start(chunkDuration);

      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      drawWaveform();

      setIsRecording(true);
      setStatusMessage("Recording and generating video...");
    } catch (err) {
      setStatusMessage("Error accessing microphone. Please allow mic usage.");
      console.error(err);
    }
  };

  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setTimerDisplay(`${minutes}:${seconds}`);
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.beginPath();

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    const sliceWidth = (canvas.width / dpr) / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * (canvas.height / dpr)) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width / dpr, (canvas.height / dpr) / 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const stopRecording = () => {
    userClosingRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn("Could not close audio context:", e);
      }
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerDisplay("00:00");
    startTimeRef.current = null;
    setIsRecording(false);

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setStatusMessage("Click to start video generation");
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      setVideoSrc("");
      try {
        await setupWebSocket();
        await startRecording();
      } catch (err) {
        setStatusMessage("Could not connect or access mic. Aborted.");
        console.error(err);
      }
    } else {
      stopRecording();
    }
  };

  const handleChunkSelectorChange = (e) => {
    setChunkDuration(parseInt(e.target.value, 10));
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      <h5>Speech to Video</h5>
      {/* 控制区 */}
      <div
        className="settings-container"
        style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "10px" }}
      >
        <button
          id="recordButton"
          onClick={toggleRecording}
          className={isRecording ? "recording" : ""}
          style={{
            width: isRecording ? "180px" : "50px",
            height: "50px",
            border: "none",
            borderRadius: isRecording ? "40px" : "50%",
            backgroundColor: "white",
            cursor: "pointer",
            transition: "all 0.3s ease",
            border: "1px solid rgb(233,233,233)",
            display: "flex",
            alignItems: "center",
            justifyContent: isRecording ? "flex-start" : "center",
            paddingLeft: isRecording ? "20px" : "0",
            position: "relative",
          }}
        >
          <div
            className="shape-container"
            style={{
              width: "25px",
              height: "25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              className="shape"
              style={{
                width: "25px",
                height: "25px",
                backgroundColor: "rgb(209,61,53)",
                borderRadius: isRecording ? "5px" : "50%",
                transition: "all 0.3s ease",
              }}
            ></div>
          </div>
          {isRecording && (
            <div
              className="recording-info"
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "15px",
                flexGrow: 1,
              }}
            >
              <div
                className="wave-container"
                style={{
                  width: "60px",
                  height: "30px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <canvas
                  id="waveCanvas"
                  ref={waveCanvasRef}
                  width={60 * (window.devicePixelRatio || 1)}
                  height={30 * (window.devicePixelRatio || 1)}
                  style={{ width: "100%", height: "100%" }}
                ></canvas>
              </div>
              <div
                className="timer"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#333",
                  marginLeft: "10px",
                }}
              >
                {timerDisplay}
              </div>
            </div>
          )}
        </button>

        <div className="settings" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div>
            <label htmlFor="chunkSelector" style={{ fontSize: "14px" }}>Chunk size (ms):</label>
            <select
              id="chunkSelector"
              value={chunkDuration}
              onChange={handleChunkSelectorChange}
              style={{
                fontSize: "14px",
                padding: "5px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                backgroundColor: "#ffffff",
                maxHeight: "30px",
                marginLeft: "5px",
              }}
            >
              <option value="500">500 ms</option>
              <option value="1000">1000 ms</option>
              <option value="2000">2000 ms</option>
              <option value="3000">3000 ms</option>
              <option value="4000">4000 ms</option>
              <option value="5000">5000 ms</option>
            </select>
          </div>
        </div>
      </div>

      {/* 状态显示 */}
      <p
        id="status"
        style={{
          marginTop: "10px",
          fontSize: "14px",
          color: "#666",
        }}
      >
        {statusMessage}
      </p>

      {/* 视频展示区域，不循环播放 */}
      <div
        id="videoContainer"
        style={{
          margin: "10px auto",
          maxWidth: "100%",
          textAlign: "center",
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
          padding: "8px",
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {videoSrc ? (
          <video
            src={videoSrc}
            controls
            style={{ maxWidth: "100%", maxHeight: "100%" }}
            autoPlay
          />
        ) : (
          <span style={{ fontSize: "15px", color: "#888" }}>
            Generated video will appear here.
          </span>
        )}
      </div>

      {/* JSON 状态日志区域 */}
      <div
        id="jsonLogs"
        style={{
          margin: "10px auto",
          maxWidth: "100%",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "6px",
          padding: "8px",
        }}
      >
        <h6 style={{ marginBottom: "8px", fontSize: "14px", color: "#333" }}>状态日志</h6>
        {logs.length > 0 ? (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {logs.map((log, index) => (
              <li key={index} style={{ marginBottom: "6px", fontSize: "13px", color: "#555" }}>
                <strong>{log.status}</strong>{" "}
                {log.video_id && `(ID: ${log.video_id})`}{" "}
                {log.video_size && `(Size: ${log.video_size})`}{" "}
                {log.gloss && ` - Gloss: ${log.gloss}`}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: "13px", color: "#999" }}>暂无状态日志</p>
        )}
      </div>
    </div>
  );
};

export default SpeechToVideo;
