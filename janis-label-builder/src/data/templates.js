import { WDEF } from './widgetDefs'

const DEFAULT_LOGO = 'https://cdn.prod.website-files.com/67e2c7fba5fadeb330890b38/67f037ff15cf5ace1eb247d0_Logo_color.svg'

function w(type, overrides = {}) {
  return { type, data: { ...JSON.parse(JSON.stringify(WDEF[type])), ...overrides } }
}

export const TEMPLATES = [
  /* ── 1. Janis ── */
  {
    id: 'janis',
    name: 'Janis',
    tag: 'Completo',
    desc: 'Logo + encabezado, datos del cliente, despacho con slot horario, grilla de productos y footer.',
    widgets: [
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 50, colSpan: 1 }),
      w('header', {
        showOrderNum: true, showDate: true, showControl: true,
        colCount: 2, columns: { c0: [], c1: ['custom_kwndq6'] },
        height: 70, colSpan: 3,
        fieldStyles: { custom_kwndq6: { fontWeight: 'bold', fontSize: 22 } },
        customFields: { custom_kwndq6: { content: '#{{order.commerceId}}', label: 'Orden' } },
        columnStyles: {},
      }),
      w('client', {
        showName: true, showCI: true, showPhone: true, showAddress: true, showPayment: true,
        colCount: 2, columns: { c0: ['name', 'ci', 'phone'], c1: ['address', 'custom_wdiola'] },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: { custom_wdiola: { content: '{{order.addresses.[0].receiverName}}', label: '¿Quién Recibe?' } },
        columnStyles: { c0: { border: true, style: 'solid' }, c1: { border: true, style: 'solid' } },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('dispatch', {
        showLogistic: true, showType: true, showDate: true, showAddress: true,
        bgColor: '#ffffff', accentColor: '#ffffff',
        colCount: 3,
        columns: {
          c0: ['logistic', 'type', 'address'],
          c1: ['custom_vp4t50', 'custom_0rn9fk'],
          c2: ['custom_o2vwgu', 'custom_hltnz1'],
        },
        height: 69, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_vp4t50: { content: '{{formatDate order.shippings.[0].deliveryEstimateDate "dd/MM/yyyy"}}', label: 'Fecha de Entrega' },
          custom_0rn9fk: { content: '{{formatTime order.shippings.[0].deliveryWindow.initialDate}} - {{formatTime order.shippings.[0].deliveryWindow.finalDate}}', label: 'Slot de Entrega' },
          custom_o2vwgu: { content: '{{order.payments.[0].paymentSystemName}}', label: 'Medio de Pago' },
          custom_hltnz1: { content: '{{order.totalAmount}}', label: 'Total' },
        },
        columnStyles: { c0: { border: true, style: 'solid' }, c1: { border: true, style: 'solid' }, c2: { border: true, style: 'solid' } },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('products', {
        showDesc: true, showEan: true, showSubst: true, showPrice: true, showOrigQty: true, showFinalQty: true,
        columnOrder: ['desc', 'ean', 'subst', 'price', 'origQty', 'finalQty'],
        locale: 'es-AR', currency: 'ARS', height: null, colSpan: 4,
        tableBorder: { visible: true },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('footer', {
        message: 'Gracias por tu compra', dark: true, mode: 'columns',
        colCount: 3, columns: { c0: [], c1: ['msg'], c2: [] },
        height: 97, colSpan: 4,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
    ],
    preview: [['logo',1],['header',3],['client',4],['dispatch',4],['products',4],['footer',4]],
  },

  /* ── 2. Janis Simple ── */
  {
    id: 'janis-simple',
    name: 'Janis Simple',
    tag: 'Sin EAN',
    desc: 'Versión simplificada del layout Janis. Sin EAN, sin separadores, despacho con colores de marca.',
    widgets: [
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 50, colSpan: 1 }),
      w('header', {
        showOrderNum: true, showDate: true, showControl: true,
        colCount: 2, columns: { c0: [], c1: ['custom_kwndq6'] },
        height: 70, colSpan: 3,
        fieldStyles: { custom_kwndq6: { fontWeight: 'bold', fontSize: 22 } },
        customFields: { custom_kwndq6: { content: '#{{order.commerceId}}', label: 'Orden' } },
        columnStyles: {},
      }),
      w('client', {
        showName: true, showCI: true, showPhone: true, showAddress: true, showPayment: true,
        colCount: 2, columns: { c0: ['name', 'ci', 'phone'], c1: ['address', 'custom_wdiola'] },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: { custom_wdiola: { content: '{{order.addresses.[0].receiverName}}', label: '¿Quién Recibe?' } },
        columnStyles: { c0: { border: true, style: 'solid' }, c1: { border: true, style: 'solid' } },
      }),
      w('dispatch', {
        showLogistic: true, showType: true, showDate: true, showAddress: true,
        bgColor: '#f0f4ff', accentColor: '#4a6cf7',
        colCount: 3,
        columns: {
          c0: ['logistic', 'type', 'address'],
          c1: ['custom_vp4t50', 'custom_0rn9fk'],
          c2: ['custom_o2vwgu', 'custom_hltnz1'],
        },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_vp4t50: { content: '{{formatDate order.shippings.[0].deliveryEstimateDate "dd/MM/yyyy"}}', label: 'Fecha de Entrega' },
          custom_0rn9fk: { content: '{{formatTime order.shippings.[0].deliveryWindow.initialDate}} - {{formatTime order.shippings.[0].deliveryWindow.finalDate}}', label: 'Slot de Entrega' },
          custom_o2vwgu: { content: '{{order.payments.[0].paymentSystemName}}', label: 'Medio de Pago' },
          custom_hltnz1: { content: '{{order.totalAmount}}', label: 'Total' },
        },
        columnStyles: { c0: { border: true, style: 'solid' }, c1: { border: true, style: 'solid' }, c2: { border: true, style: 'solid' } },
      }),
      w('products', {
        showDesc: true, showEan: false, showSubst: true, showPrice: true, showOrigQty: true, showFinalQty: true,
        columnOrder: ['desc', 'subst', 'price', 'origQty', 'finalQty'],
        locale: 'es-AR', currency: 'ARS', height: null, colSpan: 4,
        tableBorder: { visible: true },
      }),
      w('footer', {
        message: 'Gracias por tu compra', dark: true, mode: 'columns',
        colCount: 3, columns: { c0: [], c1: ['msg'], c2: [] },
        colSpan: 4,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
    ],
    preview: [['logo',1],['header',3],['client',4],['dispatch',4],['products',4],['footer',4]],
  },

  /* ── 3. Chedraui Completo ── */
  {
    id: 'chedraui',
    name: 'Chedraui',
    tag: 'Con Firma',
    desc: 'QR del pedido, info del cliente y entrega, cajas de firma para receptor y repartidor.',
    widgets: [
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 114, colSpan: 1 }),
      w('header', {
        showOrderNum: true, showDate: true, showControl: true,
        colCount: 1, columns: { c0: ['control'] },
        height: 95, colSpan: 1,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
      w('html', { content: '<img src="https://cdn.tools.janis.in/barcode?type=qr&content={{order.id}}">', height: null, colSpan: 2 }),
      w('divider', { style: 'solid', color: '#aaa', colSpan: 4 }),
      w('summary', {
        colCount: 2,
        columns: { c0: ['custom_axk816', 'custom_cnvjpu'], c1: ['custom_pd4enk', 'custom_tly39u'] },
        columnStyles: { c0: { border: true } },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_axk816: { content: '{{order.customer.firstName}} {{order.customer.lastName}}', label: 'Estimado(a)' },
          custom_cnvjpu: { content: '{{order.commerceSequentialId}} {{order.commerceId}}', label: 'El presente es una constancia de entrega de su pedido' },
          custom_pd4enk: { content: '{{order.customer.email}}', label: 'Correo Electrónico' },
          custom_tly39u: { content: '', label: 'Número de consignaciones:' },
        },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('summary', {
        colCount: 3,
        columns: { c0: ['custom_m5ea7t', 'address'], c1: ['clientName', 'logistic'], c2: ['phone'] },
        columnStyles: { c0: { border: true }, c1: { border: true }, c2: { border: true } },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: { custom_m5ea7t: { content: 'Titular', label: 'Usuario' } },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('summary', {
        colCount: 2,
        columns: { c0: ['deliveryDate', 'custom_zlf0tz', 'deliveryType', 'orderNum'], c1: ['payment', 'custom_avfkk1', 'total'] },
        columnStyles: { c0: { border: true }, c1: { border: true } },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_zlf0tz: { content: '{{formatTime order.shippings.[0].deliveryWindow.initialDate}} - {{formatTime order.shippings.[0].deliveryWindow.finalDate}}', label: 'Franja Horaria' },
          custom_avfkk1: { content: '', label: 'Id de Pago' },
        },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('summary', {
        colCount: 2,
        columns: { c0: ['custom_zf4025'], c1: ['custom_okrcdr'] },
        columnStyles: { c0: { border: true }, c1: { border: true } },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_zf4025: { content: '', label: 'Fecha de Entrega', contentMode: 'rect', rectBorderColor: '#858585', rectRows: 1 },
          custom_okrcdr: { content: '', label: 'Hora de Entrega', contentMode: 'rect', rectBorderColor: '#808080', rectRows: 1 },
        },
      }),
      w('summary', {
        colCount: 1,
        columns: { c0: ['custom_auy1na', 'custom_520z81', 'custom_1k5f89', 'custom_w7qltl', 'custom_kjq74h'] },
        columnStyles: { c0: { border: true } },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_auy1na: { content: '', label: 'Nombre de quien recibe', contentMode: 'rect', rectBorderColor: '#6e6e6e', rectRows: 1 },
          custom_520z81: { content: '', label: 'Firma de recibo', contentMode: 'rect', rectBorderColor: '#878787', rectRows: 1 },
          custom_1k5f89: { content: '', label: 'Folio y nombre de la identificación presentada', contentMode: 'rect', rectBorderColor: '#888686', rectRows: 1 },
          custom_w7qltl: { content: '', label: 'Nombre completo del repartidor', contentMode: 'rect', rectBorderColor: '#808080', rectRows: 1 },
          custom_kjq74h: { content: '', label: 'Firma del repartidor', contentMode: 'rect', rectBorderColor: '#858585', rectRows: 1 },
        },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('products', {
        showDesc: true, showEan: true, showSubst: false, showPrice: false, showOrigQty: true, showFinalQty: false,
        columnOrder: ['desc', 'ean', 'origQty'],
        locale: 'es-AR', currency: 'ARS', height: null, colSpan: 4,
        tableBorder: { visible: true },
      }),
    ],
    preview: [['logo',1],['header',1],['html',2],['summary',4],['summary',4],['summary',4],['summary',4],['summary',4],['products',4]],
  },

  /* ── 4. Chedraui Express ── */
  {
    id: 'chedraui-express',
    name: 'Chedraui Express',
    tag: 'Con QR',
    desc: 'QR del pedido, datos del cliente y despacho consolidados. Sin cajas de firma.',
    widgets: [
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 80, colSpan: 1 }),
      w('header', {
        showOrderNum: true, showDate: true, showControl: true,
        colCount: 1, columns: { c0: ['control'] },
        height: 80, colSpan: 1,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
      w('html', { content: '<img src="https://cdn.tools.janis.in/barcode?type=qr&content={{order.id}}">', height: null, colSpan: 2 }),
      w('divider', { style: 'solid', color: '#aaa', colSpan: 4 }),
      w('summary', {
        colCount: 3,
        columns: {
          c0: ['custom_m5ea7t', 'address'],
          c1: ['clientName', 'logistic', 'phone'],
          c2: ['deliveryDate', 'custom_zlf0tz', 'deliveryType'],
        },
        columnStyles: { c0: { border: true }, c1: { border: true }, c2: { border: true } },
        height: null, colSpan: 4,
        fieldStyles: {},
        customFields: {
          custom_m5ea7t: { content: 'Titular', label: 'Usuario' },
          custom_zlf0tz: { content: '{{formatTime order.shippings.[0].deliveryWindow.initialDate}} - {{formatTime order.shippings.[0].deliveryWindow.finalDate}}', label: 'Franja Horaria' },
        },
      }),
      w('divider', { style: 'solid', color: '#e8e8e8', colSpan: 4 }),
      w('products', {
        showDesc: true, showEan: true, showSubst: false, showPrice: false, showOrigQty: true, showFinalQty: false,
        columnOrder: ['desc', 'ean', 'origQty'],
        locale: 'es-AR', currency: 'ARS', height: null, colSpan: 4,
        tableBorder: { visible: true },
      }),
    ],
    preview: [['logo',1],['header',1],['html',2],['summary',4],['products',4]],
  },

  /* ── 5. Tata ── */
  {
    id: 'tata',
    name: 'Tata',
    tag: 'Con Reemplazos',
    desc: 'Resumen completo del pedido, grilla de productos enviados y sección de reemplazos diferenciada.',
    widgets: [
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 100, colSpan: 1 }),
      w('header', {
        showOrderNum: true, showDate: true, showControl: true,
        colCount: 2, columns: { c0: [], c1: ['date', 'control', 'orderNum'] },
        height: 20, colSpan: 3,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
      w('summary', {
        colCount: 3,
        columns: {
          c0: ['orderNum', 'deliveryDate', 'deliveryType', 'payment'],
          c1: ['clientName', 'ci', 'phone', 'address'],
          c2: ['itemCount', 'total'],
        },
        columnStyles: { c0: { border: true, style: 'solid' }, c1: { border: true, style: 'solid' }, c2: { border: true, style: 'solid' } },
        height: null, colSpan: 4,
        fieldStyles: { orderNum: { fontWeight: 'bold' } },
        customFields: {},
      }),
      w('text', { content: 'Productos Enviados', fontSize: 16, fontFamily: '', fontWeight: 'bold', fontStyle: 'normal', color: '#111111', textAlign: 'left', colSpan: 4 }),
      w('products', {
        showDesc: true, showEan: false, showSubst: true, showPrice: true, showOrigQty: true, showFinalQty: true,
        columnOrder: ['desc', 'subst', 'price', 'origQty', 'finalQty'],
        locale: 'es-AR', currency: 'ARS', height: 71, colSpan: 4,
        tableBorder: { visible: true },
      }),
      w('text', { content: 'Reemplazos', fontSize: 16, fontFamily: '', fontWeight: 'bold', fontStyle: 'normal', color: '#111111', textAlign: 'left', colSpan: 4 }),
      w('text', { content: 'Productos Solicitados', fontSize: 12, fontFamily: '', fontWeight: 'normal', fontStyle: 'normal', color: '#111111', textAlign: 'left', colSpan: 2 }),
      w('text', { content: 'Productos Enviados', fontSize: 12, fontFamily: '', fontWeight: 'normal', fontStyle: 'normal', color: '#111111', textAlign: 'left', colSpan: 2 }),
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 84, colSpan: 4 }),
    ],
    preview: [['logo',1],['header',3],['summary',4],['text',4],['products',4],['text',4],['logo',4]],
  },

  /* ── 6. Tata Simple ── */
  {
    id: 'tata-simple',
    name: 'Tata Simple',
    tag: 'Sin Reemplazos',
    desc: 'Resumen del pedido y grilla de productos. Sin la sección de reemplazos.',
    widgets: [
      w('logo', { imageUrl: DEFAULT_LOGO, objectFit: 'contain', bw: false, height: 100, colSpan: 1 }),
      w('header', {
        showOrderNum: true, showDate: true, showControl: true,
        colCount: 2, columns: { c0: [], c1: ['date', 'control', 'orderNum'] },
        height: 20, colSpan: 3,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
      w('summary', {
        colCount: 3,
        columns: {
          c0: ['orderNum', 'deliveryDate', 'deliveryType', 'payment'],
          c1: ['clientName', 'ci', 'phone', 'address'],
          c2: ['itemCount', 'total'],
        },
        columnStyles: { c0: { border: true, style: 'solid' }, c1: { border: true, style: 'solid' }, c2: { border: true, style: 'solid' } },
        height: null, colSpan: 4,
        fieldStyles: { orderNum: { fontWeight: 'bold' } },
        customFields: {},
      }),
      w('text', { content: 'Productos Enviados', fontSize: 16, fontFamily: '', fontWeight: 'bold', fontStyle: 'normal', color: '#111111', textAlign: 'left', colSpan: 4 }),
      w('products', {
        showDesc: true, showEan: false, showSubst: true, showPrice: true, showOrigQty: true, showFinalQty: true,
        columnOrder: ['desc', 'subst', 'price', 'origQty', 'finalQty'],
        locale: 'es-AR', currency: 'ARS', height: null, colSpan: 4,
        tableBorder: { visible: true },
      }),
      w('footer', {
        message: 'Gracias por tu compra', dark: true, mode: 'columns',
        colCount: 3, columns: { c0: [], c1: ['msg'], c2: [] },
        colSpan: 4,
        fieldStyles: {}, customFields: {}, columnStyles: {},
      }),
    ],
    preview: [['logo',1],['header',3],['summary',4],['text',4],['products',4],['footer',4]],
  },
]
