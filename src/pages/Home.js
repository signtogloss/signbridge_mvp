import React from "react";
import LiveTranscription from "../components/LiveTranscription";

const Home = () => {
  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Audio Transcription</h1>
      <LiveTranscription />
    </div>
  );
};

export default Home;
