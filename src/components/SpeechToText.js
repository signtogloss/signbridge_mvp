import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * SpeechToText
 * ------------
 * A self-contained speech recognition component that:
 *  - connects to a given WebSocket URL for live transcription
 *  - handles microphone recording, chunking, waveform visualization
 *  - displays the transcript in real-time
 * 
 * Props:
 *  - websocketUrl: string (WebSocket server URL). Default "ws://localhost:8000/asr"
 * 
 * Note: This version omits the UI for changing the WebSocket URL. 
 *       Instead, you can pass a URL via props or just edit the default below.
 */
const SpeechToText = ({ websocketUrl = "ws://localhost:8000/asr" }) => {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [chunkDuration, setChunkDuration] = useState(1000); // in ms
  const [statusMessage, setStatusMessage] = useState("Click to start transcription");
  const [transcriptHTML, setTranscriptHTML] = useState("");
  const [timerDisplay, setTimerDisplay] = useState("00:00");

  // Refs
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

  /****************************************************************
   * 1. WebSocket connection + message handling
   ****************************************************************/
  const setupWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(websocketUrl);
        ws.binaryType = "arraybuffer";
        ws.onopen = () => {
          setStatusMessage("Connected to server.");
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
            buffer_diarization = "",
            remaining_time_transcription = 0,
            remaining_time_diarization = 0,
          } = data;
          // Update transcript
          renderLinesWithBuffer(
            lines,
            buffer_diarization,
            buffer_transcription,
            remaining_time_diarization,
            remaining_time_transcription
          );
        };
        websocketRef.current = ws;
      } catch (error) {
        setStatusMessage("Invalid WebSocket URL. Please check your config.");
        reject(error);
      }
    });
  }, [websocketUrl]);

  // Render transcript lines with buffer/lag indicators
  const renderLinesWithBuffer = useCallback(
    (
      lines,
      buffer_diarization,
      buffer_transcription,
      remaining_time_diarization,
      remaining_time_transcription
    ) => {
      const linesHtml = lines
        .map((item, idx) => {
          let timeInfo = "";
          if (item.beg !== undefined && item.end !== undefined) {
            timeInfo = ` ${item.beg} - ${item.end}`;
          }
          let speakerLabel = "";
          if (item.speaker === -2) {
            speakerLabel = `<span class="silence">Silence<span id="timeInfo">${timeInfo}</span></span>`;
          } else if (item.speaker === 0) {
            speakerLabel = `<span class="loading"><span class="spinner"></span><span id="timeInfo">${remaining_time_diarization}s diarization lag</span></span>`;
          } else if (item.speaker === -1) {
            speakerLabel = `<span id="speaker"><span id="timeInfo">${timeInfo}</span></span>`;
          } else if (item.speaker !== -1) {
            speakerLabel = `<span id="speaker">Speaker ${item.speaker}<span id="timeInfo">${timeInfo}</span></span>`;
          }

          let textContent = item.text || "";

          // Show transcription lag on last line
          if (idx === lines.length - 1) {
            speakerLabel += `<span class="label_transcription"><span class="spinner"></span>Transcription lag <span id="timeInfo">${remaining_time_transcription}s</span></span>`;
          }
          // Show diarization lag / buffer on last line
          if (idx === lines.length - 1 && buffer_diarization) {
            speakerLabel += `<span class="label_diarization"><span class="spinner"></span>Diarization lag <span id="timeInfo">${remaining_time_diarization}s</span></span>`;
            textContent += `<span class="buffer_diarization">${buffer_diarization}</span>`;
          }
          // Show partial transcription buffer
          if (idx === lines.length - 1) {
            textContent += `<span class="buffer_transcription">${buffer_transcription}</span>`;
          }

          return `<p>${speakerLabel}<br/><div class="textcontent">${textContent}</div></p>`;
        })
        .join("");
      setTranscriptHTML(linesHtml);
    },
    []
  );

  /****************************************************************
   * 2. Recording + waveform
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
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.beginPath();

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    const sliceWidth = (canvas.width / dpr) / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * (canvas.height / dpr) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width / dpr, canvas.height / dpr / 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Stop recording & close everything
  const stopRecording = () => {
    userClosingRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn("Could not close audio context:", e);
      }
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerDisplay("00:00");
    startTimeRef.current = null;
    setIsRecording(false);

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setStatusMessage("Click to start transcription");
  };

  // Toggle recording on button click
  const toggleRecording = async () => {
    if (!isRecording) {
      // Clear old transcript
      setTranscriptHTML("");
      try {
        await setupWebSocket();
        await startRecording();
      } catch (err) {
        setStatusMessage("Could not connect or access mic. Aborted.");
        console.error(err);
      }
    } else {
      stopRecording();
    }
  };

  // Handler for chunk size
  const handleChunkSelectorChange = (e) => {
    setChunkDuration(parseInt(e.target.value, 10));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      <h5>Speech to Text</h5>

      {/* Controls */}
      <div
        className="settings-container"
        style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "10px" }}
      >
        <button
          id="recordButton"
          onClick={toggleRecording}
          className={isRecording ? "recording" : ""}
          style={{
            width: isRecording ? "180px" : "50px",
            height: "50px",
            border: "none",
            borderRadius: isRecording ? "40px" : "50%",
            backgroundColor: "white",
            cursor: "pointer",
            transition: "all 0.3s ease",
            border: "1px solid rgb(233,233,233)",
            display: "flex",
            alignItems: "center",
            justifyContent: isRecording ? "flex-start" : "center",
            paddingLeft: isRecording ? "20px" : "0",
            position: "relative",
          }}
        >
          <div
            className="shape-container"
            style={{
              width: "25px",
              height: "25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              className="shape"
              style={{
                width: "25px",
                height: "25px",
                backgroundColor: "rgb(209,61,53)",
                borderRadius: isRecording ? "5px" : "50%",
                transition: "all 0.3s ease",
              }}
            ></div>
          </div>
          {isRecording && (
            <div
              className="recording-info"
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "15px",
                flexGrow: 1,
              }}
            >
              <div
                className="wave-container"
                style={{
                  width: "60px",
                  height: "30px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <canvas
                  id="waveCanvas"
                  ref={waveCanvasRef}
                  width={60 * (window.devicePixelRatio || 1)}
                  height={30 * (window.devicePixelRatio || 1)}
                  style={{ width: "100%", height: "100%" }}
                ></canvas>
              </div>
              <div
                className="timer"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#333",
                  marginLeft: "10px",
                }}
              >
                {timerDisplay}
              </div>
            </div>
          )}
        </button>

        <div className="settings" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div>
            <label htmlFor="chunkSelector" style={{ fontSize: "14px" }}>
              Chunk size (ms):
            </label>
            <select
              id="chunkSelector"
              value={chunkDuration}
              onChange={handleChunkSelectorChange}
              style={{
                fontSize: "14px",
                padding: "5px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                backgroundColor: "#ffffff",
                maxHeight: "30px",
                marginLeft: "5px",
              }}
            >
              <option value="500">500 ms</option>
              <option value="1000">1000 ms</option>
              <option value="2000">2000 ms</option>
              <option value="3000">3000 ms</option>
              <option value="4000">4000 ms</option>
              <option value="5000">5000 ms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status display */}
      <p
        id="status"
        style={{
          marginTop: "10px",
          fontSize: "14px",
          color: "#666",
        }}
      >
        {statusMessage}
      </p>

      {/* Transcript display */}
      <div
        id="linesTranscript"
        style={{
          margin: "10px auto",
          maxWidth: "100%",
          textAlign: "left",
          fontSize: "15px",
          minHeight: "60px",
          lineHeight: "1.4em",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
        }}
        dangerouslySetInnerHTML={{ __html: transcriptHTML }}
      />
    </div>
  );
};

export default SpeechToText;
