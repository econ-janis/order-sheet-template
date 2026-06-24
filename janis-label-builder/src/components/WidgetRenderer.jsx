import { useRef, useState } from 'react'
import { resolveWidgetData, fmtCurrency } from '../utils/helpers'

/* ── Two-column drag & drop layout ── */
function TwoColumnDrop({ columns, onColumnsChange, renderField, wrapClass, wrapStyle }) {
  const dragging = useRef(null)
  const [overSlot, setOverSlot] = useState(null) // { col, key|null }

  function isOver(col, key) {
    return overSlot?.col === col && overSlot?.key === (key ?? null)
  }

  function drop(targetCol, targetKey) {
    if (!dragging.current) return
    const { key, fromCol } = dragging.current
    if (key === targetKey) { dragging.current = null; setOverSlot(null); return }

    const next = { left: [...columns.left], right: [...columns.right] }
    next[fromCol] = next[fromCol].filter(k => k !== key)

    if (targetKey) {
      const idx = next[targetCol].indexOf(targetKey)
      next[targetCol].splice(idx, 0, key)
    } else {
      next[targetCol].push(key)
    }

    onColumnsChange(next)
    dragging.current = null
    setOverSlot(null)
  }

  function colProps(colName) {
    return {
      className: `col-zone${isOver(colName, null) ? ' col-zone-over' : ''}`,
      onDragOver: e => { e.preventDefault(); e.stopPropagation(); setOverSlot({ col: colName, key: null }) },
      onDragLeave: () => setOverSlot(null),
      onDrop: e => { e.preventDefault(); e.stopPropagation(); drop(colName, null) },
    }
  }

  function itemProps(colName, key) {
    return {
      className: `dlist-item${isOver(colName, key) ? ' dlist-over' : ''}`,
      draggable: true,
      onDragStart: e => { dragging.current = { key, fromCol: colName }; e.stopPropagation() },
      onDragEnd: () => { dragging.current = null; setOverSlot(null) },
      onDragOver: e => { e.preventDefault(); e.stopPropagation(); setOverSlot({ col: colName, key }) },
      onDragLeave: () => setOverSlot(null),
      onDrop: e => { e.preventDefault(); e.stopPropagation(); drop(colName, key) },
    }
  }

  return (
    <div className={`two-col-drop ${wrapClass || ''}`} style={wrapStyle}>
      {['left', 'right'].map(col => (
        <div key={col} {...colProps(col)}>
          <div className="col-label">{col === 'left' ? 'Col. izquierda' : 'Col. derecha'}</div>
          {(columns[col] || []).map(k => (
            <div key={k} {...itemProps(col, k)}>
              <span className="drag-handle"><i className="ti ti-grip-vertical" /></span>
              <div className="dlist-content">{renderField(k)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Single-column drag list (header meta) ── */
function DragList({ keys, onReorder, renderItem, className, style }) {
  const dragKey = useRef(null)
  const [overKey, setOverKey] = useState(null)

  function drop(targetKey) {
    if (!dragKey.current || dragKey.current === targetKey) return
    const from = keys.indexOf(dragKey.current)
    const to   = keys.indexOf(targetKey)
    const next = [...keys]
    next.splice(from, 1)
    next.splice(to, 0, dragKey.current)
    onReorder(next)
    dragKey.current = null; setOverKey(null)
  }

  return (
    <div className={className} style={style}>
      {keys.map(k => (
        <div key={k}
          className={`dlist-item${overKey === k ? ' dlist-over' : ''}`}
          draggable
          onDragStart={e => { dragKey.current = k; e.stopPropagation() }}
          onDragEnd={() => { dragKey.current = null; setOverKey(null) }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOverKey(k) }}
          onDragLeave={() => setOverKey(null)}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); drop(k) }}
        >
          <span className="drag-handle"><i className="ti ti-grip-vertical" /></span>
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
    date:     d.showDate     && <span>Fecha de emisión: <b>{v.date}</b></span>,
    control:  d.showControl  && <span>Control de entrega N°: <b>{v.orderNum}</b></span>,
    orderNum: d.showOrderNum && <span>Número de factura</span>,
  }

  const logoBox = (
    <div
      className="w-logo-box"
      style={isSelected ? { cursor: 'pointer', position: 'relative' } : undefined}
      title={isSelected ? 'Click para cambiar posición' : undefined}
      onClick={isSelected ? e => { e.stopPropagation(); onReorder(w.id, 'logoSide', logoSide === 'left' ? 'right' : 'left') } : undefined}
    >
      {v.logoUrl
        ? <img src={v.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
        : v.storeName || 'Logo'}
      {isSelected && <span className="logo-flip-hint">{logoSide === 'left' ? '→' : '←'}</span>}
    </div>
  )

  const meta = isSelected
    ? <DragList keys={metaOrder} onReorder={next => onReorder(w.id, 'metaOrder', next)}
        className="w-header-meta" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        renderItem={k => metaItems[k] || null} />
    : <div className="w-header-meta">{metaOrder.map(k => metaItems[k] || null)}</div>

  return (
    <div className="w-header" style={{ flexDirection: logoSide === 'right' ? 'row-reverse' : 'row' }}>
      {logoBox}{meta}
    </div>
  )
}

/* ── Client ── */
const CLIENT_FIELDS = {
  name:    (d, v) => d.showName    && <div className="wcf"><label>Nombre y apellido</label><span>{v.name}</span></div>,
  ci:      (d, v) => d.showCI      && <div className="wcf"><label>C.I.</label><span>{v.ci}</span></div>,
  phone:   (d, v) => d.showPhone   && <div className="wcf"><label>Teléfono</label><span>{v.phone}</span></div>,
  address: (d, v) => d.showAddress && <div className="wcf"><label>Dirección</label><span>{v.address}</span></div>,
  payment: (d, v) => d.showPayment && <div className="wcf"><label>Forma de pago</label><span>{v.payment}</span></div>,
}

function Client({ w, v, isSelected, onReorder }) {
  const d = w.data
  const cols = d.columns || { left: ['name', 'ci', 'phone'], right: ['address', 'payment'] }

  if (isSelected) {
    return (
      <TwoColumnDrop
        columns={cols}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-client-reorder"
        renderField={k => CLIENT_FIELDS[k]?.(d, v) || <span className="field-hidden">{k}</span>}
      />
    )
  }

  return (
    <div className="w-client-2col">
      <div className="w-col">
        {cols.left.map(k => { const el = CLIENT_FIELDS[k]?.(d, v); return el ? <div key={k}>{el}</div> : null })}
      </div>
      <div className="w-col">
        {cols.right.map(k => { const el = CLIENT_FIELDS[k]?.(d, v); return el ? <div key={k}>{el}</div> : null })}
      </div>
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
  const cols = d.columns || { left: ['logistic', 'type'], right: ['date', 'address'] }
  const style = { background: d.bgColor, borderTop: `2px solid ${d.accentColor}`, borderBottom: `2px solid ${d.accentColor}` }

  if (isSelected) {
    return (
      <TwoColumnDrop
        columns={cols}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-dispatch-reorder"
        wrapStyle={style}
        renderField={k => DISPATCH_FIELDS[k]?.(d, v) || <span className="field-hidden">{k}</span>}
      />
    )
  }

  return (
    <div className="w-dispatch" style={style}>
      {[...cols.left, ...cols.right].map(k => {
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
  name:  (d, v, c) => <div style={{ fontWeight: 600, color: c.name, fontSize: 10 }}>{v.name}</div>,
  phone: (d, v, c) => v.phone && <div style={{ color: c.text, fontSize: 9 }}>Tel: {v.phone}</div>,
  web:   (d, v, c) => v.web   && <div style={{ color: c.text, fontSize: 9 }}>{v.web}</div>,
  msg:   (d, v, c) => v.msg   && <div style={{ color: c.msg,  fontSize: 9 }}>{v.msg}</div>,
}

function Footer({ w, v, isSelected, onReorder }) {
  const d = w.data
  const cols = d.columns || { left: ['name', 'phone', 'web'], right: ['msg'] }
  const bg = d.dark ? '#1a1a1a' : '#f8f8f8'
  const c  = { name: d.dark ? '#fff' : '#111', text: d.dark ? '#aaa' : '#555', msg: d.dark ? '#666' : '#aaa' }

  if (isSelected) {
    return (
      <TwoColumnDrop
        columns={cols}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-footer-reorder"
        wrapStyle={{ background: bg }}
        renderField={k => FOOTER_FIELDS[k]?.(d, v, c) || <span className="field-hidden">{k}</span>}
      />
    )
  }

  return (
    <div className="w-footer" style={{ background: bg }}>
      <div className="w-col" style={{ color: c.text }}>
        {cols.left.map(k => { const el = FOOTER_FIELDS[k]?.(d, v, c); return el ? <div key={k}>{el}</div> : null })}
      </div>
      <div className="w-col" style={{ color: c.text, textAlign: 'right' }}>
        {cols.right.map(k => { const el = FOOTER_FIELDS[k]?.(d, v, c); return el ? <div key={k}>{el}</div> : null })}
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
