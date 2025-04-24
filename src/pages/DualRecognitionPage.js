import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SignLanguageRecognition from '../components/SignLanguageRecognition';
import SpeechRecognition from '../components/SpeechRecognition';

// Optionally load Sign-Speak key from .env
const SIGN_SPEAK_KEY =
  process.env.REACT_APP_SIGN_SPEAK_KEY || "your_default_sign_speak_key";

/**
 * DualRecognitionPage
 * ------------------
 * A new page with sign language recognition on the left and speech recognition on the right
 */
const DualRecognitionPage = () => {
  // Maintain sign language recognition logic
  const [recognizedText, setRecognizedText] = useState("");

  // Callback from SignLanguageRecognition
  const handleTextRecognized = (text) => {
    setRecognizedText(text);
    console.log("Sign language recognized text:", text);
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Dual Recognition System</h1>

      {/* Row layout */}
      <div className="row">
        {/* Left: Sign Language Recognition */}
        <div className="col-md-6 mb-4">
          <h2 className="text-center">Sign Language Recognition</h2>

          <SignLanguageRecognition
            signSpeakKey={SIGN_SPEAK_KEY}
            onTextRecognized={handleTextRecognized}
          />
        </div>

        {/* Right: Speech Recognition */}
        <div className="col-md-6 mb-4">
          <h2 className="text-center">Speech Recognition</h2>
          <SpeechRecognition />
        </div>
      </div>
    </div>
  );
};

export default DualRecognitionPage;