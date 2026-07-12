export function sanitizeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const list = (value) => Array.isArray(value) ? value : []
const safeDays = (capacity, demand) => demand > 0 ? sanitizeNumber(capacity) / demand : 0
const modeFactor = (mode) => ({ emergency: 0.65, conservation: 0.8, normal: 1 }[mode] || 0.65)

export function calculateHouseholdSize(household = {}) {
  return ['adults', 'children', 'seniors', 'specialNeeds'].reduce((sum, key) => sum + sanitizeNumber(household?.[key]), 0)
}

export function calculateDailyToiletUses(household = {}, settings = {}, mode = 'emergency') {
  return calculateHouseholdSize(household) * sanitizeNumber(settings?.toiletUsesPerPersonPerDay) * modeFactor(mode)
}

export function calculateToiletSupportDays(toiletPlans = [], dailyUses = 0) {
  return safeDays(list(toiletPlans).reduce((sum, item) => sum + sanitizeNumber(item?.capacityUses), 0), sanitizeNumber(dailyUses))
}

export function calculateHygieneSupportDays(supplies = [], household = {}, settings = {}, mode = 'emergency') {
  const people = calculateHouseholdSize(household)
  const factor = modeFactor(mode)
  const demand = people * (sanitizeNumber(settings?.wipesPerPersonPerDay) + sanitizeNumber(settings?.handSanitizerMlPerPersonPerDay)) * factor
  const capacity = list(supplies).reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.usesPerUnit) || 1), 0)
  return safeDays(capacity, demand)
}

export function calculateWasteSupportDays(supplies = [], household = {}, settings = {}, mode = 'emergency') {
  const demand = calculateHouseholdSize(household) * sanitizeNumber(settings?.wasteBagsPerPersonPerDay) * modeFactor(mode)
  const capacity = list(supplies).reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.capacityUses) || 1), 0)
  return safeDays(capacity, demand)
}

export function calculateCleaningSupportDays(supplies = [], settings = {}, mode = 'emergency') {
  const demand = sanitizeNumber(settings?.disinfectantMlPerDay) * modeFactor(mode)
  const capacity = list(supplies).reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.mlPerUse) || 1), 0)
  return safeDays(capacity, demand)
}

export function calculatePetWasteSupportDays(supplies = [], household = {}, settings = {}, mode = 'emergency') {
  const demand = sanitizeNumber(household?.pets) * sanitizeNumber(settings?.petWasteBagsPerPetPerDay) * modeFactor(mode)
  const capacity = list(supplies).reduce((sum, item) => sum + sanitizeNumber(item?.quantity) * (sanitizeNumber(item?.usesPerUnit) || 1), 0)
  return safeDays(capacity, demand)
}

export function calculateOverallSanitationDays(days = {}, hasPets = false) {
  const values = [days.toiletDays, days.hygieneDays, days.wasteDays, days.cleaningDays, hasPets ? days.petWasteDays : null].filter((value) => value !== null).map(sanitizeNumber)
  return values.length ? Math.min(...values) : 0
}

export function getSanitationStatus(score) {
  const value = Math.min(100, sanitizeNumber(score))
  if (value < 30) return 'Critical'
  if (value < 50) return 'Fragile'
  if (value < 70) return 'Prepared'
  if (value < 85) return 'Resilient'
  return 'Fortified'
}

export function calculateSanitationScore(data = {}, days = {}) {
  const toilet = list(data.toiletPlans), waste = list(data.wasteSupplies), hygiene = list(data.hygieneSupplies), cleaning = list(data.cleaningSupplies), pets = sanitizeNumber(data.household?.pets)
  let score = toilet.length ? Math.min(25, 12 + sanitizeNumber(days.toiletDays) * 4) : 0
  score += waste.length ? Math.min(20, 8 + sanitizeNumber(days.wasteDays) * 3) : 0
  score += hygiene.length ? Math.min(15, 6 + sanitizeNumber(days.hygieneDays) * 2) : 0
  score += cleaning.length ? Math.min(15, 6 + sanitizeNumber(days.cleaningDays) * 2) : 0
  score += pets === 0 ? 10 : list(data.petWasteSupplies).length ? Math.min(10, 4 + sanitizeNumber(days.petWasteDays)) : 0
  score += list(data.sanitationPlans).length ? 10 : 0
  if (toilet.some((item) => item?.indoorSafe) && (toilet.some((item) => item?.odorControl) || waste.some((item) => item?.sealed || item?.odorControl))) score += 5
  return Math.round(Math.min(100, score))
}

export function generateSanitationRecommendations(data = {}, days = {}) {
  const toilet = list(data.toiletPlans), hygiene = list(data.hygieneSupplies), waste = list(data.wasteSupplies), cleaning = list(data.cleaningSupplies), pets = sanitizeNumber(data.household?.pets)
  const recs = []
  if (!toilet.some((item) => item?.type !== 'flushToilet')) recs.push('沒有停水廁所替代方案：建立不依賴沖水的排泄方案。')
  if (!waste.length || !waste.some((item) => item?.sealed || ['heavyDutyBags', 'container'].includes(item?.type))) recs.push('沒有垃圾袋或密封處理方式：準備厚袋與可封閉容器。')
  if (!hygiene.some((item) => ['handSanitizer', 'soap'].includes(item?.type))) recs.push('沒有乾洗手或肥皂：補上可在停水時使用的手部清潔用品。')
  if (!cleaning.some((item) => ['bleach', 'alcohol', 'disinfectant', 'surfaceWipes'].includes(item?.type))) recs.push('沒有消毒用品：依標示準備適用的消毒用品與安全稀釋方式。')
  if (sanitizeNumber(days.overallDays) < 1) recs.push('衛生支撐低於 24 小時：立即補齊廁所、垃圾、清潔與個人衛生耗材。')
  else if (sanitizeNumber(days.overallDays) < 3) recs.push('衛生支撐低於 72 小時：把最低衛生能力提升到三天。')
  if (pets > 0 && !list(data.petWasteSupplies).length) recs.push('有寵物但沒有寵物排泄方案：準備貓砂、尿布墊或拾便袋。')
  if (!list(data.sanitationPlans).length) recs.push('沒有停水衛生分配方案：建立 24 小時與 72 小時使用規則。')
  if (toilet.length && !toilet.some((item) => item?.indoorSafe)) recs.push('排泄方案不適合室內使用：增加可密封、通風且室內安全的方案。')
  if (!toilet.some((item) => item?.odorControl) && !waste.some((item) => item?.odorControl || item?.sealed)) recs.push('缺少除臭或密封措施：降低氣味、滲漏與接觸風險。')
  const specialNeeds = sanitizeNumber(data.household?.children) + sanitizeNumber(data.household?.seniors) + sanitizeNumber(data.household?.specialNeeds)
  if (specialNeeds > 0 && !hygiene.some((item) => ['menstrualProducts', 'diapers', 'towels', 'gloves'].includes(item?.type))) recs.push('缺少女性、生理期、幼兒或高齡者特殊衛生用品規劃。')
  return [...new Set(recs)]
}

export function evaluateSanitationPlan(plan = {}, summary = {}) {
  const days = sanitizeNumber(plan?.durationDays)
  const required = {
    toiletUses: sanitizeNumber(plan?.toiletUsesPerDay) * days,
    wasteBags: sanitizeNumber(plan?.wasteBagsPerDay) * days,
    wipes: sanitizeNumber(plan?.wipesPerDay) * days,
    handSanitizerMl: sanitizeNumber(plan?.handSanitizerMlPerDay) * days,
    disinfectantMl: sanitizeNumber(plan?.disinfectantMlPerDay) * days,
    petWasteUses: sanitizeNumber(plan?.petWasteUsesPerDay) * days
  }
  const enough = sanitizeNumber(summary?.days?.overallDays) >= days && days > 0
  return { durationDays: days, required, enough, status: enough ? '足夠' : '不足' }
}
