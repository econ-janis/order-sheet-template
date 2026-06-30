import { genHbs } from '../utils/helpers'

export default function HbsTab({ selWidget, hbsEditorCode, onHbsEditorChange, onReloadFromCanvas }) {
  const widgetCode = selWidget ? genHbs(selWidget) : null

  return (
    <div className="parea" style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden', height: '100%' }}>

      {/* ── Widget HBS (read-only, only when a widget is selected) ── */}
      {selWidget && (
        <div className="pgroup" style={{ flexShrink: 0 }}>
          <div className="pgt">Código — {selWidget.type}</div>
          <div
            className="codeblock"
            style={{ maxHeight: 120, overflowY: 'auto', fontSize: 9 }}
            dangerouslySetInnerHTML={{ __html: widgetCode.replace(/</g, '&lt;').replace(/>/g, '&gt;') }}
          />
          <button
            className="tbtn"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            onClick={() => navigator.clipboard.writeText(widgetCode)}
          >
            <i className="ti ti-copy" style={{ fontSize: 11 }} /> Copiar widget
          </button>
        </div>
      )}

      {/* ── HBS Editor ── */}
      <div className="pgroup" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="pgt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Editor HBS</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="tbtn"
              style={{ fontSize: 9, padding: '2px 7px' }}
              onClick={onReloadFromCanvas}
              title="Recargar código desde el canvas"
            >
              <i className="ti ti-refresh" style={{ fontSize: 10 }} /> Recargar
            </button>
            <button
              className="tbtn"
              style={{ fontSize: 9, padding: '2px 7px' }}
              onClick={() => onHbsEditorChange('')}
              title="Limpiar editor"
            >
              <i className="ti ti-trash" style={{ fontSize: 10 }} />
            </button>
          </div>
        </div>
        <textarea
          className="hbs-editor-textarea"
          spellCheck={false}
          placeholder={'El código del canvas aparece aquí automáticamente.\n\nPodés editarlo libremente — el canvas se actualiza en tiempo real.\n\nUsá los botones Preview y Descargar PDF de arriba.'}
          value={hbsEditorCode || ''}
          onChange={e => onHbsEditorChange(e.target.value)}
        />
      </div>
    </div>
  )
}
