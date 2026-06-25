import { useState, useRef } from 'react'
import { PLABELS, HBS_BY_TYPE } from '../data/widgetDefs'
import { resolveTemplate } from '../utils/helpers'

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

function HbsAutocomplete({ hbsList, selWidget, sampleData, onAddHelper }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  // Suggestions: widget-specific helpers first, then every other available helper
  const pool = [...new Set([...hbsList, ...ALL_HBS])]
  const q = query.trim().toLowerCase()
  const suggestions = q ? pool.filter(h => h.toLowerCase().includes(q)) : pool

  function pick(h) {
    if (!h || !selWidget) return
    onAddHelper(selWidget.id, h)
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
            if (e.key === 'Enter' && query.trim()) { pick(suggestions[0] || query.trim()); e.preventDefault() }
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
          {suggestions.slice(0, 12).map(h => {
            const val = sampleData ? resolveTemplate(h, sampleData) : ''
            const showVal = val && val !== h
            return (
              <div key={h} className="hbs-ac-item" onMouseDown={() => pick(h)}>
                <i className="ti ti-braces" style={{ fontSize: 9, opacity: .5 }} />
                <span className="hbs-ac-expr">{h}</span>
                {showVal && <span className="hbs-ac-val">{val}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PropsTab({ selWidget, selFieldKey, onUpdateProp, onUpdateFieldStyle, onUpdateCustomField, onUpdateCustomFieldLabel, onAddCustomField, onUpdateColCount, onAddHelper, sampleData }) {
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

  const hbsList = [...new Set([...(HBS_BY_TYPE[selWidget.type] || []), ...(selWidget.data.extraHbs || [])])]
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
            <>
              <div className="prow">
                <label>Nombre</label>
                <input
                  key={selFieldKey + '_label'}
                  type="text"
                  defaultValue={selWidget.data.customFields?.[selFieldKey]?.label || ''}
                  placeholder="Etiqueta del campo"
                  onInput={e => onUpdateCustomFieldLabel(selWidget.id, selFieldKey, e.target.value)}
                />
              </div>
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
            </>
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
                  max={48}
                  onInput={e => onUpdateProp(selWidget.id, k, +e.target.value)}
                />
              </div>
            )
          }
          if (k === 'fontFamily') {
            return (
              <div key={k} className="prow">
                <label>{lbl}</label>
                <select defaultValue={v} onChange={e => onUpdateProp(selWidget.id, k, e.target.value)}>
                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            )
          }
          if (k === 'fontWeight') {
            return (
              <div key={k} className="prow prow-inline">
                <label>{lbl}</label>
                <input
                  type="checkbox"
                  defaultChecked={v === 'bold'}
                  onChange={e => onUpdateProp(selWidget.id, k, e.target.checked ? 'bold' : 'normal')}
                />
              </div>
            )
          }
          if (k === 'fontStyle') {
            return (
              <div key={k} className="prow prow-inline">
                <label>{lbl}</label>
                <input
                  type="checkbox"
                  defaultChecked={v === 'italic'}
                  onChange={e => onUpdateProp(selWidget.id, k, e.target.checked ? 'italic' : 'normal')}
                />
              </div>
            )
          }
          if (k === 'textAlign') {
            return (
              <div key={k} className="prow">
                <label>{lbl}</label>
                <select defaultValue={v} onChange={e => onUpdateProp(selWidget.id, k, e.target.value)}>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
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
          selWidget={selWidget}
          sampleData={sampleData}
          onAddHelper={onAddHelper}
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
