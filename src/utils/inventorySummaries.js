const typeLabels = { water: '飲水', food: '食物', medical: '醫療', power: '電力', animal: '動物', tool: '工具', hygiene: '衛生', other: '其他' }
const priorityLabels = { high: '高', medium: '中', low: '低' }
const defaultWaterMeta = { volumeLitersPerUnit: '', potable: true, requiresTreatment: false, waterCategory: 'drinking', storageType: 'bottled' }

function inferType(category = '') {
  const text = String(category)
  if (text.includes('飲水') || text.includes('水')) return 'water'
  if (text.includes('食物')) return 'food'
  if (text.includes('醫療')) return 'medical'
  if (text.includes('照明') || text.includes('電力')) return 'power'
  if (text.includes('動物')) return 'animal'
  if (text.includes('工具')) return 'tool'
  return 'other'
}

function positiveNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.floor((date.getTime() - today.getTime()) / 86400000)
}

export function normalizeInventoryItem(item = {}) {
  const type = typeLabels[item.type] ? item.type : inferType(item.category)
  const priority = priorityLabels[item.priority] ? item.priority : 'medium'
  return {
    ...item,
    name: item.name || '未命名物資',
    category: item.category || typeLabels[type] || '其他',
    quantity: item.quantity || '', unit: item.unit || '', note: item.note || '', type,
    expiresAt: item.expiresAt || '',
    shelfStable: item.shelfStable === true || item.shelfStable === 'true',
    servings: item.servings ?? '', liters: item.liters ?? '', animalDays: item.animalDays ?? '', priority,
    isWaterResource: item.isWaterResource === true,
    waterMeta: { ...defaultWaterMeta, ...(item.waterMeta || {}) }
  }
}

export function getInventorySummary(items = []) {
  return (Array.isArray(items) ? items : []).map(normalizeInventoryItem).reduce((summary, item) => {
    const expiryDays = daysUntil(item.expiresAt)
    if (item.type === 'water') summary.waterLiters += positiveNumber(item.liters)
    if (item.type === 'food') summary.foodServings += positiveNumber(item.servings)
    if (item.type === 'food' && item.shelfStable) summary.shelfStableServings += positiveNumber(item.servings)
    if (item.type === 'animal') summary.animalDays += positiveNumber(item.animalDays)
    if (item.priority === 'high') summary.highPriorityCount += 1
    if (item.type === 'animal' || String(item.category).includes('動物')) summary.hasAnimalDemand = true
    if (expiryDays !== null && expiryDays < 0) summary.expiredCount += 1
    if (expiryDays !== null && expiryDays >= 0 && expiryDays <= 30) summary.expiringSoonCount += 1
    return summary
  }, { waterLiters: 0, foodServings: 0, shelfStableServings: 0, animalDays: 0, highPriorityCount: 0, expiringSoonCount: 0, expiredCount: 0, hasAnimalDemand: false })
}

export function getFoodRotationList(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(normalizeInventoryItem)
    .filter((item) => item.type === 'food' && parseDate(item.expiresAt))
    .sort((a, b) => parseDate(a.expiresAt).getTime() - parseDate(b.expiresAt).getTime())
}
