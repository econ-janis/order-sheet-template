import { useRef, useState } from 'react'
import { resolveWidgetData, fmtCurrency } from '../utils/helpers'

const COL_LABELS = { left: 'Izquierda', center: 'Centro', right: 'Derecha' }

/* ── Field-level style helper ── */
function makeRenderField(d, v, builtinFields) {
  return (k) => {
    const el = k.startsWith('custom_')
      ? <div className="w-custom-field">{d.customFields?.[k]?.content || 'Campo de texto'}</div>
      : builtinFields[k]?.(d, v) || <span className="field-hidden">{k}</span>
    const s = d.fieldStyles?.[k]
    return s ? <span style={s}>{el}</span> : el
  }
}

/* ── N-column drag & drop layout ── */
function ColumnDrop({ columns, colKeys = ['left', 'right'], onColumnsChange, renderField, wrapClass, wrapStyle, selFieldKey, onFieldSelect }) {
  const dragging = useRef(null)
  const [overSlot, setOverSlot] = useState(null)

  function isOver(col, key) {
    return overSlot?.col === col && overSlot?.key === (key ?? null)
  }

  function drop(targetCol, targetKey) {
    if (!dragging.current) return
    const { key, fromCol } = dragging.current
    if (key === targetKey) { dragging.current = null; setOverSlot(null); return }

    const next = {}
    colKeys.forEach(c => { next[c] = [...(columns[c] || [])] })
    next[fromCol] = next[fromCol].filter(k => k !== key)

    if (targetKey) {
      const idx = next[targetCol].indexOf(targetKey)
      next[targetCol].splice(idx >= 0 ? idx : next[targetCol].length, 0, key)
    } else {
      next[targetCol].push(key)
    }

    onColumnsChange(next)
    dragging.current = null
    setOverSlot(null)
  }

  function colZone(colName) {
    return {
      className: `col-zone${isOver(colName, null) ? ' col-zone-over' : ''}`,
      onDragOver:  e => { e.preventDefault(); e.stopPropagation(); setOverSlot({ col: colName, key: null }) },
      onDragLeave: () => setOverSlot(null),
      onDrop:      e => { e.preventDefault(); e.stopPropagation(); drop(colName, null) },
    }
  }

  function itemDrag(colName, key) {
    return {
      className: `dlist-item${isOver(colName, key) ? ' dlist-over' : ''}${selFieldKey === key ? ' field-sel' : ''}`,
      draggable: true,
      onDragStart: e => { dragging.current = { key, fromCol: colName }; e.stopPropagation() },
      onDragEnd:   () => { dragging.current = null; setOverSlot(null) },
      onDragOver:  e => { e.preventDefault(); e.stopPropagation(); setOverSlot({ col: colName, key }) },
      onDragLeave: () => setOverSlot(null),
      onDrop:      e => { e.preventDefault(); e.stopPropagation(); drop(colName, key) },
      onClick:     e => { e.stopPropagation(); onFieldSelect?.(key) },
    }
  }

  return (
    <div className={`col-drop col-drop-${colKeys.length} ${wrapClass || ''}`} style={wrapStyle}>
      {colKeys.map(col => (
        <div key={col} {...colZone(col)}>
          <div className="col-label">{COL_LABELS[col] || col}</div>
          {(columns[col] || []).map(k => (
            <div key={k} {...itemDrag(col, k)}>
              <span className="drag-handle"><i className="ti ti-grip-vertical" /></span>
              <div className="dlist-content">{renderField(k)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Header ── */
const HEADER_COL_KEYS = ['left', 'center', 'right']

function Header({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect }) {
  const d = w.data
  const cols = d.columns || { left: [], center: [], right: ['date', 'control', 'orderNum'] }

  const FIELDS = {
    date:     () => d.showDate     && <span>Fecha de emisión: <b>{v.date}</b></span>,
    control:  () => d.showControl  && <span>Control de entrega N°: <b>{v.orderNum}</b></span>,
    orderNum: () => d.showOrderNum && <span>Número de factura</span>,
  }

  const renderField = makeRenderField(d, v, FIELDS)

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        colKeys={HEADER_COL_KEYS}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-header-reorder"
        renderField={renderField}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
      />
    )
  }

  return (
    <div className="w-header">
      {HEADER_COL_KEYS.map(col => {
        const items = (cols[col] || []).map(k => FIELDS[k]?.()).filter(Boolean)
        if (!items.length) return null
        return (
          <div key={col} className={`w-header-col${col === 'right' ? ' w-header-col-right' : ''}`}>
            {items}
          </div>
        )
      })}
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

function Client({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect }) {
  const d = w.data
  const cols = d.columns || { left: ['name', 'ci', 'phone'], right: ['address', 'payment'] }

  const renderField = makeRenderField(d, v, CLIENT_FIELDS)

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-client-reorder"
        renderField={renderField}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
      />
    )
  }

  return (
    <div className="w-client-2col">
      <div className="w-col">
        {(cols.left || []).map(k => { const el = CLIENT_FIELDS[k]?.(d, v); return el ? <div key={k}>{el}</div> : null })}
      </div>
      <div className="w-col">
        {(cols.right || []).map(k => { const el = CLIENT_FIELDS[k]?.(d, v); return el ? <div key={k}>{el}</div> : null })}
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

function Dispatch({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect }) {
  const d = w.data
  const cols = d.columns || { left: ['logistic', 'type'], right: ['date', 'address'] }
  const style = { background: d.bgColor, borderTop: `2px solid ${d.accentColor}`, borderBottom: `2px solid ${d.accentColor}` }

  const renderField = makeRenderField(d, v, DISPATCH_FIELDS)

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-dispatch-reorder"
        wrapStyle={style}
        renderField={renderField}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
      />
    )
  }

  return (
    <div className="w-dispatch-2col" style={style}>
      <div className="w-col">
        {(cols.left || []).map(k => { const el = DISPATCH_FIELDS[k]?.(d, v); return el ? <div key={k}>{el}</div> : null })}
      </div>
      <div className="w-col">
        {(cols.right || []).map(k => { const el = DISPATCH_FIELDS[k]?.(d, v); return el ? <div key={k}>{el}</div> : null })}
      </div>
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

function Footer({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect }) {
  const d = w.data
  const cols = d.columns || { left: ['name', 'phone', 'web'], right: ['msg'] }
  const bg = d.dark ? '#1a1a1a' : '#f8f8f8'
  const c  = { name: d.dark ? '#fff' : '#111', text: d.dark ? '#aaa' : '#555', msg: d.dark ? '#666' : '#aaa' }

  if (d.mode === 'image') {
    return (
      <div className="w-footer w-footer-img" style={{ background: bg }}>
        {d.imageUrl
          ? <img src={d.imageUrl} alt="Footer" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ color: '#888', fontSize: 10 }}>Ingresá una URL de imagen en Propiedades</span>}
      </div>
    )
  }

  // Footer builtin fields need c, so wrap them
  const FOOTER_BUILTIN = {
    name:  (d, v) => FOOTER_FIELDS.name(d, v, c),
    phone: (d, v) => FOOTER_FIELDS.phone(d, v, c),
    web:   (d, v) => FOOTER_FIELDS.web(d, v, c),
    msg:   (d, v) => FOOTER_FIELDS.msg(d, v, c),
  }

  const renderField = makeRenderField(d, v, FOOTER_BUILTIN)

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-footer-reorder"
        wrapStyle={{ background: bg }}
        renderField={renderField}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
      />
    )
  }

  return (
    <div className="w-footer" style={{ background: bg }}>
      <div className="w-col" style={{ color: c.text }}>
        {(cols.left || []).map(k => { const el = FOOTER_FIELDS[k]?.(d, v, c); return el ? <div key={k}>{el}</div> : null })}
      </div>
      <div className="w-col" style={{ color: c.text, textAlign: 'right' }}>
        {(cols.right || []).map(k => { const el = FOOTER_FIELDS[k]?.(d, v, c); return el ? <div key={k}>{el}</div> : null })}
      </div>
    </div>
  )
}

/* ── Logo ── */
function Logo({ d }) {
  return (
    <div className="w-logo-widget" style={{ height: d.height ? d.height + 'px' : '80px' }}>
      {d.imageUrl
        ? <img src={d.imageUrl} alt="Logo" draggable={false} style={{ width: '100%', height: '100%', objectFit: d.objectFit || 'contain', display: 'block', pointerEvents: 'none' }} />
        : <div className="w-logo-placeholder"><i className="ti ti-photo" /><span>URL de imagen en Propiedades</span></div>}
    </div>
  )
}

/* ── Main export ── */
export default function WidgetRenderer({ widget, sampleData, isSelected, onReorder, selFieldKey, onFieldSelect }) {
  const d = widget.data
  const v = resolveWidgetData(widget, sampleData)

  if (widget.type === 'header')   return <Header   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} />
  if (widget.type === 'logo')     return <Logo d={d} />
  if (widget.type === 'client')   return <Client   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} />
  if (widget.type === 'dispatch') return <Dispatch w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} />
  if (widget.type === 'products') return <Products d={d} v={v} />
  if (widget.type === 'footer')   return <Footer   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} />
  if (widget.type === 'divider')  return <div className="w-divider"><hr style={{ borderTop: `1px ${d.style} ${d.color}` }} /></div>
  if (widget.type === 'text')     return <div className="w-text" style={{ fontSize: d.fontSize }}>{d.content}</div>
  return null
}
