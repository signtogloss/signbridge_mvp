import React, { useState, useRef, useEffect, useCallback } from "react";
import API_ENDPOINTS from "../services/apiConfig";

/**
 * SpeechToGlossVideo
 * -----------------
 * A component that combines speech recognition, text-to-gloss conversion, and gloss-to-video generation.
 * It captures speech, converts it to text, transforms the text to ASL gloss, and then
 * sends the gloss to a WebSocket server to generate a sign language video.
 */
const SpeechToGlossVideo = () => {
  // State variables for speech recognition
  const [isRecording, setIsRecording] = useState(false);
  const [chunkDuration, setChunkDuration] = useState(1000); // in ms
  const [statusMessage, setStatusMessage] = useState("Click to start transcription");
  const [transcriptText, setTranscriptText] = useState("");
  const [timerDisplay, setTimerDisplay] = useState("00:00");

  // State variables for gloss and video
  const [glossSequence, setGlossSequence] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");

  // Refs for speech recognition
  const websocketRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const userClosingRef = useRef(false);

  // Ref for gloss-to-video WebSocket
  const glossVideoWebsocketRef = useRef(null);

  // 从apiConfig导入WebSocket URL
  const speechWebsocketUrl = API_ENDPOINTS.SPEECH_TO_TEXT;
  // Gloss to video WebSocket URL
  const glossVideoWebsocketUrl = API_ENDPOINTS.GLOSS_TO_VIDEO;

  /****************************************************************
   * 1. Speech Recognition WebSocket connection + message handling
   ****************************************************************/
  const setupSpeechWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(speechWebsocketUrl);
        ws.binaryType = "arraybuffer";
        ws.onopen = () => {
          setStatusMessage("Connected to speech recognition server.");
          resolve(ws);
        };
        ws.onclose = () => {
          if (userClosingRef.current) {
            setStatusMessage("WebSocket closed by user.");
          } else {
            setStatusMessage(
              "Disconnected from the server. (Check logs if the model is loading.)"
            );
          }
          userClosingRef.current = false;
        };
        ws.onerror = () => {
          setStatusMessage("Error connecting to WebSocket.");
          reject(new Error("Error connecting to WebSocket"));
        };
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const {
            lines = [],
            buffer_transcription = "",
          } = data;
          
          // Update transcript
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const text = lastLine.text || "";
            const fullText = text + buffer_transcription;
            setTranscriptText(fullText);
            
            // If we have a complete sentence, convert it to gloss
            if (fullText.trim() && (fullText.endsWith(".") || fullText.endsWith("?") || fullText.endsWith("!"))) {
              convertTextToGloss(fullText);
            }
          }
        };
        websocketRef.current = ws;
      } catch (error) {
        setStatusMessage("Invalid WebSocket URL. Please check your config.");
        reject(error);
      }
    });
  }, [speechWebsocketUrl]);

  /****************************************************************
   * 2. Gloss to Video WebSocket connection + message handling
   ****************************************************************/
  const setupGlossVideoWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(glossVideoWebsocketUrl);
        ws.binaryType = "arraybuffer";
        ws.onopen = () => {
          console.log("Connected to gloss2video server.");
          resolve(ws);
        };
        ws.onclose = () => {
          console.log("Disconnected from gloss2video server.");
        };
        ws.onerror = (error) => {
          console.error("Error connecting to gloss2video WebSocket:", error);
          reject(error);
        };
        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Binary data (video)
            console.log("Received binary video data");
            const blob = new Blob([event.data], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setIsProcessingVideo(false);
            setVideoStatus("Video generated successfully");
          } else {
            // JSON status message
            const data = JSON.parse(event.data);
            console.log("Received gloss2video status:", data);
            
            if (data.status === "processing") {
              setVideoStatus(`Processing video (ID: ${data.video_id})...`);
            } else if (data.status === "success") {
              setVideoStatus(`Video ready (ID: ${data.video_id})`);
            } else if (data.status === "error") {
              setVideoStatus(`Error: ${data.message || "Unknown error"}`);
              setIsProcessingVideo(false);
            }
          }
        };
        glossVideoWebsocketRef.current = ws;
      } catch (error) {
        console.error("Failed to setup gloss2video WebSocket:", error);
        reject(error);
      }
    });
  }, [glossVideoWebsocketUrl]);

  // 添加一个状态变量来跟踪上一次处理的文本
  const lastProcessedTextRef = useRef("");

  /****************************************************************
   * 3. Text to Gloss conversion
   ****************************************************************/
  const convertTextToGloss = async (text) => {
    try {
      // 检查是否有新的文本需要处理
      if (text === lastProcessedTextRef.current) {
        console.log("Text already processed, skipping:", text);
        return;
      }

      // 获取新的文本部分（如果有上一次处理的文本）
      let newText = text;
      if (lastProcessedTextRef.current && text.startsWith(lastProcessedTextRef.current)) {
        newText = text.substring(lastProcessedTextRef.current.length).trim();
      }

      // 如果没有新文本，则返回
      if (!newText) {
        return;
      }

      console.log("Converting new text to gloss:", newText);
      
      // 更新上一次处理的文本引用
      lastProcessedTextRef.current = text;
      
      // Simple rules for demonstration (this should be replaced with actual API call)
      const simplifiedText = newText.toUpperCase()
        .replace(/[.,!?;:]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Split into words and filter out empty strings
      const words = simplifiedText.split(' ').filter(word => word.length > 0);
      
      // For demonstration, we'll just use the words as gloss
      // In a real implementation, you would use the OpenAI API as shown in the Python code
      setGlossSequence(words);
      
      // Send the gloss sequence to the video generation service
      sendGlossToVideoService(words);
    } catch (error) {
      console.error("Error converting text to gloss:", error);
    }
  };

  /****************************************************************
   * 4. Send Gloss to Video Service
   ****************************************************************/
  const sendGlossToVideoService = (glossArray) => {
    if (!glossVideoWebsocketRef.current || glossVideoWebsocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Gloss2Video WebSocket is not connected");
      return;
    }
    
    if (!glossArray || glossArray.length === 0) {
      console.error("No gloss sequence to send");
      return;
    }
    
    try {
      setIsProcessingVideo(true);
      setVideoStatus("Sending gloss sequence to video service...");
      
      const message = JSON.stringify({
        gloss: glossArray
      });
      
      console.log("Sending to gloss2video:", message);
      glossVideoWebsocketRef.current.send(message);
    } catch (error) {
      console.error("Error sending gloss to video service:", error);
      setIsProcessingVideo(false);
      setVideoStatus("Error sending gloss to video service");
    }
  };

  /****************************************************************
   * 5. Recording + waveform
   ****************************************************************/
  // Start recording: get microphone, set up MediaRecorder, etc.
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // AudioContext + Analyser
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const mic = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = mic;
      mic.connect(analyser);

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(e.data);
        }
      };
      mediaRecorder.start(chunkDuration);

      // Start timer & waveform
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      drawWaveform();

      setIsRecording(true);
      setStatusMessage("Recording...");
    } catch (err) {
      setStatusMessage("Error accessing microphone. Please allow mic usage.");
      console.error(err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (websocketRef.current) {
      userClosingRef.current = true;
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setIsRecording(false);
    setStatusMessage("Recording stopped.");
  };

  // Update timer display
  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setTimerDisplay(`${minutes}:${seconds}`);
  }, []);

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  /****************************************************************
   * 6. Component lifecycle
   ****************************************************************/
  // Initialize WebSockets on component mount
  useEffect(() => {
    setupGlossVideoWebSocket().catch(console.error);
    return () => {
      if (glossVideoWebsocketRef.current) {
        glossVideoWebsocketRef.current.close();
      }
    };
  }, [setupGlossVideoWebSocket]);

  // Handle recording start/stop
  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Set up WebSocket first, then start recording
      try {
        await setupSpeechWebSocket();
        startRecording();
      } catch (error) {
        console.error("Failed to start recording:", error);
        setStatusMessage("Failed to start recording. Check console for details.");
      }
    }
  };

  return (
    <div className="speech-to-gloss-video">
      {/* Speech Recognition Section */}
      <div className="mb-3">
        <h4>Speech to Sign Language Video</h4>
        <div>
          <div className="row mb-3">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="status-message">{statusMessage}</span>
                <span className="timer">{timerDisplay}</span>
              </div>
              <canvas
                ref={waveCanvasRef}
                className="waveform"
                width="600"
                height="100"
                style={{ width: "100%", height: "100px", backgroundColor: "#f8f9fa" }}
              ></canvas>
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col text-center">
              <button
                className={`btn ${isRecording ? "btn-danger" : "btn-primary"}`}
                onClick={handleToggleRecording}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>
            </div>
          </div>
          
          {/* Transcript Display */}
          <div className="row mb-3">
            <div className="col">
              <div className="p-3 border rounded">
                <h5>Transcript</h5>
                <p>{transcriptText || "No transcript yet. Start recording to begin."}</p>
              </div>
            </div>
          </div>
          
          {/* Gloss Sequence Display */}
          <div className="row mb-3">
            <div className="col">
              <div className="p-3 border rounded">
                <h5>ASL Gloss Sequence</h5>
                <p>{glossSequence.length > 0 ? glossSequence.join(" ") : "No gloss sequence generated yet."}</p>
              </div>
            </div>
          </div>
          
          {/* Video Display */}
          <div className="row">
            <div className="col">
              <div className="p-3 border rounded">
                <h5>Sign Language Video</h5>
                <div className="text-center">
                  {isProcessingVideo ? (
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : videoUrl ? (
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      style={{ maxWidth: "100%", maxHeight: "300px" }}
                    ></video>
                  ) : (
                    <p>No video generated yet.</p>
                  )}
                  <p className="mt-2">{videoStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechToGlossVideo;