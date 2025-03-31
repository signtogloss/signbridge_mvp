import React from "react";
import SpeechToText from "./SpeechToText";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * SignLanguageGeneration
 * ----------------------
 * A component that displays sign language generation content and includes
 * the SpeechToText component. Styled to match SignLanguageRecognition.
 */
const SignLanguageGeneration = () => {

  return (
    <div>
      <div className="card mb-3">
        <div className="card-header">Speech to Text</div>
        <div className="card-body">
          {/* Speech-to-text component */}
          <SpeechToText />
        </div>
      </div>
    </div>
  );
};

export default SignLanguageGeneration;
