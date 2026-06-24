import { useRef, useState, Fragment } from 'react'
import WidgetRenderer from './WidgetRenderer'
import { genHbs, esc } from '../utils/helpers'

const SIZE_MAP = {
  a4:    { minHeight: '600px', maxWidth: '480px' },
  half:  { minHeight: '400px', maxWidth: '380px' },
  label: { minHeight: '260px', maxWidth: '300px' },
}

/* Drop zone: accepts native palette drags (onDrop) and is detected by pointer drags
   via data-after-index + elementFromPoint. */
function DropZone({ dragTypeRef, onAdd, afterIndex = -1, colSpan = 4, zoneKey, variant, hot }) {
  const ref = useRef(null)
  const [over, setOver] = useState(false)

  function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); setOver(true) }
  function handleDragLeave(e) { if (!ref.current?.contains(e.relatedTarget)) setOver(false) }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation(); setOver(false)
    if (dragTypeRef.current) { onAdd(dragTypeRef.current, afterIndex); dragTypeRef.current = null }
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

export default function Canvas({ widgets, selId, sampleData, dragTypeRef, onAdd, onDelete, onMove, onMoveTo, onSelect, onClear, onReorder, onResize, selFieldKey, onFieldSelect }) {
  const sizeRef = useRef(null)
  const canvasRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const [ghost, setGhost] = useState(null)        // {x, y, label}
  const [hotKey, setHotKey] = useState(null)       // which drop zone is highlighted
  const dragStateRef = useRef(null)

  function onSizeChange(e) {
    const s = SIZE_MAP[e.target.value] || SIZE_MAP.a4
    if (sizeRef.current) {
      sizeRef.current.style.minHeight = s.minHeight
      sizeRef.current.style.maxWidth = s.maxWidth
    }
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
      const zone = el?.closest('.dropzone')
      if (zone) {
        setHotKey(zone.getAttribute('data-zone-key'))
        dragStateRef.current.afterIndex = parseInt(zone.getAttribute('data-after-index'), 10)
      } else {
        setHotKey(null)
        dragStateRef.current.afterIndex = null
      }
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      const { id, afterIndex } = dragStateRef.current || {}
      if (afterIndex !== null && afterIndex !== undefined) onMoveTo(id, afterIndex)
      dragStateRef.current = null
      setDragId(null); setGhost(null); setHotKey(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const rowSlots = buildRowSlots(widgets)
  const dragActive = dragId !== null

  return (
    <div className="panel panel-center">
      <div className="ctoolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select className="sz-select" onChange={onSizeChange}>
            <option value="a4">A4</option>
            <option value="half">Media carta</option>
            <option value="label">Etiqueta 10×15</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="tbtn" onClick={onClear}>
            <i className="ti ti-trash" style={{ fontSize: 12 }} aria-hidden="true" /> Limpiar
          </button>
          <button className="tbtn pri" onClick={() => exportHbs(widgets)}>
            <i className="ti ti-code" style={{ fontSize: 12 }} aria-hidden="true" /> Exportar HBS
          </button>
        </div>
      </div>

      <div className="carea">
        <div className="lcanvas" ref={sizeRef}>
          <div className={`lcgrid${dragActive ? ' grid-dragging' : ''}`} ref={canvasRef} onClick={() => onSelect(null)}>
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
                        <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} afterIndex={i} colSpan={rowSlots[i]}
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
    </div>
  )
}
