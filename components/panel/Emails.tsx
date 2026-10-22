'use client';

import { useEffect, useState } from 'react';
import { Save, RotateCcw, Braces, Clock } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { EMAIL_TEMPLATES, type EmailTemplate } from '@/lib/mock/ops';
import { fmtDate } from '@/lib/logic';
import { EmailPreview } from '@/components/EmailPreview';
import { Sk, Spinner } from '@/components/ui';

const VARS = ['{nombre}', '{referencia}', '{productos}', '{transportista}', '{seguimiento}', '{enlace_carrito}'];

export function Emails() {
  const { emails, orders, customers, saveEmail, resetEmail, toast } = useStore();
  const loading = useLoading();
  const [id, setId] = useState<EmailTemplate['id']>('confirmacion');
  const tpl = emails.find((e) => e.id === id)!;
  const [subject, setSubject] = useState(tpl.subject);
  const [body, setBody] = useState(tpl.body);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setSubject(tpl.subject); setBody(tpl.body); }, [id, tpl.subject, tpl.body]);
  const dirty = subject !== tpl.subject || body !== tpl.body;
  const changed = tpl.body !== EMAIL_TEMPLATES.find((e) => e.id === id)!.body || tpl.subject !== EMAIL_TEMPLATES.find((e) => e.id === id)!.subject;
  const sample = orders.find((o) => o.lines.some((l) => l.print) && (id === 'envio' ? !!o.tracking : true))!;
  const customer = customers.find((c) => c.id === sample.customerId);
  const missing = id !== 'opinion' && !body.includes('{productos}');

  return (
    <>
      <div className="main-head">
        <div><h1>Correos</h1><div className="small muted">El texto se cambia aquí. El diseño de la plantilla no se toca.</div></div>
        <div className="row">
          {changed && <button className="btn btn-ghost btn-sm" onClick={() => { resetEmail(id); toast('Texto original restaurado', 'info'); }}><RotateCcw size={14} /> Restaurar original</button>}
          <button className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={async () => { setSaving(true); await saveEmail(id, { subject, body }); setSaving(false); toast('Guardado. Los próximos correos salen con este texto'); }}>
            {saving ? <><Spinner /> Guardando</> : <><Save size={15} /> Guardar</>}
          </button>
        </div>
      </div>
      <div className="tabs">
        {emails.map((e) => <button key={e.id} className={id === e.id ? 'on' : ''} onClick={() => setId(e.id)}>{e.name}</button>)}
      </div>
      <div className="cols" style={{ alignItems: 'start' }}>
        <div className="card card-pad stack" style={{ gap: 14 }}>
          <div className="row small muted" style={{ gap: 6 }}><Clock size={14} /> {tpl.when} · última edición {fmtDate(tpl.updatedAt, true)}</div>
          {loading ? <><Sk h={44} /><Sk h={260} /></> : (
            <>
              <div className="field"><label htmlFor="em-s">Asunto</label><input id="em-s" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="field">
                <label htmlFor="em-b">Texto</label>
                <textarea id="em-b" className="textarea" style={{ minHeight: 280 }} value={body} onChange={(e) => setBody(e.target.value)} />
                {missing && <span className="err">Falta {'{productos}'}: sin él el correo no enseña la camiseta ni la personalización.</span>}
              </div>
              <div>
                <div className="label row" style={{ gap: 6, marginBottom: 6 }}><Braces size={14} /> Datos que se rellenan solos</div>
                <div className="row wrapflex" style={{ gap: 6 }}>
                  {VARS.map((v) => <button key={v} className="chip" style={{ minHeight: 30, fontSize: 12 }} onClick={() => setBody((b) => `${b}${b.endsWith('\n') ? '' : ' '}${v}`)}>{v}</button>)}
                </div>
              </div>
            </>
          )}
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Vista previa con el pedido {sample.ref}</div>
          {loading ? <Sk h={420} r={16} /> : <EmailPreview tpl={{ subject, body }} order={sample} customer={customer} />}
        </div>
      </div>
    </>
  );
}
