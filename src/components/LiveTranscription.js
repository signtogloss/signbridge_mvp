import React, { useState, useRef, useEffect, useCallback } from "react";

const LiveTranscription = () => {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [chunkDuration, setChunkDuration] = useState(1000);
  const [websocketUrl, setWebsocketUrl] = useState("ws://localhost:8000/asr");
  const [status, setStatus] = useState("");
  const [transcriptHTML, setTranscriptHTML] = useState("");
  const [timerDisplay, setTimerDisplay] = useState("00:00");

  // Refs for WebSocket, MediaRecorder, AudioContext, etc.
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

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(websocketUrl);
        ws.binaryType = "arraybuffer";
        ws.onopen = () => {
          setStatus("Connected to server.");
          resolve(ws);
        };
        ws.onclose = () => {
          if (userClosingRef.current) {
            setStatus("WebSocket closed by user.");
          } else {
            setStatus(
              "Disconnected from the WebSocket server. (Check logs if model is loading.)"
            );
          }
          userClosingRef.current = false;
        };
        ws.onerror = () => {
          setStatus("Error connecting to WebSocket.");
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
        setStatus("Invalid WebSocket URL. Please check and try again.");
        reject(error);
      }
    });
  }, [websocketUrl]);

  // Render transcript lines with lag indicators (same as HTML)
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
            speakerLabel = `<span class="loading"><span class="spinner"></span><span id="timeInfo">${remaining_time_diarization} second(s) of audio are undergoing diarization</span></span>`;
          } else if (item.speaker === -1) {
            speakerLabel = `<span id="speaker"><span id="timeInfo">${timeInfo}</span></span>`;
          } else if (item.speaker !== -1) {
            speakerLabel = `<span id="speaker">Speaker ${item.speaker}<span id="timeInfo">${timeInfo}</span></span>`;
          }
          let textContent = item.text;
          if (idx === lines.length - 1) {
            speakerLabel += `<span class="label_transcription"><span class="spinner"></span>Transcription lag <span id="timeInfo">${remaining_time_transcription}s</span></span>`;
          }
          if (idx === lines.length - 1 && buffer_diarization) {
            speakerLabel += `<span class="label_diarization"><span class="spinner"></span>Diarization lag<span id="timeInfo">${remaining_time_diarization}s</span></span>`;
            textContent += `<span class="buffer_diarization">${buffer_diarization}</span>`;
          }
          if (idx === lines.length - 1) {
            textContent += `<span class="buffer_transcription">${buffer_transcription}</span>`;
          }
          return textContent
            ? `<p>${speakerLabel}<br/><div class="textcontent">${textContent}</div></p>`
            : `<p>${speakerLabel}<br/></p>`;
        })
        .join("");
      setTranscriptHTML(linesHtml);
    },
    []
  );

  // Update timer display every second
  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setTimerDisplay(`${minutes}:${seconds}`);
  }, []);

  // Draw waveform on canvas using AnalyserNode
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

  // Start recording: get microphone, set up MediaRecorder, AudioContext, etc.
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Set up AudioContext and AnalyserNode for waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);
      // Set up MediaRecorder for audio
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(e.data);
        }
      };
      mediaRecorder.start(chunkDuration);
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      drawWaveform();
      setIsRecording(true);
      setStatus("Recording...");
    } catch (err) {
      setStatus("Error accessing microphone. Please allow microphone access.");
      console.error(err);
    }
  };

  // Stop recording: clean up recorder, audio, timers, and close WebSocket
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
    setStatus("Click to start transcription");
  };

  // Toggle recording on button click
  const toggleRecording = async () => {
    if (!isRecording) {
      setTranscriptHTML("");
      try {
        await setupWebSocket();
        await startRecording();
      } catch (err) {
        setStatus("Could not connect to WebSocket or access mic. Aborted.");
        console.error(err);
      }
    } else {
      stopRecording();
    }
  };

  // Handlers for settings controls
  const handleChunkSelectorChange = (e) => {
    setChunkDuration(parseInt(e.target.value));
  };

  const handleWebsocketInputChange = (e) => {
    const urlValue = e.target.value.trim();
    if (!urlValue.startsWith("ws://") && !urlValue.startsWith("wss://")) {
      setStatus("Invalid WebSocket URL (must start with ws:// or wss://)");
      return;
    }
    setWebsocketUrl(urlValue);
    setStatus("WebSocket URL updated. Ready to connect.");
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Settings and controls */}
      <div
        className="settings-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          marginTop: "20px",
        }}
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
        <div
          className="settings"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "5px",
          }}
        >
          <div>
            <label htmlFor="chunkSelector" style={{ fontSize: "14px" }}>
              Chunk size!!! (ms):
            </label>
            <select
              id="chunkSelector"
              value={chunkDuration}
              onChange={handleChunkSelectorChange}
              style={{
                fontSize: "16px",
                padding: "5px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                backgroundColor: "#ffffff",
                maxHeight: "30px",
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
          <div>
            <label htmlFor="websocketInput" style={{ fontSize: "14px" }}>
              WebSocket URL:
            </label>
            <input
              id="websocketInput"
              type="text"
              value={websocketUrl}
              onChange={handleWebsocketInputChange}
              style={{
                fontSize: "16px",
                padding: "5px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                backgroundColor: "#ffffff",
                maxHeight: "30px",
                width: "200px",
              }}
            />
          </div>
        </div>
      </div>
      {/* Status display */}
      <p
        id="status"
        style={{
          marginTop: "20px",
          fontSize: "16px",
          color: "#333",
          textAlign: "center",
        }}
      >
        {status}
      </p>
      {/* Transcript display */}
      <div
        id="linesTranscript"
        style={{
          margin: "20px auto",
          maxWidth: "700px",
          textAlign: "left",
          fontSize: "16px",
        }}
        dangerouslySetInnerHTML={{ __html: transcriptHTML }}
      ></div>
    </div>
  );
};

export default LiveTranscription;
