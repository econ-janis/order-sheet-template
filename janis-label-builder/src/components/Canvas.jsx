import { useRef, useState, useEffect, useLayoutEffect, Fragment } from 'react'
import WidgetRenderer from './WidgetRenderer'
import { genHbs, esc } from '../utils/helpers'

const LS_KEY = 'janis_lb_layouts'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function persistSaved(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function SavedModal({ onClose, getCurrentWidgets, onLoadLayout }) {
  const [saved, setSaved] = useState(loadSaved)
  const [name, setName] = useState('')

  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    const widgets = getCurrentWidgets()
    if (!widgets.length) { alert('El canvas está vacío.'); return }
    const list = loadSaved()
    const existing = list.findIndex(e => e.name === trimmed)
    const entry = { name: trimmed, savedAt: new Date().toISOString(), widgets }
    if (existing >= 0) list[existing] = entry
    else list.unshift(entry)
    persistSaved(list)
    setSaved(list)
    setName('')
  }

  function load(entry) {
    if (window.confirm(`¿Cargar "${entry.name}"? Se reemplazará el canvas actual.`)) {
      onLoadLayout(entry.widgets)
      onClose()
    }
  }

  function remove(entryName) {
    const list = loadSaved().filter(e => e.name !== entryName)
    persistSaved(list)
    setSaved(list)
  }

  function fmtDate(iso) {
    try {
      const d = new Date(iso)
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    } catch { return iso }
  }

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="tpl-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="preview-bar">
          <span><i className="ti ti-device-floppy" style={{ fontSize: 13 }} /> Guardados</span>
          <button className="tbtn" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 12 }} /> Cerrar</button>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e8eaf0', display: 'flex', gap: 7, alignItems: 'center' }}>
          <input
            className="hbs-ac-input"
            style={{ flex: 1, fontFamily: 'inherit' }}
            placeholder="Nombre del diseño…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <button className="tbtn pri" onClick={save}><i className="ti ti-device-floppy" style={{ fontSize: 11 }} /> Guardar</button>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 360, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saved.length === 0 && (
            <div style={{ textAlign: 'center', color: '#bbb', fontSize: 11, padding: 32 }}>
              <i className="ti ti-archive" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
              No hay diseños guardados
            </div>
          )}
          {saved.map(entry => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fb', borderRadius: 7, padding: '8px 12px', border: '0.5px solid #e8eaf0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#1a1d2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
                  {fmtDate(entry.savedAt)} · {entry.widgets.length} widget{entry.widgets.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button className="tbtn" style={{ fontSize: 10 }} onClick={() => load(entry)}>
                <i className="ti ti-upload" style={{ fontSize: 10 }} /> Cargar
              </button>
              <button className="tbtn" style={{ fontSize: 10, color: '#e05', borderColor: '#fca5a5' }} onClick={() => remove(entry.name)}>
                <i className="ti ti-trash" style={{ fontSize: 10 }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Physical page sizes (mm) so the build canvas is true-to-paper and prints full width.
const SIZE_MAP = {
  a4:    { w: '210mm', h: '297mm' },
  half:  { w: '140mm', h: '216mm' },
  label: { w: '100mm', h: '150mm' },
}

/* Drop zone: accepts native palette drags (onDrop) and is detected by pointer drags
   via data-after-index + elementFromPoint. */
function DropZone({ dragTypeRef, onAdd, afterIndex = -1, colSpan = 4, fitSpan = null, zoneKey, variant, hot }) {
  const ref = useRef(null)
  const [over, setOver] = useState(false)

  function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); setOver(true) }
  function handleDragLeave(e) { if (!ref.current?.contains(e.relatedTarget)) setOver(false) }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation(); setOver(false)
    if (dragTypeRef.current) { onAdd(dragTypeRef.current, afterIndex, fitSpan); dragTypeRef.current = null }
  }

  const cls = `dropzone dz-${variant}${over ? ' over' : ''}${hot ? ' dz-hot' : ''}`
  const baseStyle = { gridColumn: `span ${colSpan}` }
  if (variant === 'bar') Object.assign(baseStyle, { minHeight: 22, margin: '2px 4px' })
  else if (variant === 'slot') Object.assign(baseStyle, { minHeight: 32, margin: 4 })

  return (
    <div
      ref={ref}
      className={cls}
      data-after-index={afterIndex}
      data-zone-key={zoneKey}
      data-fit-span={fitSpan ?? ''}
      style={baseStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {variant === 'empty'
        ? (
          <div className="empty-c" style={{ pointerEvents: 'none' }}>
            <i className="ti ti-drag-drop" aria-hidden="true" />
            <p>Arrastrá widgets aquí</p>
          </div>
        )
        : <span style={{ fontSize: 10, pointerEvents: 'none' }}>+ soltar aquí</span>}
    </div>
  )
}

/* Height resize handle — drag down to set explicit height */
function ResizeHandle({ widget, onResize }) {
  const startRef = useRef(null)
  function onMouseDown(e) {
    e.preventDefault(); e.stopPropagation()
    startRef.current = { startY: e.clientY, initHeight: widget.data.height ?? 80 }
    function onMove(e) {
      const { startY, initHeight } = startRef.current
      onResize(widget.id, Math.max(20, Math.round(initHeight + (e.clientY - startY))))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      startRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  return (
    <div className="resize-handle rh-s" onMouseDown={onMouseDown} onClick={e => e.stopPropagation()} title="Ajustar altura">
      <i className="ti ti-arrows-vertical" style={{ fontSize: 9, pointerEvents: 'none' }} />
    </div>
  )
}

/* Width divider — drag horizontally between two adjacent widgets to redistribute width */
function WidthDivider({ widgetA, widgetB, onResizeWidth }) {
  function onMouseDown(e) {
    e.preventDefault(); e.stopPropagation()
    const rowEl = e.currentTarget.closest('.lcrow')
    const rowWidth = rowEl?.offsetWidth || 600
    const frA = widgetA.data.widthFr ?? 1
    const frB = widgetB.data.widthFr ?? 1
    const totalFr = frA + frB
    const startX = e.clientX
    document.body.style.cursor = 'col-resize'
    function onMove(ev) {
      const delta = ev.clientX - startX
      const newFrA = Math.max(0.05, frA + (delta / rowWidth) * totalFr)
      const newFrB = Math.max(0.05, totalFr - newFrA)
      onResizeWidth(widgetA.id, newFrA, widgetB.id, newFrB)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  return <div className="width-divider" onMouseDown={onMouseDown} onClick={e => e.stopPropagation()} title="Ajustar ancho" />
}

const EXPORT_CSS = `
.label-container { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; background: #fff; }
.lcgrid { display: grid; grid-template-columns: repeat(4, 1fr); align-items: start; width: 100%; }
.wcf label { display: block; color: #aaa; text-transform: uppercase; letter-spacing: .04em; font-size: 8px; margin-bottom: 1px; }
.wcf span  { font-size: 10px; color: #111; }
.wdi label { display: block; color: #888; text-transform: uppercase; letter-spacing: .04em; font-size: 8px; margin-bottom: 1px; }
.wdi span  { font-size: 10px; font-weight: 500; color: #111; }
.w-col { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.w-cols { display: grid; gap: 14px; padding: 8px 14px; }
.w-header { border-bottom: 1px solid #eee; padding: 10px 14px; }
.w-client-cols { border-bottom: 1px solid #f2f2f2; }
.w-dispatch-cols { border-bottom: 1px solid #e8e8e8; }
.w-products { border-bottom: 1px solid #f0f0f0; }
.w-products table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
.w-products th { padding: 4px 8px; text-align: left; font-size: 8px; color: #888; text-transform: uppercase; border-bottom: 1px solid #e8e8e8; }
.w-products td { padding: 4px 8px; border-bottom: 1px solid #f8f8f8; color: #222; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-products tr.total td { font-weight: 500; border-top: 1px solid #eee; background: #f5f5f5; color: #999; font-size: 8px; }
.w-footer { padding: 7px 14px; display: flex; align-items: center; justify-content: space-between; }
.w-text { padding: 8px 14px; word-break: break-word; }
.w-divider { padding: 3px 14px; }
.w-divider hr { border: none; }
.summary { padding: 8px 14px; }
.summary-col { display: flex; flex-direction: column; gap: 4px; }
`

function exportHbs(widgets) {
  if (!widgets.length) { alert('Agregá al menos un widget.'); return }
  const body = widgets.map(w => {
    const span = w.data.colSpan ?? 4
    const inner = '  ' + genHbs(w).replace(/\n/g, '\n    ')
    return `  <div style="grid-column:span ${span}">\n    ${inner}\n  </div>`
  }).join('\n\n')
  const hbsContent =
    `{{#if order}}\n<div class="label-container" id="pedido-{{order.commerceSequentialId}}" style="display:grid;grid-template-columns:repeat(4,1fr);align-items:start">\n\n` +
    body + `\n\n</div>\n{{/if}}`
  const full = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<style>\n${EXPORT_CSS}\n</style>\n</head>\n<body>\n${hbsContent}\n</body>\n</html>`
  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(
    `<pre style="font-family:monospace;font-size:12px;padding:24px;white-space:pre-wrap;background:#1e1e1e;color:#d4d4d4;min-height:100vh;margin:0">${esc(full)}</pre>`
  )
  win.document.close()
}

// Simulates CSS-grid row packing (4 cols, no dense backfill) and reports, for
// each widget, the size of any REAL trailing gap in its row — i.e. empty cells
// the next widget can't fill (so it wraps). Without the "next fits" check we'd
// render phantom slots between widgets that actually sit side by side.
function buildRowSlots(widgets) {
  const result = new Array(widgets.length).fill(0)
  let col = 0
  for (let i = 0; i < widgets.length; i++) {
    const span = Math.min(4, Math.max(1, widgets[i].data.colSpan ?? 4))
    if (col + span > 4) col = 0          // doesn't fit current row → wraps
    col += span
    const remaining = 4 - col
    const next = widgets[i + 1]
    const nextSpan = next ? Math.min(4, Math.max(1, next.data.colSpan ?? 4)) : null
    const nextFits = nextSpan !== null && nextSpan <= remaining
    if (remaining > 0 && !nextFits) result[i] = remaining
    if (col >= 4) col = 0
  }
  return result
}

// Groups widgets into rows based on colSpan packing. Returns array of
// { widgets, indices } where indices are the global positions in the flat array.
function buildRows(widgets) {
  const rows = []
  let current = { widgets: [], indices: [] }
  let col = 0
  for (let i = 0; i < widgets.length; i++) {
    const span = Math.min(4, Math.max(1, widgets[i].data.colSpan ?? 4))
    if (col + span > 4) {
      if (current.widgets.length) rows.push(current)
      current = { widgets: [], indices: [] }
      col = 0
    }
    current.widgets.push(widgets[i])
    current.indices.push(i)
    col += span
    if (col >= 4) {
      rows.push(current)
      current = { widgets: [], indices: [] }
      col = 0
    }
  }
  if (current.widgets.length) rows.push(current)
  return rows
}

export default function Canvas({ widgets, selId, sampleData, dragTypeRef, onAdd, onAddBeside, onDelete, onMove, onMoveTo, onSplit, onSelect, onClear, onTemplate, onReorder, onResize, onResizeWidth, selFieldKey, onFieldSelect, onRemoveField, onLoadLayout, getCurrentWidgets }) {
  const sizeRef = useRef(null)
  const canvasRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const [ghost, setGhost] = useState(null)        // {x, y, label}
  const [hotKey, setHotKey] = useState(null)       // which drop zone is highlighted
  const [splitKey, setSplitKey] = useState(null)  // which widget's split zone is hot
  const [nativeDrag, setNativeDrag] = useState(false) // palette drag hovering the canvas
  const [paper, setPaper] = useState('a4')
  const [landscape, setLandscape] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [previewNumPages, setPreviewNumPages] = useState(1)
  const previewMeasureRef = useRef(null)
  const previewPageRef = useRef(null)
  const dragStateRef = useRef(null)

  function onSizeChange(e) {
    setPaper(e.target.value)
  }

  function startWidgetDrag(id, label, e) {
    e.preventDefault(); e.stopPropagation()
    setDragId(id)
    setGhost({ x: e.clientX, y: e.clientY, label })
    setHotKey(null)
    dragStateRef.current = { id, afterIndex: null }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'

    function onMove(ev) {
      setGhost({ x: ev.clientX, y: ev.clientY, label })
      const el = document.elementFromPoint(ev.clientX, ev.clientY)

      // 1. Explicit drop zones (insertion bars + leftover-space slots) win.
      const zone = el?.closest('.dropzone')
      if (zone) {
        setSplitKey(null)
        dragStateRef.current.splitTarget = null
        setHotKey(zone.getAttribute('data-zone-key'))
        dragStateRef.current.afterIndex = parseInt(zone.getAttribute('data-after-index'), 10)
        const fs = zone.getAttribute('data-fit-span')
        dragStateRef.current.fitSpan = fs ? parseInt(fs, 10) : null
        return
      }

      // 2. Hovering another widget → drop beside it (left/right half of its box).
      const cw = el?.closest('[data-cwrap-id]')
      const cwId = cw?.getAttribute('data-cwrap-id')
      if (cw && cwId && cwId !== id) {
        const rect = cw.getBoundingClientRect()
        const side = (ev.clientX - rect.left) < rect.width / 2 ? 'left' : 'right'
        setSplitKey(`${cwId}:${side}`)
        dragStateRef.current.splitTarget = cwId
        dragStateRef.current.splitSide = side
        dragStateRef.current.afterIndex = null
        setHotKey(null)
        return
      }

      // 3. Nothing actionable under the cursor.
      setSplitKey(null)
      setHotKey(null)
      dragStateRef.current.splitTarget = null
      dragStateRef.current.afterIndex = null
      dragStateRef.current.fitSpan = null
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      const { id, afterIndex, splitTarget, splitSide, fitSpan } = dragStateRef.current || {}
      if (splitTarget) onSplit(splitTarget, id, splitSide)
      else if (afterIndex !== null && afterIndex !== undefined) onMoveTo(id, afterIndex, fitSpan)
      dragStateRef.current = null
      setDragId(null); setGhost(null); setHotKey(null); setSplitKey(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Measure rendered content height to compute number of preview pages.
  useLayoutEffect(() => {
    if (!showPreview) { setPreviewNumPages(1); return }
    const measure = () => {
      const el = previewMeasureRef.current
      const pg = previewPageRef.current
      if (!el || !pg) return
      const pageH = pg.offsetHeight
      const contentH = el.scrollHeight
      if (pageH > 0) setPreviewNumPages(Math.max(1, Math.ceil(contentH / pageH)))
    }
    const t = setTimeout(measure, 80)
    return () => clearTimeout(t)
  }, [showPreview, widgets, paper, landscape])

  // When "Descargar PDF" is pressed we open the preview in print mode and fire
  // the browser print dialog (user saves as PDF) once it has rendered.
  useEffect(() => {
    if (showPreview !== 'print') return
    const onAfter = () => setShowPreview(false)
    window.addEventListener('afterprint', onAfter)
    const t = setTimeout(() => window.print(), 250)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', onAfter) }
  }, [showPreview])

  const rowSlots = buildRowSlots(widgets)
  const dragActive = dragId !== null
  const baseSize = SIZE_MAP[paper] || SIZE_MAP.a4
  const paperStyle = landscape ? { w: baseSize.h, h: baseSize.w } : baseSize

  return (
    <div className="panel panel-center">
      <div className="ctoolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select className="sz-select" value={paper} onChange={onSizeChange}>
            <option value="a4">A4</option>
            <option value="half">Media carta</option>
            <option value="label">Etiqueta 10×15</option>
          </select>
          <button
            className={`tbtn${landscape ? ' pri' : ''}`}
            title={landscape ? 'Cambiar a vertical' : 'Cambiar a horizontal'}
            onClick={() => setLandscape(v => !v)}
          >
            <i className={`ti ${landscape ? 'ti-layout-sidebar-right' : 'ti-layout-bottombar'}`} style={{ fontSize: 12 }} />
            {landscape ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="tbtn" onClick={() => setShowSaved(true)}>
            <i className="ti ti-device-floppy" style={{ fontSize: 12 }} aria-hidden="true" /> Guardados
          </button>
          <button className="tbtn tpl-trigger" onClick={onTemplate}>
            <i className="ti ti-layout-grid" style={{ fontSize: 12 }} aria-hidden="true" /> Plantillas
          </button>
          <button className="tbtn" onClick={onClear}>
            <i className="ti ti-trash" style={{ fontSize: 12 }} aria-hidden="true" /> Limpiar
          </button>
          <button className="tbtn" onClick={() => widgets.length ? setShowPreview(true) : alert('Agregá al menos un widget.')}>
            <i className="ti ti-eye" style={{ fontSize: 12 }} aria-hidden="true" /> Preview
          </button>
          <button className="tbtn" onClick={() => exportHbs(widgets)}>
            <i className="ti ti-code" style={{ fontSize: 12 }} aria-hidden="true" /> Exportar HBS
          </button>
          <button className="tbtn pri" onClick={() => widgets.length ? setShowPreview('print') : alert('Agregá al menos un widget.')}>
            <i className="ti ti-download" style={{ fontSize: 12 }} aria-hidden="true" /> Descargar PDF
          </button>
        </div>
      </div>

      <div className="carea">
        <div className="lcanvas" ref={sizeRef} style={{ maxWidth: paperStyle.w, minHeight: paperStyle.h }}>
          <div
            className={`lcgrid${dragActive ? ' grid-dragging' : ''}`}
            ref={canvasRef}
            onClick={() => onSelect(null)}
            onDragOver={() => { if (dragTypeRef.current) { setNativeDrag(true) } }}
            onDragLeave={e => { if (!canvasRef.current?.contains(e.relatedTarget)) setNativeDrag(false) }}
            onDrop={() => setNativeDrag(false)}
          >
            {widgets.length === 0
              ? <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={-1} colSpan={4} zoneKey="empty" variant="empty" />
              : (() => {
                  const rows = buildRows(widgets)
                  return (
                    <>
                      {/* insertion bar before the first row (only while reordering) */}
                      {dragActive && (
                        <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={-1} colSpan={4}
                          zoneKey="bar--1" variant="bar" hot={hotKey === 'bar--1'} />
                      )}

                      {rows.map(row => {
                        const firstW = row.widgets[0]
                        const frameVal = firstW.data.rowFrame || 'none'
                        const lastIdx = row.indices[row.indices.length - 1]
                        const rowCls = `lcrow${frameVal === 'rounded' ? ' lcrow-rounded' : frameVal === 'square' ? ' lcrow-square' : ''}`
                        return (
                          <Fragment key={firstW.id + '-row'}>
                            <div className={rowCls}>
                              {row.widgets.map((w, wInRow) => {
                                const i = row.indices[wInRow]
                                const isLast = wInRow === row.widgets.length - 1
                                const nextW = row.widgets[wInRow + 1]
                                return (
                                  <Fragment key={w.id}>
                                    <div
                                      data-cwrap-id={w.id}
                                      className={`cwrap${selId === w.id ? ' sel-ring' : ''}${dragId === w.id ? ' cwrap-dragging' : ''}${splitKey === `${w.id}:left` ? ' cwrap-split-left' : ''}${splitKey === `${w.id}:right` ? ' cwrap-split-right' : ''}`}
                                      style={{
                                        flex: `${w.data.widthFr ?? 1} 1 0`,
                                        minWidth: 0,
                                        minHeight: w.data.height ? w.data.height + 'px' : undefined,
                                      }}
                                      onClick={e => { e.stopPropagation(); onSelect(w.id) }}
                                      onDragOver={e => {
                                        if (!dragTypeRef.current || dragId) return
                                        e.preventDefault(); e.stopPropagation()
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right'
                                        setSplitKey(`${w.id}:${side}`)
                                      }}
                                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSplitKey(null) }}
                                      onDrop={e => {
                                        if (!dragTypeRef.current || dragId) return
                                        e.preventDefault(); e.stopPropagation()
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right'
                                        onAddBeside(w.id, dragTypeRef.current, side)
                                        dragTypeRef.current = null
                                        setSplitKey(null); setNativeDrag(false)
                                      }}
                                    >
                                      <div
                                        className="cwrap-move-handle"
                                        title="Mantené presionado y arrastrá para mover"
                                        onMouseDown={e => startWidgetDrag(w.id, w.type, e)}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <i className="ti ti-arrows-move" style={{ fontSize: 11, pointerEvents: 'none' }} /> mover
                                      </div>

                                      <WidgetRenderer widget={w} sampleData={sampleData} isSelected={selId === w.id} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} onRemoveField={onRemoveField ? k => onRemoveField(w.id, k) : undefined} />
                                      {(splitKey === `${w.id}:left` || splitKey === `${w.id}:right`) && (
                                        <div className={`split-indicator split-indicator-${splitKey === `${w.id}:left` ? 'left' : 'right'}`} />
                                      )}
                                      <div className="wov">
                                        {i > 0 && (
                                          <button className="wob wob-mv" title="Subir" onClick={e => { e.stopPropagation(); onMove(w.id, -1) }}>
                                            <i className="ti ti-chevron-up" aria-hidden="true" />
                                          </button>
                                        )}
                                        {i < widgets.length - 1 && (
                                          <button className="wob wob-mv" title="Bajar" onClick={e => { e.stopPropagation(); onMove(w.id, 1) }}>
                                            <i className="ti ti-chevron-down" aria-hidden="true" />
                                          </button>
                                        )}
                                        <button className="wob wob-del" title="Eliminar" onClick={e => { e.stopPropagation(); onDelete(w.id) }}>
                                          <i className="ti ti-x" aria-hidden="true" />
                                        </button>
                                      </div>
                                      <ResizeHandle widget={w} onResize={onResize} />
                                    </div>

                                    {/* width divider between adjacent widgets */}
                                    {!isLast && onResizeWidth && (
                                      <WidthDivider widgetA={w} widgetB={nextW} onResizeWidth={onResizeWidth} />
                                    )}
                                  </Fragment>
                                )
                              })}
                            </div>

                            {/* full-width insertion bar after each row (only while reordering) */}
                            {dragActive && (
                              <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={lastIdx} colSpan={4}
                                zoneKey={`bar-${lastIdx}`} variant="bar" hot={hotKey === `bar-${lastIdx}`} />
                            )}
                          </Fragment>
                        )
                      })}

                      {/* trailing zone for palette drops when not reordering */}
                      {!dragActive && (
                        <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={widgets.length - 1} colSpan={4}
                          zoneKey="trailing" variant="slot" />
                      )}
                    </>
                  )
                })()}
          </div>
        </div>
      </div>

      {ghost && (
        <div className="drag-ghost" style={{ left: ghost.x + 12, top: ghost.y + 12 }}>
          <i className="ti ti-arrows-move" style={{ fontSize: 11 }} /> {ghost.label}
        </div>
      )}

      {showSaved && (
        <SavedModal
          onClose={() => setShowSaved(false)}
          getCurrentWidgets={getCurrentWidgets}
          onLoadLayout={onLoadLayout}
        />
      )}

      {showPreview && (() => {
        function renderPreviewContent() {
          return (
            <div className="lcgrid">
              {buildRows(widgets).map(row => {
                const firstW = row.widgets[0]
                const frameVal = firstW.data.rowFrame || 'none'
                const rowCls = `lcrow${frameVal === 'rounded' ? ' lcrow-rounded' : frameVal === 'square' ? ' lcrow-square' : ''}`
                return (
                  <div key={firstW.id + '-prev'} className={rowCls}>
                    {row.widgets.map((w) => (
                      <div key={w.id} style={{ flex: `${w.data.widthFr ?? 1} 1 0`, minWidth: 0, minHeight: w.data.height ? w.data.height + 'px' : undefined }}>
                        <WidgetRenderer widget={w} sampleData={sampleData} isSelected={false} onReorder={onReorder} />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        }
        return (
          <div className="preview-overlay" onClick={() => setShowPreview(false)}>
            {/* Off-screen measure div — content at real paper width, no height cap */}
            <div style={{ position: 'fixed', left: -10000, top: 0, width: paperStyle.w, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
              <div ref={previewMeasureRef} style={{ padding: '12px' }}>
                {renderPreviewContent()}
              </div>
            </div>
            {/* Single page height reference */}
            <div ref={previewPageRef} style={{ position: 'fixed', left: -10000, top: 0, width: paperStyle.w, height: paperStyle.h, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }} />

            <div className="preview-modal" onClick={e => e.stopPropagation()}>
              <div className="preview-bar">
                <span>
                  <i className="ti ti-eye" style={{ fontSize: 13 }} /> Vista previa real
                  {previewNumPages > 1 && (
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>— {previewNumPages} páginas</span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="tbtn pri" onClick={() => window.print()}>
                    <i className="ti ti-download" style={{ fontSize: 12 }} /> Descargar PDF
                  </button>
                  <button className="tbtn" onClick={() => setShowPreview(false)}>
                    <i className="ti ti-x" style={{ fontSize: 12 }} /> Cerrar
                  </button>
                </div>
              </div>

              <div className="preview-scroll">
                {/* Screen: discrete page divs */}
                <div className="preview-pages-visual">
                  {Array.from({ length: previewNumPages }, (_, i) => (
                    <div key={i} className="preview-page-visual" style={{ width: paperStyle.w, height: paperStyle.h }}>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: i === 0 ? 0 : `calc(-${i} * ${paperStyle.h})`, padding: '12px' }}>
                        {renderPreviewContent()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Print-only: single natural-flow paper */}
                <div className="preview-paper preview-paper-print-only" style={{ width: paperStyle.w, minHeight: paperStyle.h }}>
                  {renderPreviewContent()}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
