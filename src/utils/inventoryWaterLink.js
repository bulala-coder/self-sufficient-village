const INVENTORY_STORAGE_KEY = 'self_sufficient_village_v1'
const waterCategories = ['drinking', 'cooking', 'utility', 'rainwater', 'emergency', 'animal', 'other']
const storageTypes = ['bottled', 'container', 'tank', 'dispenser', 'bathtub', 'rainBarrel', 'other']
const list = (value) => Array.isArray(value) ? value : []
const positive = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }

export function loadInventoryData() {
  if (typeof localStorage === 'undefined') return []
  try { return list(JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY))?.inventory) } catch { return [] }
}

export function normalizeInventoryWaterItem(item = {}) {
  const meta = item?.waterMeta && typeof item.waterMeta === 'object' ? item.waterMeta : {}
  const perUnit = positive(meta.volumeLitersPerUnit)
  const rawQuantity = Number(item.quantity)
  const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1
  const isIncomplete = perUnit <= 0
  return {
    id: `inventory-${item.id ?? 'unknown'}`, source: 'inventory', inventoryItemId: item.id ?? null,
    name: String(item.name || '未命名水品項'), volumeLiters: isIncomplete ? 0 : perUnit * quantity,
    category: waterCategories.includes(meta.waterCategory) ? meta.waterCategory : 'other',
    storageType: storageTypes.includes(meta.storageType) ? meta.storageType : 'other', potable: meta.potable === true,
    requiresTreatment: meta.requiresTreatment === true, location: String(item.location || ''), notes: String(item.note || ''), isIncomplete
  }
}

export function getInventoryWaterItems(items = loadInventoryData()) {
  return list(items).filter((item) => item?.isWaterResource === true).map(normalizeInventoryWaterItem)
}

export function calculateInventoryWaterTotals(items = loadInventoryData()) {
  const waterItems = getInventoryWaterItems(items)
  return waterItems.reduce((totals, item) => {
    totals.totalLiters += item.volumeLiters
    if (item.potable) totals.potableLiters += item.volumeLiters
    else totals.nonPotableLiters += item.volumeLiters
    if (item.requiresTreatment) totals.treatmentRequiredLiters += item.volumeLiters
    if (item.isIncomplete) totals.incompleteCount += 1
    return totals
  }, { items: waterItems, totalLiters: 0, potableLiters: 0, nonPotableLiters: 0, treatmentRequiredLiters: 0, incompleteCount: 0 })
}

export { waterCategories as inventoryWaterCategories, storageTypes as inventoryWaterStorageTypes }
