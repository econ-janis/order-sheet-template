import { useState, useRef } from 'react'
import { SAMPLE_DATA } from '../data/sampleData'

const LS_KEY = 'jlb_sample_data'

export default function DataTab({ sampleData, setSampleData, onSaveData }) {
  const [status, setStatus] = useState({ ok: true, msg: '✓ JSON válido' })
  const [dirty, setDirty] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const pendingRef = useRef(null)

  function onJsonChange(val) {
    try {
      pendingRef.current = JSON.parse(val)
      setSampleData(pendingRef.current)
      setStatus({ ok: true, msg: '✓ JSON válido' })
      setDirty(true)
    } catch (e) {
      pendingRef.current = null
      setStatus({ ok: false, msg: '✗ Error: ' + e.message.slice(0, 40) })
      setDirty(false)
    }
  }

  function save() {
    if (!pendingRef.current && status.ok) pendingRef.current = sampleData
    if (!pendingRef.current) return
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(pendingRef.current))
      onSaveData?.(pendingRef.current)
      setDirty(false)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 1500)
    } catch (e) {
      setStatus({ ok: false, msg: '✗ Error al guardar' })
    }
  }

  function reset() {
    const d = JSON.parse(JSON.stringify(SAMPLE_DATA))
    pendingRef.current = d
    setSampleData(d)
    localStorage.removeItem(LS_KEY)
    onSaveData?.(d)
    setStatus({ ok: true, msg: '✓ JSON válido' })
    setDirty(false)
  }

  return (
    <div className="json-wrap">
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: '2px 0 4px' }}>
        Editá el JSON y guardá para actualizar los helpers disponibles.
      </div>
      <div className="json-toolbar">
        <button className="tbtn" style={{ fontSize: 10 }} onClick={reset}>
          <i className="ti ti-refresh" style={{ fontSize: 11 }} /> Reset
        </button>
        <button
          className="tbtn"
          style={{ fontSize: 10, background: dirty ? 'var(--color-accent, #2563eb)' : undefined, color: dirty ? '#fff' : undefined }}
          disabled={!dirty && !status.ok}
          onClick={save}
        >
          <i className="ti ti-device-floppy" style={{ fontSize: 11 }} />
          {savedMsg ? ' ✓ Guardado' : ' Guardar'}
        </button>
        <span className={`json-status ${status.ok ? 'json-ok' : 'json-err'}`}>{status.msg}</span>
      </div>
      <textarea
        className="json-ta"
        spellCheck={false}
        defaultValue={JSON.stringify(sampleData, null, 2)}
        key={JSON.stringify(sampleData)}
        onInput={e => onJsonChange(e.target.value)}
      />
    </div>
  )
}
