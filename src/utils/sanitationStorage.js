import { createDefaultSanitationSystem, SANITATION_STORAGE_KEY, sanitationModes } from '../data/sanitationDefaults.js'
import { calculateCleaningSupportDays, calculateDailyToiletUses, calculateHygieneSupportDays, calculateHouseholdSize, calculateOverallSanitationDays, calculatePetWasteSupportDays, calculateSanitationScore, calculateToiletSupportDays, calculateWasteSupportDays, generateSanitationRecommendations, getSanitationStatus, sanitizeNumber } from './sanitationCalculations.js'

const arrays = ['toiletPlans', 'hygieneSupplies', 'wasteSupplies', 'cleaningSupplies', 'petWasteSupplies', 'sanitationPlans']
const normalize = (value = {}) => {
  const defaults = createDefaultSanitationSystem()
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const next = { ...defaults, ...source, version: '5.2', household: { ...defaults.household, ...(source.household || {}) }, settings: { ...defaults.settings, ...(source.settings || {}) } }
  arrays.forEach((key) => { next[key] = Array.isArray(source[key]) ? source[key] : [] })
  if (!sanitationModes[next.sanitationMode]) next.sanitationMode = defaults.sanitationMode
  return next
}

export function loadSanitationSystemData() {
  try {
    if (typeof localStorage === 'undefined') return createDefaultSanitationSystem()
    return normalize(JSON.parse(localStorage.getItem(SANITATION_STORAGE_KEY)))
  } catch { return createDefaultSanitationSystem() }
}

export function saveSanitationSystemData(data) {
  const next = { ...normalize(data), updatedAt: new Date().toISOString() }
  if (typeof localStorage !== 'undefined') localStorage.setItem(SANITATION_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getSanitationSystemSummary(input) {
  const data = normalize(input === undefined ? loadSanitationSystemData() : input)
  const householdSize = calculateHouseholdSize(data.household)
  const dailyToiletUses = calculateDailyToiletUses(data.household, data.settings, data.sanitationMode)
  const toiletCapacityUses = data.toiletPlans.reduce((sum, item) => sum + sanitizeNumber(item?.capacityUses), 0)
  const hygieneCapacity = data.hygieneSupplies.reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.usesPerUnit) || 1), 0)
  const wasteCapacity = data.wasteSupplies.reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.capacityUses) || 1), 0)
  const cleaningCapacity = data.cleaningSupplies.reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.mlPerUse) || 1), 0)
  const petWasteCapacity = data.petWasteSupplies.reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.usesPerUnit) || 1), 0)
  const days = {
    toiletDays: calculateToiletSupportDays(data.toiletPlans, dailyToiletUses),
    hygieneDays: calculateHygieneSupportDays(data.hygieneSupplies, data.household, data.settings, data.sanitationMode),
    wasteDays: calculateWasteSupportDays(data.wasteSupplies, data.household, data.settings, data.sanitationMode),
    cleaningDays: calculateCleaningSupportDays(data.cleaningSupplies, data.settings, data.sanitationMode),
    petWasteDays: calculatePetWasteSupportDays(data.petWasteSupplies, data.household, data.settings, data.sanitationMode)
  }
  days.overallDays = calculateOverallSanitationDays(days, sanitizeNumber(data.household.pets) > 0)
  const score = calculateSanitationScore(data, days)
  const capabilities = {
    toiletPlanCount: data.toiletPlans.length, indoorSafeToiletCount: data.toiletPlans.filter((item) => item?.indoorSafe).length,
    sealedWasteCount: data.wasteSupplies.filter((item) => item?.sealed).length, odorControlCount: [...data.toiletPlans, ...data.wasteSupplies].filter((item) => item?.odorControl).length,
    hygieneSupplyCount: data.hygieneSupplies.length, cleaningSupplyCount: data.cleaningSupplies.length, petWasteSupplyCount: data.petWasteSupplies.length, sanitationPlanCount: data.sanitationPlans.length
  }
  const totals = { householdSize, dailyToiletUses, toiletCapacityUses, hygieneCapacity, wasteCapacity, cleaningCapacity, petWasteCapacity }
  return { data, score, status: getSanitationStatus(score), totals, days, capabilities, recommendations: generateSanitationRecommendations(data, days) }
}
