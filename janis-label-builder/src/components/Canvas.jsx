import { useRef, useState, useEffect, Fragment } from 'react'
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

/* Resize handle — corner is 'se' (bottom-right) or 'sw' (bottom-left) */
function ResizeHandle({ widget, canvasRef, onResize, corner = 'se' }) {
  const startRef = useRef(null)
  const dir = corner === 'sw' ? -1 : 1   // which way widening the column count goes
  function onMouseDown(e) {
    e.preventDefault(); e.stopPropagation()
    const canvasWidth = canvasRef.current?.offsetWidth || 480
    const colWidth = canvasWidth / 4
    startRef.current = {
      startX: e.clientX, startY: e.clientY,
      initColSpan: widget.data.colSpan ?? 4,
      initHeight: widget.data.height ?? 80, colWidth,
    }
    function onMove(e) {
      const { startX, startY, initColSpan, initHeight, colWidth } = startRef.current
      const newColSpan = Math.max(1, Math.min(4, Math.round(initColSpan + dir * (e.clientX - startX) / colWidth)))
      const newHeight = Math.max(20, Math.round(initHeight + (e.clientY - startY)))
      onResize(widget.id, newColSpan, newHeight)
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
    <div className={`resize-handle rh-${corner}`} onMouseDown={onMouseDown} onClick={e => e.stopPropagation()} title="Redimensionar">
      <i className={`ti ${corner === 'sw' ? 'ti-arrows-diagonal-2' : 'ti-arrows-diagonal'}`} style={{ fontSize: 9, pointerEvents: 'none' }} />
    </div>
  )
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
.w-products tr.total td { font-weight: 500; border-top: 1px solid #eee; }
.w-footer { padding: 7px 14px; display: flex; align-items: center; justify-content: space-between; }
.w-text { padding: 8px 14px; word-break: break-word; }
.w-divider { padding: 3px 14px; }
.w-divider hr { border: none; }
.summary { padding: 8px 14px; }
.summary-col { display: flex; flex-direction: column; gap: 4px; }
`

function exportHbs(widgets) {
  if (!widgets.length) { alert('Agregá al menos un widget.'); return }
  const body = widgets.map(w => '  ' + genHbs(w).replace(/\n/g, '\n  ')).join('\n\n')
  const hbsContent =
    `{{#if order}}\n<div class="label-container lcgrid" id="pedido-{{order.commerceSequentialId}}">\n\n` +
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

export default function Canvas({ widgets, selId, sampleData, dragTypeRef, onAdd, onAddBeside, onDelete, onMove, onMoveTo, onSplit, onSelect, onClear, onTemplate, onReorder, onResize, selFieldKey, onFieldSelect, onRemoveField, onLoadLayout, getCurrentWidgets }) {
  const sizeRef = useRef(null)
  const canvasRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const [ghost, setGhost] = useState(null)        // {x, y, label}
  const [hotKey, setHotKey] = useState(null)       // which drop zone is highlighted
  const [splitKey, setSplitKey] = useState(null)  // which widget's split zone is hot
  const [nativeDrag, setNativeDrag] = useState(false) // palette drag hovering the canvas
  const [paper, setPaper] = useState('a4')
  const [showPreview, setShowPreview] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
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
  const paperStyle = SIZE_MAP[paper] || SIZE_MAP.a4

  return (
    <div className="panel panel-center">
      <div className="ctoolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select className="sz-select" value={paper} onChange={onSizeChange}>
            <option value="a4">A4</option>
            <option value="half">Media carta</option>
            <option value="label">Etiqueta 10×15</option>
          </select>
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
              : (
                <>
                  {/* insertion bar before the first widget (only while reordering) */}
                  {dragActive && (
                    <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={-1} colSpan={4}
                      zoneKey="bar--1" variant="bar" hot={hotKey === 'bar--1'} />
                  )}

                  {widgets.map((w, i) => (
                    <Fragment key={w.id}>
                      <div
                        data-cwrap-id={w.id}
                        className={`cwrap${selId === w.id ? ' sel-ring' : ''}${dragId === w.id ? ' cwrap-dragging' : ''}${splitKey === `${w.id}:left` ? ' cwrap-split-left' : ''}${splitKey === `${w.id}:right` ? ' cwrap-split-right' : ''}`}
                        style={{
                          gridColumn: `span ${w.data.colSpan ?? 4}`,
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
                        {/* Beside-drop indicator: pointer-events:none so it never steals hit-testing */}
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
                        <ResizeHandle widget={w} canvasRef={canvasRef} onResize={onResize} corner="se" />
                        <ResizeHandle widget={w} canvasRef={canvasRef} onResize={onResize} corner="sw" />
                      </div>

                      {/* leftover-space slot in the same row (palette + horizontal placement) */}
                      {rowSlots[i] > 0 && (
                        <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={i} colSpan={rowSlots[i]} fitSpan={rowSlots[i]}
                          zoneKey={`slot-${i}`} variant="slot" hot={hotKey === `slot-${i}`} />
                      )}

                      {/* full-width insertion bar after each widget (only while reordering) */}
                      {dragActive && (
                        <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={i} colSpan={4}
                          zoneKey={`bar-${i}`} variant="bar" hot={hotKey === `bar-${i}`} />
                      )}
                    </Fragment>
                  ))}

                  {/* trailing zone for palette drops when not reordering */}
                  {!dragActive && (
                    <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={widgets.length - 1} colSpan={4}
                      zoneKey="trailing" variant="slot" />
                  )}
                </>
              )}
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

      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-bar">
              <span><i className="ti ti-eye" style={{ fontSize: 13 }} /> Vista previa real</span>
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
              <div className="preview-paper" style={{ width: paperStyle.w, minHeight: paperStyle.h }}>
                <div className="lcgrid">
                  {widgets.map((w, i) => (
                    <Fragment key={w.id}>
                      <div style={{ gridColumn: `span ${w.data.colSpan ?? 4}`, minHeight: w.data.height ? w.data.height + 'px' : undefined }}>
                        <WidgetRenderer widget={w} sampleData={sampleData} isSelected={false} onReorder={onReorder} />
                      </div>
                      {rowSlots[i] > 0 && <div style={{ gridColumn: `span ${rowSlots[i]}` }} />}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
