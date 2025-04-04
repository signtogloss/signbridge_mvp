import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SpeechToText from "../components/SpeechToText";

/**
 * SpeechToTextPage
 * ---------------
 * A dedicated page for the Speech to Text functionality.
 */
const SpeechToTextPage = () => {
  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Speech to Text</h1>
      <div className="row justify-content-center">
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header">Speech Recognition</div>
            <div className="card-body">
              <SpeechToText />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechToTextPage;