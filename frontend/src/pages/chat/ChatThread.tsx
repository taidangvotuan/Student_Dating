import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CheckCheck, Heart, Send, ShieldCheck } from 'lucide-react';
import { useDemo } from '../../app/DemoProvider';
import { candidateById } from '../../mocks/data';
import { dateLabel, sendMessage, timeLabel } from '../../services/chat';
import type { Conversation } from '../../services/models';
import { Button } from '../../components/ui';

export default function ChatThread({ conversation }: { conversation: Conversation }) {
  const { state, update } = useDemo();
  const person = candidateById(conversation.participantId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' }); }, [conversation.messages.length]);
  function submit(event: FormEvent) {
    event.preventDefault();
    try { const next = sendMessage(state, conversation.id, draft); update(() => next); setDraft(''); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa gửi được tin nhắn.'); }
  }
  if (!person) return null;
  return <section className="chat-thread" aria-label={`Hội thoại với ${person.fullName}`}><header className="thread-header"><Link className="chat-back" to="/chat" aria-label="Quay lại danh sách trò chuyện"><ArrowLeft size={21} /></Link><img src={person.avatar} alt="" /><div><h2>{person.fullName} {person.verified && <BadgeCheck size={16} />}</h2><p>{person.faculty} · Sinh viên</p></div><span className="thread-demo">Hội thoại demo</span></header>
    <div className="messages" role="log" aria-label="Tin nhắn" aria-live="polite"><div className="conversation-intro"><span><Heart size={20} /></span><strong>Một lời chào, một khởi đầu.</strong><p>Bạn và {person.fullName.split(' ').at(-1)} đã thích nhau. Cùng làm quen nhé!</p></div>
      {conversation.messages.map((message, index) => { const mine = message.senderId === state.profile.id; const previous = conversation.messages[index - 1]; return <div key={message.id}>
        {(!previous || dateLabel(previous.sentAt) !== dateLabel(message.sentAt)) && <div className="message-day">{dateLabel(message.sentAt)}</div>}
        <div className={`message-row ${mine ? 'mine' : ''}`}>{!mine && <img className="message-avatar" src={person.avatar} alt="" />}<div className="message-content"><div className="message-bubble">{message.body}</div><time dateTime={message.sentAt}>{timeLabel(message.sentAt)}{mine && <><CheckCheck size={12} /> Đã gửi · Demo</>}</time></div></div>
      </div>; })}<div ref={end} /></div>
    <div className="chat-safety"><ShieldCheck size={13} /> Tôn trọng và tử tế, ngay từ lời chào đầu tiên.</div>
    <form className="message-composer" onSubmit={submit}><label className="sr-only" htmlFor="message-input">Tin nhắn của bạn</label><textarea id="message-input" value={draft} onChange={e => setDraft(e.target.value)} rows={1} maxLength={2000} disabled={!conversation.active} placeholder={conversation.active ? 'Viết một lời chào…' : 'Hội thoại đã ngừng hoạt động'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (draft.trim()) event.currentTarget.form?.requestSubmit(); } }} /><Button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim() || !conversation.active}><Send size={19} /></Button></form>{error && <p role="alert" className="error composer-error">{error}</p>}
  </section>;
}
