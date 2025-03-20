import React, { useEffect, useRef, useState } from 'react';
import { setKey, useSignLanguageRecognition } from '@sign-speak/react-sdk';

const Home = () => {
  // --- 摄像头 video 引用 ---
  const videoRef = useRef(null);

  // --- 存储摄像头流（组件卸载时需停止）---
  const [localStream, setLocalStream] = useState(null);

  // --- 存储原始识别结果 & 过滤后文本 ---
  const [rawPrediction, setRawPrediction] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");

  // 1. 设置 Sign-Speak 的 API Key
  useEffect(() => {
    console.log("Setting Sign-Speak API Key...");
    setKey('u9RRQt08SbddRlUkL9H3tH6lkOLnSiNx'); // 替换为你实际的 Key
  }, []);

  // 2. 请求摄像头权限，并在页面上播放实时画面
  useEffect(() => {
    let stream;
    (async () => {
      try {
        console.log("Requesting camera access...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera access granted, got stream:", stream);

        setLocalStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log("Video element is now playing the stream.");
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    })();

    // 组件卸载时，停止摄像头流
    return () => {
      if (stream) {
        console.log("Stopping camera tracks...");
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 3. 从 SDK 获取手语识别 Hook
  const {
    prediction,         // 原始识别结果对象
    startRecognition,   // 开始识别
    stopRecognition,    // 停止识别
    recording,          // 是否正在识别
    loading,            // 是否在初始化摄像头/网络
  } = useSignLanguageRecognition();

  // 4. 监听识别结果更新
  useEffect(() => {
    if (prediction) {
      console.log("ASL Raw Prediction:", prediction);
      setRawPrediction(prediction);

      // 如果有识别结果数组，则基于置信度进行筛选
      if (prediction.prediction && Array.isArray(prediction.prediction)) {
        const filteredText = prediction.prediction
          // confidence > log(0.5) => 概率大约 > 0.5
          .filter(item => item.confidence > Math.log(0.5))
          .map(item => item.prediction)
          .join(" ");
        setRecognizedText(filteredText);
      }
    }
  }, [prediction]);

  // 5. 手动开始/停止识别
  const handleStart = () => {
    console.log("Starting ASL recognition...");
    startRecognition();
  };

  const handleStop = () => {
    console.log("Stopping ASL recognition...");
    stopRecognition();
  };

  return (
    <div style={{ margin: '20px' }}>
      <h2>ASL Recognition Demo</h2>

      {/* 显示摄像头实时画面 */}
      <video
        ref={videoRef}
        style={{ width: 400, height: 300, backgroundColor: '#000' }}
      />

      {/* 根据 loading / recording 状态显示按钮 */}
      {loading ? (
        <p>Loading camera/websocket...</p>
      ) : recording ? (
        <button onClick={handleStop} style={{ marginTop: 10 }}>
          Stop Recognition
        </button>
      ) : (
        <button onClick={handleStart} style={{ marginTop: 10 }}>
          Start Recognition
        </button>
      )}

      {/* 显示基于置信度过滤后的文本 */}
      <div style={{ marginTop: '20px' }}>
        <h3>Filtered Text (Confidence > 0.5):</h3>
        <p>{recognizedText || "No recognized text yet."}</p>
      </div>

      {/* 显示原始识别结果对象（JSON 格式） */}
      <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
        <h3>Raw Prediction Object:</h3>
        {rawPrediction
          ? JSON.stringify(rawPrediction, null, 2)
          : "No prediction data yet."}
      </div>
    </div>
  );
};

export default Home;
