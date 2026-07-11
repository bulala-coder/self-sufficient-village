export const usageCategories = ['drinking', 'cooking', 'cleaning', 'toilet', 'animals', 'irrigation', 'medical', 'other']
export const usageSourceTypes = ['manualStorage', 'inventory', 'external', 'rainwater', 'unknown']

const list = (value) => Array.isArray(value) ? value : []
const positive = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

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
