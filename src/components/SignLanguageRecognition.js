import React, { useEffect, useRef, useState } from "react";
import { setKey, useSignLanguageRecognition } from "@sign-speak/react-sdk";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ZoomStyleLayout.css";

/**
 * 手语识别组件
 * 该组件封装了手语识别的功能，包括摄像头访问、手语识别和结果展示
 * @param {Object} props - 组件属性
 * @param {string} props.signSpeakKey - Sign-Speak API密钥
 * @param {function} props.onTextRecognized - 文本识别回调函数，当有新的识别结果时调用
 */
const SignLanguageRecognition = ({ signSpeakKey, onTextRecognized }) => {
  const videoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [rawPrediction, setRawPrediction] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  // 移除动画相关状态
  
  // 添加动画效果
  useEffect(() => {
    // 页面加载后延迟显示动画效果
    const timer = setTimeout(() => {
      // 移除动画相关代码
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // 1) 初始化 Sign-Speak Key
  useEffect(() => {
    if (signSpeakKey) {
      setKey(signSpeakKey);
    }
  }, [signSpeakKey]);

  // 2) 请求摄像头并播放
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    })();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3) 获取手语识别 Hook
  const {
    prediction,
    startRecognition,
    stopRecognition,
    recording,
    loading,
  } = useSignLanguageRecognition();

  // 4) 监听识别结果
  useEffect(() => {
    if (prediction) {
      setRawPrediction(prediction);
      console.log("Raw Prediction:", prediction);
      if (prediction.prediction && Array.isArray(prediction.prediction)) {
        const filteredText = prediction.prediction
          .filter((item) => item.confidence > Math.log(0.5))
          .map((item) => item.prediction)
          .join(" ");
        setRecognizedText(filteredText);

        // 调用回调函数，将识别结果传递给父组件
        if (onTextRecognized && filteredText) {
          onTextRecognized(filteredText);
        }

        // 播放音频播报
        if (filteredText) {
          const utterance = new SpeechSynthesisUtterance(filteredText);
          speechSynthesis.speak(utterance);
        }
      }
    }
  }, [prediction, onTextRecognized]);

  // 开始/停止识别
  const handleStart = () => {
    startRecognition();
  };
  
  const handleStop = () => {
    stopRecognition();
  };

  return (
    <div className="h-100 position-relative">
      {/* 全屏视频显示 - 调整为更大的尺寸以显示上半身 */}
      <video
        ref={videoRef}
        className="w-100 h-100 object-fit-contain" /* 改为contain以显示完整上半身 */
        style={{ 
          backgroundColor: "#000",
          borderRadius: "8px"
        }}
      />
      
      {/* 控制按钮 - 底部中央 */}
      <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 z-index-10">
        {loading ? (
          <div className="badge bg-warning text-dark p-2">Loading camera...</div>
        ) : recording ? (
          <button className="btn btn-danger btn-lg shadow" onClick={handleStop}>
            <i className="bi bi-stop-fill me-1"></i> Stop Recognition
          </button>
        ) : (
          <button className="btn btn-success btn-lg shadow" onClick={handleStart}>
            <i className="bi bi-camera-video-fill me-1"></i> Start Recognition
          </button>
        )}
      </div>
      
      {/* 状态指示器 - 左上角 */}
      <div className="position-absolute top-0 start-0 m-3 badge bg-dark bg-opacity-75 p-2 z-index-10">
        {recording ? (
          <><span className="status-dot recording me-2"></span> Recording...</>
        ) : (
          <><span className="status-dot ready me-2"></span> Ready</>
        )}
      </div>
    </div>
  );
};

export default SignLanguageRecognition;