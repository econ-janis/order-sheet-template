import { useState, useRef, useEffect } from 'react'
import WidgetList from './components/WidgetList'
import Canvas from './components/Canvas'
import RightPanel from './components/RightPanel'
import { WDEF } from './data/widgetDefs'
import { SAMPLE_DATA } from './data/sampleData'
import { uid } from './utils/helpers'
import './App.css'

export default function App() {
  const [widgets, setWidgets] = useState([])
  const [selId, setSelId] = useState(null)
  const [selFieldKey, setSelFieldKey] = useState(null)
  const [activeTab, setActiveTab] = useState('props')
  const [sampleData, setSampleData] = useState(() => JSON.parse(JSON.stringify(SAMPLE_DATA)))
  const dragTypeRef = useRef(null)

  useEffect(() => { setSelFieldKey(null) }, [selId])

  function addWidget(type) {
    const w = { id: uid(), type, data: JSON.parse(JSON.stringify(WDEF[type])) }
    setWidgets(prev => [...prev, w])
    setSelId(w.id)
  }

  function deleteWidget(id) {
    setWidgets(prev => prev.filter(w => w.id !== id))
    setSelId(prev => prev === id ? null : prev)
  }

  function moveWidget(id, dir) {
    setWidgets(prev => {
      const arr = [...prev]
      const i = arr.findIndex(w => w.id === id)
      if (i + dir < 0 || i + dir >= arr.length) return arr
      ;[arr[i], arr[i + dir]] = [arr[i + dir], arr[i]]
      return arr
    })
  }

  function updateProp(id, key, val) {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, data: { ...w.data, [key]: val } } : w)
    )
  }

  function reorderField(id, key, newOrder) {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, data: { ...w.data, [key]: newOrder } } : w)
    )
  }

  function resizeWidget(id, colSpan, height) {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, data: { ...w.data, colSpan, height } } : w)
    )
  }

  function clearCanvas() {
    setWidgets([])
    setSelId(null)
  }

  function updateFieldStyle(widgetId, fieldKey, styleKey, val) {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w
      const existing = w.data.fieldStyles?.[fieldKey] || {}
      const fieldStyles = { ...(w.data.fieldStyles || {}), [fieldKey]: { ...existing, [styleKey]: val } }
      return { ...w, data: { ...w.data, fieldStyles } }
    }))
  }

  function updateCustomField(widgetId, fieldKey, content) {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w
      const customFields = { ...(w.data.customFields || {}), [fieldKey]: { content } }
      return { ...w, data: { ...w.data, customFields } }
    }))
  }

  function addCustomField(widgetId) {
    const key = 'custom_' + uid()
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w
      const customFields = { ...(w.data.customFields || {}), [key]: { content: 'Texto nuevo' } }
      const cols = w.data.columns || {}
      const columns = { ...cols, left: [...(cols.left || []), key] }
      return { ...w, data: { ...w.data, customFields, columns } }
    }))
    setSelFieldKey(key)
  }

  const selWidget = widgets.find(w => w.id === selId) ?? null

  return (
    <div className="builder" id="builder">
      <WidgetList dragTypeRef={dragTypeRef} />
      <Canvas
        widgets={widgets}
        selId={selId}
        sampleData={sampleData}
        dragTypeRef={dragTypeRef}
        onAdd={addWidget}
        onDelete={deleteWidget}
        onMove={moveWidget}
        onSelect={setSelId}
        onClear={clearCanvas}
        onReorder={reorderField}
        onResize={resizeWidget}
        selFieldKey={selFieldKey}
        onFieldSelect={setSelFieldKey}
      />
      <RightPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selWidget={selWidget}
        sampleData={sampleData}
        setSampleData={setSampleData}
        onUpdateProp={updateProp}
        selFieldKey={selFieldKey}
        onUpdateFieldStyle={updateFieldStyle}
        onUpdateCustomField={updateCustomField}
        onAddCustomField={addCustomField}
      />
    </div>
  )
}
