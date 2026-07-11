import React, { useMemo, useState } from 'react'
import { Clipboard, FileText, Printer, RefreshCw, ShieldAlert } from 'lucide-react'
import { DRILLS, getDrillCompletion } from './Drills.jsx'
import { getInventorySummary, normalizeInventoryItem } from './Inventory.jsx'
import { getCompletedMap, getRecommendedTask } from '../data/tasks.js'

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

function buildTextReport({ generatedAt, score, title, supplySummary, drillSummary, drillDetails, taskSummary, recommendation, coreStatuses, priorityAction }) {
  return [
    '自足村 Survival OS 作戰報告',
    `報告時間：${generatedAt}`,
    `Survival Readiness Score：${score}｜${title}`,
    '',
    '補給摘要',
    `飲水總量：${formatNumber(supplySummary.waterLiters)} L`,
    `成人食物：${formatNumber(supplySummary.foodServings)} 份`,
    `免冷藏食物：${formatNumber(supplySummary.shelfStableServings)} 份`,
    `動物補給：${formatNumber(supplySummary.animalDays)} 天`,
    `高優先物資：${supplySummary.highPriorityCount} 項`,
    `30 天內到期：${supplySummary.expiringSoonCount} 項`,
    `已過期：${supplySummary.expiredCount} 項`,
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
    '核心缺口',
    ...coreStatuses.map((item) => `${item.label}：${item.status}｜${item.reason}｜下一步：${item.action}`),
    '',
    `最高優先行動：${priorityAction}`,
    '',
    '安全邊界：本報告用於家庭盤點、討論與低風險準備，不取代政府防災指引、醫療建議、獸醫建議或現場專業判斷。'
  ].join('\n')
}

export default function Report({ state, tasks }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')
  const generatedAt = useMemo(() => new Date().toLocaleString('zh-TW'), [refreshKey, state])
  const normalizedInventory = (state.inventory || []).map(normalizeInventoryItem)
  const supplySummary = getInventorySummary(state.inventory || [])
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
  const coreStatuses = getCoreStatuses({ state, supplySummary, normalizedInventory })
  const score = calculateReadinessScore({ state, tasks, completedMap, drillSummary })
  const title = scoreTitle(score)
  const priorityAction = getPriorityAction({ coreStatuses, supplySummary, drillDetails })
  const textReport = buildTextReport({
    generatedAt,
    score,
    title,
    supplySummary,
    drillSummary,
    drillDetails,
    taskSummary,
    recommendation,
    coreStatuses,
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
          <SectionTitle>任務摘要</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="已完成任務" value={`${taskSummary.completed}/${taskSummary.total}`} />
            <Metric label="完成率" value={`${taskSummary.percent}%`} />
            <Metric label="未完成高風險任務" value={`${taskSummary.highRiskOpen} 項`} />
            <Metric label="建議優先任務" value={recommendation?.task.title || '無'} />
          </div>
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
                <p className="mt-3 text-sm leading-7 text-soil/75">{item.reason}</p>
                <p className="mt-2 text-sm font-black text-bark">下一步：{item.action}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="muji-card border-[#8b2f25]/25">
          <div className="muji-section-title">
            <ShieldAlert size={18} />
            <span>最高優先行動</span>
          </div>
          <h2 className="mt-4 text-2xl font-black text-bark">{priorityAction}</h2>
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
  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-soil/50">{label}</p>
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
