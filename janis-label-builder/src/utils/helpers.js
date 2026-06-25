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
  const o = sampleData.order || {}
  const r = sampleData.root || {}
  const cp = o.clientProfileData || {}
  const sh = o.shippingData || {}
  const addr = sh.address || {}
  const lg = (sh.logisticsInfo || [])[0] || {}
  const pay = ((o.paymentData || {}).transactions || [])[0] || {}
  const payName = ((pay.payments || [])[0] || {}).paymentSystemName || ''

  if (w.type === 'header') return {
    logoUrl: d.logoUrl || (r.store || {}).logo || '',
    orderNum: o.commerceSequentialId || '—',
    date: fmtDate(o.creationDate),
    storeName: (r.store || {}).name || '',
  }
  if (w.type === 'client') return {
    name: `${cp.firstName || ''} ${cp.lastName || ''}`.trim() || '—',
    ci: cp.document || '—',
    phone: cp.phone || '—',
    address: `${addr.street || ''} ${addr.number || ''}, ${addr.city || ''}, ${addr.state || ''}, ${addr.country || ''}`,
    payment: payName || '—',
  }
  if (w.type === 'dispatch') return {
    logistic: lg.deliveryCompany || '—',
    type: lg.deliveryChannel || '—',
    date: fmtDate(lg.shippingEstimateDate),
    address: `${addr.street || ''} ${addr.number || ''}`,
  }
  if (w.type === 'products') return {
    items: o.items || [],
    loc: d.locale || 'es-AR',
    cur: d.currency || 'ARS',
    total: (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0),
  }
  if (w.type === 'footer') return {
    name: d.storeName || (r.store || {}).name || 'Mi Tienda',
    phone: d.phone || (r.store || {}).phone || '',
    web: d.website || (r.store || {}).website || '',
    msg: d.message || '',
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
    return v == null || v === '' ? m : String(v)
  })
}

export function genHbs(w) {
  const d = w.data
  if (w.type === 'header') return (
    `<div class="header">\n` +
    `  <img src="${d.logoUrl || '{{root.store.logo}}'}" alt="Logo">\n` +
    `  <div>\n` +
    (d.showDate ? `    <span>{{formatDate order.creationDate "dd/MM/yyyy"}}</span>\n` : '') +
    (d.showControl ? `    <span>Control N°: {{order.commerceSequentialId}}</span>\n` : '') +
    `  </div>\n</div>`
  )
  if (w.type === 'client') return (
    `<div class="client-info">\n` +
    (d.showName ? `  <p>{{order.clientProfileData.firstName}} {{order.clientProfileData.lastName}}</p>\n` : '') +
    (d.showCI ? `  <p>CI: {{order.clientProfileData.document}}</p>\n` : '') +
    (d.showPhone ? `  <p>{{order.clientProfileData.phone}}</p>\n` : '') +
    (d.showAddress ? `  <p>{{order.shippingData.address.street}} {{order.shippingData.address.number}}, {{order.shippingData.address.city}}</p>\n` : '') +
    `</div>`
  )
  if (w.type === 'dispatch') return (
    `<div class="dispatch">\n` +
    (d.showLogistic ? `  <span>{{order.shippingData.logisticsInfo.[0].deliveryCompany}}</span>\n` : '') +
    (d.showDate ? `  <span>{{formatDate order.shippingData.logisticsInfo.[0].shippingEstimateDate "dd/MM/yyyy HH:mm"}}</span>\n` : '') +
    (d.showAddress ? `  <span>{{order.shippingData.address.street}} {{order.shippingData.address.number}}</span>\n` : '') +
    `</div>`
  )
  if (w.type === 'products') return (
    `<table class="products">\n  <thead><tr>\n` +
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
  if (w.type === 'footer') return (
    `<div class="footer">\n` +
    `  <strong>{{root.store.name}}</strong>\n` +
    `  <span>{{root.store.phone}}</span>\n` +
    `  <span>{{root.store.website}}</span>\n` +
    `  <p>${d.message}</p>\n</div>`
  )
  if (w.type === 'divider') return `<hr style="border-top: 1px ${d.style} ${d.color};">`
  if (w.type === 'text') return `<div class="text-block" style="font-size:${d.fontSize}px;">\n  ${d.content}\n</div>`
  return ''
}
