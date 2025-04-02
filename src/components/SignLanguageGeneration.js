import React from "react";
import SpeechToText from "./SpeechToText";
import SpeechToVideo from "./SpeechToVideo";
import SpeechToGlossVideo from "./SpeechToGlossVideo";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * SignLanguageGeneration
 * ----------------------
 * A component that displays sign language generation content.
 * Now directly renders the SpeechToGlossVideo component without additional container nesting,
 * following the same design pattern as SpeechToText.js.
 */
const SignLanguageGeneration = () => {
  return (
    <div>
      <div className="card mb-3">
        <div className="card-header">Sign Language Generation</div>
        <div className="card-body">
          {/* Speech-to-text component */}
          {/* <SpeechToText /> */}
          {/* <SpeechToVideo /> */}
          <SpeechToGlossVideo />
        </div>
      </div>
    </div>
  );
};

export default SignLanguageGeneration;
