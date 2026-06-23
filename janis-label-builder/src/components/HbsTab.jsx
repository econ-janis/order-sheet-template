import { genHbs, esc } from '../utils/helpers'

export default function HbsTab({ selWidget }) {
  if (!selWidget) {
    return (
      <div className="parea">
        <div className="pempty">
          <i className="ti ti-code" aria-hidden="true" />
          <p>Seleccioná un widget para ver su HBS</p>
        </div>
      </div>
    )
  }

  const code = genHbs(selWidget)

  return (
    <div className="parea">
      <div className="pgroup">
        <div className="pgt">Código HBS — {selWidget.type}</div>
        <div
          className="codeblock"
          dangerouslySetInnerHTML={{ __html: esc(code) }}
        />
        <button
          className="tbtn"
          style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          onClick={() => navigator.clipboard.writeText(code)}
        >
          <i className="ti ti-copy" style={{ fontSize: 11 }} /> Copiar
        </button>
      </div>
    </div>
  )
}
