import React, { useEffect, useRef, useState } from "react";
import { setKey, useSignLanguageRecognition } from "@sign-speak/react-sdk";
import "bootstrap/dist/css/bootstrap.min.css";

// 从环境变量中获取后端 URL，默认为 http://localhost:8000
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// 从环境变量中获取 Sign-Speak Key
const SIGN_SPEAK_KEY = process.env.REACT_APP_SIGN_SPEAK_KEY || "your_default_sign_speak_key";

// 预定义角色列表（可根据需要修改）
const ROLES = ["CBC_2", "CBC_Signer"];

const Home = () => {
  // ===================== 左侧：手语识别（保持不变） =====================
  const videoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [rawPrediction, setRawPrediction] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");

  // 1) 初始化 Sign-Speak Key
  useEffect(() => {
    setKey(SIGN_SPEAK_KEY);
  }, []);

  // 2) 请求摄像头并播放
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    })();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3) 获取手语识别 Hook
  const {
    prediction,
    startRecognition,
    stopRecognition,
    recording,
    loading,
  } = useSignLanguageRecognition();

  // 4) 监听识别结果（打印 raw data 到 console，不再展示）
  useEffect(() => {
    if (prediction) {
      setRawPrediction(prediction);
      console.log("Raw Prediction:", prediction);
      if (prediction.prediction && Array.isArray(prediction.prediction)) {
        const filteredText = prediction.prediction
          .filter((item) => item.confidence > Math.log(0.5))
          .map((item) => item.prediction)
          .join(" ");
        setRecognizedText(filteredText);

        // 播放音频播报
        if (filteredText) {
          const utterance = new SpeechSynthesisUtterance(filteredText);
          speechSynthesis.speak(utterance);
        }
      }
    }
  }, [prediction]);

  // 开始/停止识别
  const handleStart = () => {
    startRecognition();
  };
  const handleStop = () => {
    stopRecognition();
  };

  // ===================== 右侧：麦克风 -> RESTful API -> 手语视频 =====================
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  // 用于显示 /process-audio 返回的识别文本（语音转文本）
  const [audioTranscription, setAudioTranscription] = useState("");
  // 选择的角色，默认取第一个
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  // 可选 TTS 状态
  const [ttsStatus, setTtsStatus] = useState("");

  // 开始录制麦克风
  const handleStartMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        // 录制结束，整合音频数据
        const blob = new Blob(chunks, { type: "audio/wav" });
        setChunks([]);

        // 构造 FormData 并调用 /process-audio 接口
        const formData = new FormData();
        formData.append("role", selectedRole);
        formData.append("audio_file", blob, "recording.wav");

        fetch(`${BASE_URL}/process-audio`, {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            const message = response.headers.get("X-Message");
            // 保存返回的识别文本用于 marquee 显示
            setAudioTranscription(message || "");
            const videoPath = response.headers.get("X-Video-Path");
            console.log("Server Message:", message);
            console.log("Video Path:", videoPath);
            return response.blob();
          })
          .then((videoBlob) => {
            if (videoBlob && videoBlob.size > 0) {
              const url = URL.createObjectURL(videoBlob);
              setVideoUrl(url);
            } else {
              console.log("No video data received from server.");
              setVideoUrl(null);
            }
          })
          .catch((err) => console.error("ProcessAudio error:", err));
      };

      recorder.start();
      setRecordingAudio(true);
    } catch (error) {
      console.error("Microphone access error:", error);
    }
  };

  // 停止录制麦克风
  const handleStopMic = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecordingAudio(false);
    }
  };

  // 清空右侧的音频生成相关状态
  const handleClearRight = () => {
    setVideoUrl(null);
    setAudioTranscription("");
  };

  // =============== 可选：调用 GenerateAudio（文本->语音）示例 ===============
  const handleGenerateAudio = async () => {
    setTtsStatus("Generating...");
    const formData = new FormData();
    formData.append("text", "Hello from React REST API!");
    formData.append("speaker", "p225"); // TTS 说话人

    fetch(`${BASE_URL}/generate-audio`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.blob())
      .then((audioBlob) => {
        if (audioBlob && audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          setTtsStatus("Audio generated, playing now...");
          const audio = new Audio(audioUrl);
          audio.play();
        } else {
          setTtsStatus("No audio data received.");
        }
      })
      .catch((err) => setTtsStatus("Error: " + err.message));
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ASL Bidirectional Demo (RESTful API)</h1>
      <div className="row">
        {/* 左侧：手语识别（保持不变，但不显示 raw prediction） */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header">Sign Language Recognition (Left)</div>
            <div className="card-body">
              <video
                ref={videoRef}
                className="img-fluid mb-3"
                style={{ backgroundColor: "#000" }}
              />
              {loading ? (
                <p>Loading camera/websocket...</p>
              ) : recording ? (
                <button className="btn btn-danger" onClick={handleStop}>
                  Stop Recognition
                </button>
              ) : (
                <button className="btn btn-success" onClick={handleStart}>
                  Start Recognition
                </button>
              )}
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">Recognized Text (Confidence &gt; 0.5)</div>
            <div className="card-body">
              <p>{recognizedText || "No recognized text yet."}</p>
            </div>
          </div>
        </div>

        {/* 右侧：麦克风 -> RESTful API -> 手语视频 */}
        <div className="col-md-6">
          {/* 视频与识别文本展示区域 */}
          <div className="card mb-3">
            <div className="card-header">Generated Sign Video (Right)</div>
            <div className="card-body">
              <video
                src={videoUrl}
                className="img-fluid mb-2"
                controls
                autoPlay
                loop
                style={{ backgroundColor: "#000" }}
              />
              <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                <marquee scrollamount="5">
                  {audioTranscription || "Transcribed text will appear here..."}
                </marquee>
              </div>
            </div>
          </div>
          {/* 录音与角色选择区域 */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 d-flex align-items-center">
                  {!recordingAudio ? (
                    <button className="btn btn-primary w-100" onClick={handleStartMic}>
                      Start Recording
                    </button>
                  ) : (
                    <button className="btn btn-danger w-100" onClick={handleStopMic}>
                      Stop &amp; Upload
                    </button>
                  )}
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* 清空按钮 */}
          <div className="card mb-3">
            <div className="card-body">
              <button className="btn btn-secondary w-100" onClick={handleClearRight}>
                Clear
              </button>
            </div>
          </div>
          {/* 可选：调用 GenerateAudio 示例 */}
          <div className="card mt-3">
            <div className="card-header">Generate Audio (TTS) Example</div>
            <div className="card-body">
              <button className="btn btn-secondary" onClick={handleGenerateAudio}>
                Generate Audio
              </button>
              <p className="mt-2">{ttsStatus}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
