import { getWaterIntelligenceSummary } from './waterStorage.js'
import { simulateWaterEvent } from './waterEventSimulator.js'
import { buildPresetCompoundEvents, simulateCompoundDisaster } from './compoundDisasterSimulator.js'
import { getEnergySystemSummary } from './energyStorage.js'
import { getSanitationSystemSummary } from './sanitationStorage.js'
import { getMedicalSystemSummary } from './medicalStorage.js'
import { getFoodSystemSummary } from './foodStorage.js'
import { getCommunicationSystemSummary } from './communicationStorage.js'

export const CORE_DOMAIN_WEIGHTS = { water: 25, food: 20, energy: 15, sanitation: 15, medical: 15, communication: 10 }
export const CORE_DOMAIN_LABELS = { water: 'Water｜水', food: 'Food｜食物', energy: 'Energy｜能源', sanitation: 'Sanitation｜衛生與排泄', medical: 'Medical｜醫療與急救', communication: 'Communication｜通訊與資訊' }

const list = (value) => Array.isArray(value) ? value : []
const number = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }
const clamp = (value) => Math.min(100, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0))
const text = (item) => `${item?.name || ''} ${item?.category || ''} ${item?.type || ''} ${item?.note || item?.notes || ''}`.toLowerCase()
const hasAny = (value, keywords) => keywords.some((keyword) => value.includes(keyword.toLowerCase()))

const domainKeywords = {
  food: ['食物','乾糧','罐頭','米','麵','泡麵','即食','能量棒','調理包','寵物食品','food','rice','canned','instant','pet food'],
  energy: ['行動電源','電池','手電筒','太陽能','瓦斯','卡式爐','燃料','發電機','power bank','battery','flashlight','solar','gas','fuel'],
  sanitation: ['垃圾袋','乾洗手','酒精','濕紙巾','衛生紙','貓砂','尿布','簡易馬桶','bleach','wipes','toilet paper','trash bag'],
  medical: ['急救包','繃帶','優碘','生理食鹽水','消毒','藥品','止痛','退燒','first aid','bandage','iodine','saline','medicine'],
  communication: ['收音機','無線電','對講機','充電線','行動電源','離線地圖','紙本聯絡表','radio','walkie','cable','offline map']
}

const typeMatches = { food: ['food','animal'], energy: ['power'], sanitation: ['hygiene'], medical: ['medical'], communication: [] }

export function getCoreReadinessLevel(score) {
  const value = clamp(score)
  if (value < 30) return { level: 'Critical', label: '危急' }
  if (value < 50) return { level: 'Fragile', label: '脆弱' }
  if (value < 70) return { level: 'Prepared', label: '基礎準備' }
  if (value < 85) return { level: 'Resilient', label: '具韌性' }
  return { level: 'Fortified', label: '堡壘級' }
}

function estimatedDomain(domain, state = {}) {
  const inventory = list(state.inventory)
  const matched = inventory.filter((item) => typeMatches[domain]?.includes(String(item?.type || '')) || hasAny(text(item), domainKeywords[domain] || []))
  const uniqueSignals = new Set(matched.map((item) => String(item?.type || item?.category || item?.name || ''))).size
  const preparedness = state.preparedness || {}
  const completed = state.completed || {}
  let score = matched.length === 0 ? 5 : matched.length === 1 ? 35 : matched.length <= 3 ? 58 : 72
  score += Math.min(12, uniqueSignals * 3)
  let days = 0
  if (domain === 'food') {
    const servings = matched.reduce((sum, item) => sum + number(item?.servings || (item?.type === 'food' ? item?.quantity : 0)), 0)
    days = servings / 3
    if (servings >= 9) score = Math.max(score, 55)
    if (servings >= 21 || Object.keys(completed).some((key) => completed[key] && /food.*7d|home-shelter|rolling-pantry/i.test(key))) score = Math.max(score, 90)
  }
  if (domain === 'energy' && (preparedness.power || preparedness.light)) score += 15
  if (domain === 'sanitation' && (preparedness.hygiene || preparedness.sanitation)) score += 15
  if (domain === 'medical' && (preparedness.firstaid || preparedness.medicine)) score += 20
  if (domain === 'communication' && (preparedness.contacts || preparedness.communication)) score += 20
  score = Math.round(clamp(score))
  const confidence = matched.length >= 2 ? 'medium' : 'low'
  const source = matched.length ? 'inventory' : 'missing'
  const weakness = matched.length ? score < 50 ? '物資線索偏少，尚未形成可驗證的備援系統。' : '目前僅由 Inventory 與既有勾選推估，資料仍不完整。' : '目前沒有足夠資料可評估。'
  const recommendations = {
    food: '建立至少 72 小時即食／低烹調食物，並逐步提升到 7 天配置。',
    energy: '盤點照明、手機充電、基本烹調與不依賴電網的替代能源。',
    sanitation: '建立停水時的廁所、垃圾、洗手與清潔替代方案。',
    medical: '建立家庭急救包、常備藥與慢性病／動物用藥清單。',
    communication: '準備收音機、紙本聯絡表、集合點與離線地圖。'
  }
  return { score, status: getCoreReadinessLevel(score).label, days, confidence, source, primaryWeaknesses: [weakness], topRecommendation: recommendations[domain], evidenceCount: matched.length }
}

export function calculateCoreDomainScores(state = {}, waterInput, energyInput, sanitationInput, medicalInput, foodInput, communicationInput) {
  const water = waterInput && typeof waterInput === 'object' ? waterInput : getWaterIntelligenceSummary()
  const waterScore = Math.round(clamp(water?.score))
  const waterWeaknesses = list(water?.recommendations).slice(0, 2)
  const energy = energyInput && typeof energyInput === 'object' ? energyInput : getEnergySystemSummary()
  const hasEnergyData = ['devices','powerSources','fuelSources','energyPlans'].some((key)=>list(energy?.data?.[key]).length>0)
  const estimatedEnergy = estimatedDomain('energy', state)
  const energyDomain = hasEnergyData ? { score: Math.round(clamp(energy.score)), status: getCoreReadinessLevel(energy.score).label, days: number(energy.days?.overallDays || energy.days?.essentialElectricDays), confidence: 'high', source: 'energySystem', primaryWeaknesses: list(energy.recommendations).slice(0,2), topRecommendation: energy.recommendations?.[0] || '持續實測能源容量與停電分配。' } : estimatedEnergy
  const sanitation = sanitationInput && typeof sanitationInput === 'object' ? sanitationInput : getSanitationSystemSummary()
  const hasSanitationData = ['toiletPlans','hygieneSupplies','wasteSupplies','cleaningSupplies','petWasteSupplies','sanitationPlans'].some((key)=>list(sanitation?.data?.[key]).length>0)
  const estimatedSanitation = estimatedDomain('sanitation', state)
  const sanitationDomain = hasSanitationData ? { score: Math.round(clamp(sanitation.score)), status: getCoreReadinessLevel(sanitation.score).label, days: number(sanitation.days?.overallDays), confidence: 'high', source: 'sanitationSystem', primaryWeaknesses: list(sanitation.recommendations).slice(0,2), topRecommendation: sanitation.recommendations?.[0] || '持續輪替衛生耗材並完成停水演練。' } : estimatedSanitation
  const medical = medicalInput && typeof medicalInput === 'object' ? medicalInput : getMedicalSystemSummary()
  const hasMedicalData = ['firstAidItems','medicines','chronicNeeds','petMedicalItems','emergencyContacts','carePlans'].some((key)=>list(medical?.data?.[key]).length>0)
  const estimatedMedical = estimatedDomain('medical', state)
  const medicalDomain = hasMedicalData ? { score: Math.round(clamp(medical.score)), status: getCoreReadinessLevel(medical.score).label, days: number(medical.days?.overallDays), confidence: 'high', source: 'medicalSystem', primaryWeaknesses: list(medical.recommendations).slice(0,2), topRecommendation: medical.recommendations?.[0] || '持續輪替急救用品並演練照護方案。' } : estimatedMedical
  const food=foodInput&&typeof foodInput==='object'?foodInput:getFoodSystemSummary(),hasFoodData=['foodItems','petFoodItems','cookingPlans','rationPlans'].some((key)=>list(food?.data?.[key]).length>0),estimatedFood=estimatedDomain('food',state),foodDomain=hasFoodData?{score:Math.round(clamp(food.score)),status:getCoreReadinessLevel(food.score).label,days:number(food.days?.overallDays),confidence:'high',source:'foodSystem',primaryWeaknesses:list(food.recommendations).slice(0,2),topRecommendation:food.recommendations?.[0]||'持續輪替食物並演練配給。'}:estimatedFood
  const communication=communicationInput&&typeof communicationInput==='object'?communicationInput:getCommunicationSystemSummary(),hasCommunicationData=['contacts','devices','informationSources','meetingPoints','messagePlans','offlineDocuments'].some((key)=>list(communication?.data?.[key]).length>0),estimatedCommunication=estimatedDomain('communication',state),communicationDomain=hasCommunicationData?{score:Math.round(clamp(communication.score)),status:getCoreReadinessLevel(communication.score).label,days:0,confidence:'high',source:'communicationSystem',primaryWeaknesses:list(communication.recommendations).slice(0,2),topRecommendation:communication.recommendations?.[0]||'持續更新離線資訊與家庭通訊計畫。'}:estimatedCommunication
  return {
    water: { score: waterScore, status: getCoreReadinessLevel(waterScore).label, days: number(water?.days?.overallDays), confidence: 'high', source: 'waterSystem', primaryWeaknesses: waterWeaknesses.length ? waterWeaknesses : ['尚無水系統改善建議。'], topRecommendation: waterWeaknesses[0] || '持續輪替儲水並演練停水分配。' },
    food: foodDomain,
    energy: energyDomain,
    sanitation: sanitationDomain,
    medical: medicalDomain,
    communication: communicationDomain
  }
}

export function calculateCoreSurvivalScore(domains = {}) {
  return Math.round(clamp(Object.entries(CORE_DOMAIN_WEIGHTS).reduce((sum, [domain, weight]) => sum + clamp(domains?.[domain]?.score) * weight / 100, 0)))
}

function weakestDomainIds(domains, limit = 3) {
  return Object.keys(CORE_DOMAIN_WEIGHTS).sort((a, b) => clamp(domains?.[a]?.score) - clamp(domains?.[b]?.score)).slice(0, limit)
}

export function evaluateCoreScenarioReadiness(summary = {}, waterInput) {
  const domains = summary.domains || {}
  const water = waterInput && typeof waterInput === 'object' ? waterInput : null
  const presets = buildPresetCompoundEvents()
  const weakest = weakestDomainIds(domains, 2)
  const average = (ids) => ids.length ? ids.reduce((sum, id) => sum + clamp(domains?.[id]?.score), 0) / ids.length : 0
  const scenarios = [
    { id: 'home-24h', name: '24 小時居家停擺', durationDays: 1, domainIds: ['water','food','energy','sanitation','medical','communication'], simulation: water ? simulateWaterEvent(water, { durationDays: 1, mode: 'planned' }) : null },
    { id: 'water-power-72h', name: '72 小時停水停電', durationDays: 3, domainIds: ['water','energy','sanitation','communication'], simulation: water ? simulateCompoundDisaster(water, presets.find((item)=>item.id==='water-power-72h'), { mode: 'planned', strictness: 'standard' }) : null },
    { id: 'supply-7d', name: '7 天補給中斷', durationDays: 7, domainIds: ['water','food','energy','sanitation','medical'], simulation: water ? simulateCompoundDisaster(water, presets.find((item)=>item.id==='typhoon-supply-7d'), { mode: 'planned', strictness: 'standard' }) : null },
    { id: 'major-14d', name: '14 天重大災害', durationDays: 14, domainIds: Object.keys(CORE_DOMAIN_WEIGHTS), simulation: water ? simulateCompoundDisaster(water, presets.find((item)=>item.id==='earthquake-pipeline-14d'), { mode: 'planned', strictness: 'conservative' }) : null },
    { id: 'compound-stress', name: '複合災害壓力測試', durationDays: 7, domainIds: Object.keys(CORE_DOMAIN_WEIGHTS), simulation: water ? simulateCompoundDisaster(water, presets.find((item)=>item.id==='water-contamination-72h'), { mode: 'planned', strictness: 'worstCase' }) : null }
  ]
  return scenarios.map((scenario) => {
    const simulationScore = clamp(scenario.simulation?.result?.score)
    const domainScore = average(scenario.domainIds)
    const score = Math.round(clamp(simulationScore * 0.5 + domainScore * 0.5))
    const simulationStatus = scenario.simulation?.result?.status
    let status = score >= 75 ? 'pass' : score >= 60 ? 'strained' : score >= 45 ? 'partial' : score >= 25 ? 'fail' : 'critical'
    if (simulationStatus === 'critical') status = 'critical'
    const labels = { pass: '可承受', strained: '壓力偏高', partial: '部分不足', fail: '無法承受', critical: '危急' }
    const scenarioWeakest = [...scenario.domainIds].sort((a,b)=>clamp(domains?.[a]?.score)-clamp(domains?.[b]?.score)).slice(0,2)
    return { id: scenario.id, name: scenario.name, durationDays: scenario.durationDays, status, label: labels[status], score, weakestDomains: scenarioWeakest.length ? scenarioWeakest : weakest, recommendation: domains?.[scenarioWeakest[0]]?.topRecommendation || '補齊核心資源資料並完成家庭演練。' }
  })
}

export function detectCoreWeaknesses(summary = {}) {
  const domains = summary.domains || {}
  const scenarios = list(summary.scenarioReadiness)
  const weaknesses = []
  const add = (id, domain, severity, title, description, recommendation) => weaknesses.push({ id, domain, severity, title, description, recommendation })
  if (clamp(domains.water?.score) < 50) add('water-score','water','critical','水系統分數低於 50','飲水、生活用水或補水能力存在重大缺口。',domains.water?.topRecommendation)
  if (number(domains.water?.days) < 3) add('water-days','water','critical','水支撐低於 3 天','現有水量無法形成 72 小時緩衝。','先補足三天飲水與最低生活用水。')
  const outage72 = scenarios.find((item)=>item.id==='water-power-72h')
  if (outage72 && outage72.status !== 'pass') add('outage-72h','water','high','72 小時停水停電尚不可承受',`目前推估為「${outage72.label}」。`,outage72.recommendation)
  for (const domain of ['food','energy','sanitation','medical','communication']) if (domains[domain]?.confidence === 'low') add(`${domain}-data`,domain,'medium',`${CORE_DOMAIN_LABELS[domain]}資料不足`,'目前只能依有限 Inventory 或勾選資料粗略推估。',domains[domain]?.topRecommendation)
  for (const domain of Object.keys(CORE_DOMAIN_WEIGHTS)) if (clamp(domains[domain]?.score) < 30) add(`${domain}-critical`,domain,'critical',`${CORE_DOMAIN_LABELS[domain]}低於 30`, '此核心域可能成為事件中的首要失敗點。', domains[domain]?.topRecommendation)
  if (Object.values(domains).filter((domain)=>clamp(domain?.score)<50).length >= 2) add('multi-domain-low','core','high','兩個以上核心域低於 50','複合災害可能讓多個資源缺口互相放大。','先處理最低分核心域，再建立跨域 72 小時分配方案。')
  if (scenarios.some((item)=>['fail','critical'].includes(item.status))) add('compound-failure','core','critical','複合災害推演未通過','至少一個核心情境為無法承受或危急。','依情境建議補強水、食物、能源、衛生與通訊的共同弱點。')
  const rank = { critical: 0, high: 1, medium: 2, low: 3 }
  return weaknesses.sort((a,b)=>rank[a.severity]-rank[b.severity])
}

export function buildCoreRecommendations(summary = {}) {
  const weaknesses = list(summary.weaknesses).length ? summary.weaknesses : detectCoreWeaknesses(summary)
  const recommendations = weaknesses.map((item)=>item.recommendation).filter(Boolean)
  for (const domain of weakestDomainIds(summary.domains || {}, 3)) if (summary.domains?.[domain]?.topRecommendation) recommendations.push(summary.domains[domain].topRecommendation)
  return [...new Set(recommendations)].slice(0, 8)
}

export function getCoreSystemSummary(state = {}, waterInput, energyInput, sanitationInput, medicalInput, foodInput, communicationInput) {
  const safeState = state && typeof state === 'object' && !Array.isArray(state) ? state : {}
  const water = waterInput && typeof waterInput === 'object' ? waterInput : getWaterIntelligenceSummary()
  const domains = calculateCoreDomainScores(safeState, water, energyInput, sanitationInput, medicalInput, foodInput, communicationInput)
  const totalScore = calculateCoreSurvivalScore(domains)
  const readinessLevel = getCoreReadinessLevel(totalScore)
  const draft = { domains, totalScore, readinessLevel, weakestDomains: weakestDomainIds(domains, 3) }
  const scenarioReadiness = evaluateCoreScenarioReadiness(draft, water)
  const withScenarios = { ...draft, scenarioReadiness }
  const weaknesses = detectCoreWeaknesses(withScenarios)
  const recommendations = buildCoreRecommendations({ ...withScenarios, weaknesses })
  return { ...withScenarios, weaknesses, recommendations, generatedAt: new Date().toISOString() }
}
