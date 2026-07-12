const list = (value) => Array.isArray(value) ? value : []

export function sanitizeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function calculateDeviceDailyWh(device = {}) {
  return sanitizeNumber(device.watts) * sanitizeNumber(device.hoursPerDay)
}

export function calculateTotalDailyWh(devices = []) {
  return list(devices).reduce((sum, device) => sum + calculateDeviceDailyWh(device), 0)
}

export function calculateEssentialDailyWh(devices = []) {
  return list(devices).filter((device) => device?.essential === true || device?.priority === 'critical').reduce((sum, device) => sum + calculateDeviceDailyWh(device), 0)
}

export function calculateUsablePowerWh(sources = []) {
  return list(sources).reduce((sum, source) => sum + sanitizeNumber(source?.capacityWh) * Math.min(100, sanitizeNumber(source?.usablePercent)) / 100, 0)
}

export function calculateFuelCookingUses(sources = []) {
  return list(sources).reduce((sum, source) => {
    const explicit = sanitizeNumber(source?.cookingUsesAvailable)
    return sum + (explicit || sanitizeNumber(source?.amount) * sanitizeNumber(source?.usesPerUnit))
  }, 0)
}

export function calculateElectricSupportDays(totalUsableWh, dailyWh) {
  const daily = sanitizeNumber(dailyWh)
  return daily > 0 ? sanitizeNumber(totalUsableWh) / daily : 0
}

export function calculateCookingSupportDays(totalUses, usesPerDay) {
  const daily = sanitizeNumber(usesPerDay)
  return daily > 0 ? sanitizeNumber(totalUses) / daily : 0
}

export function calculateOverallEnergyDays(essentialDays, cookingDays, cookingUsesPerDay = 1) {
  const electric = sanitizeNumber(essentialDays)
  if (sanitizeNumber(cookingUsesPerDay) === 0) return electric
  const cooking = sanitizeNumber(cookingDays)
  return electric > 0 && cooking > 0 ? Math.min(electric, cooking) : 0
}

export function calculateEnergyScore(data = {}) {
  const devices = list(data.devices)
  const sources = list(data.powerSources)
  const fuels = list(data.fuelSources)
  const plans = list(data.energyPlans)
  const usableWh = calculateUsablePowerWh(sources)
  const essentialDays = calculateElectricSupportDays(usableWh, calculateEssentialDailyWh(devices))
  const cookingUses = calculateFuelCookingUses(fuels)
  const lighting = devices.some((item) => item?.category === 'lighting')
  const communication = devices.some((item) => item?.category === 'communication' || item?.category === 'information')
  const nonGrid = sources.some((item) => item?.type !== 'grid' && item?.dependsOnGrid !== true)
  let score = usableWh >= 3000 ? 25 : usableWh >= 1000 ? 20 : usableWh >= 300 ? 12 : usableWh > 0 ? 6 : 0
  score += essentialDays >= 7 ? 20 : essentialDays >= 3 ? 15 : essentialDays >= 1 ? 8 : 0
  score += lighting && usableWh > 0 ? 15 : lighting ? 5 : 0
  score += communication && usableWh > 0 ? 15 : communication ? 5 : 0
  score += cookingUses >= 7 ? 10 : cookingUses > 0 ? 5 : 0
  score += nonGrid ? 10 : 0
  score += plans.length ? 5 : 0
  return Math.min(100, Math.round(score))
}

export function getEnergyStatus(score) {
  const value = Math.min(100, sanitizeNumber(score))
  if (value < 30) return 'Critical'
  if (value < 50) return 'Fragile'
  if (value < 70) return 'Prepared'
  if (value < 85) return 'Resilient'
  return 'Fortified'
}

export function generateEnergyRecommendations(data = {}) {
  const devices = list(data.devices)
  const sources = list(data.powerSources)
  const fuels = list(data.fuelSources)
  const plans = list(data.energyPlans)
  const usableWh = calculateUsablePowerWh(sources)
  const essentialDays = calculateElectricSupportDays(usableWh, calculateEssentialDailyWh(devices))
  const recommendations = []
  if (!sources.length) recommendations.push('沒有任何供電來源：先建立可支援照明與手機充電的備用電力。')
  if (!devices.some((item) => item?.category === 'lighting')) recommendations.push('沒有照明設備規劃：加入低耗能手電筒、頭燈或 LED 燈。')
  if (!devices.some((item) => item?.category === 'communication' || item?.category === 'information')) recommendations.push('沒有通訊充電能力：盤點手機、收音機與必要充電設備。')
  if (essentialDays < 1) recommendations.push('必要設備支撐低於 24 小時：降低負載或增加可用電量。')
  else if (essentialDays < 3) recommendations.push('必要設備支撐低於 72 小時：建立三天最低用電分配。')
  if (!sources.some((item) => item?.type !== 'grid' && item?.dependsOnGrid !== true)) recommendations.push('沒有非市電供電來源：停電時現有來源可能無法使用。')
  if (calculateFuelCookingUses(fuels) === 0) recommendations.push('沒有烹調燃料：準備安全、合規且適合使用環境的備用烹調能源。')
  if (!plans.length) recommendations.push('沒有能源分配方案：建立 24 小時、72 小時或 7 天停電配額。')
  if (sources.length && sources.every((item) => item?.dependsOnGrid === true || item?.type === 'grid')) recommendations.push('所有供電來源都依賴市電：增加可離網使用的供電來源。')
  if (!devices.some((item) => item?.category === 'medical' && item?.essential === true)) recommendations.push('沒有醫療必要設備供電規劃：若家庭有相關需求，請建立獨立備援。')
  return recommendations.length ? recommendations : ['目前能源基礎配置完整；持續實測容量、輪替燃料並演練停電分配。']
}

export function evaluateEnergyPlan(plan = {}, data = {}) {
  const days = sanitizeNumber(plan.durationDays)
  const dailyWh = ['lightingWhPerDay','communicationWhPerDay','medicalWhPerDay','refrigerationWhPerDay','otherWhPerDay'].reduce((sum, key) => sum + sanitizeNumber(plan[key]), 0)
  const totalWh = dailyWh * days
  const cookingUses = sanitizeNumber(plan.cookingUsesPerDay) * days
  const availableWh = calculateUsablePowerWh(data.powerSources)
  const availableCookingUses = calculateFuelCookingUses(data.fuelSources)
  return { dailyWh, totalWh, cookingUses, availableWh, availableCookingUses, electricEnough: availableWh >= totalWh, cookingEnough: cookingUses === 0 || availableCookingUses >= cookingUses, enough: availableWh >= totalWh && (cookingUses === 0 || availableCookingUses >= cookingUses), electricGap: Math.max(0, totalWh - availableWh), cookingGap: Math.max(0, cookingUses - availableCookingUses) }
}
