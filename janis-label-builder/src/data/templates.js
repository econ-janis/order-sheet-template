import { WDEF } from './widgetDefs'

function w(type, overrides = {}) {
  return { type, data: { ...JSON.parse(JSON.stringify(WDEF[type])), ...overrides } }
}

export const TEMPLATES = [
  {
    id: 'clasico',
    name: 'Clásico',
    tag: 'Compacto',
    desc: 'Logo y encabezado lado a lado. Franja de despacho, datos del cliente y tabla de productos.',
    widgets: [
      w('logo',     { colSpan: 2, height: 70 }),
      w('header',   { colSpan: 2 }),
      w('dispatch', { colSpan: 4 }),
      w('client',   { colSpan: 4 }),
      w('products', { colSpan: 4 }),
      w('footer',   { colSpan: 4 }),
    ],
    preview: [['logo',2],['header',2],['dispatch',4],['client',4],['products',4],['footer',4]],
  },
  {
    id: 'documento',
    name: 'Documento',
    tag: 'Membrete',
    desc: 'Logo pequeño a la izquierda y número de pedido grande. Separador visual y sección de firma.',
    widgets: [
      w('logo',     { colSpan: 1, height: 60 }),
      w('header',   { colSpan: 3 }),
      w('divider',  { colSpan: 4, style: 'solid', color: '#aaa' }),
      w('client',   { colSpan: 4 }),
      w('dispatch', { colSpan: 4 }),
      w('products', { colSpan: 4 }),
      w('footer',   { colSpan: 4 }),
    ],
    preview: [['logo',1],['header',3],['divider',4],['client',4],['dispatch',4],['products',4],['footer',4]],
  },
  {
    id: 'operacional',
    name: 'Operacional',
    tag: 'Almacén',
    desc: 'Franja horaria protagonista con colores cálidos. Pensado para operaciones de picking y control de bultos.',
    widgets: [
      w('logo',     { colSpan: 1, height: 60 }),
      w('header',   { colSpan: 3 }),
      w('dispatch', { colSpan: 4, bgColor: '#fff9e6', accentColor: '#d97706' }),
      w('client',   { colSpan: 4 }),
      w('products', { colSpan: 4 }),
      w('divider',  { colSpan: 4, color: '#ccc' }),
      w('footer',   { colSpan: 4, dark: false }),
    ],
    preview: [['logo',1],['header',3],['dispatch',4],['client',4],['products',4],['divider',4],['footer',4]],
  },
  {
    id: 'express',
    name: 'Express',
    tag: 'Minimalista',
    desc: 'Diseño compacto para entregas rápidas. Despacho y cliente lado a lado. Sin tabla de productos.',
    widgets: [
      w('logo',     { colSpan: 2, height: 65 }),
      w('header',   { colSpan: 2 }),
      w('dispatch', { colSpan: 2, bgColor: '#eef2ff', accentColor: '#4a6cf7' }),
      w('client',   { colSpan: 2 }),
      w('footer',   { colSpan: 4, dark: false }),
    ],
    preview: [['logo',2],['header',2],['dispatch',2],['client',2],['footer',4]],
  },
  {
    id: 'bicolumna',
    name: 'Bi-columna',
    tag: 'Moderno',
    desc: 'Header ancho con logo integrado. Despacho e info del cliente en columnas paralelas. Máximo aprovechamiento.',
    widgets: [
      w('logo',     { colSpan: 1, height: 70 }),
      w('header',   { colSpan: 2 }),
      w('dispatch', { colSpan: 1, bgColor: '#f0fdf4', accentColor: '#16a34a' }),
      w('client',   { colSpan: 2 }),
      w('products', { colSpan: 2 }),
      w('divider',  { colSpan: 4 }),
      w('footer',   { colSpan: 4 }),
    ],
    preview: [['logo',1],['header',2],['dispatch',1],['client',2],['products',2],['divider',4],['footer',4]],
  },
  {
    id: 'media-carta',
    name: 'Media Carta',
    tag: 'Etiqueta A5',
    desc: 'Optimizado para impresión en media carta. Toda la info crítica en el menor espacio vertical posible.',
    widgets: [
      w('logo',     { colSpan: 1, height: 55 }),
      w('header',   { colSpan: 3 }),
      w('dispatch', { colSpan: 2, bgColor: '#f8f0ff', accentColor: '#7c3aed' }),
      w('client',   { colSpan: 2 }),
      w('products', { colSpan: 4 }),
      w('footer',   { colSpan: 4, dark: true }),
    ],
    preview: [['logo',1],['header',3],['dispatch',2],['client',2],['products',4],['footer',4]],
  },
]
