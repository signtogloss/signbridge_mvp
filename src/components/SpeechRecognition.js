import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const SpeechRecognitionComponent = () => {
  // —— State ——  
  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  // —— Ref ——  
  const recognitionRef = useRef(null);

  // —— 初始化 SpeechRecognition ——  
  useEffect(() => {
    // 浏览器兼容性检查
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setError('Your browser does not support Speech Recognition. Please use Chrome or Edge.');
      return;
    }

    const recog = new SpeechAPI();
    recog.continuous = true;           // 持续监听
    recog.interimResults = true;       // 返回中间结果
    recog.lang = 'en-US';              // 识别语言

    // 识别结果处理
    recog.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(prev => prev + (prev ? ' ' : '') + final);
      }
    };

    // 错误处理
    recog.onerror = (e) => {
      console.error('SpeechRecognition error', e.error);
      setError(`Error: ${e.error}`);
      setListening(false);
    };

    // onend 事件：若仍处于“开启”状态，则自动重启
    recog.onend = () => {
      if (listening) {
        recog.start();
      }
    };

    recognitionRef.current = recog;
    return () => {
      // 组件卸载时停止识别
      recog.stop();
    };
  }, []); // 注意：空依赖，确保只执行一次

  // —— 控制开始/停止 ——  
  const handleStart = useCallback(() => {
    if (!recognitionRef.current) return;
    setError('');
    setInterimTranscript('');
    setFinalTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.error('Start failed:', e);
      setError(`Failed to start: ${e.message}`);
    }
  }, []);

  const handleStop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  }, []);

  // —— 清空文本 ——  
  const handleClear = () => {
    setFinalTranscript('');
    setInterimTranscript('');
    setError('');
  };

  return (
    <div className="card mb-3">
      <div className="card-header">Speech Recognition</div>
      <div className="card-body">
        <div className="mb-3">
          <button
            className={`btn ${listening ? 'btn-danger' : 'btn-primary'} me-2`}
            onClick={listening ? handleStop : handleStart}
          >
            {listening ? 'Stop Recognition' : 'Start Recognition'}
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear Text
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-header">Recognition Results</div>
          <div className="card-body">
            <div className="mb-2">
              <strong>Final Text:</strong>
              <p className="border p-2 rounded bg-light">
                {finalTranscript || '(No recognition results yet)'}
              </p>
            </div>
            {interimTranscript && (
              <div>
                <strong>Interim Text:</strong>
                <p className="border p-2 rounded bg-light fst-italic text-muted">
                  {interimTranscript}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechRecognitionComponent;
