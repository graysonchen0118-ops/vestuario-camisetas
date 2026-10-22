'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, RotateCcw, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { productImage } from '@/lib/mock/catalog';
import { productsForReply, SUGGESTIONS } from '@/lib/assistant';
import { eur } from '@/lib/logic';

export function Assistant() {
  const { chat, ask, chatOpen, setChatOpen, resetChat } = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length, busy]);

  const send = async (t: string) => {
    if (!t.trim() || busy) return;
    setText('');
    setBusy(true);
    await ask(t.trim());
    setBusy(false);
  };

  return (
    <>
      {chatOpen && (
        <section className="chat" aria-label="Asistente">
          <div className="chat-head">
            <span className="logo-mark" style={{ width: 34, height: 34 }}><Sparkles size={17} /></span>
            <div style={{ flex: 1 }}>
              <div className="strong" style={{ fontSize: 14.5 }}>Asistente de Vestuario</div>
              <div className="tiny" style={{ color: '#9aa6c7' }}>Tallas, personalización, envíos y pedidos</div>
            </div>
            <button className="icon-btn" style={{ color: '#fff' }} onClick={resetChat} aria-label="Empezar de nuevo" title="Empezar de nuevo"><RotateCcw size={17} /></button>
            <button className="icon-btn" style={{ color: '#fff' }} onClick={() => setChatOpen(false)} aria-label="Cerrar asistente"><X size={19} /></button>
          </div>
          <div className="chat-body" ref={body}>
            <div className="msg bot">Hola. Te ayudo con tallas, personalización, envíos o el estado de tu pedido. Escribe en el idioma que prefieras.</div>
            {chat.messages.map((m, i) => (
              <div key={i} className={`msg ${m.from === 'cliente' ? 'me' : m.from === 'persona' ? 'person' : 'bot'}`}>
                {m.text}
                {productsForReply(m.products).map((p) => (
                  <Link key={p.id} href={`/producto/${p.slug}`} className="mini-prod" onClick={() => setChatOpen(false)}>
                    <img src={productImage(p)} alt="" width={46} height={46} />
                    <span className="small" style={{ flex: 1, lineHeight: 1.3 }}>{p.name}</span>
                    <b className="small">{eur(p.price)}</b>
                  </Link>
                ))}
              </div>
            ))}
            {busy && <div className="msg bot typing" aria-label="Escribiendo"><i /><i /><i /></div>}
          </div>
          {chat.messages.length === 0 && (
            <div className="chat-sugg">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
            </div>
          )}
          <form className="chat-foot" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input className="input" style={{ borderRadius: 999 }} placeholder="Escribe tu pregunta" value={text} onChange={(e) => setText(e.target.value)} aria-label="Mensaje para el asistente" />
            <button className="btn btn-primary" style={{ width: 46, padding: 0 }} aria-label="Enviar" disabled={busy || !text.trim()}><Send size={17} /></button>
          </form>
        </section>
      )}
      <button className="fab" onClick={() => setChatOpen(!chatOpen)} aria-label={chatOpen ? 'Cerrar asistente' : 'Abrir asistente'}>
        {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
        <span>{chatOpen ? 'Cerrar' : 'Ayuda'}</span>
      </button>
    </>
  );
}
