import { WIDGET_TYPES } from '../data/widgetDefs'

export default function WidgetList({ dragTypeRef }) {
  return (
    <div className="panel panel-left">
      <div className="ph">Widgets</div>
      <div className="scroll">
        <div className="wlist">
          {WIDGET_TYPES.map(({ type, icon, name, sub, hbs }) => (
            <div
              key={type}
              className="wchip"
              draggable
              onDragStart={e => {
                dragTypeRef.current = type
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onDragEnd={() => { dragTypeRef.current = null }}
            >
              <i className={icon} aria-hidden="true" />
              <div className="wchip-info">
                <span className="wchip-name">{name}</span>
                <span className="wchip-sub">{sub}</span>
                {hbs && <span className="wchip-hbs">{hbs}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
