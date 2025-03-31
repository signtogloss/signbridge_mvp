import React, { useEffect, useRef, useState } from "react";
import { setKey, useSignLanguageRecognition } from "@sign-speak/react-sdk";
import "bootstrap/dist/css/bootstrap.min.css";

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
    <div>
      <div className="card mb-3">
        <div className="card-header">Sign Language Recognition</div>
        <div className="card-body">
          <video
            ref={videoRef}
            className="img-fluid"
            style={{ 
              backgroundColor: "#000",
              width: "100%",
              height: "auto",
              marginBottom: "15px"
            }}
          />
          <div style={{ textAlign: "center" }}>
            {loading ? (
              <p>Loading camera/websocket...</p>
            ) : recording ? (
              <button className="btn btn-danger" onClick={handleStop}>
                Stop Recognition
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleStart}>
                Start Recognition
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Recognized Text (Confidence &gt; 0.5)</div>
        <div className="card-body">
          <p>{recognizedText || "No recognized text yet."}</p>
        </div>
      </div>
    </div>
  );
};

export default SignLanguageRecognition;