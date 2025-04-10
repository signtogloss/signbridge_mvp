import React from "react";
import SpeechToText from "./SpeechToText";
import SpeechToGlossVideo from "./SpeechToGlossVideo";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * SignLanguageGeneration
 * ----------------------
 * A component that displays sign language generation content.
 * The video player is now positioned at the top, with other content below.
 * The video playback speed is set to 1.5x for more natural sign language presentation.
 */
const SignLanguageGeneration = () => {
  return (
    <div>
      <div className="card mb-3">
        <div className="card-header">Sign Language Generation</div>
        <div className="card-body">
          {/* 这里我们不直接渲染完整的SpeechToGlossVideo组件，而是自定义布局 */}
          <SpeechToGlossVideo />
        </div>
      </div>
    </div>
  );
};

export default SignLanguageGeneration;
