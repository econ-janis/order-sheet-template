import { useState, useEffect, useRef } from 'react'
import { genHbs, esc, resolveTemplate } from '../utils/helpers'

const LS_KEY = 'jlb_hbs_editor'

function loadSaved() {
  try { return localStorage.getItem(LS_KEY) || '' } catch { return '' }
}

export default function HbsTab({ selWidget, sampleData }) {
  const [code, setCode] = useState(loadSaved)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, code) } catch {}
  }, [code])

  useEffect(() => {
    if (showPreview !== 'print') return
    const onAfter = () => setShowPreview(false)
    window.addEventListener('afterprint', onAfter)
    const t = setTimeout(() => window.print(), 250)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', onAfter) }
  }, [showPreview])

  function copyCode(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1100)
    })
  }

  const widgetCode = selWidget ? genHbs(selWidget) : null
  const resolved = resolveTemplate(code, sampleData)

  return (
    <div className="parea" style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>

      {/* ── Widget HBS (read-only) ── */}
      {selWidget ? (
        <div className="pgroup">
          <div className="pgt">Código HBS — {selWidget.type}</div>
          <div className="codeblock" style={{ maxHeight: 160, overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: esc(widgetCode) }} />
          <button
            className="tbtn"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            onClick={() => copyCode(widgetCode)}
          >
            <i className="ti ti-copy" style={{ fontSize: 11 }} /> {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ) : (
        <div style={{ padding: '10px 14px 0', fontSize: 10, color: '#9ca3af' }}>
          Seleccioná un widget para ver su código generado.
        </div>
      )}

      {/* ── HBS Editor ── */}
      <div className="pgroup" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="pgt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Editor HBS</span>
          <button
            className="tbtn"
            style={{ fontSize: 9, padding: '2px 7px' }}
            onClick={() => setCode('')}
            title="Limpiar editor"
          >
            <i className="ti ti-trash" style={{ fontSize: 10 }} />
          </button>
        </div>
        <textarea
          className="hbs-editor-textarea"
          spellCheck={false}
          placeholder={'Pegá tu código HBS/HTML aquí…\n\nEjemplo:\n<div style="padding:12px">\n  <b>Pedido:</b> {{order.commerceSequentialId}}\n</div>'}
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
          <button
            className="tbtn"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!code.trim()}
            onClick={() => setShowPreview(true)}
          >
            <i className="ti ti-eye" style={{ fontSize: 11 }} /> Vista previa
          </button>
          <button
            className="tbtn pri"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!code.trim()}
            onClick={() => setShowPreview('print')}
          >
            <i className="ti ti-download" style={{ fontSize: 11 }} /> PDF
          </button>
        </div>
      </div>

      {/* ── Preview modal ── */}
      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          {/* Print-only rendered content */}
          <div
            ref={printRef}
            className="hbs-preview-print"
            dangerouslySetInnerHTML={{ __html: resolved }}
          />
          <div className="preview-modal" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
            <div className="preview-bar">
              <span><i className="ti ti-code" style={{ fontSize: 13 }} /> Vista previa HBS</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="tbtn pri" onClick={() => window.print()}>
                  <i className="ti ti-download" style={{ fontSize: 12 }} /> Descargar PDF
                </button>
                <button className="tbtn" onClick={() => setShowPreview(false)}>
                  <i className="ti ti-x" style={{ fontSize: 12 }} /> Cerrar
                </button>
              </div>
            </div>
            <div className="preview-scroll" style={{ padding: 24 }}>
              <div
                className="hbs-preview-screen"
                dangerouslySetInnerHTML={{ __html: resolved }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
