import { useState, useRef } from 'react'
import { PLABELS, HBS_BY_TYPE, BUILTIN_FIELDS_BY_TYPE, FIELD_LABELS, WDEF } from '../data/widgetDefs'
import { resolveTemplate } from '../utils/helpers'

const WIDGETS_WITH_COLUMNS = ['header', 'client', 'dispatch', 'footer', 'summary']

function colKeysOf(d) {
  const n = d.colCount ?? Object.keys(d.columns || {}).length ?? 3
  return Array.from({ length: Math.max(1, n) }, (_, i) => 'c' + i)
}

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

function HbsAutocomplete({ hbsList, selWidget, sampleData, onAddHelper, dynamicHbs }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  // Suggestions: widget-specific helpers first, then dynamic from saved JSON, then static list
  const pool = [...new Set([...hbsList, ...(dynamicHbs || []), ...ALL_HBS])]
  const q = query.trim().toLowerCase()
  const suggestions = q ? pool.filter(h => h.toLowerCase().includes(q)) : pool

  function pick(h) {
    if (!h) return
    navigator.clipboard.writeText(h).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1100)
    })
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
          value={copied ? '✓ copiado' : query}
          placeholder="Buscar o escribir helper…"
          autoComplete="off"
          spellCheck={false}
          readOnly={copied}
          onChange={e => { if (!copied) { setQuery(e.target.value); setOpen(true) } }}
          onFocus={() => { if (!copied) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) { pick(suggestions[0] || query.trim()); e.preventDefault() }
            if (e.key === 'Escape') { setQuery(''); setOpen(false) }
          }}
        />
        {query && !copied && (
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

export default function PropsTab({ selWidget, selFieldKey, onUpdateProp, onUpdateFieldStyle, onUpdateCustomField, onUpdateCustomFieldLabel, onUpdateCustomFieldProp, onAddCustomField, onUpdateColCount, onAddHelper, sampleData, dynamicHbs, onUpdateColumnStyle, onRestoreField }) {
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

  // Built-in fields currently absent from all columns (available to restore)
  const allInColumns = Object.values(selWidget.data.columns || {}).flat()
  const removedBuiltinFields = (BUILTIN_FIELDS_BY_TYPE[selWidget.type] || []).filter(k => !allInColumns.includes(k))

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

          {isCustomField && (() => {
            const cf = selWidget.data.customFields?.[selFieldKey] || {}
            const isRect = cf.contentMode === 'rect'
            return (
              <>
                <div className="prow">
                  <label>Nombre</label>
                  <input
                    key={selFieldKey + '_label'}
                    type="text"
                    defaultValue={cf.label || ''}
                    placeholder="Etiqueta del campo"
                    onInput={e => onUpdateCustomFieldLabel(selWidget.id, selFieldKey, e.target.value)}
                  />
                </div>
                <div className="prow prow-inline">
                  <label>Tipo</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className={`fsbtn${!isRect ? ' on' : ''}`}
                      style={{ fontSize: 10, padding: '2px 8px' }}
                      onClick={() => onUpdateCustomFieldProp(selWidget.id, selFieldKey, 'contentMode', 'text')}
                    >Texto</button>
                    <button
                      className={`fsbtn${isRect ? ' on' : ''}`}
                      style={{ fontSize: 10, padding: '2px 8px' }}
                      onClick={() => onUpdateCustomFieldProp(selWidget.id, selFieldKey, 'contentMode', 'rect')}
                    >Rectángulo</button>
                  </div>
                </div>
                {!isRect && (
                  <div className="prow">
                    <label>Contenido</label>
                    <textarea
                      key={selFieldKey}
                      defaultValue={cf.content || ''}
                      data-field-key={selFieldKey}
                      rows={2}
                      style={{ fontSize: 11, padding: '4px 7px', borderRadius: 4, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', width: '100%', resize: 'vertical' }}
                      onInput={e => onUpdateCustomField(selWidget.id, selFieldKey, e.target.value)}
                    />
                  </div>
                )}
                {isRect && (
                  <>
                    <div className="prow">
                      <label>Filas (alto)</label>
                      <input
                        key={selFieldKey + '_rows'}
                        type="number"
                        defaultValue={cf.rectRows || 2}
                        min={1}
                        max={20}
                        onInput={e => onUpdateCustomFieldProp(selWidget.id, selFieldKey, 'rectRows', +e.target.value || 2)}
                      />
                    </div>
                    <div className="prow">
                      <label>Borde color</label>
                      <input
                        key={selFieldKey + '_bc'}
                        type="color"
                        defaultValue={cf.rectBorderColor || '#333333'}
                        onChange={e => onUpdateCustomFieldProp(selWidget.id, selFieldKey, 'rectBorderColor', e.target.value)}
                      />
                    </div>
                    <div className="prow">
                      <label>Grosor (px)</label>
                      <input
                        key={selFieldKey + '_bw'}
                        type="number"
                        defaultValue={cf.rectBorderWidth || 1}
                        min={1}
                        max={10}
                        onInput={e => onUpdateCustomFieldProp(selWidget.id, selFieldKey, 'rectBorderWidth', +e.target.value || 1)}
                      />
                    </div>
                    <div className="prow">
                      <label>Estilo borde</label>
                      <select
                        key={selFieldKey + '_bs'}
                        defaultValue={cf.rectBorderStyle || 'solid'}
                        onChange={e => onUpdateCustomFieldProp(selWidget.id, selFieldKey, 'rectBorderStyle', e.target.value)}
                      >
                        <option value="solid">Sólido</option>
                        <option value="dashed">Guión</option>
                        <option value="dotted">Punteado</option>
                        <option value="double">Doble</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )
          })()}

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
        {Object.entries({ ...(WDEF[selWidget.type] || {}), ...selWidget.data }).map(([k, v]) => {
          if (Array.isArray(v) || (v !== null && typeof v === 'object')) return null
          if (k === 'height' || k === 'colSpan' || k === 'colCount') return null
          if (k === 'imageUrl' && selWidget.data.mode !== 'image' && selWidget.type !== 'logo') return null
          // html widget: render large code textarea for content
          if (k === 'content' && selWidget.type === 'html') {
            return (
              <div key={k} className="prow" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label style={{ marginBottom: 4 }}>Código HTML / JS</label>
                <textarea
                  key={selWidget.id + '_html'}
                  defaultValue={String(v ?? '')}
                  rows={10}
                  spellCheck={false}
                  style={{ fontSize: 10, fontFamily: 'monospace', padding: '4px 7px', borderRadius: 4, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', width: '100%', resize: 'vertical' }}
                  onInput={e => onUpdateProp(selWidget.id, k, e.target.value)}
                />
              </div>
            )
          }
          // barcode widget: value field with HBS chips
          if (k === 'value' && selWidget.type === 'barcode') {
            return (
              <div key={k} className="prow" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label style={{ marginBottom: 4 }}>Valor (HBS)</label>
                <input
                  key={selWidget.id + '_bval'}
                  type="text"
                  defaultValue={String(v ?? '')}
                  style={{ fontFamily: 'monospace', fontSize: 11 }}
                  onInput={e => onUpdateProp(selWidget.id, k, e.target.value)}
                />
                <div className="hbs-chips" style={{ marginTop: 4 }}>
                  {(hbsList).map(h => (
                    <button key={h} className="hbs-chip" title={h}
                      onClick={() => onUpdateProp(selWidget.id, 'value', h)}
                    ><i className="ti ti-copy" /><span>{h}</span></button>
                  ))}
                </div>
              </div>
            )
          }
          if (k === 'format' && selWidget.type === 'barcode') {
            return (
              <div key={k} className="prow">
                <label>Formato</label>
                <select defaultValue={v} onChange={e => onUpdateProp(selWidget.id, k, e.target.value)}>
                  <option value="qr">QR Code</option>
                </select>
              </div>
            )
          }
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

      {/* 3b. Borde del widget products */}
      {selWidget.type === 'products' && (() => {
        const tb = selWidget.data.tableBorder || {}
        const upd = (k, val) => onUpdateProp(selWidget.id, 'tableBorder', { ...selWidget.data.tableBorder, [k]: val })
        return (
          <div className="pgroup">
            <div className="pgt">Borde del widget</div>
            <div className="prow prow-inline">
              <label>Visible</label>
              <input type="checkbox" checked={!!tb.visible} onChange={e => upd('visible', e.target.checked)} />
            </div>
            {tb.visible && (<>
              <div className="prow">
                <label>Color</label>
                <input key={`tb_color_${tb.visible}`} type="color" defaultValue={tb.color || '#cccccc'} style={{ height: 28, padding: '2px 4px', width: '100%' }} onChange={e => upd('color', e.target.value)} />
              </div>
              <div className="prow">
                <label>Tipo</label>
                <select key={`tb_style_${tb.visible}`} defaultValue={tb.style || 'solid'} onChange={e => upd('style', e.target.value)}>
                  <option value="solid">Continua</option>
                  <option value="dashed">Guión</option>
                  <option value="dotted">Punteada</option>
                </select>
              </div>
              <div className="prow">
                <label>Grosor (px)</label>
                <input key={`tb_width_${tb.visible}`} type="number" defaultValue={tb.width || 1} min={1} max={5} onInput={e => upd('width', +e.target.value)} />
              </div>
              <div className="prow">
                <label>Esquinas (px)</label>
                <input key={`tb_radius_${tb.visible}`} type="number" defaultValue={tb.radius ?? 5} min={0} max={24} title="0 = cuadradas, mayor = redondeadas" onInput={e => upd('radius', +e.target.value)} />
              </div>
            </>)}
          </div>
        )
      })()}

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

      {/* 4b. Bordes de columnas */}
      {hasColumns && (
        <div className="pgroup">
          <div className="pgt">Bordes de columnas</div>
          {colKeysOf(selWidget.data).map((col, ci) => {
            const cs = selWidget.data.columnStyles?.[col] || {}
            return (
              <div key={col} className="col-border-row">
                <div className="pgt" style={{ fontSize: 9, marginBottom: 4 }}>Columna {ci + 1}</div>
                <div className="prow prow-inline">
                  <label>Visible</label>
                  <input type="checkbox" checked={!!cs.border} onChange={e => onUpdateColumnStyle(selWidget.id, col, 'border', e.target.checked)} />
                </div>
                {cs.border && (<>
                  <div className="prow">
                    <label>Color</label>
                    <input key={`${col}_color_${cs.border}`} type="color" defaultValue={cs.color || '#cccccc'} style={{ height: 28, padding: '2px 4px', width: '100%' }} onChange={e => onUpdateColumnStyle(selWidget.id, col, 'color', e.target.value)} />
                  </div>
                  <div className="prow">
                    <label>Tipo</label>
                    <select key={`${col}_style_${cs.border}`} defaultValue={cs.style || 'dashed'} onChange={e => onUpdateColumnStyle(selWidget.id, col, 'style', e.target.value)}>
                      <option value="solid">Continua</option>
                      <option value="dashed">Guión</option>
                      <option value="dotted">Punteada</option>
                    </select>
                  </div>
                  <div className="prow">
                    <label>Grosor (px)</label>
                    <input key={`${col}_width_${cs.border}`} type="number" defaultValue={cs.width || 1} min={1} max={5} onInput={e => onUpdateColumnStyle(selWidget.id, col, 'width', +e.target.value)} />
                  </div>
                  <div className="prow">
                    <label>Esquinas (px)</label>
                    <input key={`${col}_radius_${cs.border}`} type="number" defaultValue={cs.radius ?? 5} min={0} max={24} title="0 = cuadradas, mayor = redondeadas" onInput={e => onUpdateColumnStyle(selWidget.id, col, 'radius', +e.target.value)} />
                  </div>
                </>)}
              </div>
            )
          })}
        </div>
      )}

      {/* 4c. Campos eliminados (restore) */}
      {hasColumns && removedBuiltinFields.length > 0 && (
        <div className="pgroup">
          <div className="pgt">Campos eliminados</div>
          <div className="hbs-chips" style={{ marginTop: 4 }}>
            {removedBuiltinFields.map(k => (
              <span
                key={k}
                className="hbsc hbsc-restore"
                title="Volver a agregar"
                onClick={() => onRestoreField?.(selWidget.id, k)}
              >
                <i className="ti ti-plus" style={{ fontSize: 9 }} />
                {FIELD_LABELS[k] || k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Helpers */}
      <div className="pgroup">
        <div className="pgt">Helpers disponibles</div>
        <HbsAutocomplete
          hbsList={hbsList}
          selWidget={selWidget}
          sampleData={sampleData}
          onAddHelper={onAddHelper}
          dynamicHbs={dynamicHbs}
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
