import React from "react";
import SpeechToText from "./SpeechToText";

/**
 * SignLanguageGeneration
 * ----------------------
 * A fancy container on the right-hand side that displays
 * your sign-language generation content, plus it renders
 * the SpeechToText component inside if you wish.
 */
const SignLanguageGeneration = () => {
  return (
    <div
      style={{
        border: "2px solid #ddd",
        borderRadius: "10px",
        backgroundColor: "#f0f8ff",
        padding: "1rem",
        marginTop: "1rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h4 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Sign Language Generation
      </h4>

      {/* Speech-to-text component can be included here */}
      <div style={{ marginTop: "1rem" }}>
        <SpeechToText />
      </div>

      {/* Example placeholder button (customize as needed) */}
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#00bcd4",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Generate Sign Language
        </button>
      </div>
    </div>
  );
};

export default SignLanguageGeneration;
