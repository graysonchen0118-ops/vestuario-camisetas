import type { Metadata } from 'next';
import { SHIPPING, FREE_SHIPPING_FROM } from '@/lib/mock/sales';
import { eur } from '@/lib/logic';
import { FeeLine } from '@/components/store/FeeLine';

export const metadata: Metadata = { title: 'Envíos y devoluciones' };

export default function Envios() {
  return (
    <div className="wrap section" style={{ paddingTop: 36, maxWidth: 900 }}>
      <div className="eyebrow">Ayuda</div>
      <h1 className="h-lg" style={{ margin: '6px 0 18px' }}>Envíos y devoluciones</h1>
      <div className="card card-pad table-wrap">
        <table className="table">
          <thead><tr><th>Transportista</th><th>Plazo</th><th>Precio</th></tr></thead>
          <tbody>
            {(Object.keys(SHIPPING) as (keyof typeof SHIPPING)[]).map((k) => (
              <tr key={k}>
                <td className="strong">{k}</td>
                <td>{SHIPPING[k].label.split(', ')[1]}</td>
                <td>{k === 'Correos' ? `${eur(SHIPPING[k].price)}, gratis desde ${eur(FREE_SHIPPING_FROM)}` : eur(SHIPPING[k].price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="stack" style={{ gap: 16, marginTop: 24 }}>
        <div className="card card-pad">
          <h2 className="h-md">Las personalizadas, dos días más</h2>
          <p className="muted" style={{ marginTop: 8 }}>Una camiseta con nombre y dorsal pasa por el taller de estampación antes de salir. Cuenta dos días laborables más sobre el plazo del transportista.</p>
        </div>
        <div className="card card-pad">
          <h2 className="h-md">El recargo fijo, a la vista</h2>
          <FeeLine />
        </div>
        <div className="card card-pad">
          <h2 className="h-md">Devoluciones</h2>
          <p className="muted" style={{ marginTop: 8 }}>Tienes 14 días naturales desde la entrega para devolver lo que no esté personalizado. Las prendas hechas con tu nombre y tu dorsal quedan fuera del derecho de desistimiento, por eso te enseñamos la camiseta en 3D antes de pagar. Si llega con un fallo de estampado, la reponemos siempre.</p>
        </div>
      </div>
    </div>
  );
}
