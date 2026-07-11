import { calculateUsageTypeSplit } from './waterUsage.js'

const list = (value) => Array.isArray(value) ? value : []
const amount = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }
const daysValue = (value, fallback = 3) => Math.max(1, Math.min(365, Math.floor(amount(value) || fallback)))

export function buildPresetWaterEvents() {
  return [
    { id: 'water-outage-24h', name: '24 小時停水', durationDays: 1, severity: 'basic', description: '短期供水中斷，測試家庭是否具備基本飲水與衛生緩衝。' },
    { id: 'water-outage-72h', name: '72 小時停水', durationDays: 3, severity: 'standard', description: '常見災害初期黃金 72 小時停水情境。' },
    { id: 'water-outage-7d', name: '7 天停水', durationDays: 7, severity: 'serious', description: '中度災害或管線修復延遲情境。' },
    { id: 'water-outage-14d', name: '14 天停水', durationDays: 14, severity: 'extreme', description: '長期補給中斷與社區供水不穩情境。' }
  ]
}

function resolveDemand(summary, mode, allocationPlanId) {
  const plannedDrinking = amount(summary?.demand?.dailyDrinking)
  const plannedUtility = amount(summary?.demand?.dailyUtility)
  const fallback = { dailyDrinking: plannedDrinking, dailyUtility: plannedUtility, allocationPlan: null }
  if (mode === 'strictSurvival') return { dailyDrinking: plannedDrinking, dailyUtility: plannedUtility * 0.3, allocationPlan: null }
  if (mode === 'recent7' || mode === 'recent30') {
    const days = mode === 'recent7' ? 7 : 30
    const split = calculateUsageTypeSplit(summary?.data?.usageLogs, days)
    const dailyDrinking = split.drinkingLiters / days
    const dailyUtility = split.utilityLiters / days
    return dailyDrinking + dailyUtility > 0 ? { dailyDrinking, dailyUtility, allocationPlan: null } : fallback
  }
  if (mode === 'allocationPlan') {
    const plan = list(summary?.data?.plans).find((item) => String(item?.id) === String(allocationPlanId || ''))
    if (!plan) return fallback
    return {
      dailyDrinking: amount(plan.drinking) + amount(plan.animals) + amount(plan.medical),
      dailyUtility: amount(plan.cooking) + amount(plan.cleaning) + amount(plan.toilet) + amount(plan.irrigation) + amount(plan.other),
      allocationPlan: plan
    }
  }
  return fallback
}

export function calculateWaterEventGaps(supply = {}, demand = {}) {
  const potable = amount(supply.potableLiters)
  const nonPotable = amount(supply.nonPotableLiters)
  const total = amount(supply.totalLiters)
  const drinking = amount(demand.totalDrinking)
  const utility = amount(demand.totalUtility)
  const totalDemand = amount(demand.totalDemand)
  return { drinkingGap: Math.max(0, drinking - potable), utilityGap: Math.max(0, utility - nonPotable), totalGap: Math.max(0, totalDemand - total) }
}

export function evaluateWaterEventResult({ supply = {}, demand = {}, gaps = {}, checks = {}, durationDays = 3 } = {}) {
  const duration = daysValue(durationDays)
  const dailyDrinking = amount(demand.dailyDrinking)
  const dailyUtility = amount(demand.dailyUtility)
  const drinkingDays = dailyDrinking > 0 ? amount(supply.potableLiters) / dailyDrinking : duration
  const utilityDays = dailyUtility > 0 ? amount(supply.nonPotableLiters) / dailyUtility : duration
  const survivedDays = Math.max(0, Math.min(drinkingDays, utilityDays))
  const score = Math.min(100, (checks.drinkingEnough ? 40 : 0) + (checks.utilityEnough ? 25 : 0) + (checks.totalEnough ? 15 : 0) + (checks.hasSource ? 5 : 0) + (amount(supply.purificationDailyCapacity) > 0 ? 10 : 0) + (checks.hasAllocationPlan ? 5 : 0))
  let failurePoint = 'none'
  if (!checks.drinkingEnough) failurePoint = 'drinking'
  else if (!checks.utilityEnough) failurePoint = 'utility'
  else if (!checks.totalEnough) failurePoint = 'total'
  else if (!checks.purificationEnough) failurePoint = 'purification'
  let status = 'pass'
  if (!checks.drinkingEnough || amount(gaps.drinkingGap) > 0) status = survivedDays < 1 ? 'critical' : 'fail'
  else if (!checks.utilityEnough || !checks.totalEnough || !checks.purificationEnough) status = 'partial'
  const labels = { pass: '可撐過', partial: '部分不足', fail: '無法撐過', critical: '危急' }
  const severity = status === 'critical' ? 'extreme' : status === 'fail' ? 'serious' : status === 'partial' ? 'standard' : 'basic'
  return { status, label: labels[status], score, survivedDays, failurePoint, severity }
}

export function generateWaterEventRecommendations(simulation = {}) {
  const recommendations = []
  const gaps = simulation.gaps || {}
  const checks = simulation.checks || {}
  if (!checks.drinkingEnough) recommendations.push(`優先補足 ${amount(gaps.drinkingGap).toFixed(1)} L 飲用水，飲水不可由未確認水質的來源直接替代。`)
  if (!checks.utilityEnough) recommendations.push(`生活用水尚缺 ${amount(gaps.utilityGap).toFixed(1)} L，降低清潔與沖廁配額並準備非飲用水。`)
  if (!checks.hasSource) recommendations.push('建立至少一個不完全依賴電力或交通的穩定補水來源。')
  if (amount(simulation.supply?.treatmentRequiredLiters) > 0 && !checks.purificationEnough) recommendations.push('需處理水量高於事件期間淨水容量；淨水模擬只代表容量，不代表能去除所有污染。')
  if (!checks.hasAllocationPlan) recommendations.push('建立與事件天數相符的停水分配方案並保留緊急飲水。')
  if (amount(simulation.supply?.potentialExternalLiters) > 0) recommendations.push('外部補水為潛在且不確定供給，須確認道路、電力、容器與水質。')
  if (!recommendations.length) recommendations.push('目前供給可涵蓋事件需求；仍應輪替儲水並演練取水與淨水流程。')
  return recommendations
}

export function simulateWaterEvent(summary = {}, options = {}) {
  const settings = { durationDays: 3, mode: 'planned', includeInventoryWater: true, includeManualStorage: true, includeExternalSources: false, includePurificationCapacity: true, useRecentUsage: false, allocationPlanId: '', ...options }
  const durationDays = daysValue(settings.durationDays)
  const mode = ['planned', 'recent7', 'recent30', 'allocationPlan', 'strictSurvival'].includes(settings.mode) ? settings.mode : 'planned'
  const demandMode = settings.useRecentUsage && mode === 'planned' ? 'recent7' : mode
  const resolved = resolveDemand(summary, demandMode, settings.allocationPlanId)
  const dailyDrinking = amount(resolved.dailyDrinking)
  const dailyUtility = amount(resolved.dailyUtility)
  const demand = { dailyDrinking, dailyUtility, dailyTotal: dailyDrinking + dailyUtility, totalDrinking: dailyDrinking * durationDays, totalUtility: dailyUtility * durationDays, totalDemand: (dailyDrinking + dailyUtility) * durationDays }

  const totals = summary?.totals || {}
  let potableLiters = settings.includeManualStorage ? amount(totals.manualPotableLiters) : 0
  let nonPotableLiters = settings.includeManualStorage ? amount(totals.manualNonPotableLiters) : 0
  const inventoryTreatmentRequired = amount(summary?.inventoryWater?.treatmentRequiredLiters)
  const manualTreatmentRequired = Math.max(0, amount(totals.treatmentRequiredLiters) - inventoryTreatmentRequired)
  let treatmentRequiredLiters = settings.includeManualStorage ? Math.min(nonPotableLiters, manualTreatmentRequired) : 0
  if (settings.includeInventoryWater) {
    potableLiters += amount(totals.inventoryPotableLiters)
    nonPotableLiters += amount(totals.inventoryNonPotableLiters)
    treatmentRequiredLiters += inventoryTreatmentRequired
  }

  let potentialExternalLiters = 0
  if (settings.includeExternalSources) list(summary?.data?.sources).filter((source) => source?.stable === true).forEach((source) => {
    const volume = amount(source.estimatedVolume)
    potentialExternalLiters += volume
    if (source.potable === true && source.requiresTreatment !== true) potableLiters += volume
    else { nonPotableLiters += volume; if (source.requiresTreatment === true) treatmentRequiredLiters += volume }
  })

  const purificationDailyCapacity = settings.includePurificationCapacity ? amount(summary?.capabilities?.purificationDailyCapacity) : 0
  const purificationTotalCapacity = purificationDailyCapacity * durationDays
  const treatedLiters = Math.min(treatmentRequiredLiters, nonPotableLiters, purificationTotalCapacity)
  potableLiters += treatedLiters
  nonPotableLiters = Math.max(0, nonPotableLiters - treatedLiters)
  const supply = { potableLiters, nonPotableLiters, totalLiters: potableLiters + nonPotableLiters, treatmentRequiredLiters, potentialExternalLiters, purificationDailyCapacity, purificationTotalCapacity }
  const gaps = calculateWaterEventGaps(supply, demand)
  const plans = list(summary?.data?.plans)
  const checks = { drinkingEnough: gaps.drinkingGap === 0, utilityEnough: gaps.utilityGap === 0, totalEnough: gaps.totalGap === 0, purificationEnough: treatmentRequiredLiters === 0 || treatedLiters >= Math.min(treatmentRequiredLiters, demand.totalDrinking), hasSource: list(summary?.data?.sources).length > 0, hasAllocationPlan: plans.length > 0 }
  const result = evaluateWaterEventResult({ supply, demand, gaps, checks, durationDays })
  const simulation = { event: { durationDays, mode: demandMode, allocationPlanName: resolved.allocationPlan?.name || '' }, supply, demand, gaps, checks, result }
  return { ...simulation, recommendations: generateWaterEventRecommendations(simulation) }
}
