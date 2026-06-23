import { useState } from 'react'
import { SAMPLE_DATA } from '../data/sampleData'

export default function DataTab({ sampleData, setSampleData }) {
  const [status, setStatus] = useState({ ok: true, msg: '✓ JSON válido' })

  function onJsonChange(val) {
    try {
      setSampleData(JSON.parse(val))
      setStatus({ ok: true, msg: '✓ JSON válido' })
    } catch (e) {
      setStatus({ ok: false, msg: '✗ Error: ' + e.message.slice(0, 30) })
    }
  }

  function reset() {
    setSampleData(JSON.parse(JSON.stringify(SAMPLE_DATA)))
    setStatus({ ok: true, msg: '✓ JSON válido' })
  }

  return (
    <div className="json-wrap">
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: '2px 0 4px' }}>
        Editá el JSON y el preview se actualiza en tiempo real.
      </div>
      <div className="json-toolbar">
        <button className="tbtn" style={{ fontSize: 10 }} onClick={reset}>
          <i className="ti ti-refresh" style={{ fontSize: 11 }} /> Reset
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
