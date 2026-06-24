import { resolveWidgetData, fmtCurrency } from '../utils/helpers'

function Header({ d, v }) {
  return (
    <div className="w-header">
      <div className="w-logo-box">
        {v.logoUrl
          ? <img src={v.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
          : v.storeName || 'Logo'}
      </div>
      <div className="w-header-meta">
        {d.showDate && <span>Fecha de emisión: <b>{v.date}</b></span>}
        {d.showControl && <span>Control de entrega N°: <b>{v.orderNum}</b></span>}
        {d.showOrderNum && <span>Número de factura</span>}
      </div>
    </div>
  )
}

function Client({ d, v }) {
  return (
    <div className="w-client">
      {d.showName && <div className="wcf"><label>Nombre y apellido</label><span>{v.name}</span></div>}
      {d.showCI && <div className="wcf"><label>C.I.</label><span>{v.ci}</span></div>}
      {d.showPhone && <div className="wcf"><label>Teléfono</label><span>{v.phone}</span></div>}
      {d.showAddress && <div className="wcf" style={{ gridColumn: '1/-1' }}><label>Dirección</label><span>{v.address}</span></div>}
      {d.showPayment && <div className="wcf" style={{ gridColumn: '1/-1' }}><label>Forma de pago</label><span>{v.payment}</span></div>}
    </div>
  )
}

function Dispatch({ d, v }) {
  return (
    <div className="w-dispatch" style={{ background: d.bgColor, borderTop: `2px solid ${d.accentColor}`, borderBottom: `2px solid ${d.accentColor}` }}>
      {d.showLogistic && <div className="wdi"><label>Logística</label><span>{v.logistic}</span></div>}
      {d.showType && <div className="wdi"><label>Tipo</label><span>{v.type}</span></div>}
      {d.showDate && <div className="wdi"><label>Fecha entrega</label><span>{v.date}</span></div>}
      {d.showAddress && <div className="wdi"><label>Dirección</label><span>{v.address}</span></div>}
    </div>
  )
}

function Products({ d, v }) {
  const colSpan = 1 + (d.showSubst ? 1 : 0) + (d.showPrice ? 1 : 0) + (d.showOrigQty ? 1 : 0)
  return (
    <div className="w-products">
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            {d.showSubst && <th>Sust.</th>}
            {d.showPrice && <th>P. unit.</th>}
            {d.showOrigQty && <th>C. orig</th>}
            {d.showFinalQty && <th>C. final</th>}
          </tr>
        </thead>
        <tbody>
          {v.items.map((it, i) => (
            <tr key={i}>
              <td>{it.name || ''}</td>
              {d.showSubst && <td>{it.isSubstituted ? 'Sí' : '-'}</td>}
              {d.showPrice && <td>{fmtCurrency(it.purchasedPrice, v.loc, v.cur)}</td>}
              {d.showOrigQty && <td>{it.purchasedQuantity ?? ''}</td>}
              {d.showFinalQty && <td>{it.quantity ?? ''}</td>}
            </tr>
          ))}
          <tr className="tot">
            <td colSpan={colSpan}>Total enviados</td>
            {d.showFinalQty && <td>{v.total}</td>}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Footer({ d, v }) {
  const bg = d.dark ? '#1a1a1a' : '#f8f8f8'
  const textColor = d.dark ? '#aaa' : '#555'
  const nameColor = d.dark ? '#fff' : '#111'
  const msgColor = d.dark ? '#666' : '#aaa'
  return (
    <div className="w-footer" style={{ background: bg }}>
      <div className="wft" style={{ color: textColor }}>
        <b style={{ color: nameColor, display: 'block' }}>{v.name}</b>
        {v.phone ? `Tel: ${v.phone}` : ''}{v.web ? ` · ${v.web}` : ''}
      </div>
      <div style={{ fontSize: 9, color: msgColor }}>{v.msg}</div>
    </div>
  )
}

export default function WidgetRenderer({ widget, sampleData }) {
  const d = widget.data
  const v = resolveWidgetData(widget, sampleData)

  if (widget.type === 'header') return <Header d={d} v={v} />
  if (widget.type === 'client') return <Client d={d} v={v} />
  if (widget.type === 'dispatch') return <Dispatch d={d} v={v} />
  if (widget.type === 'products') return <Products d={d} v={v} />
  if (widget.type === 'footer') return <Footer d={d} v={v} />
  if (widget.type === 'divider') return <div className="w-divider"><hr style={{ borderTop: `1px ${d.style} ${d.color}` }} /></div>
  if (widget.type === 'text') return <div className="w-text" style={{ fontSize: d.fontSize }}>{d.content}</div>
  return null
}
