import React, { useEffect, useRef, useState } from "react";
import { setKey, useSignLanguageRecognition } from "@sign-speak/react-sdk";
import "bootstrap/dist/css/bootstrap.min.css";

// 导入WebSocket Hooks
import useSpeechToText from "../hooks/useSpeechToText";
import useTextToSpeech from "../hooks/useTextToSpeech";
import useTextToGloss from "../hooks/useTextToGloss";
import useGlossToVideo from "../hooks/useGlossToVideo";
import useTextToASLVideo from "../hooks/useTextToASLVideo";

// 导入WebSocket配置
import WS_CONFIG from "../config/websocket";

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
  const [animateVideo, setAnimateVideo] = useState(false);
  
  // 添加动画效果
  useEffect(() => {
    // 页面加载后延迟显示动画效果
    const timer = setTimeout(() => {
      setAnimateVideo(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

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

  // ===================== 右侧：WebSocket API 实现 =====================
  // 选择的角色，默认取第一个
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  
  // 用户输入的文本
  const [inputText, setInputText] = useState("");
  
  // 当前选择的功能模式
  const [activeMode, setActiveMode] = useState("text2video"); // speech2text, text2speech, text2gloss, gloss2video, text2video
  
  // 语音转文字WebSocket Hook
  const speechToText = useSpeechToText({
    wsUrl: WS_CONFIG.SPEECH_TO_TEXT.url,
    autoConnect: WS_CONFIG.SPEECH_TO_TEXT.autoConnect
  });
  
  // 文本转语音WebSocket Hook
  const textToSpeech = useTextToSpeech({
    wsUrl: WS_CONFIG.TEXT_TO_SPEECH.url,
    autoConnect: WS_CONFIG.TEXT_TO_SPEECH.autoConnect
  });
  
  // 文本转ASL GlossWebSocket Hook
  const textToGloss = useTextToGloss({
    wsUrl: WS_CONFIG.TEXT_TO_GLOSS.url,
    autoConnect: WS_CONFIG.TEXT_TO_GLOSS.autoConnect
  });
  
  // ASL Gloss转视频WebSocket Hook
  const glossToVideo = useGlossToVideo({
    wsUrl: WS_CONFIG.GLOSS_TO_VIDEO.url,
    autoConnect: WS_CONFIG.GLOSS_TO_VIDEO.autoConnect
  });
  
  // 文本到手语视频一体化WebSocket Hook
  const textToASLVideo = useTextToASLVideo({
    wsUrl: WS_CONFIG.TEXT_TO_ASL_VIDEO.url,
    autoConnect: WS_CONFIG.TEXT_TO_ASL_VIDEO.autoConnect
  });

  // =============== WebSocket API 处理函数 ===============
  
  // 处理语音转文字
  const handleSpeechToText = () => {
    if (speechToText.isRecording) {
      speechToText.stopRecognition();
    } else {
      speechToText.startRecognition();
    }
  };
  
  // 处理文本转语音
  const handleTextToSpeech = () => {
    if (inputText) {
      textToSpeech.generateSpeech(inputText);
    }
  };
  
  // 处理文本转ASL Gloss
  const handleTextToGloss = () => {
    if (inputText) {
      textToGloss.generateGloss(inputText);
    }
  };
  
  // 处理ASL Gloss转视频
  const handleGlossToVideo = () => {
    if (textToGloss.gloss) {
      // 将Gloss文本拆分为数组
      const glossArray = textToGloss.gloss.split(' ').filter(item => item.trim());
      if (glossArray.length > 0) {
        glossToVideo.generateVideo(glossArray);
      }
    }
  };
  
  // 处理文本到手语视频一体化
  const handleTextToASLVideo = () => {
    if (inputText) {
      textToASLVideo.generateVideoFromText(inputText);
    }
  };
  
  // 清空右侧状态
  const handleClearRight = () => {
    // 根据当前模式清理相应状态
    switch (activeMode) {
      case 'speech2text':
        speechToText.stopRecognition();
        break;
      case 'text2speech':
        textToSpeech.cleanup();
        break;
      case 'text2gloss':
        textToGloss.reset();
        break;
      case 'gloss2video':
        glossToVideo.cleanup();
        break;
      case 'text2video':
        textToASLVideo.cleanup();
        break;
      default:
        break;
    }
    
    // 清空输入文本
    setInputText('');
  };
  
  // 播放生成的语音
  const handlePlayAudio = () => {
    if (textToSpeech.audioUrl) {
      textToSpeech.playAudio();
    }
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ASL Bidirectional Demo (WebSocket API)</h1>
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

        {/* 右侧：WebSocket API 实现 */}
        <div className="col-md-6">
          {/* 功能选择区域 */}
          <div className="card mb-3">
            <div className="card-header">WebSocket API 功能</div>
            <div className="card-body">
              <div className="btn-group w-100 mb-3">
                <button 
                  className={`btn ${activeMode === 'speech2text' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveMode('speech2text')}
                >
                  语音转文字
                </button>
                <button 
                  className={`btn ${activeMode === 'text2speech' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveMode('text2speech')}
                >
                  文本转语音
                </button>
                <button 
                  className={`btn ${activeMode === 'text2gloss' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveMode('text2gloss')}
                >
                  文本转Gloss
                </button>
                <button 
                  className={`btn ${activeMode === 'gloss2video' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveMode('gloss2video')}
                >
                  Gloss转视频
                </button>
                <button 
                  className={`btn ${activeMode === 'text2video' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveMode('text2video')}
                >
                  一体化
                </button>
              </div>
              
              {/* 文本输入区域 - 除了语音转文字外的模式都需要 */}
              {activeMode !== 'speech2text' && (
                <div className="mb-3">
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="请输入文本..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  ></textarea>
                </div>
              )}
              
              {/* 角色选择 - 仅在一体化模式下显示 */}
              {activeMode === 'text2video' && (
                <div className="mb-3">
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
              )}
              
              {/* 操作按钮 */}
              <div className="d-flex justify-content-between">
                {/* 语音转文字模式 */}
                {activeMode === 'speech2text' && (
                  <button 
                    className={`btn ${speechToText.isRecording ? 'btn-danger' : 'btn-success'} w-100`}
                    onClick={handleSpeechToText}
                  >
                    {speechToText.isRecording ? '停止录音' : '开始录音'}
                  </button>
                )}
                
                {/* 文本转语音模式 */}
                {activeMode === 'text2speech' && (
                  <>
                    <button 
                      className="btn btn-primary flex-grow-1 me-2"
                      onClick={handleTextToSpeech}
                      disabled={!inputText || textToSpeech.isLoading}
                    >
                      {textToSpeech.isLoading ? '生成中...' : '生成语音'}
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={handlePlayAudio}
                      disabled={!textToSpeech.audioUrl}
                    >
                      播放
                    </button>
                  </>
                )}
                
                {/* 文本转Gloss模式 */}
                {activeMode === 'text2gloss' && (
                  <button 
                    className="btn btn-primary w-100"
                    onClick={handleTextToGloss}
                    disabled={!inputText || textToGloss.isLoading}
                  >
                    {textToGloss.isLoading ? '转换中...' : '转换为Gloss'}
                  </button>
                )}
                
                {/* Gloss转视频模式 */}
                {activeMode === 'gloss2video' && (
                  <button 
                    className="btn btn-primary w-100"
                    onClick={handleGlossToVideo}
                    disabled={!textToGloss.gloss || glossToVideo.isProcessing}
                  >
                    {glossToVideo.isProcessing ? '生成中...' : '生成视频'}
                  </button>
                )}
                
                {/* 一体化模式 */}
                {activeMode === 'text2video' && (
                  <button 
                    className="btn btn-primary w-100"
                    onClick={handleTextToASLVideo}
                    disabled={!inputText || textToASLVideo.isProcessing}
                  >
                    {textToASLVideo.isProcessing ? '生成中...' : '一键生成手语视频'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* 结果展示区域 */}
          <div className="card mb-3">
            <div className="card-header">
              {activeMode === 'speech2text' && '语音识别结果'}
              {activeMode === 'text2speech' && '语音合成状态'}
              {activeMode === 'text2gloss' && 'ASL Gloss结果'}
              {activeMode === 'gloss2video' && '手语视频'}
              {activeMode === 'text2video' && '手语视频'}
            </div>
            <div className="card-body">
              {/* 语音转文字结果 */}
              {activeMode === 'speech2text' && (
                <div>
                  <p>{speechToText.recognizedText || '等待识别结果...'}</p>
                  {speechToText.error && (
                    <div className="alert alert-danger">{speechToText.error}</div>
                  )}
                </div>
              )}
              
              {/* 文本转语音结果 */}
              {activeMode === 'text2speech' && (
                <div>
                  {textToSpeech.isSuccess && (
                    <div className="alert alert-success">语音生成成功，可点击播放按钮收听</div>
                  )}
                  {textToSpeech.error && (
                    <div className="alert alert-danger">{textToSpeech.error}</div>
                  )}
                </div>
              )}
              
              {/* 文本转Gloss结果 */}
              {activeMode === 'text2gloss' && (
                <div>
                  <p className="font-monospace">{textToGloss.gloss || '等待转换结果...'}</p>
                  {textToGloss.error && (
                    <div className="alert alert-danger">{textToGloss.error}</div>
                  )}
                </div>
              )}
              
              {/* Gloss转视频结果 */}
              {activeMode === 'gloss2video' && (
                <div>
                  {glossToVideo.videoUrl ? (
                    <video
                      src={glossToVideo.videoUrl}
                      className="img-fluid mb-2"
                      controls
                      autoPlay
                      loop
                      style={{ backgroundColor: "#000" }}
                    />
                  ) : (
                    <p>等待视频生成...</p>
                  )}
                  {glossToVideo.error && (
                    <div className="alert alert-danger">{glossToVideo.error}</div>
                  )}
                </div>
              )}
              
              {/* 一体化结果 */}
              {activeMode === 'text2video' && (
                <div>
                  {textToASLVideo.videoUrl ? (
                    <>
                      <video
                        src={textToASLVideo.videoUrl}
                        className="img-fluid mb-2"
                        controls
                        autoPlay
                        loop
                        style={{ backgroundColor: "#000" }}
                      />
                      {textToASLVideo.gloss && (
                        <div className="alert alert-info mt-2">
                          <strong>生成的Gloss:</strong> {textToASLVideo.gloss}
                        </div>
                      )}
                    </>
                  ) : (
                    <p>等待视频生成...</p>
                  )}
                  {textToASLVideo.error && (
                    <div className="alert alert-danger">{textToASLVideo.error}</div>
                  )}
                </div>
              )}
              </div>
            </div>
            
            {/* 清除按钮 */}
            <div className="card mb-3">
              <div className="card-body">
                <button className="btn btn-secondary w-100" onClick={handleClearRight}>
                  清除
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Home;
