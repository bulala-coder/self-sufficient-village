export const usageCategories = ['drinking', 'cooking', 'cleaning', 'toilet', 'animals', 'irrigation', 'medical', 'other']
export const usageSourceTypes = ['manualStorage', 'inventory', 'external', 'rainwater', 'unknown']
export const usageCategoryLabels = { drinking: '飲水', cooking: '煮食', cleaning: '清潔', toilet: '廁所', animals: '動物', irrigation: '灌溉', medical: '醫療', other: '其他' }

const list = (value) => Array.isArray(value) ? value : []
const positive = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const [year, month, day] = String(value).split('-').map(Number)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const labelDate = (date) => `${date.getMonth() + 1}/${date.getDate()}`

export function normalizeUsageLog(log = {}) {
  return {
    id: log.id ?? null,
    date: validDate(log.date) ? String(log.date) : '',
    category: usageCategories.includes(log.category) ? log.category : 'other',
    volumeLiters: positive(log.volumeLiters),
    sourceType: usageSourceTypes.includes(log.sourceType) ? log.sourceType : 'unknown',
    sourceName: String(log.sourceName || ''), purpose: String(log.purpose || ''), notes: String(log.notes || ''), createdAt: String(log.createdAt || '')
  }
}

export function calculateUsageByCategory(logs = []) {
  const result = Object.fromEntries(usageCategories.map((key) => [key, 0]))
  list(logs).map(normalizeUsageLog).forEach((log) => { result[log.category] += log.volumeLiters })
  return result
}

export function calculateUsageTotals(logs = []) {
  const byCategory = calculateUsageByCategory(logs)
  const drinkingUsedLiters = byCategory.drinking + byCategory.animals + byCategory.medical
  const utilityUsedLiters = byCategory.cooking + byCategory.cleaning + byCategory.toilet + byCategory.irrigation + byCategory.other
  return { totalUsedLiters: drinkingUsedLiters + utilityUsedLiters, drinkingUsedLiters, utilityUsedLiters, byCategory }
}

export function calculateRecentUsage(logs = [], days = 7) {
  const windowDays = Math.max(1, Math.floor(positive(days) || 1))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today); start.setDate(today.getDate() - windowDays + 1)
  const items = list(logs).map(normalizeUsageLog).filter((log) => { const date = validDate(log.date); return date && date >= start && date <= today })
  return { items, totalLiters: calculateUsageTotals(items).totalUsedLiters, days: windowDays }
}

export function calculateAverageDailyUsage(logs = [], days = 7) {
  const recent = calculateRecentUsage(logs, days)
  return recent.days ? recent.totalLiters / recent.days : 0
}

export function calculateProjectedRemainingDays(summary = {}, logs = [], daysWindow = 7) {
  const recent = calculateRecentUsage(logs, daysWindow)
  const totals = calculateUsageTotals(recent.items)
  const days = recent.days || 1
  const averageDailyUsed = totals.totalUsedLiters / days
  const drinkingAverage = totals.drinkingUsedLiters / days
  const potable = positive(summary.totals?.potableLiters)
  const totalWater = potable + positive(summary.totals?.nonPotableLiters)
  const projectedPotableDays = drinkingAverage > 0 ? potable / drinkingAverage : 0
  const projectedTotalWaterDays = averageDailyUsed > 0 ? totalWater / averageDailyUsed : 0
  return { averageDailyUsed, projectedPotableDays, projectedTotalWaterDays, differenceFromPlannedDays: projectedTotalWaterDays - positive(summary.days?.overallDays) }
}

export function generateUsageWarnings(summary = {}, logs = []) {
  const normalized = list(logs).map(normalizeUsageLog)
  if (!normalized.length) return ['尚無用水紀錄：開始記錄才能建立實際消耗趨勢。']
  const recent = calculateRecentUsage(normalized, 7)
  const totals = calculateUsageTotals(recent.items)
  const average = recent.totalLiters / recent.days
  const drinkingAverage = totals.drinkingUsedLiters / recent.days
  const byCategory = totals.byCategory
  const warnings = []
  if (average > positive(summary.demand?.dailyTotal)) warnings.push('最近 7 天平均用水高於計畫每日總需求。')
  if (drinkingAverage > positive(summary.demand?.dailyDrinking)) warnings.push('飲水類用水高於計畫每日飲水需求。')
  if ((byCategory.toilet + byCategory.cleaning) / recent.days > positive(summary.demand?.dailyUtility) * 0.75) warnings.push('廁所或清潔用水偏高，建議檢查節水方式。')
  if (normalized.some((log) => log.sourceType === 'unknown')) warnings.push('部分用水紀錄沒有指定來源類型。')
  if (normalized.filter((log) => log.sourceType === 'external').length / normalized.length > 0.5) warnings.push('外部補水紀錄比例很高，現有系統可能過度依賴外部來源。')
  const projected = calculateProjectedRemainingDays(summary, normalized, 7)
  if (projected.projectedTotalWaterDays > 0 && projected.projectedTotalWaterDays < positive(summary.days?.overallDays)) warnings.push('依實際用水推估的剩餘天數低於 Water System 原始支撐天數。')
  return warnings.length ? warnings : ['最近用水未偵測到明顯超支；持續記錄以觀察趨勢。']
}

export function buildDailyUsageSeries(logs = [], days = 7) {
  const windowDays = Math.max(1, Math.min(365, Math.floor(positive(days) || 1)))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const normalized = list(logs).map(normalizeUsageLog).filter((log) => validDate(log.date) && log.volumeLiters > 0)
  const byDate = new Map()
  normalized.forEach((log) => {
    const current = byDate.get(log.date) || Object.fromEntries(usageCategories.map((category) => [category, 0]))
    current[log.category] += log.volumeLiters
    byDate.set(log.date, current)
  })
  return Array.from({ length: windowDays }, (_, index) => {
    const date = new Date(today); date.setDate(today.getDate() - windowDays + index + 1)
    const key = dateKey(date)
    const categories = byDate.get(key) || Object.fromEntries(usageCategories.map((category) => [category, 0]))
    const drinkingLiters = categories.drinking + categories.animals + categories.medical
    const utilityLiters = categories.cooking + categories.cleaning + categories.toilet + categories.irrigation + categories.other
    return { date: key, label: labelDate(date), totalLiters: drinkingLiters + utilityLiters, drinkingLiters, utilityLiters, categories }
  })
}

export function buildCategoryUsageChartData(logs = [], days = 7) {
  const totals = Object.fromEntries(usageCategories.map((category) => [category, 0]))
  buildDailyUsageSeries(logs, days).forEach((item) => usageCategories.forEach((category) => { totals[category] += item.categories[category] }))
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0)
  return usageCategories.map((category) => ({ category, label: usageCategoryLabels[category], liters: totals[category], percentage: total > 0 ? totals[category] / total * 100 : 0 }))
}

export function calculateUsageTypeSplit(logs = [], days = 7) {
  const series = buildDailyUsageSeries(logs, days)
  const drinkingLiters = series.reduce((sum, item) => sum + item.drinkingLiters, 0)
  const utilityLiters = series.reduce((sum, item) => sum + item.utilityLiters, 0)
  const total = drinkingLiters + utilityLiters
  return { drinkingLiters, utilityLiters, drinkingPercentage: total > 0 ? drinkingLiters / total * 100 : 0, utilityPercentage: total > 0 ? utilityLiters / total * 100 : 0 }
}

export function findOverBudgetUsageDays(logs = [], summary = {}, days = 7) {
  const plannedDailyTotal = positive(summary.demand?.dailyTotal)
  if (!plannedDailyTotal) return []
  return buildDailyUsageSeries(logs, days).filter((item) => item.totalLiters > plannedDailyTotal).map((item) => ({ date: item.date, label: item.label, totalLiters: item.totalLiters, plannedDailyTotal, overByLiters: item.totalLiters - plannedDailyTotal }))
}

export function getUsageTrendSummary(logs = [], summary = {}) {
  const recent7 = buildDailyUsageSeries(logs, 7)
  const recent30 = buildDailyUsageSeries(logs, 30)
  const recent7Total = recent7.reduce((sum, item) => sum + item.totalLiters, 0)
  const recent30Total = recent30.reduce((sum, item) => sum + item.totalLiters, 0)
  const recent7Average = recent7Total / 7
  const recent30Average = recent30Total / 30
  let direction = 'insufficient'
  if (recent30Average > 0) direction = recent7Average > recent30Average * 1.15 ? 'increasing' : recent7Average < recent30Average * 0.85 ? 'decreasing' : 'stable'
  const directionLabels = { increasing: '用水上升', decreasing: '用水下降', stable: '用水穩定', insufficient: '資料不足' }
  const categoryData = buildCategoryUsageChartData(logs, 30)
  const topCategory = [...categoryData].sort((a, b) => b.liters - a.liters)[0]
  return { recent7Total, recent7Average, recent30Total, recent30Average, direction, directionLabel: directionLabels[direction], overBudgetDays7: findOverBudgetUsageDays(logs, summary, 7).length, topCategory: topCategory?.liters > 0 ? topCategory.category : null, topCategoryLiters: topCategory?.liters || 0 }
}
