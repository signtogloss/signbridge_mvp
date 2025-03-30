import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// ===== 左侧：手语识别组件（保留不动）=====
import SignLanguageRecognition from "../components/SignLanguageRecognition";

// ===== 右侧：文件上传 -> 语音识别组件 =====
import SpeechToTextSimple from "../components/SpeechToTextSimple";

// 从 .env 读取 Sign-Speak Key，方便后续手语识别用
const SIGN_SPEAK_KEY = process.env.REACT_APP_SIGN_SPEAK_KEY || "your_default_sign_speak_key";

// 从 .env 读取基础 WebSocket URL，例如 "wss://3c17-183-223-25-19.ngrok-free.app/ws/"
// 这里自动补上斜杠，最后加上 "speech2text" 路径，得到完整的 wss://xxx/ws/speech2text
const baseUrl = process.env.REACT_APP_SIGNBRIDGE_BACKEND_URL || "wss://3c17-183-223-25-19.ngrok-free.app/ws/";
const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
const WS_URL = normalizedBaseUrl + "speech2text";

const Home = () => {
  // 用于存放从左边手语识别得到的文本
  const [recognizedText, setRecognizedText] = useState("");

  // 当手语识别到文本时，放入 recognizedText
  const handleSignTextRecognized = (text) => {
    setRecognizedText(text);
  };

  // 当右侧音频识别到文本时，这里仅打印，可以自行添加别的逻辑
  const handleSpeechRecognized = (text) => {
    console.log("右侧识别到新文本:", text);
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ASL Bidirectional Demo (WebSocket API)</h1>

      <div className="row">
        {/* 左侧：手语识别组件，不动 */}
        <div className="col-md-6">
          <SignLanguageRecognition
            signSpeakKey={SIGN_SPEAK_KEY}
            onTextRecognized={handleSignTextRecognized}
          />
        </div>

        {/* 右侧：语音转文字（文件上传）组件 */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header">语音转文字字幕</div>
            <div className="card-body">
              <SpeechToTextSimple wsUrl={WS_URL} onTextRecognized={handleSpeechRecognized} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
