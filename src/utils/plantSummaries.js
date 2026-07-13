const cropTypes = { leafy: true, herb: true, root: true, fruit: true, sprout: true, grain: true, mushroom: true, other: true }
const growingSpaces = { balcony: '陽台', windowsill: '窗台', indoor: '室內', yard: '庭院', field: '農地', hydroponic: '水耕', container: '容器' }
const edibleParts = { leaf: true, stem: true, root: true, fruit: true, seed: true, flower: true }
const difficulties = { easy: true, medium: true, hard: true }
const statuses = { planning: true, growing: true, harvestable: true, harvested: true, failed: true }
const harvestUnits = ['g', 'kg', 'bunch', 'piece', 'meal']
const harvestUnitLabels = { g: 'g', kg: 'kg', bunch: '把', piece: '顆', meal: '餐' }
const positiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
const parseDate = (value) => { if (!value) return null; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? null : date }
const today = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
const daysUntil = (value) => { const date = parseDate(value); return date ? Math.floor((date.getTime() - today().getTime()) / 86400000) : null }
const isThisMonth = (value) => { const date = parseDate(value), now = today(); return Boolean(date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) }
const isActive = (plant) => ['planning', 'growing', 'harvestable'].includes(plant.status)
const isHarvestSoon = (plant) => { const days = daysUntil(plant.expectedHarvestDate); return days !== null && days >= 0 && days <= 30 }
const formatNumber = (value) => Number(value.toFixed(1)).toString()

export function normalizePlant(plant = {}) {
  const cropType = cropTypes[plant.cropType] ? plant.cropType : 'other'
  const growingSpace = growingSpaces[plant.growingSpace] ? plant.growingSpace : 'container'
  const difficulty = difficulties[plant.difficulty] ? plant.difficulty : 'easy'
  const status = statuses[plant.status] ? plant.status : 'growing'
  const harvestUnit = harvestUnits.includes(plant.harvestUnit) ? plant.harvestUnit : 'g'
  return { ...plant, name: plant.name || '未命名作物', location: plant.location || '', plantedAt: plant.plantedAt || '', sunlight: plant.sunlight || '不確定', note: plant.note || '', lastWateredAt: plant.lastWateredAt || '', cropType, growingSpace, seedDate: plant.seedDate || '', transplantDate: plant.transplantDate || '', expectedHarvestDate: plant.expectedHarvestDate || '', lastHarvestDate: plant.lastHarvestDate || '', harvestAmount: positiveNumber(plant.harvestAmount), harvestUnit, edibleParts: Array.isArray(plant.edibleParts) ? plant.edibleParts.filter((part) => edibleParts[part]) : [], seedSaving: plant.seedSaving === true || plant.seedSaving === 'true', difficulty, status, failureReason: plant.failureReason || '' }
}

export function getFoodProductionSummary(plants = []) {
  const normalized = (Array.isArray(plants) ? plants : []).map(normalizePlant)
  const active = normalized.filter(isActive)
  const types = new Set(normalized.filter((plant) => plant.status !== 'failed').map((plant) => plant.cropType))
  const harvestGroups = normalized.reduce((groups, plant) => { if (plant.harvestAmount > 0) groups[plant.harvestUnit] = (groups[plant.harvestUnit] || 0) + plant.harvestAmount; return groups }, {})
  const spaceCounts = normalized.reduce((counts, plant) => { counts[plant.growingSpace] = (counts[plant.growingSpace] || 0) + 1; return counts }, {})
  const harvestRecordCount = normalized.filter((plant) => plant.harvestAmount > 0 || plant.lastHarvestDate).length
  const seedSavingCount = normalized.filter((plant) => plant.seedSaving).length
  const score = Math.round(Math.min(100, Math.min(normalized.length / 5, 1) * 25 + Math.min(types.size / 4, 1) * 20 + Math.min(active.length / 3, 1) * 20 + Math.min(harvestRecordCount / 3, 1) * 20 + Math.min(seedSavingCount / 3, 1) * 15))
  const highestGap = normalized.length === 0 ? '尚未建立食物生產' : active.length === 0 ? '目前沒有生長中作物' : harvestRecordCount === 0 ? '尚未建立採收紀錄' : seedSavingCount === 0 ? '尚未建立留種能力' : '食物生產系統已開始運作'
  return { plants: normalized, total: normalized.length, activeCount: active.length, growingCount: normalized.filter((plant) => plant.status === 'growing').length, harvestableCount: normalized.filter((plant) => plant.status === 'harvestable').length, harvestedCount: normalized.filter((plant) => plant.status === 'harvested').length, failedCount: normalized.filter((plant) => plant.status === 'failed').length, harvestGroups, harvestSummary: Object.entries(harvestGroups).map(([unit, amount]) => `${formatNumber(amount)}${harvestUnitLabels[unit] || unit}`).join('、') || '尚無採收', seedSavingCount, spaceCounts, spaceSummary: Object.entries(spaceCounts).map(([space, count]) => `${growingSpaces[space]} ${count}`).join('、') || '尚無資料', monthHarvestCount: normalized.filter((plant) => isThisMonth(plant.lastHarvestDate)).length, harvestSoonCount: normalized.filter(isHarvestSoon).length, cropTypeDiversity: types.size, harvestRecordCount, score, scoreTitle: score <= 20 ? '尚未建立生產系統' : score <= 40 ? '初步種植' : score <= 60 ? '可產生少量食物' : score <= 80 ? '穩定家庭食物補充' : '半自給生產基礎', highestGap }
}
