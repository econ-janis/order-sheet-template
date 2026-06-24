import { useRef } from 'react'
import WidgetRenderer from './WidgetRenderer'
import { genHbs, esc } from '../utils/helpers'

const SIZE_MAP = {
  a4:    { minHeight: '600px', maxWidth: '480px' },
  half:  { minHeight: '400px', maxWidth: '380px' },
  label: { minHeight: '260px', maxWidth: '300px' },
}

function DropZone({ dragTypeRef, onAdd, compact }) {
  const ref = useRef(null)
  return (
    <div
      ref={ref}
      className="dropzone"
      style={compact ? { minHeight: 32, margin: 4, gridColumn: 'span 4' } : undefined}
      onDragOver={e => { e.preventDefault(); ref.current.classList.add('over') }}
      onDragLeave={() => ref.current.classList.remove('over')}
      onDrop={e => {
        e.preventDefault()
        ref.current.classList.remove('over')
        if (dragTypeRef.current) {
          onAdd(dragTypeRef.current)
          dragTypeRef.current = null
        }
      }}
    >
      {compact
        ? <span style={{ fontSize: 10, color: '#ccc' }}>+ soltar aquí</span>
        : (
          <div className="empty-c">
            <i className="ti ti-drag-drop" aria-hidden="true" />
            <p>Arrastrá widgets aquí</p>
          </div>
        )}
    </div>
  )
}

/* Resize handle – drag right/left changes colSpan (1-4), drag down/up changes height */
function ResizeHandle({ widget, canvasRef, onResize }) {
  const startRef = useRef(null)

  function onMouseDown(e) {
    e.preventDefault()
    e.stopPropagation()
    const canvasWidth = canvasRef.current?.offsetWidth || 480
    const colWidth = canvasWidth / 4
    startRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initColSpan: widget.data.colSpan ?? 4,
      initHeight: widget.data.height ?? 80,
      colWidth,
    }

    function onMove(e) {
      const { startX, startY, initColSpan, initHeight, colWidth } = startRef.current
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const newColSpan = Math.max(1, Math.min(4, Math.round(initColSpan + dx / colWidth)))
      const newHeight = Math.max(20, Math.round(initHeight + dy))
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
    <div
      className="resize-handle"
      onMouseDown={onMouseDown}
      onClick={e => e.stopPropagation()}
      title="Arrastrar para redimensionar"
    >
      <i className="ti ti-arrows-diagonal" style={{ fontSize: 9, pointerEvents: 'none' }} />
    </div>
  )
}

function exportHbs(widgets) {
  if (!widgets.length) { alert('Agregá al menos un widget.'); return }
  const body = widgets.map(w => '  ' + genHbs(w).replace(/\n/g, '\n  ')).join('\n\n')
  const full =
    `{{#if order}}\n<div class="label-container" id="pedido-{{root.order.commerceSequentialId}}">\n\n` +
    body +
    `\n\n</div>\n{{/if}}`
  const win = window.open('', '_blank', 'width=720,height=520')
  win.document.write(
    `<pre style="font-family:monospace;font-size:12px;padding:24px;white-space:pre-wrap;background:#1e1e1e;color:#d4d4d4;min-height:100vh">${esc(full)}</pre>`
  )
}

export default function Canvas({ widgets, selId, sampleData, dragTypeRef, onAdd, onDelete, onMove, onSelect, onClear, onReorder, onResize, selFieldKey, onFieldSelect }) {
  const sizeRef = useRef(null)
  const canvasRef = useRef(null)

  function onSizeChange(e) {
    const s = SIZE_MAP[e.target.value] || SIZE_MAP.a4
    if (sizeRef.current) {
      sizeRef.current.style.minHeight = s.minHeight
      sizeRef.current.style.maxWidth = s.maxWidth
    }
  }

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
          <div className="lcgrid" ref={canvasRef} onClick={() => onSelect(null)}>
            {widgets.length === 0
              ? <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} />
              : (
                <>
                  {widgets.map((w, i) => (
                    <div
                      key={w.id}
                      className={`cwrap${selId === w.id ? ' sel-ring' : ''}`}
                      style={{
                        gridColumn: `span ${w.data.colSpan ?? 4}`,
                        minHeight: w.data.height ? w.data.height + 'px' : undefined,
                      }}
                      onClick={e => { e.stopPropagation(); onSelect(w.id) }}
                    >
                      <WidgetRenderer widget={w} sampleData={sampleData} isSelected={selId === w.id} onReorder={onReorder} selFieldKey={selFieldKey} onFieldSelect={onFieldSelect} />
                      <div className="wov">
                        {i > 0 && (
                          <button className="wob wob-mv" title="Subir"
                            onClick={e => { e.stopPropagation(); onMove(w.id, -1) }}>
                            <i className="ti ti-chevron-up" aria-hidden="true" />
                          </button>
                        )}
                        {i < widgets.length - 1 && (
                          <button className="wob wob-mv" title="Bajar"
                            onClick={e => { e.stopPropagation(); onMove(w.id, 1) }}>
                            <i className="ti ti-chevron-down" aria-hidden="true" />
                          </button>
                        )}
                        <button className="wob wob-del" title="Eliminar"
                          onClick={e => { e.stopPropagation(); onDelete(w.id) }}>
                          <i className="ti ti-x" aria-hidden="true" />
                        </button>
                      </div>
                      <ResizeHandle widget={w} canvasRef={canvasRef} onResize={onResize} />
                    </div>
                  ))}
                  <DropZone dragTypeRef={dragTypeRef} onAdd={onAdd} compact />
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
