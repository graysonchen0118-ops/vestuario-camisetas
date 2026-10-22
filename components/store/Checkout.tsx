'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, CreditCard, Smartphone, Wallet, Lock, Truck, Mail, MapPin, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { SHIPPING } from '@/lib/mock/sales';
import { eur, lineKey, deliveryWindow } from '@/lib/logic';
import { CartLine, Summary } from './CartDrawer';
import { Empty, Spinner } from '@/components/ui';

const COUNTRIES = ['España', 'Portugal', 'Francia', 'Alemania', 'Italia', 'Irlanda', 'Reino Unido'];
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

export function Checkout() {
  const router = useRouter();
  const { cart, checkout, updateCheckout, totals, placeOrder, hydrated, toast } = useStore();
  const [step, setStep] = useState(1);
  const [pay, setPay] = useState<'Tarjeta' | 'Bizum' | 'PayPal'>('Tarjeta');
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  useEffect(() => {
    const allowed: (keyof typeof SHIPPING)[] = checkout.country === 'España' ? ['Correos', 'SEUR'] : ['GLS'];
    if (!allowed.includes(checkout.carrier)) updateCheckout({ carrier: allowed[0] });
  }, [checkout.country, checkout.carrier, updateCheckout]);

  if (!hydrated) return <div className="wrap section"><div className="sk" style={{ height: 360 }} /></div>;
  if (!cart.length) {
    return (
      <div className="wrap section">
        <Empty icon={<ShoppingBag size={24} />} title="No hay nada que tramitar" text="Añade una camiseta al carrito y vuelve aquí." action={<Link href="/categoria/temporada-26-27" className="btn btn-dark btn-sm">Ver camisetas</Link>} />
      </div>
    );
  }

  const domestic = checkout.country === 'España';
  const carriers = (domestic ? ['Correos', 'SEUR'] : ['GLS']) as (keyof typeof SHIPPING)[];

  const next1 = () => {
    const e: Record<string, string> = {};
    if (!EMAIL.test(checkout.email)) e.email = 'Escribe un correo válido, ahí llegan la confirmación y el seguimiento.';
    if (checkout.name.trim().length < 3) e.name = 'Escribe tu nombre y apellidos.';
    setErrs(e);
    if (!Object.keys(e).length) setStep(2);
  };
  const next2 = () => {
    const e: Record<string, string> = {};
    if (checkout.address.trim().length < 5) e.address = 'Falta la dirección.';
    if (checkout.city.trim().length < 2) e.city = 'Falta la ciudad.';
    if (!/^\d{4,5}$/.test(checkout.zip.trim())) e.zip = 'El código postal tiene 4 o 5 cifras.';
    setErrs(e);
    if (!Object.keys(e).length) setStep(3);
  };
  const submit = async () => {
    setError('');
    if (pay === 'Tarjeta' && (card.number.replace(/\s/g, '').length < 15 || !/^\d{2}\/\d{2}$/.test(card.exp) || card.cvc.length < 3)) {
      setErrs({ card: 'Revisa el número, la caducidad (MM/AA) y el código de seguridad.' });
      return;
    }
    if (pay === 'Bizum' && !/^\d{9}$/.test(phone)) {
      setErrs({ phone: 'El móvil de Bizum tiene 9 cifras.' });
      return;
    }
    setErrs({});
    setBusy(true);
    try {
      const ref = await placeOrder(pay, card.number);
      router.push(`/pedido/confirmado?ref=${ref}`);
    } catch (e) {
      setError((e as Error).message);
      toast('Pago rechazado, no se ha cobrado nada', 'bad');
      setBusy(false);
    }
  };

  const win = deliveryWindow(cart, checkout.carrier);
  const Pill = ({ n, label, icon }: { n: number; label: string; icon: React.ReactNode }) => (
    <button className={`step-pill ${step === n ? 'on' : step > n ? 'done' : ''}`} onClick={() => step > n && setStep(n)} style={{ cursor: step > n ? 'pointer' : 'default' }}>
      {step > n ? <Check size={15} /> : icon} {label}
    </button>
  );

  return (
    <div className="wrap">
      <div className="checkout">
        <div>
          <h1 className="h-lg" style={{ marginBottom: 16 }}>Tramitar pedido</h1>
          <div className="steps">
            <Pill n={1} label="Tus datos" icon={<Mail size={15} />} />
            <Pill n={2} label="Envío" icon={<MapPin size={15} />} />
            <Pill n={3} label="Pago" icon={<CreditCard size={15} />} />
          </div>

          {step === 1 && (
            <div className="card card-pad stack enter" style={{ gap: 14 }}>
              <div className="field">
                <label htmlFor="c-email">Correo electrónico</label>
                <input id="c-email" className={`input ${errs.email ? 'invalid' : ''}`} type="email" autoComplete="email" value={checkout.email} onChange={(e) => updateCheckout({ email: e.target.value })} placeholder="tu@correo.com" />
                {errs.email ? <span className="err">{errs.email}</span> : <span className="hint">Si sales sin terminar, te guardamos el carrito tal cual y te lo recordamos por correo, sin descuentos ni insistencia.</span>}
              </div>
              <div className="field">
                <label htmlFor="c-name">Nombre y apellidos</label>
                <input id="c-name" className={`input ${errs.name ? 'invalid' : ''}`} autoComplete="name" value={checkout.name} onChange={(e) => updateCheckout({ name: e.target.value })} />
                {errs.name && <span className="err">{errs.name}</span>}
              </div>
              <button className="btn btn-primary" onClick={next1}>Continuar con el envío</button>
            </div>
          )}

          {step === 2 && (
            <div className="card card-pad stack enter" style={{ gap: 14 }}>
              <div className="form-grid">
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="c-addr">Dirección</label>
                  <input id="c-addr" className={`input ${errs.address ? 'invalid' : ''}`} autoComplete="street-address" value={checkout.address} onChange={(e) => updateCheckout({ address: e.target.value })} placeholder="Calle, número, piso" />
                  {errs.address && <span className="err">{errs.address}</span>}
                </div>
                <div className="field">
                  <label htmlFor="c-city">Ciudad</label>
                  <input id="c-city" className={`input ${errs.city ? 'invalid' : ''}`} value={checkout.city} onChange={(e) => updateCheckout({ city: e.target.value })} />
                  {errs.city && <span className="err">{errs.city}</span>}
                </div>
                <div className="field">
                  <label htmlFor="c-zip">Código postal</label>
                  <input id="c-zip" className={`input ${errs.zip ? 'invalid' : ''}`} inputMode="numeric" value={checkout.zip} onChange={(e) => updateCheckout({ zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
                  {errs.zip && <span className="err">{errs.zip}</span>}
                </div>
                <div className="field">
                  <label htmlFor="c-country">País</label>
                  <select id="c-country" className="select" value={checkout.country} onChange={(e) => updateCheckout({ country: e.target.value })}>
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="label">Forma de envío</div>
              <div className="stack" style={{ gap: 10 }}>
                {carriers.map((c) => {
                  const free = c === 'Correos' && totals.subtotal >= 100;
                  return (
                    <button key={c} className={`radio-card ${checkout.carrier === c ? 'on' : ''}`} onClick={() => updateCheckout({ carrier: c })}>
                      <Truck size={20} color="var(--accent)" />
                      <span style={{ flex: 1 }}><b>{c}</b><br /><span className="small muted">{SHIPPING[c].label}</span></span>
                      <b>{free ? 'Gratis' : eur(SHIPPING[c].price)}</b>
                    </button>
                  );
                })}
              </div>
              <div className="notice info"><Truck size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Entrega estimada entre el <b>{win.start}</b> y el <b>{win.end}</b>{win.printed ? ', contando los dos días laborables del taller' : ''}.</span></div>
              <button className="btn btn-primary" onClick={next2}>Continuar con el pago</button>
            </div>
          )}

          {step === 3 && (
            <div className="card card-pad stack enter" style={{ gap: 14 }}>
              <div className="stack" style={{ gap: 10 }}>
                {([['Tarjeta', CreditCard, 'Visa, Mastercard'], ['Bizum', Smartphone, 'Con tu móvil'], ['PayPal', Wallet, 'Con tu cuenta']] as const).map(([k, Icon, d]) => (
                  <button key={k} className={`radio-card ${pay === k ? 'on' : ''}`} onClick={() => setPay(k)}>
                    <Icon size={20} color="var(--accent)" /><span style={{ flex: 1 }}><b>{k}</b><br /><span className="small muted">{d}</span></span>
                  </button>
                ))}
              </div>
              {pay === 'Tarjeta' && (
                <div className="form-grid enter">
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="cc">Número de tarjeta</label>
                    <input id="cc" className={`input num ${errs.card ? 'invalid' : ''}`} inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} />
                    <span className="hint">Para ver un pago rechazado, usa una tarjeta que termine en 0002.</span>
                  </div>
                  <div className="field"><label htmlFor="exp">Caducidad</label><input id="exp" className="input num" placeholder="MM/AA" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value.replace(/[^\d]/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2') })} /></div>
                  <div className="field"><label htmlFor="cvc">CVC</label><input id="cvc" className="input num" inputMode="numeric" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></div>
                  {errs.card && <span className="err" style={{ gridColumn: '1 / -1' }}>{errs.card}</span>}
                </div>
              )}
              {pay === 'Bizum' && (
                <div className="field enter">
                  <label htmlFor="bz">Móvil</label>
                  <input id="bz" className={`input ${errs.phone ? 'invalid' : ''}`} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="600 000 000" />
                  {errs.phone && <span className="err">{errs.phone}</span>}
                </div>
              )}
              {pay === 'PayPal' && <div className="notice info enter"><Wallet size={16} /><span>Al pagar te llevamos a PayPal con el importe exacto y vuelves aquí al terminar.</span></div>}
              {error && <div className="notice bad"><AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span></div>}
              <button className="btn btn-primary" style={{ minHeight: 52 }} onClick={submit} disabled={busy}>
                {busy ? <><Spinner /> Procesando el pago</> : <><Lock size={16} /> Pagar {eur(totals.total)}</>}
              </button>
              <p className="tiny muted" style={{ textAlign: 'center' }}>Se cobra exactamente el total del resumen, {totals.fee > 0 ? `${totals.feeLabel.toLowerCase()} incluida` : 'envío incluido'}.</p>
            </div>
          )}
        </div>

        <aside className="card card-pad" style={{ position: 'sticky', top: 90 }}>
          <div className="strong" style={{ marginBottom: 4 }}>Resumen</div>
          {cart.map((l) => <CartLine key={lineKey(l)} line={l} editable={step < 3} />)}
          <div style={{ marginTop: 12 }}><Summary t={totals} /></div>
        </aside>
      </div>
    </div>
  );
}
