import React, { useMemo, useState } from 'react'
import { Clipboard, FileText, Printer, RefreshCw, ShieldAlert } from 'lucide-react'
import { DRILLS, getDrillCompletion } from './Drills.jsx'
import { getFoodRotationList, getInventorySummary, normalizeInventoryItem } from './Inventory.jsx'
import { getFoodProductionSummary } from './Plants.jsx'
import { getHighestRisk, getRiskCounts, residenceLabels } from './RiskMatrix.jsx'
import { getEvacuationKitSummary } from './EvacuationKit.jsx'
import { getRoadmapSummary } from './Roadmap.jsx'
import { getCompletedMap, getRecommendedTask } from '../data/tasks.js'
import { getWaterIntelligenceSummary } from '../utils/waterStorage.js'
import { simulateWaterEvent } from '../utils/waterEventSimulator.js'
import { buildPresetCompoundEvents, simulateCompoundDisaster } from '../utils/compoundDisasterSimulator.js'
import { CORE_DOMAIN_LABELS, getCoreSystemSummary } from '../utils/coreSystem.js'

function scoreTitle(score) {
  if (score <= 20) return '高風險'
  if (score <= 40) return '基礎不足'
  if (score <= 60) return '可撐 24 小時'
  if (score <= 80) return '可撐 72 小時'
  return '高韌性系統'
}

function formatNumber(value) {
  return Number(value.toFixed(1)).toString()
}
const usageCategoryLabels = { drinking: '飲水', cooking: '煮食', cleaning: '清潔', toilet: '廁所', animals: '動物', irrigation: '灌溉', medical: '醫療', other: '其他' }
function primaryUsageCategory(water) { const entry = Object.entries(water.usage.byCategory).sort((a, b) => b[1] - a[1])[0]; return entry && entry[1] > 0 ? usageCategoryLabels[entry[0]] : '無紀錄' }
function usageCategorySummary(water) { return Object.entries(water.usage.byCategory).filter(([, liters]) => Number(liters) > 0).sort((a, b) => b[1] - a[1]).map(([category, liters]) => `${usageCategoryLabels[category]} ${formatNumber(liters)} L`) }
const eventFailureLabels = { drinking: '飲用水', utility: '生活用水', total: '總水量', purification: '淨水能力', none: '無' }
function waterEventLine(item) { const result = item.simulation; return `${item.label}：${result.result.label}｜${result.result.score} 分｜可撐 ${formatNumber(result.result.survivedDays)} 天｜飲水缺口 ${formatNumber(result.gaps.drinkingGap)} L｜生活用水缺口 ${formatNumber(result.gaps.utilityGap)} L｜失敗點 ${eventFailureLabels[result.result.failurePoint]}` }
const compoundFailureLabels = { ...eventFailureLabels, water: '水資源', power: '電力', logistics: '交通補給', contamination: '水質', sanitation: '衛生' }
function compoundEventLine(item) { const result=item.simulation; return `${item.name}：${result.result.label}｜${result.result.score} 分｜${result.result.riskLevel}｜可撐 ${formatNumber(result.result.survivedDays)} 天｜失敗點 ${compoundFailureLabels[result.result.primaryFailurePoint]||result.result.primaryFailurePoint}｜建議：${result.recommendations[0]}` }

function statusBadgeClass(status) {
  if (status === '基本成立') return 'bg-[#24483a] text-[#fff9ea]'
  if (status === '部分成立' || status === '未設定') return 'bg-[#c2a25c] text-[#241b10]'
  return 'bg-[#8b2f25] text-[#fff9ea]'
}

function getPreparednessScore(state) {
  const preparedness = state.preparedness || {}
  const items = [
    preparedness.water ? '基本成立' : '缺口',
    preparedness.food ? '基本成立' : '缺口',
    preparedness.light && preparedness.power ? '基本成立' : (preparedness.light || preparedness.power ? '部分成立' : '缺口'),
    preparedness.firstaid || preparedness.medicine ? '基本成立' : '缺口',
    preparedness.animals ? '基本成立' : '缺口',
    preparedness.contacts && preparedness.documents ? '基本成立' : (preparedness.contacts || preparedness.documents ? '部分成立' : '缺口')
  ]

  return items.reduce((sum, status) => {
    if (status === '基本成立') return sum + 7
    if (status === '部分成立') return sum + 4
    return sum
  }, 0)
}

function calculateReadinessScore({ state, tasks, completedMap, drillSummary }) {
  const preparednessScore = getPreparednessScore(state)
  const inventoryScore = Math.min((state.inventory?.length || 0) / 6, 1) * 20
  const plantsScore = Math.min((state.plants?.length || 0) / 4, 1) * 15
  const taskScore = Math.min(Object.keys(completedMap).length / Math.max(tasks.length, 1), 1) * 23
  const drillScore = (drillSummary.percent / 100) * 10

  return Math.round(Math.min(100, preparednessScore + inventoryScore + plantsScore + taskScore + drillScore))
}

function getDrillDetails(drills = {}) {
  return DRILLS.map((drill) => {
    const checked = drills[drill.id] || {}
    const completed = drill.items.filter((_, index) => checked[`item-${index}`]).length
    const percent = drill.items.length ? Math.round((completed / drill.items.length) * 100) : 0

    return {
      ...drill,
      completed,
      percent,
      passed: completed >= drill.passCount
    }
  })
}

function getCoreStatuses({ state, supplySummary, normalizedInventory }) {
  const preparedness = state.preparedness || {}
  const hasMedicalHighPriority = normalizedInventory.some((item) => item.type === 'medical' && item.priority === 'high')
  const hasAnimalData = supplySummary.hasAnimalDemand || normalizedInventory.some((item) => item.type === 'animal' || String(item.category).includes('動物'))

  return [
    {
      key: 'water',
      label: '飲水',
      status: preparedness.water || supplySummary.waterLiters >= 9 ? '基本成立' : '缺口',
      reason: preparedness.water ? '備災清單已完成飲水項目。' : supplySummary.waterLiters >= 9 ? `庫存飲水已達 ${formatNumber(supplySummary.waterLiters)} L。` : `庫存飲水 ${formatNumber(supplySummary.waterLiters)} L，低於 72 小時最低線 9 L。`,
      action: '建立 72 小時飲水基準'
    },
    {
      key: 'food',
      label: '食物',
      status: preparedness.food || supplySummary.shelfStableServings >= 9 ? '基本成立' : '缺口',
      reason: preparedness.food ? '備災清單已完成食物項目。' : supplySummary.shelfStableServings >= 9 ? `免冷藏食物已達 ${formatNumber(supplySummary.shelfStableServings)} 份。` : `免冷藏食物 ${formatNumber(supplySummary.shelfStableServings)} 份，低於 72 小時最低線 9 份。`,
      action: '建立 72 小時免冷藏食物'
    },
    {
      key: 'power',
      label: '電力照明',
      status: preparedness.light && preparedness.power ? '基本成立' : (preparedness.light || preparedness.power ? '部分成立' : '缺口'),
      reason: preparedness.light && preparedness.power ? '照明與行動電源均已建立。' : (preparedness.light || preparedness.power ? '照明或行動電源已有一項，但尚未完整。' : '尚未建立停電照明與通訊電力基準。'),
      action: '測試 12 小時照明能力'
    },
    {
      key: 'medical',
      label: '醫療',
      status: preparedness.firstaid || preparedness.medicine || hasMedicalHighPriority ? '基本成立' : '缺口',
      reason: preparedness.firstaid || preparedness.medicine ? '備災清單已有急救或常備藥項目。' : hasMedicalHighPriority ? '庫存已有高優先醫療物資。' : '急救箱、常備藥或高優先醫療庫存尚未建立。',
      action: '建立家庭急救箱'
    },
    {
      key: 'animal',
      label: '動物',
      status: hasAnimalData ? (preparedness.animals || supplySummary.animalDays >= 3 ? '基本成立' : '缺口') : '未設定',
      reason: hasAnimalData ? (preparedness.animals ? '備災清單已完成動物項目。' : supplySummary.animalDays >= 3 ? `動物補給已達 ${formatNumber(supplySummary.animalDays)} 天。` : `動物補給 ${formatNumber(supplySummary.animalDays)} 天，低於 3 天最低線。`) : '目前沒有動物相關資料，不強制判定缺口。',
      action: hasAnimalData ? '建立動物 7 天補給' : '若家中有動物，建立動物資料與補給清單'
    },
    {
      key: 'evacuation',
      label: '撤離',
      status: preparedness.contacts && preparedness.documents ? '基本成立' : (preparedness.contacts || preparedness.documents ? '部分成立' : '缺口'),
      reason: preparedness.contacts && preparedness.documents ? '聯絡人與重要文件均已建立。' : (preparedness.contacts || preparedness.documents ? '聯絡人或重要文件已有一項，但尚未完整。' : '尚未建立紙本聯絡、文件與撤離基準。'),
      action: '建立家庭集合點與重要文件包'
    }
  ]
}

function getPriorityAction({ coreStatuses, supplySummary, drillDetails }) {
  const highRiskFailedDrill = drillDetails.find((drill) => drill.level >= 4 && !drill.passed)
  const firstGap = coreStatuses.find((item) => item.status === '缺口')

  if (firstGap?.key === 'water') return '建立 72 小時飲水基準'
  if (firstGap?.key === 'food') return '建立 72 小時免冷藏食物'
  if (firstGap?.key === 'power') return '測試 12 小時照明能力'
  if (firstGap?.key === 'medical') return '建立家庭急救箱'
  if (firstGap?.key === 'animal') return '建立動物 7 天補給'
  if (firstGap?.key === 'evacuation') return '建立家庭集合點與重要文件包'
  if (supplySummary.expiredCount > 0) return '立即替換過期物資'
  if (highRiskFailedDrill) return `優先重做演練：${highRiskFailedDrill.title}`
  return '進行 7 天補給中斷壓力測試'
}

function buildTextReport({ generatedAt, score, title, supplySummary, rotationList, productionSummary, drillSummary, drillDetails, taskSummary, recommendation, coreStatuses, riskSummary, kitSummary, roadmapSummary, water, waterEvents, compoundEvents, fortressCore, priorityAction }) {
  return [
    'Fortress OS｜自足堡壘 作戰報告',
    `報告時間：${generatedAt}`,
    `Survival Readiness Score：${score}｜${title}`,
    '',
    'Fortress Core Summary｜家庭核心生存摘要',
    `Core Survival Score：${fortressCore.totalScore}｜${fortressCore.readinessLevel.level}・${fortressCore.readinessLevel.label}`,
    `最弱核心域：${fortressCore.weakestDomains.map((id)=>CORE_DOMAIN_LABELS[id]).join('、')}`,
    ...Object.entries(fortressCore.domains).map(([id,domain])=>`${CORE_DOMAIN_LABELS[id]}：${domain.score}｜${domain.status}｜confidence ${domain.confidence}｜source ${domain.source}`),
    ...fortressCore.scenarioReadiness.map((item)=>`核心情境 ${item.name}：${item.label}｜${item.score}｜最弱 ${item.weakestDomains.map((id)=>CORE_DOMAIN_LABELS[id]).join('、')}`),
    ...fortressCore.recommendations.slice(0,5).map((item,index)=>`核心建議 ${index+1}：${item}`),
    '',
    '補給摘要',
    `飲水總量：${formatNumber(supplySummary.waterLiters)} L`,
    `成人食物：${formatNumber(supplySummary.foodServings)} 份`,
    `免冷藏食物：${formatNumber(supplySummary.shelfStableServings)} 份`,
    `動物補給：${formatNumber(supplySummary.animalDays)} 天`,
    `高優先物資：${supplySummary.highPriorityCount} 項`,
    `30 天內到期：${supplySummary.expiringSoonCount} 項`,
    `已過期：${supplySummary.expiredCount} 項`,
    `物資輪替狀態：已過期 ${supplySummary.expiredCount} 項；30 天內到期 ${supplySummary.expiringSoonCount} 項；最早到期食物：${rotationList[0] ? `${rotationList[0].name}（${rotationList[0].expiresAt}）` : '尚未建立食物期限資料'}`,
    '',
    '水資源安全摘要',
    `水系統分數：${water.score} / 100｜${water.status}`,
    `Water System 手動儲水：${formatNumber(water.totals.manualPotableLiters + water.totals.manualNonPotableLiters)} L`,
    `Inventory 引用儲水：${formatNumber(water.inventoryWater.totalLiters)} L｜${water.inventoryWater.items.length} 項｜資料不完整 ${water.inventoryWater.incompleteCount} 項`,
    `可飲用／非飲用／需處理：${formatNumber(water.totals.potableLiters)} / ${formatNumber(water.totals.nonPotableLiters)} / ${formatNumber(water.totals.treatmentRequiredLiters)} L`,
    `每日飲水／生活用水：${formatNumber(water.demand.dailyDrinking)} / ${formatNumber(water.demand.dailyUtility)} L`,
    `飲水／生活／整體支撐：${formatNumber(water.days.drinkingDays)} / ${formatNumber(water.days.utilityDays)} / ${formatNumber(water.days.overallDays)} 天`,
    `補水來源：${water.capabilities.sourceCount}（穩定 ${water.capabilities.stableSourceCount}）`,
    `淨水方式：${water.capabilities.purificationCount}｜每日能力 ${formatNumber(water.capabilities.purificationDailyCapacity)} L`,
    `停水分配方案：${water.capabilities.allocationPlanCount}｜雨水或替代水源：${water.capabilities.hasRainwater ? '有' : '無'}`,
    `最近 7 天用水：${formatNumber(water.usage.recent7Total)} L｜平均 ${formatNumber(water.usage.recent7Average)} L/日`,
    `最近 30 天用水：${formatNumber(water.usage.recent30Total)} L｜平均 ${formatNumber(water.usage.recent30Average)} L/日`,
    `用水趨勢：${water.usage.trend.directionLabel}｜最近 7 天超支 ${water.usage.trend.overBudgetDays7} 天`,
    `預估可飲用水／總水量剩餘：${formatNumber(water.usage.projectedPotableDays)} / ${formatNumber(water.usage.projectedTotalWaterDays)} 天`,
    `主要用水分類：${primaryUsageCategory(water)}`,
    `分類用水摘要：${usageCategorySummary(water).join('、') || '尚無紀錄'}`,
    ...waterEvents.map(waterEventLine),
    '複合災害推演摘要',
    ...compoundEvents.map(compoundEventLine),
    ...water.usage.warnings.slice(0, 3).map((item, index) => `用水警告 ${index + 1}：${item}`),
    ...water.recommendations.slice(0, 3).map((item, index) => `改善建議 ${index + 1}：${item}`),
    '',
    '食物生產摘要',
    `Food Production Score：${productionSummary.score}｜${productionSummary.scoreTitle}`,
    `作物總數：${productionSummary.total}`,
    `Active 作物：${productionSummary.activeCount}`,
    `可採收：${productionSummary.harvestableCount}`,
    `累計採收：${productionSummary.harvestSummary}`,
    `可留種：${productionSummary.seedSavingCount} 項`,
    `30 天內可採收：${productionSummary.harvestSoonCount} 項`,
    `最高缺口：${productionSummary.highestGap}`,
    '',
    '演練摘要',
    `完成度：${drillSummary.percent}%`,
    `通過演練：${drillSummary.passedDrills}/${DRILLS.length}`,
    `未通過：${drillDetails.filter((drill) => !drill.passed).map((drill) => drill.title).join('、') || '無'}`,
    '',
    '任務摘要',
    `已完成任務：${taskSummary.completed}/${taskSummary.total}`,
    `完成率：${taskSummary.percent}%`,
    `未完成高風險任務：${taskSummary.highRiskOpen} 項`,
    `建議優先任務：${recommendation?.task.title || '無未完成任務'}`,
    '',
    '環境風險摘要',
    `住所型態：${riskSummary.residenceType}`,
    `最高風險：${riskSummary.highestRisk ? `${riskSummary.highestRisk.title}｜${riskSummary.highestRisk.level} ${riskSummary.highestRisk.riskScore}` : '尚未建立'}`,
    `極高／高風險數：${riskSummary.extremeCount}/${riskSummary.highCount}`,
    '',
    '撤離包摘要',
    `完成率：${kitSummary.percent}%（${kitSummary.preparedCount}/${kitSummary.totalItems}）`,
    `負重比例：${kitSummary.burden.ratio > 0 ? `${Number(kitSummary.burden.ratio.toFixed(1)).toString()}%` : '未計算'}｜${kitSummary.burden.label}`,
    `高優先缺口：${kitSummary.highPriorityGapCount} 項`,
    `即期／過期：${kitSummary.expiringSoonCount}/${kitSummary.expiredCount}`,
    `最高缺口：${kitSummary.highestGap}`,
    '',
    '自給能力摘要',
    `目前階段：${roadmapSummary.currentStage.name}`,
    `總體自給能力分數：${roadmapSummary.score}`,
    `下一個最重要能力：${roadmapSummary.nextAbility?.title || '全部階段已達標'}`,
    `Stage 完成率：${roadmapSummary.stages.map((stage) => `${stage.name} ${stage.percent}%`).join('；')}`,
    '',
    '核心缺口',
    ...coreStatuses.map((item) => `${item.label}：${item.status}｜${item.reason}｜下一步：${item.action}`),
    '',
    `最高優先行動：${priorityAction}`,
    '',
    '安全邊界：本報告用於家庭盤點、討論與低風險準備，不取代政府防災指引、醫療建議、獸醫建議或現場專業判斷。'
  ].join('\n')
}

const reportEmphasisTerms = ['最高優先行動', '缺口', '已過期', '極高風險', '高風險', '未通過演練', '未完成高風險任務', '最低線', '下一步', '高優先醫療', '補給中斷']

function renderReportEmphasis(text, maxMatches = 2) {
  const escapedTerms = [...reportEmphasisTerms].sort((a, b) => b.length - a.length).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'g')
  let matchCount = 0

  return String(text).split(pattern).map((part, index) => {
    if (!reportEmphasisTerms.includes(part) || matchCount >= maxMatches) return part
    matchCount += 1
    const className = part.includes('下一步') || part.includes('最高優先行動') ? 'action-point' : part.includes('已過期') || part.includes('極高') || part.includes('未通過') || part.includes('高風險') ? 'critical-point' : 'emphasis-underline'
    return <span key={`${part}-${index}`} className={className}>{part}</span>
  })
}

export default function Report({ state, tasks }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')
  const generatedAt = useMemo(() => new Date().toLocaleString('zh-TW'), [refreshKey, state])
  const normalizedInventory = (state.inventory || []).map(normalizeInventoryItem)
  const supplySummary = getInventorySummary(state.inventory || [])
  const rotationList = getFoodRotationList(state.inventory || [])
  const productionSummary = getFoodProductionSummary(state.plants || [])
  const drillSummary = getDrillCompletion(state.drills || {})
  const drillDetails = getDrillDetails(state.drills || {})
  const unpassedDrills = drillDetails.filter((drill) => !drill.passed)
  const lowestDrills = [...drillDetails].sort((a, b) => a.percent - b.percent || b.level - a.level).slice(0, 3)
  const completedMap = getCompletedMap(state.completed)
  const completedCount = tasks.filter((task) => completedMap[task.id]).length
  const taskSummary = {
    completed: completedCount,
    total: tasks.length,
    percent: tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0,
    highRiskOpen: tasks.filter((task) => task.riskLevel >= 4 && !completedMap[task.id]).length
  }
  const recommendation = getRecommendedTask(tasks, state)
  const highestRisk = getHighestRisk(state.riskProfile || {})
  const riskCounts = getRiskCounts(state.riskProfile || {})
  const riskSummary = {
    highestRisk,
    extremeCount: riskCounts.極高 || 0,
    highCount: riskCounts.高 || 0,
    residenceType: residenceLabels[state.riskProfile?.residenceType] || '公寓'
  }
  const kitSummary = getEvacuationKitSummary(state.evacuationKit || {})
  const roadmapSummary = getRoadmapSummary(state)
  const water = getWaterIntelligenceSummary()
  const waterEvents = [{ label: '24 小時停水', days: 1 }, { label: '72 小時停水', days: 3 }, { label: '7 天停水', days: 7 }, { label: '14 天停水', days: 14 }].map((item) => ({ ...item, simulation: simulateWaterEvent(water, { durationDays: item.days, mode: 'planned' }) }))
  const compoundEvents = buildPresetCompoundEvents().map((event)=>({...event,simulation:simulateCompoundDisaster(water,event,{mode:'planned',strictness:'standard'})}))
  const fortressCore = getCoreSystemSummary(state, water)
  const coreStatuses = getCoreStatuses({ state, supplySummary, normalizedInventory })
  const score = calculateReadinessScore({ state, tasks, completedMap, drillSummary })
  const title = scoreTitle(score)
  const priorityAction = getPriorityAction({ coreStatuses, supplySummary, drillDetails })
  const textReport = buildTextReport({
    generatedAt,
    score,
    title,
    supplySummary,
    rotationList,
    productionSummary,
    drillSummary,
    drillDetails,
    taskSummary,
    recommendation,
    coreStatuses,
    riskSummary,
    kitSummary,
    roadmapSummary,
    water,
    waterEvents,
    compoundEvents,
    fortressCore,
    priorityAction
  })

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(textReport)
      setCopyStatus('已複製')
    } catch {
      setCopyStatus('複製失敗')
    }
  }

  return (
    <div className="report-page space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Export Report v3.1</p>
        <h1 className="text-2xl font-black text-bark">作戰報告</h1>
        <p className="mt-2 leading-7 text-soil/70">
          整合補給、演練、任務與核心缺口，產生家庭韌性檢查報告。
        </p>

        <div className="report-actions mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw size={16} />
            重新整理報告
          </button>
          <button type="button" className="btn-primary inline-flex items-center justify-center gap-2" onClick={copyReport}>
            <Clipboard size={16} />
            複製文字報告
          </button>
          <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => window.print()}>
            <Printer size={16} />
            列印 / 存成 PDF
          </button>
        </div>
        {copyStatus && <p className="report-actions mt-3 text-sm font-black text-[#24483a]">{copyStatus}</p>}
      </section>

      <section className="report-content space-y-5">
        <section className="muji-card">
          <div className="muji-section-title">
            <FileText size={18} />
            <span>報告總覽</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="報告產生時間" value={generatedAt} />
            <Metric label="Survival Readiness Score" value={score} />
            <Metric label="系統稱號" value={title} />
          </div>
        </section>

        <section className="muji-card">
          <SectionTitle>補給摘要</SectionTitle>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="飲水總量" value={`${formatNumber(supplySummary.waterLiters)} L`} />
            <Metric label="成人食物" value={`${formatNumber(supplySummary.foodServings)} 份`} />
            <Metric label="免冷藏食物" value={`${formatNumber(supplySummary.shelfStableServings)} 份`} />
            <Metric label="動物補給" value={`${formatNumber(supplySummary.animalDays)} 天`} />
            <Metric label="高優先物資" value={`${supplySummary.highPriorityCount} 項`} />
            <Metric label="30 天內到期" value={`${supplySummary.expiringSoonCount} 項`} />
            <Metric label="已過期" value={`${supplySummary.expiredCount} 項`} />
          </div>
          <div className="mt-4 rounded-2xl border border-soil/15 bg-white/60 p-4">
            <h3 className="font-black text-bark">物資輪替狀態</h3>
            <p className="mt-2 text-sm font-bold leading-7 text-soil/75">
              已過期 {supplySummary.expiredCount} 項，30 天內到期 {supplySummary.expiringSoonCount} 項。
              最早到期食物：{rotationList[0] ? `${rotationList[0].name}（${rotationList[0].expiresAt}）` : '尚未建立食物期限資料'}。
            </p>
          </div>
        </section>

        <section className="muji-card core-summary-card border-[#24483a]/25"><SectionTitle>Fortress Core Summary｜家庭核心生存摘要</SectionTitle><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Core Survival Score" value={`${fortressCore.totalScore} / 100`}/><Metric label="Readiness Level" value={`${fortressCore.readinessLevel.level}｜${fortressCore.readinessLevel.label}`}/><Metric label="最弱核心域" value={fortressCore.weakestDomains.map((id)=>CORE_DOMAIN_LABELS[id]).join('、')}/><Metric label="資料時間" value={new Date(fortressCore.generatedAt).toLocaleString('zh-TW')}/>{Object.entries(fortressCore.domains).map(([id,domain])=><Metric key={id} label={CORE_DOMAIN_LABELS[id]} value={`${domain.score}｜${domain.status}｜${domain.confidence}｜${domain.source}`}/>)}</div><ReportList title="核心情境準備度" items={fortressCore.scenarioReadiness.map((item)=>`${item.name}：${item.label}｜${item.score}｜最弱 ${item.weakestDomains.map((id)=>CORE_DOMAIN_LABELS[id]).join('、')}`)}/><ReportList title="核心改善建議" items={fortressCore.recommendations.slice(0,5)}/></section>

        <section className="muji-card border-[#24483a]/25">
          <SectionTitle>水資源安全摘要</SectionTitle>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="水系統分數" value={`${water.score} / 100`} />
            <Metric label="水系統狀態" value={water.status} />
            <Metric label="Water System 手動儲水" value={`${formatNumber(water.totals.manualPotableLiters + water.totals.manualNonPotableLiters)} L`} />
            <Metric label="Inventory 引用儲水" value={`${formatNumber(water.inventoryWater.totalLiters)} L`} />
            <Metric label="Inventory 水品項" value={`${water.inventoryWater.items.length} 項`} />
            <Metric label="Inventory 資料不完整" value={`${water.inventoryWater.incompleteCount} 項`} />
            <Metric label="可飲用水" value={`${formatNumber(water.totals.potableLiters)} L`} />
            <Metric label="非飲用水" value={`${formatNumber(water.totals.nonPotableLiters)} L`} />
            <Metric label="需處理水量" value={`${formatNumber(water.totals.treatmentRequiredLiters)} L`} />
            <Metric label="每日飲水需求" value={`${formatNumber(water.demand.dailyDrinking)} L`} />
            <Metric label="每日生活用水" value={`${formatNumber(water.demand.dailyUtility)} L`} />
            <Metric label="飲用水支撐" value={`${formatNumber(water.days.drinkingDays)} 天`} />
            <Metric label="生活用水支撐" value={`${formatNumber(water.days.utilityDays)} 天`} />
            <Metric label="整體支撐" value={`${formatNumber(water.days.overallDays)} 天`} />
            <Metric label="補水來源" value={`${water.capabilities.sourceCount}（穩定 ${water.capabilities.stableSourceCount}）`} />
            <Metric label="淨水方式" value={`${water.capabilities.purificationCount} 種`} />
            <Metric label="每日淨水能力" value={`${formatNumber(water.capabilities.purificationDailyCapacity)} L`} />
            <Metric label="停水分配方案" value={`${water.capabilities.allocationPlanCount} 個`} />
            <Metric label="雨水或替代水源" value={water.capabilities.hasRainwater ? '有' : '無'} />
            <Metric label="最近 7 天總用水" value={`${formatNumber(water.usage.recent7Total)} L`} />
            <Metric label="7 天平均每日" value={`${formatNumber(water.usage.recent7Average)} L`} />
            <Metric label="最近 30 天總用水" value={`${formatNumber(water.usage.recent30Total)} L`} />
            <Metric label="30 天平均每日" value={`${formatNumber(water.usage.recent30Average)} L`} />
            <Metric label="用水趨勢" value={water.usage.trend.directionLabel} />
            <Metric label="最近 7 天超支日" value={`${water.usage.trend.overBudgetDays7} 天`} />
            <Metric label="預估可飲用水剩餘" value={`${formatNumber(water.usage.projectedPotableDays)} 天`} />
            <Metric label="預估總水量剩餘" value={`${formatNumber(water.usage.projectedTotalWaterDays)} 天`} />
            <Metric label="主要用水分類" value={primaryUsageCategory(water)} />
          </div>
          <ReportList title="水系統前 3 條改善建議" items={water.recommendations.slice(0, 3)} />
          <ReportList title="分類用水摘要" items={usageCategorySummary(water)} empty="尚無用水紀錄。" />
          <ReportList title="停水事件模擬" items={waterEvents.map(waterEventLine)} />
          <ReportList title="複合災害推演摘要" items={compoundEvents.map(compoundEventLine)} />
          <ReportList title="前 3 條用水警告" items={water.usage.warnings.slice(0, 3)} />
        </section>

        <section className="muji-card">
          <SectionTitle>演練摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="總完成百分比" value={`${drillSummary.percent}%`} />
            <Metric label="通過演練" value={`${drillSummary.passedDrills}/${DRILLS.length}`} />
            <Metric label="未通過演練" value={`${unpassedDrills.length} 個`} />
          </div>

          <ReportList title="未通過演練列表" items={unpassedDrills.map((drill) => `${drill.title}（${drill.completed}/${drill.items.length}）`)} empty="全部演練已通過。" />
          <ReportList title="完成度最低的 3 個演練" items={lowestDrills.map((drill) => `${drill.title}：${drill.percent}%`)} />
        </section>

        <section className="muji-card">
          <SectionTitle>食物生產摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="Food Production Score" value={`${productionSummary.score}｜${productionSummary.scoreTitle}`} />
            <Metric label="作物總數" value={`${productionSummary.total} 項`} />
            <Metric label="Active 作物" value={`${productionSummary.activeCount} 項`} />
            <Metric label="可採收" value={`${productionSummary.harvestableCount} 項`} />
            <Metric label="累計採收" value={productionSummary.harvestSummary} />
            <Metric label="可留種作物" value={`${productionSummary.seedSavingCount} 項`} />
            <Metric label="30 天內可採收" value={`${productionSummary.harvestSoonCount} 項`} />
            <Metric label="最高缺口" value={productionSummary.highestGap} />
          </div>
        </section>

        <section className="muji-card">
          <SectionTitle>任務摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="已完成任務" value={`${taskSummary.completed}/${taskSummary.total}`} />
            <Metric label="完成率" value={`${taskSummary.percent}%`} />
            <Metric label="未完成高風險任務" value={`${taskSummary.highRiskOpen} 項`} />
            <Metric label="建議優先任務" value={recommendation?.task.title || '無'} />
          </div>
        </section>

        <section className="muji-card">
          <SectionTitle>環境風險摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="住所型態" value={riskSummary.residenceType} />
            <Metric label="最高風險" value={highestRisk ? highestRisk.title : '尚未建立'} />
            <Metric label="極高風險" value={`${riskSummary.extremeCount} 項`} />
            <Metric label="高風險" value={`${riskSummary.highCount} 項`} />
          </div>
          {highestRisk && (
            <div className="mt-4 rounded-2xl border border-soil/15 bg-white/60 p-4">
              <p className="text-sm font-black text-bark"><span className={highestRisk.level === '極高' ? 'critical-point' : 'emphasis-underline'}>{highestRisk.level} {highestRisk.riskScore}</span>｜{renderReportEmphasis(highestRisk.reason)}</p>
              <p className="mt-2 text-sm font-bold text-soil/75"><span className="action-point">建議行動</span>：{renderReportEmphasis(highestRisk.action)}</p>
            </div>
          )}
        </section>

        <section className="muji-card">
          <SectionTitle>撤離包摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="完成率" value={`${kitSummary.percent}%`} />
            <Metric label="負重判定" value={`${kitSummary.burden.ratio > 0 ? `${Number(kitSummary.burden.ratio.toFixed(1)).toString()}%` : '未計算'}｜${kitSummary.burden.label}`} />
            <Metric label="高優先缺口" value={`${kitSummary.highPriorityGapCount} 項`} />
            <Metric label="即期／過期" value={`${kitSummary.expiringSoonCount}/${kitSummary.expiredCount}`} />
          </div>
          <div className="mt-4 rounded-2xl border border-soil/15 bg-white/60 p-4">
            <p className="text-sm font-black text-bark"><span className="critical-point">最高缺口</span>：{renderReportEmphasis(kitSummary.highestGap)}</p>
          </div>
        </section>

        <section className="muji-card">
          <SectionTitle>自給能力摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="目前階段" value={roadmapSummary.currentStage.name} />
            <Metric label="總體自給能力分數" value={`${roadmapSummary.score}`} />
            <Metric label="已完成能力" value={`${roadmapSummary.completedAbilities}/${roadmapSummary.totalAbilities}`} />
            <Metric label="下一個能力" value={roadmapSummary.nextAbility?.title || '全部階段已達標'} />
          </div>
          <ReportList title="Stage 1–5 完成率" items={roadmapSummary.stages.map((stage) => `${stage.name}：${stage.percent}%（${stage.completedCount}/${stage.totalCount}）`)} />
        </section>

        <section className="muji-card">
          <SectionTitle>核心缺口</SectionTitle>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {coreStatuses.map((item) => (
              <article key={item.key} className="rounded-2xl border border-soil/15 bg-white/65 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-black text-bark">{item.label}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadgeClass(item.status)}`}>{item.status}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-soil/75">{renderReportEmphasis(item.reason)}</p>
                <p className="mt-2 text-sm font-black text-bark"><span className="action-point">下一步</span>：{renderReportEmphasis(item.action)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="muji-card border-[#8b2f25]/25">
          <div className="muji-section-title">
            <ShieldAlert size={18} />
            <span>最高優先行動</span>
          </div>
          <h2 className="mt-4 text-2xl font-black text-bark"><span className="action-point">{priorityAction}</span></h2>
          <p className="mt-2 leading-7 text-soil/70">
            先處理會直接影響 72 小時生存基準的缺口，再處理演練與長期壓力測試。
          </p>
        </section>

        <section className="muji-note">
          <ShieldAlert size={18} />
          <div>
            <strong>安全邊界</strong>
            <p>本報告用於家庭盤點、討論與低風險準備，不取代政府防災指引、醫療建議、獸醫建議或現場專業判斷。</p>
          </div>
        </section>
      </section>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 className="text-xl font-black text-bark">{children}</h2>
}

function Metric({ label, value }) {
  const emphasizedLabels = ['已過期', '未通過演練', '未完成高風險任務', '極高風險', '高風險']

  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <p className={`text-xs font-black uppercase tracking-[0.12em] text-soil/50 ${emphasizedLabels.includes(label) ? 'critical-point' : ''}`}>{label}</p>
      <p className="mt-2 break-words text-xl font-black text-bark">{value}</p>
    </div>
  )
}

function ReportList({ title, items, empty = '無資料。' }) {
  return (
    <div className="mt-5 rounded-2xl border border-soil/15 bg-white/60 p-4">
      <h3 className="font-black text-bark">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-soil/75">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-soil/70">{empty}</p>
      )}
    </div>
  )
}
