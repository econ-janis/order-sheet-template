import { useRef, useState } from 'react'
import { resolveWidgetData, fmtCurrency } from '../utils/helpers'

/* ── Drag-to-reorder list ── */
function DragList({ keys, onReorder, renderItem, className, style }) {
  const dragKey = useRef(null)
  const [overKey, setOverKey] = useState(null)

  function handleDrop(targetKey) {
    if (!dragKey.current || dragKey.current === targetKey) return
    const from = keys.indexOf(dragKey.current)
    const to   = keys.indexOf(targetKey)
    const next = [...keys]
    next.splice(from, 1)
    next.splice(to, 0, dragKey.current)
    onReorder(next)
    setOverKey(null)
  }

  return (
    <div className={className} style={style}>
      {keys.map(k => (
        <div
          key={k}
          className={`dlist-item${overKey === k ? ' dlist-over' : ''}`}
          draggable
          onDragStart={e => { dragKey.current = k; e.stopPropagation() }}
          onDragEnd={() => { dragKey.current = null; setOverKey(null) }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOverKey(k) }}
          onDragLeave={() => setOverKey(null)}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(k) }}
        >
          <span className="drag-handle" title="Mover">
            <i className="ti ti-grip-vertical" />
          </span>
          <div className="dlist-content">{renderItem(k)}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Header ── */
function Header({ w, v, isSelected, onReorder }) {
  const d = w.data
  const metaOrder = d.metaOrder || ['date', 'control', 'orderNum']
  const logoSide  = d.logoSide || 'left'

  const metaItems = {
    date:     d.showDate    && <span key="date">Fecha de emisión: <b>{v.date}</b></span>,
    control:  d.showControl && <span key="control">Control de entrega N°: <b>{v.orderNum}</b></span>,
    orderNum: d.showOrderNum && <span key="orderNum">Número de factura</span>,
  }

  const logoBox = (
    <div className="w-logo-box">
      {v.logoUrl
        ? <img src={v.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
        : v.storeName || 'Logo'}
    </div>
  )

  const metaSection = isSelected
    ? (
      <DragList
        keys={metaOrder}
        onReorder={next => onReorder(w.id, 'metaOrder', next)}
        className="w-header-meta"
        style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        renderItem={k => metaItems[k] || null}
      />
    )
    : (
      <div className="w-header-meta">
        {metaOrder.map(k => metaItems[k] || null)}
      </div>
    )

  return (
    <div className="w-header" style={{ flexDirection: logoSide === 'right' ? 'row-reverse' : 'row' }}>
      {isSelected
        ? (
          <div
            className="w-logo-box"
            style={{ cursor: 'pointer', position: 'relative' }}
            title="Click para cambiar posición del logo"
            onClick={e => { e.stopPropagation(); onReorder(w.id, 'logoSide', logoSide === 'left' ? 'right' : 'left') }}
          >
            {v.logoUrl
              ? <img src={v.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
              : v.storeName || 'Logo'}
            <span className="logo-flip-hint">{logoSide === 'left' ? '→' : '←'}</span>
          </div>
        )
        : logoBox}
      {metaSection}
    </div>
  )
}

/* ── Client ── */
const CLIENT_FIELDS = {
  name:    (d, v) => d.showName    && <div className="wcf"><label>Nombre y apellido</label><span>{v.name}</span></div>,
  ci:      (d, v) => d.showCI      && <div className="wcf"><label>C.I.</label><span>{v.ci}</span></div>,
  phone:   (d, v) => d.showPhone   && <div className="wcf"><label>Teléfono</label><span>{v.phone}</span></div>,
  address: (d, v) => d.showAddress && <div className="wcf" style={{ gridColumn: '1/-1' }}><label>Dirección</label><span>{v.address}</span></div>,
  payment: (d, v) => d.showPayment && <div className="wcf" style={{ gridColumn: '1/-1' }}><label>Forma de pago</label><span>{v.payment}</span></div>,
}

function Client({ w, v, isSelected, onReorder }) {
  const d = w.data
  const order = d.fieldOrder || ['name', 'ci', 'phone', 'address', 'payment']

  if (isSelected) {
    return (
      <DragList
        keys={order}
        onReorder={next => onReorder(w.id, 'fieldOrder', next)}
        className="w-client w-client-reorder"
        renderItem={k => CLIENT_FIELDS[k]?.(d, v) || <span style={{ color: '#ccc', fontSize: 9 }}>{k} (oculto)</span>}
      />
    )
  }

  return (
    <div className="w-client">
      {order.map(k => {
        const el = CLIENT_FIELDS[k]?.(d, v)
        return el ? <div key={k}>{el}</div> : null
      })}
    </div>
  )
}

/* ── Dispatch ── */
const DISPATCH_FIELDS = {
  logistic: (d, v) => d.showLogistic && <div className="wdi"><label>Logística</label><span>{v.logistic}</span></div>,
  type:     (d, v) => d.showType     && <div className="wdi"><label>Tipo</label><span>{v.type}</span></div>,
  date:     (d, v) => d.showDate     && <div className="wdi"><label>Fecha entrega</label><span>{v.date}</span></div>,
  address:  (d, v) => d.showAddress  && <div className="wdi"><label>Dirección</label><span>{v.address}</span></div>,
}

function Dispatch({ w, v, isSelected, onReorder }) {
  const d = w.data
  const order = d.fieldOrder || ['logistic', 'type', 'date', 'address']
  const style = { background: d.bgColor, borderTop: `2px solid ${d.accentColor}`, borderBottom: `2px solid ${d.accentColor}` }

  if (isSelected) {
    return (
      <DragList
        keys={order}
        onReorder={next => onReorder(w.id, 'fieldOrder', next)}
        className="w-dispatch w-dispatch-reorder"
        style={style}
        renderItem={k => DISPATCH_FIELDS[k]?.(d, v) || <span style={{ color: '#ccc', fontSize: 9 }}>{k} (oculto)</span>}
      />
    )
  }

  return (
    <div className="w-dispatch" style={style}>
      {order.map(k => {
        const el = DISPATCH_FIELDS[k]?.(d, v)
        return el ? <div key={k}>{el}</div> : null
      })}
    </div>
  )
}

/* ── Products (rigid) ── */
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

/* ── Footer ── */
const FOOTER_FIELDS = {
  name:  (d, v, colors) => <div key="name" style={{ fontWeight: 600, color: colors.name, fontSize: 10 }}>{v.name}</div>,
  phone: (d, v, colors) => v.phone && <div key="phone" style={{ color: colors.text, fontSize: 9 }}>Tel: {v.phone}</div>,
  web:   (d, v, colors) => v.web   && <div key="web"   style={{ color: colors.text, fontSize: 9 }}>{v.web}</div>,
  msg:   (d, v, colors) => v.msg   && <div key="msg"   style={{ color: colors.msg,  fontSize: 9 }}>{v.msg}</div>,
}

function Footer({ w, v, isSelected, onReorder }) {
  const d = w.data
  const order = d.fieldOrder || ['name', 'phone', 'web', 'msg']
  const bg = d.dark ? '#1a1a1a' : '#f8f8f8'
  const colors = {
    name: d.dark ? '#fff' : '#111',
    text: d.dark ? '#aaa' : '#555',
    msg:  d.dark ? '#666' : '#aaa',
  }

  if (isSelected) {
    return (
      <DragList
        keys={order}
        onReorder={next => onReorder(w.id, 'fieldOrder', next)}
        className="w-footer w-footer-reorder"
        style={{ background: bg }}
        renderItem={k => FOOTER_FIELDS[k]?.(d, v, colors) || <span style={{ color: '#ccc', fontSize: 9 }}>{k} (oculto)</span>}
      />
    )
  }

  return (
    <div className="w-footer" style={{ background: bg }}>
      <div className="wft" style={{ color: colors.text }}>
        {order.map(k => FOOTER_FIELDS[k]?.(d, v, colors))}
      </div>
    </div>
  )
}

/* ── Main export ── */
export default function WidgetRenderer({ widget, sampleData, isSelected, onReorder }) {
  const d = widget.data
  const v = resolveWidgetData(widget, sampleData)

  if (widget.type === 'header')   return <Header   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} />
  if (widget.type === 'client')   return <Client   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} />
  if (widget.type === 'dispatch') return <Dispatch w={widget} v={v} isSelected={isSelected} onReorder={onReorder} />
  if (widget.type === 'products') return <Products d={d} v={v} />
  if (widget.type === 'footer')   return <Footer   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} />
  if (widget.type === 'divider')  return <div className="w-divider"><hr style={{ borderTop: `1px ${d.style} ${d.color}` }} /></div>
  if (widget.type === 'text')     return <div className="w-text" style={{ fontSize: d.fontSize }}>{d.content}</div>
  return null
}
