import { useRef, useState } from 'react'
import { resolveWidgetData, fmtCurrency, resolveTemplate } from '../utils/helpers'

/* Generic internal-column keys derived from the widget's colCount (default 3). */
function colKeysOf(d) {
  const n = d.colCount ?? Object.keys(d.columns || {}).length ?? 3
  return Array.from({ length: Math.max(1, n) }, (_, i) => 'c' + i)
}

/* Custom field content with {{helpers}} resolved to their sample value. */
function customContent(d, k, sampleData) {
  const raw = d.customFields?.[k]?.content
  if (raw == null) return ''
  return sampleData ? resolveTemplate(raw, sampleData) : raw
}

function customLabel(d, k) {
  return d.customFields?.[k]?.label || ''
}

/* ── Field-level style helper (edit mode shows a placeholder for hidden fields) ── */
function makeRenderField(d, v, builtinFields, sampleData) {
  return (k) => {
    if (k.startsWith('custom_')) {
      const lbl = customLabel(d, k)
      const val = customContent(d, k, sampleData) || 'Campo de texto'
      const s = d.fieldStyles?.[k]
      return (
        <div className="w-custom-field">
          {lbl && <label>{lbl}</label>}
          {s ? <span style={s}>{val}</span> : <span>{val}</span>}
        </div>
      )
    }
    const el = builtinFields[k]?.(d, v) || <span className="field-hidden">{k}</span>
    const s = d.fieldStyles?.[k]
    return s ? <span style={s}>{el}</span> : el
  }
}

/* ── Display-mode cell: returns null for hidden fields, applies field styles ── */
function makeDisplayCell(d, v, builtinFields, sampleData) {
  return (k) => {
    if (k.startsWith('custom_')) {
      const lbl = customLabel(d, k)
      const val = customContent(d, k, sampleData)
      if (!lbl && !val) return null
      const s = d.fieldStyles?.[k]
      return (
        <div className="w-custom-field">
          {lbl && <label>{lbl}</label>}
          {s ? <span style={s}>{val}</span> : <span>{val}</span>}
        </div>
      )
    }
    const el = builtinFields[k]?.(d, v)
    if (!el) return null
    const s = d.fieldStyles?.[k]
    return s ? <span style={s}>{el}</span> : el
  }
}

/* ── Generic N-column display (non-selected) ── */
function ColumnDisplay({ columns, colKeys, renderCell, wrapClass, wrapStyle, columnStyles }) {
  return (
    <div
      className={`w-cols ${wrapClass || ''}`}
      style={{ ...(wrapStyle || {}), display: 'grid', gridTemplateColumns: `repeat(${colKeys.length}, 1fr)` }}
    >
      {colKeys.map(col => {
        const cs = (columnStyles || {})[col]
        const radius = cs?.border ? (cs.rounded !== false ? (cs.radius ?? 5) : 0) : 0
        const colStyle = cs?.border ? { border: `${cs.width || 1}px ${cs.style || 'dashed'} ${cs.color || '#cccccc'}`, borderRadius: radius, padding: '4px 6px' } : {}
        return (
          <div key={col} className="w-col" style={colStyle}>
            {(columns[col] || []).map(k => { const el = renderCell(k); return el ? <div key={k}>{el}</div> : null })}
          </div>
        )
      })}
    </div>
  )
}

/* ── N-column drag & drop layout ── */
function ColumnDrop({ columns, colKeys = ['left', 'right'], onColumnsChange, renderField, wrapClass, wrapStyle, selFieldKey, onFieldSelect, columnStyles, onRemoveField }) {
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
    <div
      className={`col-drop ${wrapClass || ''}`}
      style={{ ...(wrapStyle || {}), gridTemplateColumns: `repeat(${colKeys.length}, 1fr)` }}
    >
      {colKeys.map((col, ci) => {
        const cs = (columnStyles || {})[col]
        const zoneStyle = cs?.border ? { outline: `2px solid ${cs.color || '#cccccc'}` } : {}
        return (
          <div key={col} {...colZone(col)} style={{ ...zoneStyle }}>
            <div className="col-label">Columna {ci + 1}</div>
            {(columns[col] || []).map(k => (
              <div key={k} {...itemDrag(col, k)}>
                <span className="drag-handle"><i className="ti ti-grip-vertical" /></span>
                <div className="dlist-content">{renderField(k)}</div>
                {onRemoveField && (
                  <button className="field-remove-btn" title="Eliminar campo" onClick={e => { e.stopPropagation(); onRemoveField(k) }}>
                    <i className="ti ti-x" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Header ── */
function Header({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect, sampleData, onRemoveField }) {
  const d = w.data
  const cols = d.columns || {}
  const colKeys = colKeysOf(d)

  const FIELDS = {
    date:     () => d.showDate     && <span>Fecha de emisión: <b>{v.date}</b></span>,
    control:  () => d.showControl  && <span>Control de entrega N°: <b>{v.orderNum}</b></span>,
    orderNum: () => d.showOrderNum && <span>Número de factura</span>,
  }

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        colKeys={colKeys}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-header-reorder"
        renderField={makeRenderField(d, v, FIELDS, sampleData)}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
        columnStyles={d.columnStyles}
        onRemoveField={onRemoveField}
      />
    )
  }

  return (
    <ColumnDisplay
      columns={cols}
      colKeys={colKeys}
      renderCell={makeDisplayCell(d, v, FIELDS, sampleData)}
      wrapClass="w-header"
      columnStyles={d.columnStyles}
    />
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

function Client({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect, sampleData, onRemoveField }) {
  const d = w.data
  const cols = d.columns || {}
  const colKeys = colKeysOf(d)

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        colKeys={colKeys}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-client-reorder"
        renderField={makeRenderField(d, v, CLIENT_FIELDS, sampleData)}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
        columnStyles={d.columnStyles}
        onRemoveField={onRemoveField}
      />
    )
  }

  return (
    <ColumnDisplay
      columns={cols}
      colKeys={colKeys}
      renderCell={makeDisplayCell(d, v, CLIENT_FIELDS, sampleData)}
      wrapClass="w-client-cols"
      columnStyles={d.columnStyles}
    />
  )
}

/* ── Dispatch ── */
const DISPATCH_FIELDS = {
  logistic: (d, v) => d.showLogistic && <div className="wdi"><label>Logística</label><span>{v.logistic}</span></div>,
  type:     (d, v) => d.showType     && <div className="wdi"><label>Tipo</label><span>{v.type}</span></div>,
  date:     (d, v) => d.showDate     && <div className="wdi"><label>Fecha entrega</label><span>{v.date}</span></div>,
  address:  (d, v) => d.showAddress  && <div className="wdi"><label>Dirección</label><span>{v.address}</span></div>,
}

function Dispatch({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect, sampleData, onRemoveField }) {
  const d = w.data
  const cols = d.columns || {}
  const colKeys = colKeysOf(d)
  const style = { background: d.bgColor, borderTop: `2px solid ${d.accentColor}`, borderBottom: `2px solid ${d.accentColor}` }

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        colKeys={colKeys}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-dispatch-reorder"
        wrapStyle={style}
        renderField={makeRenderField(d, v, DISPATCH_FIELDS, sampleData)}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
        columnStyles={d.columnStyles}
        onRemoveField={onRemoveField}
      />
    )
  }

  return (
    <ColumnDisplay
      columns={cols}
      colKeys={colKeys}
      renderCell={makeDisplayCell(d, v, DISPATCH_FIELDS, sampleData)}
      wrapClass="w-dispatch-cols"
      wrapStyle={style}
      columnStyles={d.columnStyles}
    />
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

function Footer({ w, v, isSelected, onReorder, selFieldKey, onFieldSelect, sampleData, onRemoveField }) {
  const d = w.data
  const cols = d.columns || {}
  const colKeys = colKeysOf(d)
  const bg = d.dark ? '#1a1a1a' : '#f8f8f8'
  const c  = { name: d.dark ? '#fff' : '#111', text: d.dark ? '#aaa' : '#555', msg: d.dark ? '#666' : '#aaa' }

  if (d.mode === 'image') {
    return (
      <div className="w-footer w-footer-img" style={{ background: bg }}>
        {d.imageUrl
          ? <img src={d.imageUrl} alt="Footer" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
          : <span style={{ color: '#888', fontSize: 10 }}>Ingresá una URL de imagen en Propiedades</span>}
      </div>
    )
  }

  // Footer builtin fields need c, so wrap them to the (d, v) signature
  const FOOTER_BUILTIN = {
    name:  (d, v) => FOOTER_FIELDS.name(d, v, c),
    phone: (d, v) => FOOTER_FIELDS.phone(d, v, c),
    web:   (d, v) => FOOTER_FIELDS.web(d, v, c),
    msg:   (d, v) => FOOTER_FIELDS.msg(d, v, c),
  }

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        colKeys={colKeys}
        onColumnsChange={next => onReorder(w.id, 'columns', next)}
        wrapClass="w-footer-reorder"
        wrapStyle={{ background: bg }}
        renderField={makeRenderField(d, v, FOOTER_BUILTIN, sampleData)}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
        columnStyles={d.columnStyles}
        onRemoveField={onRemoveField}
      />
    )
  }

  return (
    <ColumnDisplay
      columns={cols}
      colKeys={colKeys}
      renderCell={makeDisplayCell(d, v, FOOTER_BUILTIN, sampleData)}
      wrapClass="w-footer w-footer-cols"
      wrapStyle={{ background: bg, color: c.text }}
      columnStyles={d.columnStyles}
    />
  )
}

/* ── Summary ── */
const SUMMARY_FIELDS = {
  orderNum:     (d, v) => <div className="wcf"><label>N° de Pedido</label><span>{v.orderNum}</span></div>,
  date:         (d, v) => <div className="wcf"><label>Fecha creación</label><span>{v.date}</span></div>,
  total:        (d, v) => <div className="wcf"><label>Total</label><span>{v.total}</span></div>,
  clientName:   (d, v) => <div className="wcf"><label>Nombre y apellido</label><span>{v.clientName}</span></div>,
  ci:           (d, v) => <div className="wcf"><label>C.I.</label><span>{v.ci}</span></div>,
  phone:        (d, v) => <div className="wcf"><label>Teléfono</label><span>{v.phone}</span></div>,
  address:      (d, v) => <div className="wcf"><label>Dirección</label><span>{v.address}</span></div>,
  logistic:     (d, v) => <div className="wcf"><label>Logística</label><span>{v.logistic}</span></div>,
  deliveryType: (d, v) => <div className="wcf"><label>Tipo envío</label><span>{v.deliveryType}</span></div>,
  deliveryDate: (d, v) => <div className="wcf"><label>Fecha entrega</label><span>{v.deliveryDate}</span></div>,
  payment:      (d, v) => <div className="wcf"><label>Forma de pago</label><span>{v.payment}</span></div>,
  itemCount:    (d, v) => <div className="wcf"><label>Cant. ítems</label><span>{v.itemCount}</span></div>,
  storeName:    (d, v) => <div className="wcf"><label>Tienda</label><span>{v.storeName}</span></div>,
  storePhone:   (d, v) => <div className="wcf"><label>Tel. tienda</label><span>{v.storePhone}</span></div>,
}

function Summary({ widget, isSelected, onReorder, selFieldKey, onFieldSelect, sampleData, onRemoveField }) {
  const d = widget.data
  const v = resolveWidgetData(widget, sampleData || {})
  const cols = d.columns || {}
  const colKeys = colKeysOf(d)

  if (isSelected) {
    return (
      <ColumnDrop
        columns={cols}
        colKeys={colKeys}
        onColumnsChange={next => onReorder(widget.id, 'columns', next)}
        wrapClass="w-summary-reorder"
        renderField={makeRenderField(d, v, SUMMARY_FIELDS, sampleData)}
        selFieldKey={selFieldKey}
        onFieldSelect={onFieldSelect}
        columnStyles={d.columnStyles}
        onRemoveField={onRemoveField}
      />
    )
  }

  return (
    <ColumnDisplay
      columns={cols}
      colKeys={colKeys}
      renderCell={makeDisplayCell(d, v, SUMMARY_FIELDS, sampleData)}
      wrapClass="w-summary-cols"
      columnStyles={d.columnStyles}
    />
  )
}

/* ── Logo ── */
function Logo({ d }) {
  return (
    <div className="w-logo-widget" style={{ height: d.height ? d.height + 'px' : '80px' }}>
      {d.imageUrl
        ? <img src={d.imageUrl} alt="Logo" draggable={false} style={{ width: '100%', height: '100%', objectFit: d.objectFit || 'contain', display: 'block', pointerEvents: 'none', filter: d.bw ? 'grayscale(1)' : undefined }} />
        : <div className="w-logo-placeholder"><i className="ti ti-photo" /><span>URL de imagen en Propiedades</span></div>}
    </div>
  )
}

/* ── Main export ── */
export default function WidgetRenderer({ widget, sampleData, isSelected, onReorder, selFieldKey, onFieldSelect, onRemoveField }) {
  const d = widget.data
  const v = resolveWidgetData(widget, sampleData)

  if (widget.type === 'header')   return <Header   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} sampleData={sampleData} onRemoveField={onRemoveField} />
  if (widget.type === 'logo')     return <Logo d={d} />
  if (widget.type === 'client')   return <Client   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} sampleData={sampleData} onRemoveField={onRemoveField} />
  if (widget.type === 'dispatch') return <Dispatch w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} sampleData={sampleData} onRemoveField={onRemoveField} />
  if (widget.type === 'products') return <Products d={d} v={v} />
  if (widget.type === 'footer')   return <Footer   w={widget} v={v} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} sampleData={sampleData} onRemoveField={onRemoveField} />
  if (widget.type === 'summary')  return <Summary  widget={widget} isSelected={isSelected} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} sampleData={sampleData} onRemoveField={onRemoveField} />
  if (widget.type === 'divider')  return <div className="w-divider"><hr style={{ borderTop: `1px ${d.style} ${d.color}` }} /></div>
  if (widget.type === 'text')     return <div className="w-text" style={{ fontSize: d.fontSize, fontFamily: d.fontFamily || undefined, fontWeight: d.fontWeight || undefined, fontStyle: d.fontStyle || undefined, color: d.color || undefined, textAlign: d.textAlign || undefined }}>{d.content}</div>
  return null
}
