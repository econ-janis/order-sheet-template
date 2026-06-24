import PropsTab from './PropsTab'
import DataTab from './DataTab'
import HbsTab from './HbsTab'

const TABS = [
  { id: 'props', label: 'Propiedades' },
  { id: 'data',  label: 'Datos ejemplo' },
  { id: 'hbs',   label: 'HBS' },
]

export default function RightPanel({ activeTab, setActiveTab, selWidget, sampleData, setSampleData, onUpdateProp, selFieldKey, onUpdateFieldStyle, onUpdateCustomField, onAddCustomField }) {
  return (
    <div className="panel panel-right">
      <div className="tab-row">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`tab${activeTab === t.id ? ' on' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {activeTab === 'props' && (
          <PropsTab
            selWidget={selWidget}
            selFieldKey={selFieldKey}
            onUpdateProp={onUpdateProp}
            onUpdateFieldStyle={onUpdateFieldStyle}
            onUpdateCustomField={onUpdateCustomField}
            onAddCustomField={onAddCustomField}
          />
        )}
        {activeTab === 'data' && (
          <DataTab sampleData={sampleData} setSampleData={setSampleData} />
        )}
        {activeTab === 'hbs' && (
          <HbsTab selWidget={selWidget} />
        )}
      </div>
    </div>
  )
}
