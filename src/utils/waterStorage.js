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
  const household = data.household || {}
  const mode = data.modes?.[data.activeMode] || {}
  const potableLiters = calculatePotableStorage(data.storage)
  const nonPotableLiters = calculateNonPotableStorage(data.storage)
  const treatmentRequiredLiters = calculateTreatmentRequiredStorage(data.storage)
  const humanDrinking = calculateHumanDrinkingDemand(household)
  const animalDrinking = calculateAnimalDrinkingDemand(household)
  const dailyDrinking = calculateDailyDrinkingDemand(household)
  const dailyUtility = calculateDailyUtilityDemand(mode)
  const drinkingDays = calculateDrinkingDays(potableLiters, dailyDrinking)
  const utilityDays = calculateUtilityDays(nonPotableLiters, dailyUtility)
  const treatments = list(data.treatments).filter((item) => item?.owned === true)
  const sources = list(data.sources)
  const alternativeTypes = ['rain', 'spring', 'stream', 'river', 'well', 'dehumidifier', 'airConditioner']
  const score = calculateWaterScore(data)

  return {
    data,
    score: safeNumber(score),
    status: getWaterStatus(score),
    totals: { potableLiters, nonPotableLiters, treatmentRequiredLiters },
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
    recommendations: generateWaterRecommendations(data)
  }
}
