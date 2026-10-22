'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageCircleQuestion, MessagesSquare, UserRound, Settings2, Check, Trash2, KeyRound, Languages, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { fmtDate, ago } from '@/lib/logic';
import { productById } from '@/lib/mock/catalog';
import { SkRows, Empty, Spinner, Switch } from '@/components/ui';

const OUTCOME = { resuelta: { t: 'Resuelta', tone: 'ok' }, derivada: { t: 'Pasada a una persona', tone: 'info' }, sin_respuesta: { t: 'Sin respuesta', tone: 'warn' } } as const;

export function AssistantAdmin() {
  const router = useRouter();
  const { unanswered, conversations, escalations, settings, answerQuestion, deleteQuestion, resolveEscalation, saveAssistantSettings, setChatOpen, toast } = useStore();
  const loading = useLoading();
  const [tab, setTab] = useState<'preguntas' | 'conversaciones' | 'personas' | 'ajustes'>('preguntas');
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [conv, setConv] = useState<string | null>(conversations[0]?.id ?? null);
  const open = conversations.find((c) => c.id === conv);
  const pending = unanswered.filter((q) => !q.answer);
  const learned = unanswered.filter((q) => q.answer);
  const resolved = conversations.filter((c) => c.outcome === 'resuelta').length;

  return (
    <>
      <div className="main-head">
        <div><h1>Asistente</h1><div className="small muted">Lo que pregunta la gente, lo que no supo contestar y lo que pasó a una persona</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => { setChatOpen(true); router.push('/'); }}><Sparkles size={15} /> Probarlo en la tienda</button>
      </div>
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="card kpi"><span className="small muted">Conversaciones resueltas</span><b>{Math.round((resolved / Math.max(1, conversations.length)) * 100)} %</b><span className="tiny muted">{resolved} de {conversations.length} sin intervención</span></div>
        <div className="card kpi"><span className="small muted">Sin respuesta</span><b>{pending.length}</b><span className="tiny muted">{pending.reduce((a, q) => a + q.count, 0)} veces preguntadas</span></div>
        <div className="card kpi"><span className="small muted">Respuestas del cupo</span><b>{settings.assistant.quotaUsed}</b><span className="tiny muted">de {settings.assistant.quota} este mes</span><div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${(settings.assistant.quotaUsed / settings.assistant.quota) * 100}%` }} /></div></div>
      </div>
      <div className="tabs">
        <button className={tab === 'preguntas' ? 'on' : ''} onClick={() => setTab('preguntas')}><MessageCircleQuestion size={14} /> Sin respuesta ({pending.length})</button>
        <button className={tab === 'conversaciones' ? 'on' : ''} onClick={() => setTab('conversaciones')}><MessagesSquare size={14} /> Conversaciones</button>
        <button className={tab === 'personas' ? 'on' : ''} onClick={() => setTab('personas')}><UserRound size={14} /> Pasadas a una persona ({escalations.filter((e) => e.status === 'abierta').length})</button>
        <button className={tab === 'ajustes' ? 'on' : ''} onClick={() => setTab('ajustes')}><Settings2 size={14} /> Ajustes</button>
      </div>

      {loading ? <SkRows rows={6} h={70} /> : tab === 'preguntas' ? (
        <div className="cols" style={{ alignItems: 'start' }}>
          <div className="stack" style={{ gap: 10 }}>
            <p className="small muted">Cada pregunta que el asistente no supo contestar se guarda aquí, ordenada por cuántas veces se repite. Contéstala una vez y desde ese momento la responde sola.</p>
            {pending.length === 0 ? <Empty icon={<CheckCircle2 size={22} />} title="Todas contestadas" text="Cuando aparezca una pregunta nueva sin respuesta, la verás aquí." /> : pending.sort((a, b) => b.count - a.count).map((q) => (
              <div key={q.id} className="card card-pad enter" style={{ padding: 16 }}>
                <div className="row between" style={{ gap: 10 }}>
                  <b className="small">{q.question}</b>
                  <span className="badge warn">{q.count} {q.count === 1 ? 'vez' : 'veces'}</span>
                </div>
                <div className="tiny muted" style={{ marginTop: 4 }}>Última {ago(q.lastAt)} · idioma {q.lang}</div>
                <textarea className="textarea" style={{ minHeight: 70, marginTop: 10 }} placeholder="Escribe la respuesta que debe dar" value={drafts[q.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })} />
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn btn-dark btn-xs" disabled={!drafts[q.id]?.trim() || saving === q.id} onClick={async () => { setSaving(q.id); await answerQuestion(q.id, drafts[q.id].trim()); setSaving(null); toast('Aprendida. La próxima vez la contesta el asistente'); }}>
                    {saving === q.id ? <Spinner size={13} /> : <Check size={13} />} Guardar respuesta
                  </button>
                  <button className="btn btn-ghost btn-xs" onClick={() => { deleteQuestion(q.id); toast('Descartada', 'info'); }}><Trash2 size={13} /> Descartar</button>
                </div>
              </div>
            ))}
          </div>
          <div className="card card-pad">
            <b>Ya aprendidas</b>
            {learned.length === 0 ? <p className="small muted" style={{ marginTop: 8 }}>Aún ninguna. Contesta la de Canarias, que es la que más se repite, y pruébala en la tienda.</p> : learned.map((q) => (
              <div key={q.id} className="enter" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="small strong">{q.question}</div>
                <div className="small muted" style={{ marginTop: 3 }}>{q.answer}</div>
                <button className="btn btn-xs btn-ghost" style={{ marginTop: 6 }} onClick={() => answerQuestion(q.id, '')}>Olvidar respuesta</button>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'conversaciones' ? (
        <div className="cols" style={{ alignItems: 'start' }}>
          <div className="card" style={{ padding: 6 }}>
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setConv(c.id)} className="row" style={{ width: '100%', gap: 10, padding: 12, border: 0, borderRadius: 10, background: conv === c.id ? 'var(--surface-2)' : 'transparent', textAlign: 'left' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small strong" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages[0]?.text}</div>
                  <div className="tiny muted">{c.id} · {ago(c.startedAt)} · {c.lang}</div>
                </div>
                <span className={`badge ${OUTCOME[c.outcome].tone}`}>{OUTCOME[c.outcome].t}</span>
              </button>
            ))}
          </div>
          {open && (
            <div className="card card-pad" style={{ background: '#f7f8fb' }}>
              <div className="row between" style={{ marginBottom: 10 }}><b>{open.id}</b><span className="tiny muted">{fmtDate(open.startedAt, true)}</span></div>
              <div className="stack" style={{ gap: 8 }}>
                {open.messages.map((m, i) => (
                  <div key={i} className={`msg ${m.from === 'cliente' ? 'me' : m.from === 'persona' ? 'person' : 'bot'}`}>
                    {m.text}
                    {(m.products ?? []).map((id) => <div key={id} className="tiny" style={{ marginTop: 4 }}>{productById(id)?.name}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === 'personas' ? (
        <div className="card" style={{ padding: 6 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Pregunta</th><th>Correo</th><th>Cuándo</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {escalations.map((e) => (
                  <tr key={e.id} className="enter">
                    <td className="small strong">{e.question}</td>
                    <td className="small">{e.email}</td>
                    <td className="small muted">{ago(e.at)}</td>
                    <td><span className={`badge ${e.status === 'abierta' ? 'warn' : 'ok'}`}>{e.status === 'abierta' ? 'Abierta' : 'Respondida'}</span></td>
                    <td>{e.status === 'abierta' && <button className="btn btn-xs btn-soft" onClick={async () => { await resolveEscalation(e.id); toast('Marcada como respondida'); }}><Check size={13} /> Respondida</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="cols" style={{ alignItems: 'start' }}>
          <div className="card card-pad stack" style={{ gap: 14 }}>
            <div className="row between"><span className="small strong">Pasar a una persona cuando no sabe</span><Switch on={settings.assistant.handoff} onChange={(v) => saveAssistantSettings({ handoff: v })} label="Pasar a una persona" /></div>
            <div>
              <div className="label row" style={{ gap: 6, marginBottom: 6 }}><Languages size={14} /> Idiomas en los que contesta</div>
              <div className="row wrapflex" style={{ gap: 6 }}>
                {['Español', 'English', 'Français', 'Português', 'Italiano', 'Deutsch'].map((l) => {
                  const on = settings.assistant.languages.includes(l);
                  return <button key={l} className={`chip ${on ? 'on' : ''}`} onClick={() => saveAssistantSettings({ languages: on ? settings.assistant.languages.filter((x) => x !== l) : [...settings.assistant.languages, l] })}>{l}</button>;
                })}
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>Contesta en el idioma en que le escriben.</p>
            </div>
          </div>
          <div className="card card-pad">
            <b className="row" style={{ gap: 8 }}><KeyRound size={16} /> Qué puede leer de la tienda</b>
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="table">
                <tbody>
                  {[['Productos, tallas y stock', 'Lectura'], ['Guía de tallas, envíos y plazos', 'Lectura'], ['Estado y seguimiento de pedidos', 'Lectura, con referencia y correo'], ['Direcciones y datos de pago', 'Sin acceso'], ['Crear, cambiar o cancelar pedidos', 'Sin acceso']].map(([a, b]) => (
                    <tr key={a}><td className="small">{a}</td><td><span className={`badge ${b === 'Sin acceso' ? 'muted' : 'ok'}`}>{b}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>Se conecta con una clave de solo lectura. Un pedido solo se enseña si la referencia y el correo coinciden.</p>
          </div>
        </div>
      )}
    </>
  );
}
