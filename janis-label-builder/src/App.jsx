import { useState, useRef, useEffect } from 'react'
import WidgetList from './components/WidgetList'
import Canvas from './components/Canvas'
import RightPanel from './components/RightPanel'
import TemplateModal from './components/TemplateModal'
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
  const [showTemplateModal, setShowTemplateModal] = useState(widgets.length === 0)
  const dragTypeRef = useRef(null)

  useEffect(() => { setSelFieldKey(null) }, [selId])

  function addWidget(type, afterIndex = -1, fitSpan = null) {
    const w = { id: uid(), type, data: JSON.parse(JSON.stringify(WDEF[type])) }
    if (fitSpan) w.data.colSpan = fitSpan
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

  function moveWidgetTo(id, afterIndex, fitSpan = null) {
    setWidgets(prev => {
      const arr = [...prev]
      const fromIdx = arr.findIndex(w => w.id === id)
      if (fromIdx === -1) return arr
      if (fromIdx === afterIndex) {
        if (fitSpan) arr[fromIdx] = { ...arr[fromIdx], data: { ...arr[fromIdx].data, colSpan: fitSpan } }
        return arr
      }
      let [widget] = arr.splice(fromIdx, 1)
      if (fitSpan) widget = { ...widget, data: { ...widget.data, colSpan: fitSpan } }
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

  function splitWidgets(targetId, draggedId, side = 'right') {
    setWidgets(prev => {
      const arr = [...prev]
      const fromIdx = arr.findIndex(w => w.id === draggedId)
      const toIdx = arr.findIndex(w => w.id === targetId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return arr
      const [dragged] = arr.splice(fromIdx, 1)
      const newToIdx = arr.findIndex(w => w.id === targetId)
      arr[newToIdx] = { ...arr[newToIdx], data: { ...arr[newToIdx].data, colSpan: 2 } }
      const insertAt = side === 'left' ? newToIdx : newToIdx + 1
      arr.splice(insertAt, 0, { ...dragged, data: { ...dragged.data, colSpan: 2 } })
      return arr
    })
  }

  function addBeside(targetId, type, side = 'right') {
    const w = { id: uid(), type, data: JSON.parse(JSON.stringify(WDEF[type])) }
    w.data.colSpan = 2
    setWidgets(prev => {
      const arr = [...prev]
      const i = arr.findIndex(x => x.id === targetId)
      if (i === -1) return [...prev, w]
      arr[i] = { ...arr[i], data: { ...arr[i].data, colSpan: 2 } }
      arr.splice(side === 'left' ? i : i + 1, 0, w)
      return arr
    })
    setSelId(w.id)
  }

  function loadTemplate(tpl) {
    const ws = tpl.widgets.map(w => ({ id: uid(), type: w.type, data: JSON.parse(JSON.stringify(w.data)) }))
    setWidgets(ws)
    setSelId(null)
    setShowTemplateModal(false)
  }

  function clearCanvas() {
    setWidgets([])
    setSelId(null)
    setShowTemplateModal(true)
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
      const firstKey = Object.keys(cols)[0] || 'c0'
      const columns = { ...cols, [firstKey]: [...(cols[firstKey] || []), key] }
      return { ...w, data: { ...w.data, customFields, columns } }
    }))
    setSelFieldKey(key)
  }

  // Click on a helper suggestion: surface the value at the top of the widget
  // (a new custom field holding the helper) AND register the helper as a chip.
  function addHelper(widgetId, helper) {
    let newKey = null
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w
      const extraHbs = [...new Set([...(w.data.extraHbs || []), helper])]
      const cols = w.data.columns
      if (!cols) return { ...w, data: { ...w.data, extraHbs } }   // non-column widget: chip only
      const key = 'custom_' + uid()
      newKey = key
      const customFields = { ...(w.data.customFields || {}), [key]: { content: helper } }
      const firstKey = Object.keys(cols)[0] || 'c0'
      const columns = { ...cols, [firstKey]: [key, ...(cols[firstKey] || [])] }  // prepend = arriba
      return { ...w, data: { ...w.data, customFields, columns, extraHbs } }
    }))
    if (newKey) setSelFieldKey(newKey)
  }

  function updateColCount(id, n) {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w
      const count = Math.max(1, Math.min(6, n))
      const cur = w.data.columns || {}
      const oldCount = Object.keys(cur).length
      const columns = {}
      for (let i = 0; i < count; i++) columns['c' + i] = [...(cur['c' + i] || [])]
      // shrinking: move fields from dropped columns into the last kept one
      if (oldCount > count) {
        const lastKey = 'c' + (count - 1)
        for (let i = count; i < oldCount; i++) columns[lastKey] = [...columns[lastKey], ...(cur['c' + i] || [])]
      }
      return { ...w, data: { ...w.data, colCount: count, columns } }
    }))
  }

  const selWidget = widgets.find(w => w.id === selId) ?? null

  return (
    <div className="builder" id="builder">
      {showTemplateModal && <TemplateModal onSelect={loadTemplate} onClose={() => setShowTemplateModal(false)} />}
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
        onTemplate={() => setShowTemplateModal(true)}
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
        onUpdateColCount={updateColCount}
        onAddHelper={addHelper}
      />
    </div>
  )
}
