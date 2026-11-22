// One conversation with Pirento AI: load a saved chat, send a message and stream the reply, rate an answer.
// Used by the AI dashboard and by the Ask Pirento AI panel in every product dashboard.
import {useState} from 'react';
import {api, authFetch} from '../../lib/api/client';

export function useChat({product = '', onSent} = {}) {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState({});

  const open = async (id) => {
    setError('');
    setChatId(id);
    setRatings({});
    try {
      setMessages(id ? (await api(`/ai/chats/${id}`)).messages : []);
    } catch (err) {
      setError(err.message);
    }
  };

  /** Sends `content`; returns false (and keeps nothing) when it failed, so the caller can put the text back. */
  const send = async (content) => {
    if (!content || busy) return true;
    setError('');
    setBusy(true);
    setMessages((m) => [...m, {role: 'user', content}, {role: 'assistant', content: ''}]);
    try {
      const res = await authFetch(`/api/ai/chats/${chatId ?? 'new'}/messages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content, product}),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? 'Something went wrong');
      if (!chatId) setChatId(res.headers.get('x-chat-id'));
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const {value, done} = await reader.read();
        if (done) break;
        setMessages((m) => [...m.slice(0, -1), {role: 'assistant', content: m.at(-1).content + value}]);
      }
      onSent?.();
      return true;
    } catch (err) {
      setError(err.message);
      setMessages((m) => m.slice(0, -2));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const rate = async (index, rating) => {
    if (!chatId) return;
    try {
      await api(`/ai/chats/${chatId}/feedback`, {method: 'POST', body: {index, rating}});
      setRatings((r) => ({...r, [index]: rating}));
    } catch (err) {
      setError(err.message);
    }
  };

  return {chatId, messages, busy, error, ratings, open, send, rate};
}
