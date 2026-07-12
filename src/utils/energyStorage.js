import { createDefaultEnergySystem, ENERGY_STORAGE_KEY } from '../data/energyDefaults.js'
import { calculateCookingSupportDays, calculateElectricSupportDays, calculateEnergyScore, calculateEssentialDailyWh, calculateFuelCookingUses, calculateOverallEnergyDays, calculateTotalDailyWh, calculateUsablePowerWh, generateEnergyRecommendations, getEnergyStatus } from './energyCalculations.js'

const list = (value) => Array.isArray(value) ? value : []

export function loadEnergySystemData() {
  const fallback = createDefaultEnergySystem()
  if (typeof localStorage === 'undefined') return fallback
  try {
    const saved = JSON.parse(localStorage.getItem(ENERGY_STORAGE_KEY))
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return fallback
    const usageProfiles = saved.usageProfiles && typeof saved.usageProfiles === 'object' && !Array.isArray(saved.usageProfiles) ? { ...fallback.usageProfiles, ...saved.usageProfiles } : fallback.usageProfiles
    const currentProfile = usageProfiles[saved.currentProfile] ? saved.currentProfile : fallback.currentProfile
    return { ...fallback, ...saved, devices: list(saved.devices), powerSources: list(saved.powerSources), fuelSources: list(saved.fuelSources), energyPlans: list(saved.energyPlans), usageProfiles, currentProfile }
  } catch { return fallback }
}

export function saveEnergySystemData(data = {}) {
  const next = { ...createDefaultEnergySystem(), ...(data && typeof data === 'object' && !Array.isArray(data) ? data : {}), version: '5.1', updatedAt: new Date().toISOString() }
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getEnergySystemSummary(input) {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input : loadEnergySystemData()
  const devices = list(data.devices), powerSources = list(data.powerSources), fuelSources = list(data.fuelSources), energyPlans = list(data.energyPlans)
  const dailyWh = calculateTotalDailyWh(devices)
  const essentialDailyWh = calculateEssentialDailyWh(devices)
  const usablePowerWh = calculateUsablePowerWh(powerSources)
  const cookingUsesAvailable = calculateFuelCookingUses(fuelSources)
  const profile = data.usageProfiles?.[data.currentProfile] || {}
  const cookingUsesPerDay = Number(profile.cookingUsesPerDay) > 0 ? Number(profile.cookingUsesPerDay) : 0
  const electricDays = calculateElectricSupportDays(usablePowerWh, dailyWh)
  const essentialElectricDays = calculateElectricSupportDays(usablePowerWh, essentialDailyWh)
  const cookingDays = calculateCookingSupportDays(cookingUsesAvailable, cookingUsesPerDay)
  const overallDays = calculateOverallEnergyDays(essentialElectricDays, cookingDays, cookingUsesPerDay)
  const normalized = { ...data, devices, powerSources, fuelSources, energyPlans }
  const score = calculateEnergyScore(normalized)
  return { data: normalized, score, status: getEnergyStatus(score), totals: { dailyWh, essentialDailyWh, usablePowerWh, cookingUsesAvailable }, days: { electricDays, essentialElectricDays, cookingDays, overallDays }, capabilities: { lightingDeviceCount: devices.filter((item)=>item?.category==='lighting').length, communicationDeviceCount: devices.filter((item)=>item?.category==='communication'||item?.category==='information').length, medicalDeviceCount: devices.filter((item)=>item?.category==='medical').length, nonGridPowerSourceCount: powerSources.filter((item)=>item?.type!=='grid'&&item?.dependsOnGrid!==true).length, rechargeableSourceCount: powerSources.filter((item)=>item?.rechargeable===true).length, solarSourceCount: powerSources.filter((item)=>item?.type==='solarPanel'||item?.solarRecharge===true).length, planCount: energyPlans.length }, recommendations: generateEnergyRecommendations(normalized) }
}
