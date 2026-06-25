import { TEMPLATES } from '../data/templates'

const W_COLOR = {
  logo:     { bg: '#fed7aa', text: '#9a3412', label: 'Logo' },
  header:   { bg: '#bfdbfe', text: '#1e40af', label: 'Header' },
  dispatch: { bg: '#ddd6fe', text: '#5b21b6', label: 'Despacho' },
  client:   { bg: '#bbf7d0', text: '#166534', label: 'Cliente' },
  products: { bg: '#e5e7eb', text: '#374151', label: 'Productos' },
  footer:   { bg: '#374151', text: '#f9fafb', label: 'Footer' },
  divider:  { bg: '#e5e7eb', text: '#9ca3af', label: '—' },
  text:     { bg: '#fef9c3', text: '#854d0e', label: 'Texto' },
}

function LayoutPreview({ preview }) {
  return (
    <div className="tpl-preview-grid">
      {preview.map(([type, span], i) => {
        const c = W_COLOR[type] || W_COLOR.text
        return (
          <div
            key={i}
            className={`tpl-preview-block${type === 'divider' ? ' tpb-divider' : ''}`}
            style={{ gridColumn: `span ${span}`, background: c.bg, color: c.text }}
          >
            {type !== 'divider' && c.label}
          </div>
        )
      })}
    </div>
  )
}

export default function TemplateModal({ onSelect, onClose }) {
  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="tpl-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-bar">
          <span><i className="ti ti-layout-grid" style={{ fontSize: 14 }} /> Elegí un template para empezar</span>
          <button className="tbtn" onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 12 }} /> Cerrar
          </button>
        </div>
        <div className="tpl-scroll">
          <div className="tpl-grid">
            {TEMPLATES.map(tpl => (
              <div key={tpl.id} className="tpl-card" onClick={() => onSelect(tpl)}>
                <span className="tpl-tag">{tpl.tag}</span>
                <LayoutPreview preview={tpl.preview} />
                <div className="tpl-footer">
                  <div className="tpl-name">{tpl.name}</div>
                  <div className="tpl-desc">{tpl.desc}</div>
                  <button className="tbtn pri tpl-btn">Usar plantilla →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
