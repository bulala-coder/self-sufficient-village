import { createDefaultWaterSystem, WATER_STORAGE_KEY } from '../data/waterDefaults.js'
import {
  calculateAnimalDrinkingDemand,
  calculateDailyDrinkingDemand,
  calculateDailyUtilityDemand,
  calculateDrinkingDays,
  calculateHumanDrinkingDemand,
  calculateNonPotableStorage,
  calculateOverallWaterDays,
  calculatePotableStorage,
  calculatePurificationCapacity,
  calculateTreatmentRequiredStorage,
  calculateUtilityDays,
  calculateWaterScore,
  generateWaterRecommendations,
  getWaterStatus
} from './waterCalculations.js'
import { calculateInventoryWaterTotals } from './inventoryWaterLink.js'
import { calculateAverageDailyUsage, calculateProjectedRemainingDays, calculateRecentUsage, calculateUsageTotals, generateUsageWarnings, getUsageTrendSummary } from './waterUsage.js'

const list = (value) => Array.isArray(value) ? value : []
const safeNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function loadWaterSystemData() {
  const fallback = createDefaultWaterSystem()
  if (typeof localStorage === 'undefined') return fallback
  try {
    const saved = JSON.parse(localStorage.getItem(WATER_STORAGE_KEY))
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return fallback
    return {
      ...fallback,
      ...saved,
      household: {
        ...fallback.household,
        ...(saved.household || {}),
        needs: { ...fallback.household.needs, ...(saved.household?.needs || {}) }
      },
      modes: { ...fallback.modes, ...(saved.modes || {}) },
      rainwater: { ...fallback.rainwater, ...(saved.rainwater || {}) },
      storage: list(saved.storage),
      sources: list(saved.sources),
      treatments: list(saved.treatments),
      usageLogs: list(saved.usageLogs),
      plans: Array.isArray(saved.plans) ? saved.plans : fallback.plans
    }
  } catch {
    return fallback
  }
}

export function getWaterIntelligenceSummary(input) {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input : loadWaterSystemData()
  const inventoryWater = calculateInventoryWaterTotals()
  const household = data.household || {}
  const mode = data.modes?.[data.activeMode] || {}
  const manualPotableLiters = calculatePotableStorage(data.storage)
  const manualNonPotableLiters = calculateNonPotableStorage(data.storage)
  const manualTreatmentRequiredLiters = calculateTreatmentRequiredStorage(data.storage)
  const potableLiters = manualPotableLiters + inventoryWater.potableLiters
  const nonPotableLiters = manualNonPotableLiters + inventoryWater.nonPotableLiters
  const treatmentRequiredLiters = manualTreatmentRequiredLiters + inventoryWater.treatmentRequiredLiters
  const humanDrinking = calculateHumanDrinkingDemand(household)
  const animalDrinking = calculateAnimalDrinkingDemand(household)
  const dailyDrinking = calculateDailyDrinkingDemand(household)
  const dailyUtility = calculateDailyUtilityDemand(mode)
  const drinkingDays = calculateDrinkingDays(potableLiters, dailyDrinking)
  const utilityDays = calculateUtilityDays(nonPotableLiters, dailyUtility)
  const treatments = list(data.treatments).filter((item) => item?.owned === true)
  const sources = list(data.sources)
  const alternativeTypes = ['rain', 'spring', 'stream', 'river', 'well', 'dehumidifier', 'airConditioner']
  const mergedData = { ...data, storage: [...list(data.storage), ...inventoryWater.items] }
  const score = calculateWaterScore(mergedData)
  const days = { drinkingDays, utilityDays, overallDays: calculateOverallWaterDays(drinkingDays, utilityDays) }
  const totals = { manualPotableLiters, manualNonPotableLiters, inventoryPotableLiters: inventoryWater.potableLiters, inventoryNonPotableLiters: inventoryWater.nonPotableLiters, potableLiters, nonPotableLiters, treatmentRequiredLiters }
  const demand = { humanDrinking, animalDrinking, dailyDrinking, dailyUtility, dailyTotal: dailyDrinking + dailyUtility }
  const usageLogs = list(data.usageLogs)
  const usageTotals = calculateUsageTotals(usageLogs)
  const recent7 = calculateRecentUsage(usageLogs, 7)
  const recent30 = calculateRecentUsage(usageLogs, 30)
  const usageBase = { totals, demand, days }
  const projected = calculateProjectedRemainingDays(usageBase, usageLogs, 7)
  const trend = getUsageTrendSummary(usageLogs, usageBase)

  return {
    data,
    score: safeNumber(score),
    status: getWaterStatus(score),
    totals,
    inventoryWater,
    demand,
    days,
    usage: { totalUsedLiters: usageTotals.totalUsedLiters, drinkingUsedLiters: usageTotals.drinkingUsedLiters, utilityUsedLiters: usageTotals.utilityUsedLiters, recent7Total: recent7.totalLiters, recent7Average: calculateAverageDailyUsage(usageLogs, 7), recent30Total: recent30.totalLiters, recent30Average: calculateAverageDailyUsage(usageLogs, 30), byCategory: usageTotals.byCategory, projectedPotableDays: projected.projectedPotableDays, projectedTotalWaterDays: projected.projectedTotalWaterDays, warnings: generateUsageWarnings(usageBase, usageLogs), trend },
    capabilities: {
      sourceCount: sources.length,
      stableSourceCount: sources.filter((item) => item?.stable === true).length,
      purificationCount: treatments.length,
      purificationDailyCapacity: calculatePurificationCapacity(treatments),
      allocationPlanCount: list(data.plans).length,
      hasRainwater: Boolean(data.rainwater?.enabled || sources.some((item) => alternativeTypes.includes(item?.type)))
    },
    recommendations: generateWaterRecommendations(mergedData)
  }
}
