import React, { useState } from "react";
import SpeechToGlossVideo from "./SpeechToGlossVideo";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ZoomStyleLayout.css";

/**
 * SignLanguageGeneration
 * ----------------------
 * A component that displays sign language generation content.
 * Renders the SpeechToGlossVideo component in a container that allows
 * for better visibility of the upper body of the signer.
 * Modified to fit in the new sidebar layout with subtitle area.
 */
const SignLanguageGeneration = () => {
  const [glossSequence, setGlossSequence] = useState([]);
  
  // Handle gloss sequence received from SpeechToGlossVideo
  const handleGlossUpdate = (glosses) => {
    setGlossSequence(glosses);
  };
  
  return (
    <div className="h-100 w-100 d-flex flex-column">
      <div className="flex-grow-1 p-0 position-relative">
        <div className="position-absolute top-0 start-0 end-0 bg-dark bg-opacity-50 text-white p-1 text-center" style={{fontSize: "0.8rem", zIndex: 5}}>
          Sign Language Video
        </div>
        {/* Use larger video area to display upper body */}
        <SpeechToGlossVideo compact={false} onGlossUpdate={handleGlossUpdate} />
        
        {/* Caption area - Display gloss sequence */}
        {glossSequence.length > 0 && (
          <div className="subtitle-area" style={{fontSize: "0.8rem"}}>
            <div className="gloss-sequence">
              {glossSequence.join(" ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignLanguageGeneration;
