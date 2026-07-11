const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}
const list = (value) => Array.isArray(value) ? value : []
const safeDays = (volume, demand) => {
  const safeDemand = number(demand)
  return safeDemand ? number(volume) / safeDemand : 0
}

export function calculateHumanDrinkingDemand(household = {}) {
  const needs = household.needs || {}
  return number(household.adults) * number(needs.adult) + number(household.children) * number(needs.child) + number(household.seniors) * number(needs.senior) + number(household.specialNeeds) * number(needs.specialNeeds)
}

export function calculateAnimalDrinkingDemand(household = {}) {
  const needs = household.needs || {}
  return number(household.dogs) * number(needs.dog) + number(household.cats) * number(needs.cat) + number(household.otherAnimals) * number(needs.otherAnimal)
}

export function calculateDailyDrinkingDemand(household = {}) {
  return calculateHumanDrinkingDemand(household) + calculateAnimalDrinkingDemand(household)
}

export function calculateDailyUtilityDemand(mode = {}) {
  return number(mode.cooking) + number(mode.cleaning) + number(mode.toilet)
}

export function calculateTotalDailyDemand(household = {}, mode = {}) {
  return calculateDailyDrinkingDemand(household) + calculateDailyUtilityDemand(mode)
}

export function calculatePotableStorage(storage = []) {
  return list(storage).reduce((sum, item) => sum + (item?.potable === true ? number(item.volumeLiters) : 0), 0)
}

export function calculateNonPotableStorage(storage = []) {
  return list(storage).reduce((sum, item) => sum + (item?.potable === true ? 0 : number(item?.volumeLiters)), 0)
}

export function calculateTreatmentRequiredStorage(storage = []) {
  return list(storage).reduce((sum, item) => sum + (item?.requiresTreatment === true ? number(item.volumeLiters) : 0), 0)
}

export const calculateDrinkingDays = (storage, demand) => safeDays(storage, demand)
export const calculateUtilityDays = (storage, demand) => safeDays(storage, demand)
export function calculateOverallWaterDays(drinkingDays, utilityDays) {
  return Math.min(number(drinkingDays), number(utilityDays))
}

export function calculatePurificationCapacity(treatments = []) {
  return list(treatments).reduce((sum, method) => sum + (method?.owned === true ? number(method.dailyCapacity) : 0), 0)
}

export function getPlanMetrics(plan = {}, minimumDrinking = 0, availableWater = 0) {
  const daily = number(plan.drinking) + number(plan.cooking) + number(plan.cleaning) + number(plan.toilet) + number(plan.animals)
  const total = daily * number(plan.durationDays) + number(plan.emergencyReserve)
  return { daily, total, enough: number(availableWater) >= total, belowMinimum: number(plan.drinking) + number(plan.animals) < number(minimumDrinking) }
}

export function calculateWaterScore(data = {}) {
  const household = data.household || {}
  const mode = data.modes?.[data.activeMode] || {}
  const drinking = calculateDailyDrinkingDemand(household)
  const utility = calculateDailyUtilityDemand(mode)
  const potable = calculatePotableStorage(data.storage)
  const nonPotable = calculateNonPotableStorage(data.storage)
  const sources = list(data.sources)
  const treatments = list(data.treatments).filter((item) => item?.owned === true)
  const plans = list(data.plans)
  const animals = number(household.dogs) + number(household.cats) + number(household.otherAnimals)
  const planValid = plans.some((plan) => !getPlanMetrics(plan, drinking, potable + nonPotable).belowMinimum)
  const hasRotation = list(data.storage).some((item) => item?.storedAt && item?.expiresAt)
  const alternative = data.rainwater?.enabled || sources.some((item) => ['rain', 'spring', 'stream', 'river', 'well', 'dehumidifier', 'airConditioner'].includes(item?.type))
  let score = 0
  score += Math.min(safeDays(potable, drinking) / 7, 1) * 25
  score += Math.min(safeDays(nonPotable, utility) / 7, 1) * 15
  score += Math.min(sources.length / 2, 1) * 15
  score += Math.min(calculatePurificationCapacity(treatments) / Math.max(drinking, 1), 1) * 20
  score += plans.length ? (planValid ? 10 : 5) : 0
  score += animals === 0 || calculateAnimalDrinkingDemand(household) > 0 ? 5 : 0
  score += hasRotation ? 5 : 0
  score += alternative ? 5 : 0
  return Math.round(Math.min(100, Math.max(0, score)))
}

export function getWaterStatus(score) {
  const value = number(score)
  if (value < 30) return 'Critical'
  if (value < 50) return 'Fragile'
  if (value < 70) return 'Prepared'
  if (value < 85) return 'Resilient'
  return 'Fortified'
}

export function generateWaterRecommendations(data = {}) {
  const household = data.household || {}
  const mode = data.modes?.[data.activeMode] || {}
  const drinking = calculateDailyDrinkingDemand(household)
  const potable = calculatePotableStorage(data.storage)
  const nonPotable = calculateNonPotableStorage(data.storage)
  const drinkingDays = safeDays(potable, drinking)
  const utilityDays = safeDays(nonPotable, calculateDailyUtilityDemand(mode))
  const sources = list(data.sources)
  const treatments = list(data.treatments).filter((item) => item?.owned === true)
  const plans = list(data.plans)
  const animals = number(household.dogs) + number(household.cats) + number(household.otherAnimals)
  const suggestions = []
  if (drinkingDays < 1) suggestions.push('飲用水不足 1 天：立即補足可直接飲用的安全儲水。')
  else if (drinkingDays < 3) suggestions.push('飲用水不足 3 天：優先建立至少 72 小時飲水線。')
  if (utilityDays < 1) suggestions.push('生活用水不足：增加清潔與廁所用途的非飲用儲水。')
  if (!sources.length) suggestions.push('沒有補水來源：建立至少兩個可實際到達的來源。')
  else if (sources.length === 1) suggestions.push('只有一個補水來源：增加不共享相同失效條件的備援來源。')
  if (sources.length && sources.every((item) => item?.dependsOnElectricity)) suggestions.push('所有補水來源都依賴電力：增加無電力來源。')
  if (sources.length && sources.every((item) => item?.dependsOnTransport)) suggestions.push('所有補水來源都依賴交通：增加步行可達或現地來源。')
  if (!treatments.length) suggestions.push('沒有淨水方法：準備適合風險類型的淨水設備與程序。')
  else if (calculatePurificationCapacity(treatments) < drinking) suggestions.push('淨水能力低於每日飲水需求：提升每日處理容量。')
  if (treatments.length && treatments.every((item) => item?.requiresElectricity)) suggestions.push('所有淨水方式都依賴電力：增加無電力淨水備援。')
  if (treatments.length && treatments.every((item) => item?.requiresConsumables)) suggestions.push('所有淨水方式都依賴耗材：增加可長期運作的方法。')
  if (animals > 0 && calculateAnimalDrinkingDemand(household) <= 0) suggestions.push('有動物但未設定動物用水：填入每隻每日最低飲水量。')
  if (!plans.length) suggestions.push('沒有停水分配方案：建立 24 小時、72 小時與 7 天方案。')
  if (plans.some((plan) => getPlanMetrics(plan, drinking, potable + nonPotable).belowMinimum)) suggestions.push('部分分配方案低於最低飲水需求：提高人與動物飲水配額。')
  if (!plans.some((plan) => number(plan?.emergencyReserve) > 0)) suggestions.push('沒有緊急保留水：在分配方案中保留不可日常動用的水量。')
  if (list(data.storage).some((item) => !item?.expiresAt)) suggestions.push('部分儲水沒有保存期限：標記期限並安排輪替。')
  if (!data.rainwater?.enabled && !sources.some((item) => ['rain', 'spring', 'stream', 'river', 'well', 'dehumidifier', 'airConditioner'].includes(item?.type))) suggestions.push('沒有雨水或替代水源：評估可安全管理的備用來源。')
  return suggestions.length ? suggestions : ['目前未偵測到重大缺口；持續輪替儲水並定期演練停水方案。']
}
