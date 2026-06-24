import { PLABELS, HBS_BY_TYPE } from '../data/widgetDefs'

function copyText(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.innerHTML
    el.innerHTML = '<i class="ti ti-check" style="font-size:9px"></i> ok'
    setTimeout(() => { el.innerHTML = orig }, 1100)
  })
}

export default function PropsTab({ selWidget, onUpdateProp }) {
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

  return (
    <div className="parea">
      <div className="pgroup">
        <div className="pgt">Widget: {selWidget.type}</div>
        {Object.entries(selWidget.data).map(([k, v]) => {
          if (Array.isArray(v)) return null
          const lbl = PLABELS[k] || k
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
                defaultValue={String(v)}
                onInput={e => onUpdateProp(selWidget.id, k, e.target.value)}
              />
            </div>
          )
        })}
      </div>

      {hbsList.length > 0 && (
        <div className="pgroup">
          <div className="pgt">Helpers disponibles</div>
          <div className="hbs-chips">
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
        </div>
      )}
    </div>
  )
}
