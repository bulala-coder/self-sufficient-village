import { simulateWaterEvent } from './waterEventSimulator.js'

export const compoundHazards = ['waterOutage', 'powerOutage', 'roadBlocked', 'waterContamination', 'typhoon', 'earthquake', 'supplyDisruption', 'pipelineDamage', 'communicationDown', 'sanitationIssue']
export const compoundHazardLabels = { waterOutage: '停水', powerOutage: '停電', roadBlocked: '道路中斷', waterContamination: '水污染', typhoon: '颱風', earthquake: '地震', supplyDisruption: '補給中斷', pipelineDamage: '管線破裂', communicationDown: '通訊中斷', sanitationIssue: '衛生問題' }

const list = (value) => Array.isArray(value) ? value : []
const amount = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min))
const has = (event, hazard) => list(event?.hazards).includes(hazard)

export function buildPresetCompoundEvents() {
  return [
    { id: 'water-power-72h', name: '停水 + 停電 72 小時', durationDays: 3, hazards: ['waterOutage', 'powerOutage'], severity: 'serious', description: '供水與電力同時中斷，抽水、淨水、照明與通訊能力受限。' },
    { id: 'water-road-7d', name: '停水 + 道路中斷 7 天', durationDays: 7, hazards: ['waterOutage', 'roadBlocked'], severity: 'serious', description: '停水且外出補給困難，超商、賣場、公共供水站取得難度上升。' },
    { id: 'water-contamination-72h', name: '停水 + 水污染 72 小時', durationDays: 3, hazards: ['waterOutage', 'waterContamination'], severity: 'critical', description: '供水中斷並伴隨污染疑慮，部分水源需排除或限制用途。' },
    { id: 'typhoon-supply-7d', name: '颱風 + 補給中斷 7 天', durationDays: 7, hazards: ['typhoon', 'supplyDisruption', 'roadBlocked'], severity: 'serious', description: '颱風造成道路、物流與供水不穩，家庭需依賴既有庫存。' },
    { id: 'earthquake-pipeline-14d', name: '地震 + 管線破裂 14 天', durationDays: 14, hazards: ['earthquake', 'pipelineDamage', 'waterOutage', 'powerOutage'], severity: 'extreme', description: '地震後供水管線與電力系統受損，恢復時間不確定。' }
  ]
}

export function calculateCompoundModifiers(event = {}, options = {}) {
  const strictness = ['standard', 'conservative', 'worstCase'].includes(options.strictness) ? options.strictness : 'standard'
  const modifiers = { allowExternalSources: true, allowElectricPurification: true, externalSourceReliability: 1, purificationReliability: 1, nonPotableUsability: 1, utilityDemandMultiplier: 1, drinkingDemandMultiplier: 1, sanitationRiskMultiplier: 1, logisticsRiskMultiplier: 1 }
  if (has(event, 'powerOutage')) { modifiers.allowElectricPurification = false; modifiers.purificationReliability *= 0.75; modifiers.externalSourceReliability *= 0.85 }
  if (has(event, 'roadBlocked')) { modifiers.allowExternalSources = false; modifiers.externalSourceReliability *= 0.2; modifiers.logisticsRiskMultiplier *= 1.7 }
  if (has(event, 'waterContamination')) { modifiers.nonPotableUsability *= 0.45; modifiers.purificationReliability *= 0.65; modifiers.drinkingDemandMultiplier *= 1.1; modifiers.sanitationRiskMultiplier *= 1.5 }
  if (has(event, 'typhoon')) { modifiers.externalSourceReliability *= 0.55; modifiers.utilityDemandMultiplier *= 1.15; modifiers.logisticsRiskMultiplier *= 1.35; modifiers.purificationReliability *= 0.9 }
  if (has(event, 'earthquake')) { modifiers.externalSourceReliability *= 0.6; modifiers.nonPotableUsability *= 0.8; modifiers.logisticsRiskMultiplier *= 1.4 }
  if (has(event, 'pipelineDamage')) { modifiers.externalSourceReliability *= 0.65; modifiers.nonPotableUsability *= 0.7; modifiers.sanitationRiskMultiplier *= 1.25 }
  if (has(event, 'supplyDisruption')) { modifiers.allowExternalSources = false; modifiers.externalSourceReliability *= 0.25; modifiers.logisticsRiskMultiplier *= 1.6 }
  if (has(event, 'sanitationIssue')) { modifiers.utilityDemandMultiplier *= 1.35; modifiers.sanitationRiskMultiplier *= 1.8 }
  if (strictness === 'conservative') { modifiers.externalSourceReliability *= 0.8; modifiers.purificationReliability *= 0.85; modifiers.nonPotableUsability *= 0.9; modifiers.utilityDemandMultiplier *= 1.1; modifiers.drinkingDemandMultiplier *= 1.05 }
  if (strictness === 'worstCase') { modifiers.allowExternalSources = false; modifiers.externalSourceReliability = 0; modifiers.purificationReliability *= 0.5; modifiers.nonPotableUsability *= 0.65; modifiers.utilityDemandMultiplier *= 1.25; modifiers.drinkingDemandMultiplier *= 1.15; modifiers.logisticsRiskMultiplier *= 1.35 }
  Object.keys(modifiers).forEach((key) => { if (typeof modifiers[key] === 'number') modifiers[key] = clamp(modifiers[key], 0, 3) })
  return { ...modifiers, strictness }
}

function buildAdjustedSummary(summary, event, modifiers) {
  const sourceData = summary && typeof summary === 'object' ? summary : {}
  const data = sourceData.data && typeof sourceData.data === 'object' ? sourceData.data : {}
  const treatments = list(data.treatments).filter((item) => item?.owned === true && (modifiers.allowElectricPurification || item?.requiresElectricity !== true))
  const purificationCapacity = treatments.reduce((sum, item) => sum + amount(item.dailyCapacity), 0) * modifiers.purificationReliability
  const sources = list(data.sources).map((source) => {
    let reliability = modifiers.externalSourceReliability
    if (has(event, 'powerOutage') && source?.dependsOnElectricity === true) reliability *= 0.25
    if ((has(event, 'roadBlocked') || has(event, 'supplyDisruption')) && source?.dependsOnTransport === true) reliability *= 0.15
    return { ...source, estimatedVolume: amount(source?.estimatedVolume) * clamp(reliability, 0, 1) }
  })
  const scaleLog = (log) => ({ ...log, volumeLiters: amount(log?.volumeLiters) * (['drinking', 'animals', 'medical'].includes(log?.category) ? modifiers.drinkingDemandMultiplier : modifiers.utilityDemandMultiplier) })
  const scalePlan = (plan) => ({ ...plan, drinking: amount(plan?.drinking) * modifiers.drinkingDemandMultiplier, animals: amount(plan?.animals) * modifiers.drinkingDemandMultiplier, medical: amount(plan?.medical) * modifiers.drinkingDemandMultiplier, cooking: amount(plan?.cooking) * modifiers.utilityDemandMultiplier, cleaning: amount(plan?.cleaning) * modifiers.utilityDemandMultiplier, toilet: amount(plan?.toilet) * modifiers.utilityDemandMultiplier, irrigation: amount(plan?.irrigation) * modifiers.utilityDemandMultiplier, other: amount(plan?.other) * modifiers.utilityDemandMultiplier })
  const totals = sourceData.totals || {}
  return {
    ...sourceData,
    totals: { ...totals, manualNonPotableLiters: amount(totals.manualNonPotableLiters) * modifiers.nonPotableUsability, inventoryNonPotableLiters: amount(totals.inventoryNonPotableLiters) * modifiers.nonPotableUsability, treatmentRequiredLiters: amount(totals.treatmentRequiredLiters) * modifiers.nonPotableUsability },
    demand: { ...sourceData.demand, dailyDrinking: amount(sourceData.demand?.dailyDrinking) * modifiers.drinkingDemandMultiplier, dailyUtility: amount(sourceData.demand?.dailyUtility) * modifiers.utilityDemandMultiplier, dailyTotal: amount(sourceData.demand?.dailyDrinking) * modifiers.drinkingDemandMultiplier + amount(sourceData.demand?.dailyUtility) * modifiers.utilityDemandMultiplier },
    capabilities: { ...sourceData.capabilities, purificationDailyCapacity: purificationCapacity },
    data: { ...data, sources, treatments, usageLogs: list(data.usageLogs).map(scaleLog), plans: list(data.plans).map(scalePlan) }
  }
}

export function getCompoundRiskLevel(value) {
  const risk = clamp(value)
  if (risk < 30) return 'Low'
  if (risk < 55) return 'Moderate'
  if (risk < 80) return 'High'
  return 'Critical'
}

export function evaluateCompoundResult({ waterResult = {}, riskBreakdown = {}, modifiers = {}, summary = {} } = {}) {
  const sourceCount = list(summary?.data?.sources).length
  const waterScore = clamp(waterResult?.result?.score) * 0.5
  const refillScore = modifiers.allowExternalSources && sourceCount > 0 ? 10 * clamp(modifiers.externalSourceReliability, 0, 1) : 0
  const purificationScore = amount(waterResult?.supply?.purificationDailyCapacity) > 0 ? 10 * clamp(modifiers.purificationReliability, 0, 1) : 0
  const logisticsScore = 10 / Math.max(1, amount(modifiers.logisticsRiskMultiplier) || 1)
  const powerScore = modifiers.allowElectricPurification ? 10 : list(summary?.data?.treatments).some((item) => item?.owned === true && item?.requiresElectricity !== true) ? 7 : 2
  const sanitationScore = 10 / Math.max(1, amount(modifiers.sanitationRiskMultiplier) || 1)
  const score = Math.round(clamp(waterScore + refillScore + purificationScore + logisticsScore + powerScore + sanitationScore))
  const overallRisk = clamp(riskBreakdown.overallRisk)
  let status = score >= 75 ? 'pass' : score >= 60 ? 'strained' : score >= 45 ? 'partial' : score >= 25 ? 'fail' : 'critical'
  if (waterResult?.result?.status === 'critical') status = 'critical'
  else if (waterResult?.result?.status === 'fail' && !['critical'].includes(status)) status = score < 45 ? 'fail' : 'partial'
  const labels = { pass: '可承受', strained: '壓力偏高', partial: '部分不足', fail: '無法承受', critical: '危急' }
  const riskEntries = Object.entries(riskBreakdown).filter(([key]) => key !== 'overallRisk').sort((a, b) => b[1] - a[1])
  const waterFailurePoint = waterResult?.result?.failurePoint || 'none'
  const primaryFailurePoint = waterFailurePoint !== 'none' ? waterFailurePoint : riskEntries[0]?.[0]?.replace('Risk', '') || 'none'
  return { status, label: labels[status], score, riskLevel: getCompoundRiskLevel(overallRisk), survivedDays: amount(waterResult?.result?.survivedDays), primaryFailurePoint }
}

export function generateCompoundRecommendations(simulation = {}) {
  const hazards = list(simulation.event?.hazards)
  const recommendations = []
  if (hazards.includes('powerOutage')) recommendations.push('準備不依賴電力的淨水、照明與通訊方案，並確認大樓抽水設備失效時的取水方式。')
  if (hazards.includes('roadBlocked') || hazards.includes('supplyDisruption')) recommendations.push('不要把商店或公共供水站視為確定供給；建立第二水源與至少 7 天聯合分配策略。')
  if (hazards.includes('waterContamination') || hazards.includes('pipelineDamage')) recommendations.push('隔離疑似污染水源並限制用途；煮沸或一般濾水器不保證能處理化學污染與重金屬。')
  if (hazards.includes('sanitationIssue') || amount(simulation.riskBreakdown?.sanitationRisk) >= 60) recommendations.push('建立洗手、清潔、沖廁與排泄替代方案，避免生活用水不足轉化為衛生事件。')
  if (hazards.includes('communicationDown')) recommendations.push('準備紙本聯絡表、集合點與無網路時的家庭決策規則。')
  if (simulation.waterResult?.recommendations?.[0]) recommendations.push(simulation.waterResult.recommendations[0])
  if (!recommendations.length) recommendations.push('目前模擬可承受；仍需實際演練取水、照明、通訊與衛生流程。')
  return [...new Set(recommendations)]
}

export function simulateCompoundDisaster(summary = {}, event = {}, options = {}) {
  const presetFallback = buildPresetCompoundEvents()[0]
  const safeEvent = event && typeof event === 'object' ? event : presetFallback
  const hazards = list(safeEvent.hazards).filter((hazard) => compoundHazards.includes(hazard))
  const normalizedEvent = { id: String(safeEvent.id || 'custom'), name: String(safeEvent.name || '自訂複合災害'), durationDays: Math.max(1, Math.min(365, Math.floor(amount(safeEvent.durationDays) || 3))), hazards, severity: String(safeEvent.severity || 'custom') }
  const settings = { mode: 'planned', includeInventoryWater: true, includeManualStorage: true, includeExternalSources: true, includePurificationCapacity: true, allocationPlanId: '', strictness: 'standard', ...options }
  const modifiers = calculateCompoundModifiers(normalizedEvent, settings)
  const adjustedSummary = buildAdjustedSummary(summary, normalizedEvent, modifiers)
  const waterResult = simulateWaterEvent(adjustedSummary, { durationDays: normalizedEvent.durationDays, mode: settings.mode, includeInventoryWater: settings.includeInventoryWater, includeManualStorage: settings.includeManualStorage, includeExternalSources: settings.includeExternalSources && modifiers.allowExternalSources, includePurificationCapacity: settings.includePurificationCapacity, allocationPlanId: settings.allocationPlanId })
  const waterRisk = clamp(100 - waterResult.result.score)
  const powerRisk = clamp((has(normalizedEvent, 'powerOutage') ? 80 : 15) + (has(normalizedEvent, 'earthquake') || has(normalizedEvent, 'typhoon') ? 10 : 0))
  const logisticsRisk = clamp((has(normalizedEvent, 'roadBlocked') || has(normalizedEvent, 'supplyDisruption') ? 75 : 20) * modifiers.logisticsRiskMultiplier)
  const contaminationRisk = clamp((has(normalizedEvent, 'waterContamination') ? 90 : has(normalizedEvent, 'pipelineDamage') ? 65 : 15) + (waterResult.checks.purificationEnough ? 0 : 15))
  const sanitationRisk = clamp((has(normalizedEvent, 'sanitationIssue') ? 75 : waterResult.checks.utilityEnough ? 20 : 65) * modifiers.sanitationRiskMultiplier)
  const overallRisk = Math.round(clamp(Math.max(waterRisk, powerRisk, logisticsRisk, contaminationRisk, sanitationRisk) * 0.65 + (waterRisk + powerRisk + logisticsRisk + contaminationRisk + sanitationRisk) / 5 * 0.35))
  const riskBreakdown = { waterRisk, powerRisk, logisticsRisk, contaminationRisk, sanitationRisk, overallRisk }
  const result = evaluateCompoundResult({ waterResult, riskBreakdown, modifiers, summary: adjustedSummary })
  const simulation = { event: normalizedEvent, modifiers, waterResult, riskBreakdown, result }
  return { ...simulation, recommendations: generateCompoundRecommendations(simulation) }
}
