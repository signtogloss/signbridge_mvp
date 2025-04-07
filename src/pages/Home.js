import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// Keep your existing sign language component
import SignLanguageRecognition from "../components/SignLanguageRecognition";

// Use the new SignLanguageGeneration container (which includes the speech2text component inside)
import SignLanguageGeneration from "../components/SignLanguageGeneration";

// 导入Zoom风格布局的CSS
import "../components/ZoomStyleLayout.css";

// Optionally load your Sign-Speak key from the .env
const SIGN_SPEAK_KEY =
  process.env.REACT_APP_SIGN_SPEAK_KEY || "your_default_sign_speak_key";

const Home = () => {
  // Keep your sign language recognition logic
  const [recognizedText, setRecognizedText] = useState("");
  const [glossSequence, setGlossSequence] = useState([]);

  // Callback from SignLanguageRecognition
  const handleTextRecognized = (text) => {
    setRecognizedText(text);
    console.log("手语识别文本:", text);
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ASL Bi-directional Translation MVP</h1>

      {/* Zoom风格布局 */}
      <div className="zoom-layout-container p-3">
        {/* 主屏幕区域：手语识别 */}
        <div className="main-screen">
          <h2 className="text-center text-white py-2">Sign Language Recognition</h2>
          
          <SignLanguageRecognition
            signSpeakKey={SIGN_SPEAK_KEY}
            onTextRecognized={handleTextRecognized}
          />
          
          {/* 识别结果显示 - 字幕区域 */}
          <div className="subtitle-area">
            <div><strong>Recognized Text:</strong> {recognizedText || "等待识别..."}</div>
            {glossSequence.length > 0 && (
              <div className="gloss-sequence">
                <strong>Gloss:</strong> {glossSequence.join(" ")}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧边栏 - 只包含视频播放 */}
        <div className="sidebar">
          {/* 视频播放区域 - 占据整个右侧 */}
          <div className="video-player-container full-height">
            <SignLanguageGeneration />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
