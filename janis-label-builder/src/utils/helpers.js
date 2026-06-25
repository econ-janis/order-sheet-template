export function uid() {
  return Math.random().toString(36).slice(2, 8)
}

export function fmtDate(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`
  } catch {
    return isoStr
  }
}

export function fmtCurrency(n, loc, cur) {
  try {
    return new Intl.NumberFormat(loc || 'es-AR', {
      style: 'currency',
      currency: cur || 'ARS',
    }).format(n || 0)
  } catch {
    return '$' + n
  }
}

export function resolveWidgetData(w, sampleData) {
  const d = w.data
  const o = sampleData?.order || {}
  const r = sampleData?.root || {}
  const store = r.store || {}

  // Support both old (clientProfileData/shippingData) and new (customer/shippings/addresses) structures
  const cp = o.customer || o.clientProfileData || {}
  const shipping = (o.shippings || [])[0] || {}
  const sh = o.shippingData || {}
  const addrNew = (o.addresses || [])[0] || shipping.pickupInfo?.address || {}
  const addrOld = sh.address || {}
  const addr = Object.keys(addrNew).length ? addrNew : addrOld
  const lg = (sh.logisticsInfo || [])[0] || {}
  const pay = (o.payments || [])[0] || ((o.paymentData?.transactions || [])[0]?.payments || [])[0] || {}

  const clientName = `${cp.firstName || ''} ${cp.lastName || ''}`.trim() || '—'
  const ci = cp.documentNumber || cp.document || '—'
  const phone = cp.phone || '—'
  const street = addr.streetName || addr.street || ''
  const num = addr.streetNumber || addr.number || ''
  const city = addr.city || ''
  const state = addr.state || ''
  const country = addr.countryCode || addr.country || ''
  const fullAddr = [street && num ? `${street} ${num}` : street || num, city, state, country].filter(Boolean).join(', ') || '—'
  const logistic = shipping.companyName || lg.deliveryCompany || '—'
  const delivType = shipping.type || lg.deliveryChannel || '—'
  const delivDate = fmtDate(shipping.deliveryEstimateDate || lg.shippingEstimateDate)
  const payName = pay.paymentSystemName || '—'
  const creationDate = o.commerceDateCreated || o.creationDate || ''

  if (w.type === 'header') return {
    logoUrl: d.logoUrl || store.logo || '',
    orderNum: o.commerceSequentialId || '—',
    date: fmtDate(creationDate),
    storeName: store.name || '',
  }
  if (w.type === 'client') return {
    name: clientName, ci, phone, address: fullAddr, payment: payName,
  }
  if (w.type === 'dispatch') return {
    logistic, type: delivType, date: delivDate, address: `${street} ${num}`.trim() || '—',
  }
  if (w.type === 'products') return {
    items: o.items || [],
    loc: d.locale || 'es-UY',
    cur: d.currency || o.currency || 'UYU',
    total: (o.items || []).reduce((s, i) => s + ((i.pickingResult?.[0]?.totalQuantity ?? i.quantity ?? 0)), 0),
  }
  if (w.type === 'footer') return {
    name: d.storeName || store.name || 'Mi Tienda',
    phone: d.phone || store.phone || '',
    web: d.website || store.website || '',
    msg: d.message || '',
  }
  if (w.type === 'summary') return {
    orderNum: o.commerceSequentialId || '—',
    date: fmtDate(creationDate),
    total: fmtCurrency(o.totalAmount, 'es-UY', o.currency || 'UYU'),
    clientName, ci, phone, address: fullAddr,
    logistic, deliveryType: delivType, deliveryDate: delivDate,
    payment: payName,
    itemCount: (o.items || []).length,
    storeName: store.name || '—',
    storePhone: store.phone || '—',
  }
  return {}
}

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ── Helper/value resolution against the sample data ──────────────────────────
   Replaces {{ ... }} tokens inside a string with their resolved sample value so
   custom fields can preview the actual value a helper produces. Unknown/complex
   helpers are left as-is. */
function getPath(path, data) {
  const norm = String(path).replace(/\[(\d+)\]/g, '.$1').replace(/^this\./, '').replace(/^\./, '')
  const segs = norm.split('.').filter(Boolean)
  if (!segs.length || /[^\w.\[\]0-9]/.test(norm)) return undefined  // not a real path (e.g. "...")
  let cur = data
  for (const s of segs) {
    if (cur == null) return undefined
    cur = cur[s]
  }
  return cur
}

function resolveExpr(expr, data) {
  const parts = expr.trim().split(/\s+/)
  if (parts.length === 1) return getPath(parts[0], data)
  const [name, arg] = parts
  if (name === 'formatDate') return fmtDate(getPath(arg, data))
  if (name === 'currency') return fmtCurrency(Number(getPath(arg, data)), 'es-AR', 'ARS')
  if (name === 'uppercase') return String(getPath(arg, data) ?? '').toUpperCase()
  if (name === 'count' || name === 'sumArray') { const v = getPath(arg, data); return Array.isArray(v) ? v.length : v }
  // unknown helper: best-effort resolve of its first path argument
  return getPath(arg, data)
}

export function resolveTemplate(str, sampleData) {
  if (!str) return str
  return str.replace(/\{\{([^}]+)\}\}/g, (m, expr) => {
    const v = resolveExpr(expr, sampleData)
    return v == null ? '' : String(v)
  })
}

/* ── Render one row of a column-based widget as HBS HTML ── */
function genColsHbs(d, builtinHbs, builtinLabels, wrapClass, extraStyle) {
  const cols = d.columns || {}
  const n = d.colCount ?? Object.keys(cols).length ?? 2
  const colKeys = Array.from({ length: Math.max(1, n) }, (_, i) => 'c' + i)
  const gridStyle = `display:grid;grid-template-columns:repeat(${colKeys.length},1fr);gap:14px;padding:8px 14px`
  const styleAttr = extraStyle ? `${gridStyle};${extraStyle}` : gridStyle
  let html = `<div class="${wrapClass}" style="${styleAttr}">\n`
  for (const col of colKeys) {
    const cs = (d.columnStyles || {})[col]
    const colStyle = cs?.border
      ? `border:${cs.width || 1}px ${cs.style || 'dashed'} ${cs.color || '#ccc'};border-radius:${cs.rounded !== false ? (cs.radius ?? 5) : 0}px;padding:4px 6px`
      : ''
    html += `  <div class="w-col"${colStyle ? ` style="${colStyle}"` : ''}>\n`
    for (const k of (cols[col] || [])) {
      if (k.startsWith('custom_')) {
        const lbl = d.customFields?.[k]?.label || ''
        const val = d.customFields?.[k]?.content || ''
        html += `    <div class="wcf">${lbl ? `<label>${lbl}</label>` : ''}<span>${val}</span></div>\n`
      } else {
        const lbl = builtinLabels[k]
        const val = builtinHbs[k]
        if (val !== undefined) {
          html += lbl
            ? `    <div class="wcf"><label>${lbl}</label><span>${val}</span></div>\n`
            : `    <span>${val}</span>\n`
        }
      }
    }
    html += `  </div>\n`
  }
  html += `</div>`
  return html
}

export function genHbs(w) {
  const d = w.data

  if (w.type === 'header') {
    return genColsHbs(d, {
      date:     d.showDate     ? `{{formatDate order.commerceDateCreated "dd/MM/yyyy"}}` : undefined,
      control:  d.showControl  ? `Control N°: {{order.commerceSequentialId}}` : undefined,
      orderNum: d.showOrderNum ? `{{order.commerceSequentialId}}` : undefined,
    }, {
      date: 'Fecha de emisión', control: 'Control', orderNum: 'N° factura',
    }, 'w-header w-cols', 'border-bottom:1px solid #eee')
  }

  if (w.type === 'client') {
    return genColsHbs(d, {
      name:    d.showName    ? `{{order.customer.firstName}} {{order.customer.lastName}}` : undefined,
      ci:      d.showCI      ? `{{order.customer.documentNumber}}` : undefined,
      phone:   d.showPhone   ? `{{order.customer.phone}}` : undefined,
      address: d.showAddress ? `{{order.addresses.[0].streetName}} {{order.addresses.[0].streetNumber}}, {{order.addresses.[0].city}}` : undefined,
      payment: d.showPayment ? `{{order.payments.[0].paymentSystemName}}` : undefined,
    }, {
      name: 'Nombre y apellido', ci: 'C.I.', phone: 'Teléfono', address: 'Dirección', payment: 'Forma de pago',
    }, 'w-client w-cols', 'border-bottom:1px solid #f2f2f2')
  }

  if (w.type === 'dispatch') {
    const bg = d.bgColor || '#f0f4ff'
    const ac = d.accentColor || '#4a6cf7'
    return genColsHbs(d, {
      logistic: d.showLogistic ? `{{order.shippings.[0].companyName}}` : undefined,
      type:     d.showType    ? `{{order.shippings.[0].type}}` : undefined,
      date:     d.showDate    ? `{{formatDate order.shippings.[0].deliveryEstimateDate "dd/MM/yyyy"}}` : undefined,
      address:  d.showAddress ? `{{order.addresses.[0].streetName}} {{order.addresses.[0].streetNumber}}` : undefined,
    }, {
      logistic: 'Logística', type: 'Tipo', date: 'Fecha entrega', address: 'Dirección',
    }, 'w-dispatch w-cols', `background:${bg};border-top:2px solid ${ac};border-bottom:2px solid ${ac}`)
  }

  if (w.type === 'products') return (
    `<table class="w-products">\n  <thead><tr>\n` +
    `    <th>Descripción</th>\n` +
    (d.showSubst ? '    <th>Sust.</th>\n' : '') +
    (d.showPrice ? '    <th>Precio</th>\n' : '') +
    (d.showOrigQty ? '    <th>C. orig</th>\n' : '') +
    (d.showFinalQty ? '    <th>C. final</th>\n' : '') +
    `  </tr></thead>\n  <tbody>\n  {{#each order.items}}\n    <tr>\n      <td>{{name}}</td>\n` +
    (d.showSubst ? '      <td>{{#if isSubstituted}}Sí{{else}}-{{/if}}</td>\n' : '') +
    (d.showPrice ? `      <td>{{currency purchasedPrice locale="${d.locale}" currencyCode="${d.currency}"}}</td>\n` : '') +
    (d.showOrigQty ? '      <td>{{purchasedQuantity}}</td>\n' : '') +
    (d.showFinalQty ? '      <td>{{quantity}}</td>\n' : '') +
    `    </tr>\n  {{/each}}\n    <tr class="total">\n      <td>Total enviados</td>\n      <td>{{sumArray order.items "quantity"}}</td>\n    </tr>\n  </tbody>\n</table>`
  )

  if (w.type === 'footer') {
    const bg = d.dark ? '#1a1a1a' : '#f8f8f8'
    return genColsHbs(d, {
      name:  `{{root.store.name}}`,
      phone: `{{root.store.phone}}`,
      web:   `{{root.store.website}}`,
      msg:   d.message || '',
    }, {
      name: '', phone: 'Tel.', web: '', msg: '',
    }, 'w-footer w-cols', `background:${bg}`)
  }

  if (w.type === 'summary') {
    return genColsHbs(d, {
      orderNum:     '{{order.commerceSequentialId}}',
      date:         '{{formatDate order.commerceDateCreated "dd/MM/yyyy"}}',
      total:        '{{currency order.totalAmount locale="es-UY" currencyCode="UYU"}}',
      clientName:   '{{order.customer.firstName}} {{order.customer.lastName}}',
      ci:           '{{order.customer.documentNumber}}',
      phone:        '{{order.customer.phone}}',
      address:      '{{order.addresses.[0].streetName}} {{order.addresses.[0].streetNumber}}, {{order.addresses.[0].city}}, {{order.addresses.[0].state}}',
      logistic:     '{{order.shippings.[0].companyName}}',
      deliveryType: '{{order.shippings.[0].type}}',
      deliveryDate: '{{formatDate order.shippings.[0].deliveryEstimateDate "dd/MM/yyyy"}}',
      payment:      '{{order.payments.[0].paymentSystemName}}',
      itemCount:    '{{count order.items}}',
      storeName:    '{{root.store.name}}',
      storePhone:   '{{root.store.phone}}',
    }, {
      orderNum: 'N° de Pedido', date: 'Fecha creación', total: 'Total', clientName: 'Nombre y apellido',
      ci: 'C.I.', phone: 'Teléfono', address: 'Dirección', logistic: 'Logística',
      deliveryType: 'Tipo envío', deliveryDate: 'Fecha entrega', payment: 'Forma de pago',
      itemCount: 'Cant. ítems', storeName: 'Tienda', storePhone: 'Tel. tienda',
    }, 'w-summary w-cols', '')
  }

  if (w.type === 'logo') return (
    `<div class="w-logo-widget" style="height:${d.height ?? 100}px">\n` +
    `  <img src="${d.imageUrl || ''}" alt="Logo" style="width:100%;height:100%;object-fit:${d.objectFit || 'contain'};${d.bw ? 'filter:grayscale(1);' : ''}">\n` +
    `</div>`
  )

  if (w.type === 'divider') return `<div class="w-divider"><hr style="border:none;border-top:1px ${d.style} ${d.color};"></div>`

  if (w.type === 'text') {
    const styles = [`font-size:${d.fontSize}px`]
    if (d.fontFamily) styles.push(`font-family:${d.fontFamily}`)
    if (d.fontWeight && d.fontWeight !== 'normal') styles.push(`font-weight:${d.fontWeight}`)
    if (d.fontStyle && d.fontStyle !== 'normal') styles.push(`font-style:${d.fontStyle}`)
    if (d.color && d.color !== '#111111') styles.push(`color:${d.color}`)
    if (d.textAlign && d.textAlign !== 'left') styles.push(`text-align:${d.textAlign}`)
    return `<div class="w-text" style="${styles.join(';')}">${d.content}</div>`
  }
  return ''
}
