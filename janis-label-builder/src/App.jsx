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

  function addWidget(type, afterIndex = -1) {
    const w = { id: uid(), type, data: JSON.parse(JSON.stringify(WDEF[type])) }
    setWidgets(prev => {
      if (afterIndex < 0 || afterIndex >= prev.length) return [...prev, w]
      const arr = [...prev]
      arr.splice(afterIndex + 1, 0, w)
      return arr
    })
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

  function moveWidgetTo(id, afterIndex) {
    setWidgets(prev => {
      const arr = [...prev]
      const fromIdx = arr.findIndex(w => w.id === id)
      if (fromIdx === -1 || fromIdx === afterIndex) return arr
      const [widget] = arr.splice(fromIdx, 1)
      const insertAt = afterIndex > fromIdx ? afterIndex : afterIndex + 1
      arr.splice(insertAt, 0, widget)
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

  function splitWidgets(targetId, draggedId) {
    setWidgets(prev => {
      const arr = [...prev]
      const fromIdx = arr.findIndex(w => w.id === draggedId)
      const toIdx = arr.findIndex(w => w.id === targetId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return arr
      const [dragged] = arr.splice(fromIdx, 1)
      const newToIdx = arr.findIndex(w => w.id === targetId)
      arr[newToIdx] = { ...arr[newToIdx], data: { ...arr[newToIdx].data, colSpan: 2 } }
      arr.splice(newToIdx + 1, 0, { ...dragged, data: { ...dragged.data, colSpan: 2 } })
      return arr
    })
  }

  function addBeside(targetId, type) {
    const w = { id: uid(), type, data: JSON.parse(JSON.stringify(WDEF[type])) }
    w.data.colSpan = 2
    setWidgets(prev => {
      const arr = [...prev]
      const i = arr.findIndex(x => x.id === targetId)
      if (i === -1) return [...prev, w]
      arr[i] = { ...arr[i], data: { ...arr[i].data, colSpan: 2 } }
      arr.splice(i + 1, 0, w)
      return arr
    })
    setSelId(w.id)
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
        onMoveTo={moveWidgetTo}
        onSplit={splitWidgets}
        onAddBeside={addBeside}
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
