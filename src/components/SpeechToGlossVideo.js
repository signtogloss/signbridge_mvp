import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * SpeechToGlossVideo
 * ------------
 * 一个集成组件，提供从语音到手语视频的转换流程：
 * 1. 语音识别：将用户语音转换为文本
 * 2. 文本到ASL Gloss：将识别到的文本转换为ASL手语符号序列
 * 3. Gloss到视频：将ASL手语符号序列发送到后端API生成手语视频
 * 
 * 设计模式与SpeechToText.js保持一致，作为一个自包含的组件，直接处理所有UI和功能
 * 
 * Props:
 *  - speechWebsocketUrl: string (WebSocket URL) - 语音识别WebSocket URL
 *  - glossVideoWebsocketUrl: string (WebSocket URL) - Gloss到视频WebSocket URL
 */
const SpeechToGlossVideo = ({ 
  speechWebsocketUrl = "wss://8494-183-223-25-19.ngrok-free.app/ws/speech2text",
  glossVideoWebsocketUrl = "wss://8494-183-223-25-19.ngrok-free.app/ws/gloss2video"
}) => {
  // 状态变量
  const [isRecording, setIsRecording] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Click to start sign language generation");
  const [transcriptText, setTranscriptText] = useState(""); // 识别的文本
  const [videoSrc, setVideoSrc] = useState(""); // 视频URL
  const [pendingText, setPendingText] = useState(""); // 待处理的新文本
  const [logs, setLogs] = useState([]); // 状态日志

  // Refs
  const speechWsRef = useRef(null); // 语音识别WebSocket
  const glossVideoWsRef = useRef(null); // Gloss到视频WebSocket
  const lastProcessedTextRef = useRef(""); // 最后处理过的文本
  const userClosingRef = useRef(false);

  /**
   * 将 Base64 字符串转换为 Blob 对象
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
   * 1. 语音识别WebSocket连接与消息处理
   ****************************************************************/
  const setupSpeechWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(speechWebsocketUrl);
        ws.binaryType = "arraybuffer";
        
        ws.onopen = () => {
          setStatusMessage("Connected to speech recognition server.");
          resolve(ws);
        };
        
        ws.onclose = () => {
          if (userClosingRef.current) {
            setStatusMessage("Speech WebSocket closed by user.");
          } else {
            setStatusMessage("Disconnected from speech recognition server.");
          }
          userClosingRef.current = false;
        };
        
        ws.onerror = () => {
          setStatusMessage("Error connecting to speech recognition WebSocket.");
          reject(new Error("Error connecting to speech recognition WebSocket"));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const {
            lines = [],
            buffer_transcription = "",
          } = data;
          
          // 处理识别到的文本
          let newTranscript = "";
          if (lines.length > 0) {
            newTranscript = lines.map(item => item.text || "").join(" ");
          }
          
          if (newTranscript) {
            newTranscript += " " + buffer_transcription;
          }
          
          // 更新识别文本
          if (newTranscript.trim() !== "") {
            setTranscriptText(newTranscript);
            
            // 检测新增文本并设置为待处理
            if (newTranscript.length > lastProcessedTextRef.current.length) {
              const newText = newTranscript.substring(lastProcessedTextRef.current.length).trim();
              if (newText) {
                setPendingText(prev => prev + " " + newText);
              }
            }
          }
        };
        
        speechWsRef.current = ws;
      } catch (error) {
        setStatusMessage("Invalid speech WebSocket URL. Please check your config.");
        reject(error);
      }
    });
  }, [speechWebsocketUrl]);

  /****************************************************************
   * 2. Gloss到视频WebSocket连接与消息处理
   ****************************************************************/
  const setupGlossVideoWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(glossVideoWebsocketUrl);
        ws.binaryType = "arraybuffer";
        
        ws.onopen = () => {
          setStatusMessage("Connected to gloss2video server.");
          resolve(ws);
        };
        
        ws.onclose = () => {
          if (userClosingRef.current) {
            setStatusMessage("Gloss2Video WebSocket closed by user.");
          } else {
            setStatusMessage("Disconnected from gloss2video server.");
          }
        };
        
        ws.onerror = () => {
          setStatusMessage("Error connecting to gloss2video WebSocket.");
          reject(new Error("Error connecting to gloss2video WebSocket"));
        };
        
        ws.onmessage = (event) => {
          // 判断 event.data 类型
          if (typeof event.data === "string") {
            const trimmed = event.data.trim();
            // 如果字符串以 { 开头，则认为是 JSON 状态消息
            if (trimmed.startsWith("{")) {
              try {
                const data = JSON.parse(trimmed);
                // 将 JSON 状态消息追加到日志中
                setLogs(prev => [...prev, data]);
                
                if (data.videoBase64) {
                  // 如果包含视频 Base64 数据
                  const blob = base64ToBlob(data.videoBase64, data.mimeType || "video/mp4");
                  const blobUrl = URL.createObjectURL(blob);
                  setVideoSrc(blobUrl);
                  setStatusMessage(`Received video (lag: ${data.remaining_time_video || 0}s)`);
                } else {
                  setStatusMessage(data.status || "");
                }
              } catch (err) {
                console.error("Error parsing JSON:", err);
              }
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
            console.log("Unsupported message type", event.data);
          }
        };
        
        glossVideoWsRef.current = ws;
      } catch (error) {
        setStatusMessage("Invalid gloss2video WebSocket URL. Please check your config.");
        reject(error);
      }
    });
  }, [glossVideoWebsocketUrl]);

  /****************************************************************
   * 3. 文本处理与发送
   ****************************************************************/
  useEffect(() => {
    // 当有新的待处理文本时，转换为ASL gloss并发送
    const processNewText = async () => {
      try {
        // 转换为ASL gloss (简单示例，实际应用中可能需要调用API)
        setStatusMessage("Converting to ASL gloss...");
        const pendingTextTrimmed = pendingText.trim();
        
        // 简单的文本到gloss转换示例 (实际应用中可能需要更复杂的处理)
        const glossArray = pendingTextTrimmed.toUpperCase().split(/\s+/);
        
        setStatusMessage(`Converted to ${glossArray.length} gloss signs`);
        
        // 发送到gloss2video WebSocket
        if (glossVideoWsRef.current && glossVideoWsRef.current.readyState === WebSocket.OPEN) {
            const glossRequest = {
              gloss: glossArray
            };
            glossVideoWsRef.current.send(JSON.stringify(glossRequest));
            setStatusMessage("Sent gloss to video generation server...");
            
            // 更新日志
            setLogs(prev => [...prev, {
              status: "Sent gloss to server",
              gloss: glossArray.join(" ")
            }]);
            
            // 更新最后处理的文本
            lastProcessedTextRef.current = transcriptText;
        }
        
        // 清空待处理文本
        setPendingText("");
      } catch (error) {
        console.error("Error processing text to gloss:", error);
        setStatusMessage("Error converting text to gloss.");
      }
    };
    
    // 使用防抖处理，避免频繁调用API
    const debounceTimeout = setTimeout(() => {
      if (isRecording && pendingText.trim() !== "") {
        processNewText();
      }
    }, 2000); // 2秒防抖
    
    return () => clearTimeout(debounceTimeout);
  }, [pendingText, isRecording, transcriptText]);

  /****************************************************************
   * 4. 录音控制
   ****************************************************************/
  const toggleRecording = async () => {
    if (isRecording) {
      // 停止录音
      setIsRecording(false);
      setStatusMessage("Recording stopped.");
      userClosingRef.current = true;
      
      // 关闭WebSocket连接
      if (speechWsRef.current) {
        speechWsRef.current.close();
        speechWsRef.current = null;
      }
      
      if (glossVideoWsRef.current) {
        glossVideoWsRef.current.close();
        glossVideoWsRef.current = null;
      }
    } else {
      // 开始录音
      setStatusMessage("Recording and generating sign language video...");
      setVideoSrc("");
      setPendingText("");
      lastProcessedTextRef.current = "";
      
      try {
        // 连接两个WebSocket
        await setupSpeechWebSocket();
        await setupGlossVideoWebSocket();
        
        // 开始录音 (使用浏览器MediaRecorder API)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (speechWsRef.current && speechWsRef.current.readyState === WebSocket.OPEN) {
            speechWsRef.current.send(e.data);
          }
        };
        mediaRecorder.start(1000); // 每秒发送一次数据
        
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
        setStatusMessage("Could not connect or access mic. Aborted.");
      }
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      <h5>Speech to Sign Language Video</h5>

      {/* Controls */}
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
                className="timer"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#333",
                  marginLeft: "10px",
                }}
              >
                Recording...
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Status display */}
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

      {/* 识别文本显示 */}
      <div
        style={{
          margin: "10px auto",
          maxWidth: "100%",
          textAlign: "left",
          fontSize: "15px",
          minHeight: "60px",
          lineHeight: "1.4em",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
        }}
      >
        <h6 style={{ fontSize: "14px", marginBottom: "5px" }}>Recognized Text</h6>
        <div>{transcriptText || "No recognized text yet."}</div>
      </div>

      {/* 视频展示 */}
      <div
        style={{
          margin: "10px auto",
          maxWidth: "100%",
          textAlign: "center",
          minHeight: "200px",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h6 style={{ fontSize: "14px", marginBottom: "10px", alignSelf: "flex-start" }}>Sign Language Video</h6>
        {videoSrc ? (
          <video 
            src={videoSrc} 
            controls 
            style={{ maxWidth: "100%", maxHeight: "300px" }} 
            autoPlay
          />
        ) : (
          <span style={{ color: "#666" }}>
            Generated sign language video will appear here.
          </span>
        )}
      </div>

      {/* JSON状态日志区域 */}
      <div
        style={{
          margin: "10px auto",
          maxWidth: "100%",
          maxHeight: "150px",
          overflowY: "auto",
          fontSize: "13px",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
        }}
      >
        <h6 style={{ fontSize: "14px", marginBottom: "5px" }}>状态日志</h6>
        {logs.length > 0 ? (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {logs.map((log, index) => (
              <li key={index} style={{ marginBottom: "4px" }}>
                <strong>{log.status}</strong>{" "}
                {log.video_id && `(ID: ${log.video_id})`}{" "}
                {log.video_size && `(Size: ${log.video_size})`}{" "}
                {log.gloss && `- Gloss: ${log.gloss}`}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#999" }}>暂无状态日志</p>
        )}
      </div>
    </div>
  );
};

export default SpeechToGlossVideo;