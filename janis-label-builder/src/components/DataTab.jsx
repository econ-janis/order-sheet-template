import { useState } from 'react'
import { SAMPLE_DATA } from '../data/sampleData'

const LS_KEY = 'jlb_sample_data'

export default function DataTab({ sampleData, setSampleData }) {
  const [status, setStatus] = useState({ ok: true, msg: '✓ JSON válido' })
  const [dirty, setDirty] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  function onJsonChange(val) {
    try {
      setSampleData(JSON.parse(val))
      setStatus({ ok: true, msg: '✓ JSON válido' })
      setDirty(true)
    } catch (e) {
      setStatus({ ok: false, msg: '✗ ' + e.message.slice(0, 40) })
    }
  }

  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(sampleData))
      setDirty(false)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 1500)
    } catch {
      setStatus({ ok: false, msg: '✗ Error al guardar' })
    }
  }

  function reset() {
    const d = JSON.parse(JSON.stringify(SAMPLE_DATA))
    setSampleData(d)
    localStorage.removeItem(LS_KEY)
    setStatus({ ok: true, msg: '✓ JSON válido' })
    setDirty(false)
  }

  return (
    <div className="json-wrap">
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: '2px 0 4px' }}>
        Los helpers disponibles se actualizan en tiempo real al editar el JSON.
      </div>
      <div className="json-toolbar" style={{ flexWrap: 'wrap' }}>
        <button className="tbtn" style={{ fontSize: 10 }} onClick={reset}>
          <i className="ti ti-refresh" style={{ fontSize: 11 }} /> Reset
        </button>
        <button
          className="tbtn"
          style={{
            fontSize: 10,
            ...(dirty && status.ok ? { background: 'var(--color-accent, #2563eb)', color: '#fff' } : {}),
          }}
          disabled={!status.ok}
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
