import { useState, useRef } from 'react'
import { PLABELS, HBS_BY_TYPE } from '../data/widgetDefs'

const WIDGETS_WITH_COLUMNS = ['header', 'client', 'dispatch', 'footer']

const FONT_FAMILIES = [
  { value: '',                          label: 'Por defecto' },
  { value: 'Arial, sans-serif',         label: 'Arial' },
  { value: 'Georgia, serif',            label: 'Georgia' },
  { value: "'Times New Roman', serif",  label: 'Times New Roman' },
  { value: "'Courier New', monospace",  label: 'Courier New' },
]

// All helpers that can be typed freely (union of all widget types)
const ALL_HBS = [...new Set(Object.values(HBS_BY_TYPE).flat())]

function copyText(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.innerHTML
    el.innerHTML = '<i class="ti ti-check" style="font-size:9px"></i> ok'
    setTimeout(() => { el.innerHTML = orig }, 1100)
  })
}

function HbsAutocomplete({ hbsList, selFieldKey, selWidget, onUpdateCustomField }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  // Suggestions: first show widget-specific helpers, then all others
  const pool = [...new Set([...hbsList, ...ALL_HBS])]
  const q = query.trim().toLowerCase()
  const suggestions = q ? pool.filter(h => h.toLowerCase().includes(q)) : pool

  function insertHelper(h) {
    const isCustom = selFieldKey?.startsWith('custom_')
    if (isCustom && selWidget) {
      // Insert at cursor position inside the textarea, or append
      const current = selWidget.data.customFields?.[selFieldKey]?.content || ''
      const ta = document.querySelector('textarea[data-field-key]')
      if (ta && ta.dataset.fieldKey === selFieldKey) {
        const start = ta.selectionStart ?? current.length
        const end = ta.selectionEnd ?? current.length
        const next = current.slice(0, start) + h + current.slice(end)
        onUpdateCustomField(selWidget.id, selFieldKey, next)
        // Restore caret after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + h.length
          ta.focus()
        })
      } else {
        onUpdateCustomField(selWidget.id, selFieldKey, current + h)
      }
    } else {
      navigator.clipboard.writeText(h)
    }
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="hbs-ac-wrap">
      <div className="hbs-ac-input-row">
        <input
          ref={inputRef}
          className="hbs-ac-input"
          value={query}
          placeholder="Buscar o escribir helper…"
          autoComplete="off"
          spellCheck={false}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              const match = suggestions[0] || query.trim()
              insertHelper(match)
              e.preventDefault()
            }
            if (e.key === 'Escape') { setQuery(''); setOpen(false) }
          }}
        />
        {query && (
          <button className="hbs-ac-clear" onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}>
            <i className="ti ti-x" style={{ fontSize: 9 }} />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="hbs-ac-dropdown">
          {suggestions.slice(0, 12).map(h => (
            <div key={h} className="hbs-ac-item" onMouseDown={() => insertHelper(h)}>
              <i className="ti ti-braces" style={{ fontSize: 9, opacity: .5 }} />
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PropsTab({ selWidget, selFieldKey, onUpdateProp, onUpdateFieldStyle, onUpdateCustomField, onAddCustomField, onUpdateColCount, onInsertHelper }) {
  if (!selWidget) {
    return (
      <div className="parea">
        <div className="pempty">
          <i className="ti ti-click" aria-hidden="true" />
          <p>Seleccioná un widget del canvas</p>
        </div>
      </div>
    )
  }

  const hbsList = HBS_BY_TYPE[selWidget.type] || []
  const fieldStyles = selWidget.data.fieldStyles?.[selFieldKey] || {}
  const isCustomField = selFieldKey?.startsWith('custom_')
  const hasColumns = WIDGETS_WITH_COLUMNS.includes(selWidget.type)

  return (
    <div className="parea" key={selWidget.id}>
      {/* 1. Dimensiones */}
      <div className="pgroup">
        <div className="pgt">Dimensiones</div>
        <div className="prow">
          <label>Altura (px)</label>
          <input
            type="number"
            defaultValue={selWidget.data.height || ''}
            min={20}
            placeholder="auto"
            onInput={e => onUpdateProp(selWidget.id, 'height', e.target.value ? +e.target.value : null)}
          />
        </div>
        <div className="prow">
          <label>Ancho (col 1–4)</label>
          <input
            type="number"
            defaultValue={selWidget.data.colSpan ?? 4}
            min={1}
            max={4}
            onInput={e => onUpdateProp(selWidget.id, 'colSpan', Math.max(1, Math.min(4, +e.target.value)))}
          />
        </div>
        {hasColumns && (
          <div className="prow">
            <label>Columnas internas</label>
            <div className="colcount-ctl">
              <button
                className="cc-btn"
                title="Quitar columna"
                disabled={(selWidget.data.colCount ?? 3) <= 1}
                onClick={() => onUpdateColCount(selWidget.id, (selWidget.data.colCount ?? 3) - 1)}
              >−</button>
              <span className="cc-val">{selWidget.data.colCount ?? 3}</span>
              <button
                className="cc-btn"
                title="Agregar columna"
                disabled={(selWidget.data.colCount ?? 3) >= 6}
                onClick={() => onUpdateColCount(selWidget.id, (selWidget.data.colCount ?? 3) + 1)}
              >+</button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Campo seleccionado */}
      {selFieldKey && (
        <div className="pgroup">
          <div className="pgt">Campo: {selFieldKey}</div>

          {isCustomField && (
            <div className="prow">
              <label>Contenido</label>
              <textarea
                key={selFieldKey}
                defaultValue={selWidget.data.customFields?.[selFieldKey]?.content || ''}
                data-field-key={selFieldKey}
                rows={2}
                style={{ fontSize: 11, padding: '4px 7px', borderRadius: 4, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', width: '100%', resize: 'vertical' }}
                onInput={e => onUpdateCustomField(selWidget.id, selFieldKey, e.target.value)}
              />
            </div>
          )}

          <div className="prow">
            <label>Fuente</label>
            <select
              defaultValue={fieldStyles.fontFamily || ''}
              onChange={e => onUpdateFieldStyle(selWidget.id, selFieldKey, 'fontFamily', e.target.value || undefined)}
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="prow">
            <label>Tamaño (px)</label>
            <input
              type="number"
              defaultValue={fieldStyles.fontSize || ''}
              min={8}
              max={48}
              placeholder="heredado"
              onInput={e => onUpdateFieldStyle(selWidget.id, selFieldKey, 'fontSize', e.target.value ? +e.target.value : undefined)}
            />
          </div>

          <div className="field-style-bar">
            <button
              className={`fsbtn${fieldStyles.fontWeight === 'bold' ? ' on' : ''}`}
              onClick={() => onUpdateFieldStyle(selWidget.id, selFieldKey, 'fontWeight', fieldStyles.fontWeight === 'bold' ? 'normal' : 'bold')}
            >
              <b>N</b>
            </button>
            <button
              className={`fsbtn${fieldStyles.fontStyle === 'italic' ? ' on' : ''}`}
              onClick={() => onUpdateFieldStyle(selWidget.id, selFieldKey, 'fontStyle', fieldStyles.fontStyle === 'italic' ? 'normal' : 'italic')}
            >
              <i>I</i>
            </button>
          </div>
        </div>
      )}

      {/* 3. Propiedades */}
      <div className="pgroup">
        <div className="pgt">Widget: {selWidget.type}</div>
        {Object.entries(selWidget.data).map(([k, v]) => {
          if (Array.isArray(v) || (v !== null && typeof v === 'object')) return null
          if (k === 'height' || k === 'colSpan' || k === 'colCount') return null
          if (k === 'imageUrl' && selWidget.data.mode !== 'image' && selWidget.type !== 'logo') return null
          const lbl = PLABELS[k] || k
          if (k === 'objectFit') {
            return (
              <div key={k} className="prow">
                <label>{lbl}</label>
                <select
                  defaultValue={v}
                  onChange={e => onUpdateProp(selWidget.id, k, e.target.value)}
                >
                  <option value="contain">Contener</option>
                  <option value="cover">Cubrir</option>
                  <option value="fill">Estirar</option>
                </select>
              </div>
            )
          }
          if (k === 'mode') {
            return (
              <div key={k} className="prow">
                <label>{lbl}</label>
                <select
                  defaultValue={v}
                  onChange={e => onUpdateProp(selWidget.id, k, e.target.value)}
                >
                  <option value="columns">2 columnas</option>
                  <option value="image">Imagen completa</option>
                </select>
              </div>
            )
          }
          if (typeof v === 'boolean') {
            return (
              <div key={k} className="prow prow-inline">
                <label>{lbl}</label>
                <input
                  type="checkbox"
                  defaultChecked={v}
                  onChange={e => onUpdateProp(selWidget.id, k, e.target.checked)}
                />
              </div>
            )
          }
          if (k === 'bgColor' || k === 'accentColor' || k === 'color') {
            return (
              <div key={k} className="prow">
                <label>{lbl}</label>
                <input
                  type="color"
                  defaultValue={v}
                  style={{ height: 28, padding: '2px 4px', width: '100%' }}
                  onChange={e => onUpdateProp(selWidget.id, k, e.target.value)}
                />
              </div>
            )
          }
          if (k === 'fontSize') {
            return (
              <div key={k} className="prow">
                <label>{lbl}</label>
                <input
                  type="number"
                  defaultValue={v}
                  min={8}
                  max={24}
                  onInput={e => onUpdateProp(selWidget.id, k, +e.target.value)}
                />
              </div>
            )
          }
          return (
            <div key={k} className="prow">
              <label>{lbl}</label>
              <input
                type="text"
                defaultValue={String(v ?? '')}
                onInput={e => onUpdateProp(selWidget.id, k, e.target.value)}
              />
            </div>
          )
        })}
      </div>

      {/* 4. Agregar campo */}
      {hasColumns && (
        <button
          className="tbtn"
          style={{ fontSize: 11, margin: '2px 0' }}
          onClick={() => onAddCustomField(selWidget.id)}
        >
          + Agregar texto
        </button>
      )}

      {/* 5. Helpers */}
      <div className="pgroup">
        <div className="pgt">Helpers disponibles</div>
        <HbsAutocomplete
          hbsList={hbsList}
          selFieldKey={selFieldKey}
          selWidget={selWidget}
          onUpdateCustomField={onUpdateCustomField}
        />
        {hbsList.length > 0 && (
          <div className="hbs-chips" style={{ marginTop: 6 }}>
            {hbsList.map(h => (
              <span
                key={h}
                className="hbsc"
                onClick={e => copyText(h, e.currentTarget)}
              >
                <i className="ti ti-copy" style={{ fontSize: 9 }} />
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
