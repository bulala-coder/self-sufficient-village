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

  return {
    data,
    score: safeNumber(score),
    status: getWaterStatus(score),
    totals: { manualPotableLiters, manualNonPotableLiters, inventoryPotableLiters: inventoryWater.potableLiters, inventoryNonPotableLiters: inventoryWater.nonPotableLiters, potableLiters, nonPotableLiters, treatmentRequiredLiters },
    inventoryWater,
    demand: { humanDrinking, animalDrinking, dailyDrinking, dailyUtility, dailyTotal: dailyDrinking + dailyUtility },
    days: { drinkingDays, utilityDays, overallDays: calculateOverallWaterDays(drinkingDays, utilityDays) },
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
