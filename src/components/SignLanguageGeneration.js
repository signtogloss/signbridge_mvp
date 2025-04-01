import React from "react";
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
      <SpeechToGlossVideo />
    </div>
  );
};

export default SignLanguageGeneration;
