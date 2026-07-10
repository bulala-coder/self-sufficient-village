import React from 'react'
import { AlertTriangle, BarChart3, Calculator, ClipboardCheck, Droplets, HeartPulse, Leaf, ListChecks, Map, Package, PawPrint, ShieldCheck, Utensils, Zap } from 'lucide-react'
import { getDrillCompletion } from './Drills.jsx'

const routeLabels = {
  balcony_beginner: '城市陽台環境',
  rural_beginner: '平地住宅環境',
  mountain_living: '山區風險環境',
  coastal_living: '海岸風險環境',
  riverside_valley: '溪谷風險環境',
  island_resilience: '離島補給環境',
  family_nature_education: '家庭訓練環境',
}

const gapTasks = {
  water: '完成 3 天飲水需求與儲水檢查',
  food: '建立 72 小時免冷藏食物',
  power: '測試手電筒與行動電源',
  medical: '建立急救箱與常備藥清單',
  animals: '建立動物 7 天補給與轉送計畫',
  evacuation: '建立紙本緊急聯絡與撤離路線',
}

function scoreTitle(score) {
  if (score <= 20) return '高風險'
  if (score <= 40) return '基礎不足'
  if (score <= 60) return '可撐 24 小時'
  if (score <= 80) return '可撐 72 小時'
  return '高韌性系統'
}

function statusClass(status) {
  if (status === '已建立') return 'bg-[#24483a] text-[#fff9ea]'
  if (status === '部分完成') return 'bg-[#c2a25c] text-[#241b10]'
  return 'bg-[#8b2f25] text-[#fff9ea]'
}

function getSystemStatus(state) {
  const preparedness = state.preparedness || {}
  const hasDrills = Object.values(state.drills || {}).some((drill) => Object.values(drill || {}).some(Boolean))
  const evacuationReady = hasDrills || preparedness.contacts || preparedness.documents

  return [
    {
      key: 'water',
      label: '飲水準備',
      icon: Droplets,
      status: preparedness.water ? '已建立' : '缺口',
      detail: preparedness.water ? '已完成 72 小時飲水盤點' : '尚未建立最低飲水線'
    },
    {
      key: 'food',
      label: '食物準備',
      icon: Utensils,
      status: preparedness.food ? '已建立' : '缺口',
      detail: preparedness.food ? '已建立基礎食物準備' : '尚未建立免冷藏食物線'
    },
    {
      key: 'power',
      label: '電力照明',
      icon: Zap,
      status: preparedness.light && preparedness.power ? '已建立' : (preparedness.light || preparedness.power ? '部分完成' : '缺口'),
      detail: preparedness.light && preparedness.power ? '照明與行動電源已檢查' : (preparedness.light || preparedness.power ? '照明或電源仍有缺項' : '停電情境未完成驗證')
    },
    {
      key: 'medical',
      label: '醫療急救',
      icon: HeartPulse,
      status: preparedness.firstaid || preparedness.medicine ? '已建立' : '缺口',
      detail: preparedness.firstaid || preparedness.medicine ? '急救或常備藥已建立' : '急救箱與用藥清單未建立'
    },
    {
      key: 'animals',
      label: '動物照護',
      icon: PawPrint,
      status: preparedness.animals ? '已建立' : '缺口',
      detail: preparedness.animals ? '動物補給與轉送資訊已建立' : '動物補給與轉送計畫缺失'
    },
    {
      key: 'evacuation',
      label: '撤離規劃',
      icon: Map,
      status: evacuationReady ? '部分完成' : '缺口',
      detail: evacuationReady ? '聯絡、文件或演練已有資料' : '紙本聯絡與撤離路線未建立'
    }
  ]
}

function readinessScore({ statuses, state, tasks, completedCount }) {
  const preparednessScore = statuses.reduce((sum, item) => {
    if (item.status === '已建立') return sum + 7
    if (item.status === '部分完成') return sum + 4
    return sum
  }, 0)
  const inventoryScore = Math.min((state.inventory?.length || 0) / 6, 1) * 20
  const plantsScore = Math.min((state.plants?.length || 0) / 4, 1) * 15
  const taskScore = Math.min(completedCount / Math.max(tasks.length, 1), 1) * 23
  const drillScore = (getDrillCompletion(state.drills || {}).percent / 100) * 10

  return Math.round(Math.min(100, preparednessScore + inventoryScore + plantsScore + taskScore + drillScore))
}

export default function Dashboard({ state, tasks, completedCount, setPage }) {
  const statuses = getSystemStatus(state)
  const highestGap = statuses.find((item) => item.status === '缺口')
  const score = readinessScore({ statuses, state, tasks, completedCount })
  const drillSummary = getDrillCompletion(state.drills || {})
  const title = scoreTitle(score)
  const mission = highestGap ? gapTasks[highestGap.key] : '執行 72 小時斷水斷電壓力測試'

  return (
    <div className="muji-dashboard space-y-5 pb-32">
      <section className="muji-hero border-[#2f3d35]/30 bg-[#e7dfd0]">
        <div>
          <p className="muji-kicker">Survival OS</p>
          <h1>自足村 Survival OS</h1>
          <p className="muji-subtitle">
            家庭韌性、補給中斷、地形風險與自給生活壓力測試系統
          </p>
        </div>

        <div className="muji-route">
          {routeLabels[state.routeType] || '未指定環境'}
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="muji-card lg:col-span-2">
          <div className="muji-section-title">
            <ShieldCheck size={18} />
            <span>系統狀態</span>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {statuses.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.key} className="rounded-2xl border border-soil/15 bg-white/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon size={18} className="text-[#24483a] shrink-0" />
                      <h2 className="font-black text-bark">{item.label}</h2>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-soil/70">{item.detail}</p>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="muji-card">
          <div className="muji-section-title">
            <BarChart3 size={18} />
            <span>Survival Readiness Score</span>
          </div>

          <div className="mt-5">
            <div className="text-6xl font-black text-[#1d3029]">{score}</div>
            <p className="mt-1 text-lg font-black text-bark">{title}</p>
            <div className="mt-4 h-3 rounded-full bg-[#d5c9b4] overflow-hidden">
              <div className="h-full rounded-full bg-[#24483a]" style={{ width: `${score}%` }} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-bold text-soil/70">
            <span>物資 {state.inventory?.length || 0}</span>
            <span>生產 {state.plants?.length || 0}</span>
            <span>任務 {completedCount}/{tasks.length}</span>
            <span>狀態 {statuses.filter((item) => item.status !== '缺口').length}/6</span>
            <span>演練 {drillSummary.passedDrills}/8</span>
          </div>
        </aside>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <section className="muji-card">
          <div className="muji-section-title">
            <AlertTriangle size={18} />
            <span>最高優先缺口</span>
          </div>

          <h2 className="mt-4">{highestGap?.label || '無立即缺口'}</h2>
          <p>
            {highestGap?.detail || '核心 72 小時項目已具備。下一步進入斷水斷電壓力測試。'}
          </p>
        </section>

        <section className="muji-card lg:col-span-2">
          <div className="muji-section-title">
            <ListChecks size={18} />
            <span>今日硬核任務</span>
          </div>

          <h2 className="mt-4">{mission}</h2>
          <p>
            只做可驗證項目：盤點、測試、記錄、補缺口。不把希望寄託在臨場反應。
          </p>

          <button
            className="muji-primary mt-4"
            onClick={() => setPage(highestGap?.key === 'evacuation' ? 'preparedness' : 'preparedness')}
          >
            進入備災清單
          </button>
        </section>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Package size={18} />
          <span>作戰工具</span>
        </div>

        <div className="muji-tool-grid">
          <button onClick={() => setPage('tasks')}>
            <ListChecks size={18} />
            <span>能力任務</span>
          </button>

          <button onClick={() => setPage('preparedness')}>
            <ShieldCheck size={18} />
            <span>72 小時備災</span>
          </button>

          <button onClick={() => setPage('inventory')}>
            <Package size={18} />
            <span>物資庫存</span>
          </button>

          <button onClick={() => setPage('plants')}>
            <Leaf size={18} />
            <span>食物生產</span>
          </button>

          <button onClick={() => setPage('drills')}>
            <ClipboardCheck size={18} />
            <span>情境演練</span>
          </button>

          <button onClick={() => setPage('calculators')}>
            <Calculator size={18} />
            <span>硬核計算器</span>
          </button>

          <button onClick={() => setPage('health')}>
            <HeartPulse size={18} />
            <span>醫療急救</span>
          </button>

          <button onClick={() => setPage('score')}>
            <BarChart3 size={18} />
            <span>韌性評分</span>
          </button>
        </div>
      </section>
    </div>
  )
}
