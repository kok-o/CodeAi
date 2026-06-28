/**
 * useAiStream — хук для SSE-стриминга ответов от /api/ai/chat
 *
 * Возвращает:
 *   streamChat(messages, options) — запускает стриминг, возвращает итоговый текст
 *   isStreaming — boolean
 *   abort() — прерывает текущий стрим
 *
 * options: { model, mode, onToken, onDone, onError }
 *   onToken(token, fullText) — вызывается при каждом новом токене
 *   onDone(fullText, model)  — вызывается по завершению
 *   onError(message)         — вызывается при ошибке
 */

import { useRef, useState, useCallback } from 'react';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

const useAiStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const streamChat = useCallback(async (messages, options = {}) => {
    const { model = 'qwen3:8b', mode, onToken, onDone, onError } = options;

    // Abort any ongoing stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);

    const token = localStorage.getItem('codeai_token');
    let fullText = '';
    let resolvedModel = model;

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages, model, mode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              onError?.(data.error);
              setIsStreaming(false);
              return '';
            }

            if (data.token) {
              fullText += data.token;
              onToken?.(data.token, fullText);
            }

            if (data.done) {
              resolvedModel = data.model || model;
            }
          } catch { /* skip malformed */ }
        }
      }

      onDone?.(fullText, resolvedModel);
      return fullText;
    } catch (err) {
      if (err.name === 'AbortError') return ''; // user cancelled
      onError?.(err.message);
      return '';
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { streamChat, isStreaming, abort };
};

export default useAiStream;
