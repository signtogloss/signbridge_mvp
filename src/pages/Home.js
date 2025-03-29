import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// 导入组件
import SignLanguageRecognition from "../components/SignLanguageRecognition";

// 导入WebSocket Hooks - 只保留语音识别功能
import useSpeechToText from "../hooks/useSpeechToText";

// 导入WebSocket配置
import WS_CONFIG from "../config/websocket";

// 从环境变量中获取后端 URL，默认为 http://localhost:8000
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// 从环境变量中获取 Sign-Speak Key
const SIGN_SPEAK_KEY = process.env.REACT_APP_SIGN_SPEAK_KEY || "your_default_sign_speak_key";

// 预定义角色列表（可根据需要修改）
const ROLES = ["CBC_2", "CBC_Signer"];

const Home = () => {
  // ===================== 状态管理 =====================
  const [recognizedText, setRecognizedText] = useState("");
  
  // 处理手语识别结果的回调函数
  const handleTextRecognized = (text) => {
    setRecognizedText(text);
  };

  // ===================== 右侧：WebSocket API 实现 =====================
  // 选择的角色，默认取第一个
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  
  // 用户输入的文本
  const [inputText, setInputText] = useState("");
  
    // 语音转文字WebSocket Hook
  const speechToText = useSpeechToText({
    wsUrl: WS_CONFIG.SPEECH_TO_TEXT.url,
    autoConnect: WS_CONFIG.SPEECH_TO_TEXT.autoConnect
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
  
  // 清空右侧状态
  const handleClearRight = () => {
    speechToText.stopRecognition();
    // 清空其他状态
    console.log('清空语音识别状态');
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">ASL Bidirectional Demo (WebSocket API)</h1>
      <div className="row">
        {/* 左侧：手语识别组件 */}
        <div className="col-md-6">
          <SignLanguageRecognition 
            signSpeakKey={SIGN_SPEAK_KEY} 
            onTextRecognized={handleTextRecognized} 
          />
        </div>

        {/* 右侧：语音识别调试区域 */}
        <div className="col-md-6">
          {/* 功能区域 */}
          <div className="card mb-3">
            <div className="card-header">语音识别调试</div>
            <div className="card-body">
              {/* 操作按钮 */}
              <div className="d-flex justify-content-between">
                <button 
                  className={`btn ${speechToText.isRecording ? 'btn-danger' : 'btn-success'} w-100`}
                  onClick={handleSpeechToText}
                >
                  {speechToText.isRecording ? '停止录音' : '开始录音'}
                </button>
              </div>
            </div>
          </div>
          
          {/* 结果展示区域 - 增强版带调试信息 */}
          <div className="card mb-3">
            <div className="card-header">语音识别结果</div>
            <div className="card-body">
              <div>
                <div className="alert alert-info mb-2">
                  <strong>连接状态:</strong> {speechToText.isConnected ? '已连接' : '未连接'} 
                  ({speechToText.status})
                </div>
                
                {speechToText.error && (
                  <div className="alert alert-danger mb-2">
                    <strong>错误:</strong> {speechToText.error}
                  </div>
                )}
                
                <div className="alert alert-secondary mb-2">
                  <strong>WebSocket URL:</strong> {speechToText.wsUrl}
                </div>
                
                <div className="card bg-light mb-2">
                  <div className="card-header">识别文本 (实时流)</div>
                  <div className="card-body">
                    <p className="mb-0">{speechToText.recognizedText || "等待语音输入..."}</p>
                  </div>
                </div>
                
                {/* 添加更多调试信息 */}
                <div className="card bg-light mb-2">
                  <div className="card-header">调试信息</div>
                  <div className="card-body">
                    <p><strong>是否正在录音:</strong> {speechToText.isRecording ? '是' : '否'}</p>
                    <p><strong>WebSocket状态:</strong> {speechToText.status}</p>
                  </div>
                </div>
                
                <small className="text-muted">提示: 请查看控制台获取更多调试信息</small>
              </div>
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
