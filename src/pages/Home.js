import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// Keep your existing sign language component
import SignLanguageRecognition from "../components/SignLanguageRecognition";

// Use the new SignLanguageGeneration container (which includes the speech2text component inside)
import SignLanguageGeneration from "../components/SignLanguageGeneration";

// Optionally load your Sign-Speak key from the .env
const SIGN_SPEAK_KEY =
  process.env.REACT_APP_SIGN_SPEAK_KEY || "your_default_sign_speak_key";

const Home = () => {
  // Keep your sign language recognition logic
  const [recognizedText, setRecognizedText] = useState("");

  // Callback from SignLanguageRecognition
  // 添加第二个参数skipSpeech，用于决定是否跳过语音合成
  const handleTextRecognized = (text, skipSpeech = false) => {
    setRecognizedText(text);
    console.log("手语识别文本:", text);
    
    // 如果skipSpeech为false，才执行语音合成
    // 由于我们在SignLanguageRecognition组件中已经执行了语音合成
    // 这里默认不再执行，避免重复朗读
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ASL Bi-directional Translation MVP</h1>

      {/* Row layout */}
      <div className="row">
        {/* Left side: SignLanguageRecognition (unchanged) */}
        <div className="col-md-6 mb-4">
          <h2 className="text-center">Sign Language Recognition</h2>

          <SignLanguageRecognition
            signSpeakKey={SIGN_SPEAK_KEY}
            onTextRecognized={handleTextRecognized}
          />

          {/* 移除重复显示的识别文本 */}
        </div>

        {/* Right side: sign language generation container (which has speech recognition inside) */}
        <div className="col-md-6 mb-4">
          <h2 className="text-center">Sign Language Generation</h2>
          <SignLanguageGeneration />
        </div>
      </div>
    </div>
  );
};

export default Home;
