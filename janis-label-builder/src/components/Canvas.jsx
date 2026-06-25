import { useRef, useState, useEffect, Fragment } from 'react'
import WidgetRenderer from './WidgetRenderer'
import { genHbs, esc } from '../utils/helpers'

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

/* Resize handle */
function ResizeHandle({ widget, canvasRef, onResize }) {
  const startRef = useRef(null)
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
      const newColSpan = Math.max(1, Math.min(4, Math.round(initColSpan + (e.clientX - startX) / colWidth)))
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
    <div className="resize-handle" onMouseDown={onMouseDown} onClick={e => e.stopPropagation()} title="Redimensionar">
      <i className="ti ti-arrows-diagonal" style={{ fontSize: 9, pointerEvents: 'none' }} />
    </div>
  )
}

function exportHbs(widgets) {
  if (!widgets.length) { alert('Agregá al menos un widget.'); return }
  const body = widgets.map(w => '  ' + genHbs(w).replace(/\n/g, '\n  ')).join('\n\n')
  const full =
    `{{#if order}}\n<div class="label-container" id="pedido-{{root.order.commerceSequentialId}}">\n\n` +
    body + `\n\n</div>\n{{/if}}`
  const win = window.open('', '_blank', 'width=720,height=520')
  win.document.write(
    `<pre style="font-family:monospace;font-size:12px;padding:24px;white-space:pre-wrap;background:#1e1e1e;color:#d4d4d4;min-height:100vh">${esc(full)}</pre>`
  )
}

function buildRowSlots(widgets) {
  const result = []
  let col = 0
  for (const w of widgets) {
    const span = w.data.colSpan ?? 4
    col += span
    const remainder = col % 4
    if (remainder === 0) { result.push(0); col = 0 }
    else { result.push(4 - remainder) }
  }
  return result
}

export default function Canvas({ widgets, selId, sampleData, dragTypeRef, onAdd, onAddBeside, onDelete, onMove, onMoveTo, onSplit, onSelect, onClear, onTemplate, onReorder, onResize, selFieldKey, onFieldSelect }) {
  const sizeRef = useRef(null)
  const canvasRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const [ghost, setGhost] = useState(null)        // {x, y, label}
  const [hotKey, setHotKey] = useState(null)       // which drop zone is highlighted
  const [splitKey, setSplitKey] = useState(null)  // which widget's split zone is hot
  const [nativeDrag, setNativeDrag] = useState(false) // palette drag hovering the canvas
  const [paper, setPaper] = useState('a4')         // current paper size key
  const [showPreview, setShowPreview] = useState(false)
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
      const splitZoneId = el?.getAttribute('data-split-zone') || el?.closest('[data-split-zone]')?.getAttribute('data-split-zone')
      if (splitZoneId && splitZoneId !== id) {
        setSplitKey(splitZoneId)
        dragStateRef.current.splitTarget = splitZoneId
        dragStateRef.current.afterIndex = null
        setHotKey(null)
        return
      }
      setSplitKey(null)
      dragStateRef.current.splitTarget = null
      const zone = el?.closest('.dropzone')
      if (zone) {
        setHotKey(zone.getAttribute('data-zone-key'))
        dragStateRef.current.afterIndex = parseInt(zone.getAttribute('data-after-index'), 10)
        const fs = zone.getAttribute('data-fit-span')
        dragStateRef.current.fitSpan = fs ? parseInt(fs, 10) : null
      } else {
        setHotKey(null)
        dragStateRef.current.afterIndex = null
        dragStateRef.current.fitSpan = null
      }
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      const { id, afterIndex, splitTarget, fitSpan } = dragStateRef.current || {}
      if (splitTarget) onSplit(splitTarget, id)
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
                        className={`cwrap${selId === w.id ? ' sel-ring' : ''}${dragId === w.id ? ' cwrap-dragging' : ''}`}
                        style={{
                          gridColumn: `span ${w.data.colSpan ?? 4}`,
                          minHeight: w.data.height ? w.data.height + 'px' : undefined,
                        }}
                        onClick={e => { e.stopPropagation(); onSelect(w.id) }}
                      >
                        <div
                          className="cwrap-move-handle"
                          title="Mantené presionado y arrastrá para mover"
                          onMouseDown={e => startWidgetDrag(w.id, w.type, e)}
                          onClick={e => e.stopPropagation()}
                        >
                          <i className="ti ti-arrows-move" style={{ fontSize: 11, pointerEvents: 'none' }} /> mover
                        </div>

                        <WidgetRenderer widget={w} sampleData={sampleData} isSelected={selId === w.id} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} />
                        {((dragActive && dragId !== w.id) || nativeDrag) && (
                          <div
                            className={`split-zone${splitKey === w.id ? ' sz-hot' : ''}`}
                            data-split-zone={w.id}
                            onDragOver={e => { if (dragTypeRef.current) { e.preventDefault(); e.stopPropagation(); setSplitKey(w.id) } }}
                            onDragLeave={() => setSplitKey(null)}
                            onDrop={e => {
                              if (dragTypeRef.current) {
                                e.preventDefault(); e.stopPropagation()
                                onAddBeside(w.id, dragTypeRef.current)
                                dragTypeRef.current = null
                                setSplitKey(null); setNativeDrag(false)
                              }
                            }}
                          />
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
                        <ResizeHandle widget={w} canvasRef={canvasRef} onResize={onResize} />
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
