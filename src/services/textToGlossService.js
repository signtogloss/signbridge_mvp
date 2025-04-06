import { EventEmitter } from 'events';
import glossList from '../data/glossList.json';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.REACT_APP_OPENAI_BASE_URL || 'https://api.openai.com/v1';

const systemPrompt = `Below is the allowed vocabulary for ASL gloss (${glossList.length} words):
${glossList.join(' ')}

Your task:
1. Rephrase the given sentence into a simpler, more direct version without any punctuation.
2. Translate into ASL gloss sequence following ASL grammar.
3. For unlisted essential terms, spell them letter by letter.
Output ONLY the ASL gloss in uppercase.`;

export const textToGlossStream = (text) => {
  const emitter = new EventEmitter();
  
  (async () => {
    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Input: ${text}\nASL gloss:` }
          ]
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let contentBuffer = ''; // 用于累积完整内容
  
      // 处理完整单词的函数
      const processCompleteWords = (text) => {
        // 只处理非空文本
        if (!text.trim()) return '';
        
        // 按空格分割文本
        const parts = text.split(' ');
        
        // 如果只有一部分且没有空格，返回原文本（可能是不完整的单词）
        if (parts.length === 1) return text;
        
        // 处理除最后一部分外的所有完整单词
        for (let i = 0; i < parts.length - 1; i++) {
          const word = parts[i].trim();
          if (word) {
            emitter.emit('data', word);
          }
        }
        
        // 返回最后一部分（可能是不完整的单词）
        return parts[parts.length - 1];
      };

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // 处理剩余内容
          const remainingText = contentBuffer.trim();
          if (remainingText) {
            // 发送最后剩余的完整单词
            const words = remainingText.split(' ');
            words.forEach(word => {
              if (word.trim()) {
                emitter.emit('data', word.trim());
              }
            });
          }
          break;
        }

        // 解码新接收的数据
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 处理每一行数据
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              
              if (content) {
                // 添加到内容缓冲区
                contentBuffer += content;
                
                // 如果有空格，处理完整单词
                if (contentBuffer.includes(' ')) {
                  contentBuffer = processCompleteWords(contentBuffer);
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
        
        // 保留最后一行作为新的缓冲区
        buffer = lines[lines.length - 1] || '';
      }
      
      emitter.emit('end');
    } catch (error) {
      emitter.emit('error', error);
    }
  })();

  return emitter;
};