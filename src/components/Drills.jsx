import React, { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Circle, ClipboardCheck, ShieldAlert } from 'lucide-react'
import { getWaterIntelligenceSummary } from '../utils/waterStorage.js'
import { simulateWaterEvent } from '../utils/waterEventSimulator.js'
import { buildPresetCompoundEvents, simulateCompoundDisaster } from '../utils/compoundDisasterSimulator.js'
import { CORE_DOMAIN_LABELS, getCoreSystemSummary } from '../utils/coreSystem.js'

const compoundFailureLabels = { drinking: '飲用水', utility: '生活用水', total: '總水量', purification: '淨水能力', water: '水資源', power: '電力', logistics: '交通補給', contamination: '水質', sanitation: '衛生', none: '無' }

export const DRILLS = [
  {
    id: 'water-24h',
    title: '停水 24 小時',
    level: 3,
    description: '測試家庭最低用水分配能力。',
    passCount: 5,
    items: ['家中可飲用水量已估算', '每人每日飲水需求已計算', '動物飲水已納入', '洗手與清潔用水已分配', '廁所使用策略已確認', '補水來源已確認', '儲水容器已清潔並加蓋']
  },
  {
    id: 'power-12h',
    title: '停電 12 小時',
    level: 3,
    description: '測試照明、通訊、冷藏食物與夜間安全。',
    passCount: 5,
    items: ['手電筒或頭燈可用', '行動電源已充滿', '備用電池已確認', '冰箱食物處理順序已規劃', '需要冷藏藥品已確認', '夜間動線安全已檢查', '動物溫控需求已評估']
  },
  {
    id: 'typhoon-24h',
    title: '颱風前 24 小時',
    level: 4,
    description: '測試颱風來臨前的家庭固定、補給與安置能力。',
    passCount: 6,
    items: ['陽台與戶外物品已固定', '排水孔與排水溝已檢查', '飲水與食物已補充', '手機與行動電源已充電', '現金與重要文件已準備', '動物安置位置已確認', '家人集合與聯絡方式已確認', '不外出檢查的停止條件已設定']
  },
  {
    id: 'earthquake-72h',
    title: '地震後 72 小時',
    level: 5,
    description: '測試震後斷水、斷電、受傷、交通中斷時的家庭韌性。',
    passCount: 7,
    items: ['72 小時飲水已準備', '72 小時免冷藏食物已準備', '急救箱與常備藥已準備', '手電筒與行動電源可用', '避難包位置固定', '家庭集合點已設定', '重要文件與現金已準備', '動物外出籠與飼料已準備', '瓦斯、火源與建築安全檢查原則已確認']
  },
  {
    id: 'family-72h',
    title: '家庭 72 小時韌性',
    level: 4,
    description: '測試家庭是否能在補給中斷下維持 3 天基本生活。',
    passCount: 8,
    items: ['3 天飲水', '3 天食物', '照明設備', '行動電源', '急救箱', '常備藥', '寵物／動物用品', '緊急聯絡人', '重要文件', '撤離包']
  },
  {
    id: 'mountain-rain',
    title: '山區豪雨撤離',
    level: 5,
    description: '測試山區豪雨、落石、土石流與道路中斷風險。',
    passCount: 6,
    items: ['土石流或落石警戒資訊來源已確認', '撤離路線已畫出', '替代道路已確認', '保暖與雨具已準備', '通訊備援已準備', '7 天物資已盤點', '動物轉送方案已規劃', '夜間或豪雨時不移動的停止條件已設定']
  },
  {
    id: 'coastal-typhoon',
    title: '海邊颱風暴潮',
    level: 5,
    description: '測試海邊強風、暴潮、鹽害與冷藏食物處理。',
    passCount: 5,
    items: ['潮汐與暴潮資訊來源已確認', '強風固定清單已完成', '淡水儲備已確認', '防鏽與防潮工具已整理', '避免靠近海岸的警戒線已確認', '魚貨或冷藏食物處理順序已規劃', '撤離路線與集合點已確認']
  },
  {
    id: 'remote-7d',
    title: '離島／偏遠地區 7 天補給中斷',
    level: 5,
    description: '測試船班、交通、醫療距離與補給中斷時的長期韌性。',
    passCount: 6,
    items: ['7 天飲水已估算', '7 天食物已盤點', '常用藥與急救用品已確認', '動物飼料與飲水已納入', '通訊與充電備援已確認', '就醫與轉送備案已建立', '社區互助聯絡人已建立', '現金與重要文件已準備']
  },
  {
    id: 'evac-kit-10min',
    title: '10 分鐘撤離包測試',
    level: 5,
    description: '測試撤離包能否在真實起點下 10 分鐘內拿了就走。',
    passCount: 5,
    items: ['10 分鐘內找到撤離包', '10 分鐘內穿鞋並取得鑰匙與手機', '重要文件可立即取得', '撤離包重量在可接受範圍', '動物可在 10 分鐘內控制或裝籠', '能走到門口或集合點']
  },
  {
    id: 'darkout-30min',
    title: '黑暗停電 30 分鐘',
    level: 4,
    description: '測試無主要照明時的照明、通訊、冰箱管制、夜間動線與動物安全。',
    passCount: 5,
    items: ['無主要照明下找到手電筒或頭燈', '行動電源可用', '夜間動線無障礙', '紙本聯絡人可取得', '冰箱未被頻繁打開', '動物位置可確認']
  },
  {
    id: 'home-shelter-14d',
    title: '居家避難 14 天壓力測試',
    level: 5,
    description: '測試住處仍安全但外部補給中斷時的 14 天基本生活能力。',
    passCount: 5,
    items: ['14 天飲水或補水方案已估算', '14 天食物或備糧輪替已建立', '常用藥與急救用品已納入', '動物補給已納入', '電力與照明備援已納入', '物資輪替規則已建立']
  }
]

export function getDrillCompletion(drills = {}) {
  const totalItems = DRILLS.reduce((sum, drill) => sum + drill.items.length, 0)
  const completedItems = DRILLS.reduce((sum, drill) => {
    const checked = drills[drill.id] || {}
    return sum + drill.items.filter((_, index) => checked[`item-${index}`]).length
  }, 0)
  const passedDrills = DRILLS.filter((drill) => {
    const checked = drills[drill.id] || {}
    const completed = drill.items.filter((_, index) => checked[`item-${index}`]).length
    return completed >= drill.passCount
  }).length

  return {
    completedItems,
    totalItems,
    passedDrills,
    percent: totalItems ? Math.round((completedItems / totalItems) * 100) : 0
  }
}

function readinessTitle(percent) {
  if (percent <= 20) return '未成系統'
  if (percent <= 40) return '初步準備'
  if (percent <= 60) return '可撐 24 小時'
  if (percent <= 80) return '可撐 72 小時'
  return '高韌性硬核系統'
}

function levelMarks(level) {
  return Array.from({ length: 5 }, (_, index) => index < level ? '■' : '□').join('')
}

function renderDrillItem(item) {
  if (item.includes('停止條件')) {
    return item.split('停止條件').map((part, index) => (
      <React.Fragment key={`${part}-${index}`}>
        {index > 0 && <span className="stop-condition">停止條件</span>}
        {part}
      </React.Fragment>
    ))
  }

  if (item.includes('高風險')) {
    return item.split('高風險').map((part, index) => (
      <React.Fragment key={`${part}-${index}`}>
        {index > 0 && <span className="critical-point">高風險</span>}
        {part}
      </React.Fragment>
    ))
  }

  return item
}

export default function Drills({ state, toggleDrillItem }) {
  const water = getWaterIntelligenceSummary()
  const compoundDrills = buildPresetCompoundEvents().filter((event)=>['water-power-72h','water-road-7d','typhoon-supply-7d'].includes(event.id)).map((event)=>({...event,simulation:simulateCompoundDisaster(water,event,{mode:'planned',strictness:'standard'})}))
  const fortressCore = getCoreSystemSummary(state, water)
  const [openDrills, setOpenDrills] = useState({ 'water-24h': true })
  const drills = state.drills || {}
  const summary = getDrillCompletion(drills)

  function toggleOpen(drillId) {
    setOpenDrills({ ...openDrills, [drillId]: !openDrills[drillId] })
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Scenario Drills</p>
        <h1 className="text-2xl font-black text-bark">情境演練</h1>
        <p className="text-soil/70 mt-2 leading-7">
          安全範圍內的壓力測試。目標不是冒險，而是提前暴露缺口、修正清單、建立停止條件。
        </p>

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-soil/15 bg-white/60 p-4">
            <p className="text-sm font-bold text-soil/60">硬核演練完成度</p>
            <strong className="block mt-1 text-4xl text-bark">{summary.percent}%</strong>
          </div>
          <div className="rounded-2xl border border-soil/15 bg-white/60 p-4">
            <p className="text-sm font-bold text-soil/60">通過演練</p>
            <strong className="block mt-1 text-4xl text-bark">{summary.passedDrills}/{DRILLS.length}</strong>
          </div>
          <div className="rounded-2xl border border-soil/15 bg-white/60 p-4">
            <p className="text-sm font-bold text-soil/60">系統等級</p>
            <strong className="block mt-2 text-lg text-bark">{readinessTitle(summary.percent)}</strong>
          </div>
        </div>

        <div className="mt-4 h-3 rounded-full bg-[#d5c9b4] overflow-hidden">
          <div className="h-full rounded-full bg-[#24483a]" style={{ width: `${summary.percent}%` }} />
        </div>
      </section>

      <section className="muji-card border-[#24483a]/25">
        <div className="muji-section-title"><ClipboardCheck size={18}/><span>停水演練情報</span></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[{ label: '24 小時', days: 1 }, { label: '72 小時', days: 3 }, { label: '7 天', days: 7 }].map((target) => {
            const simulation = simulateWaterEvent(water, { durationDays: target.days, mode: 'planned' })
            const badge = simulation.result.status === 'pass' ? 'bg-[#24483a] text-[#fff9ea]' : simulation.result.status === 'partial' ? 'bg-[#c2a25c] text-[#241b10]' : 'bg-[#8b2f25] text-[#fff9ea]'
            return <article key={target.days} className="rounded-2xl border border-soil/15 bg-white/60 p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="font-black text-bark">{target.label}停水演練</h3><span className={`rounded-full px-3 py-1 text-xs font-black ${badge}`}>{simulation.result.label}</span></div>
              <div className="mt-3 space-y-1 text-sm font-bold text-soil/75">
                <p>模擬分數：{simulation.result.score} / 100</p><p>可撐天數：{Number(simulation.result.survivedDays.toFixed(1))} 天</p>
                <p>飲水缺口：{Number(simulation.gaps.drinkingGap.toFixed(1))} L</p><p>生活用水缺口：{Number(simulation.gaps.utilityGap.toFixed(1))} L</p><p>總水量缺口：{Number(simulation.gaps.totalGap.toFixed(1))} L</p>
                <p className="pt-1">建議：{simulation.recommendations[0]}</p>
              </div>
            </article>
          })}
        </div>
      </section>

      <section className="muji-card border-[#8b2f25]/20"><div className="muji-section-title"><ShieldAlert size={18}/><span>複合災害演練情報</span></div><div className="mt-4 grid gap-3 lg:grid-cols-3">{compoundDrills.map((event)=>{const simulation=event.simulation;const badge=simulation.result.status==='pass'?'bg-[#24483a] text-[#fff9ea]':simulation.result.status==='strained'||simulation.result.status==='partial'?'bg-[#c2a25c] text-[#241b10]':'bg-[#8b2f25] text-[#fff9ea]';return <article key={event.id} className="rounded-2xl border border-soil/15 bg-white/60 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-black text-bark">{event.name}</h3><span className={`rounded-full px-3 py-1 text-xs font-black ${badge}`}>{simulation.result.label}</span></div><div className="mt-3 space-y-1 text-sm font-bold text-soil/75"><p>分數：{simulation.result.score} / 100</p><p>風險等級：{simulation.result.riskLevel}</p><p>主要失敗點：{compoundFailureLabels[simulation.result.primaryFailurePoint]||simulation.result.primaryFailurePoint}</p><p className="pt-1">建議：{simulation.recommendations[0]}</p></div></article>})}</div></section>

      <section className="muji-card border-[#24483a]/25"><div className="muji-section-title"><ClipboardCheck size={18}/><span>核心生存演練</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{fortressCore.scenarioReadiness.filter((item)=>['home-24h','water-power-72h','supply-7d','major-14d'].includes(item.id)).map((item)=><article key={item.id} className="core-scenario-card"><div className="flex items-start justify-between gap-2"><h3 className="font-black">{item.name}</h3><span className="badge">{item.label}</span></div><p className="mt-2 font-black">{item.score} / 100</p><p className="mt-2 text-sm">最弱：{item.weakestDomains.map((id)=>CORE_DOMAIN_LABELS[id]).join('、')}</p><p className="mt-2 text-sm font-bold">建議：{item.recommendation}</p></article>)}</div></section>

      <section className="grid lg:grid-cols-2 gap-4">
        {DRILLS.map((drill) => {
          const checked = drills[drill.id] || {}
          const completed = drill.items.filter((_, index) => checked[`item-${index}`]).length
          const percent = Math.round((completed / drill.items.length) * 100)
          const passed = completed >= drill.passCount
          const isOpen = Boolean(openDrills[drill.id])

          return (
            <article key={drill.id} className="muji-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">硬核等級 {drill.level}</span>
                    <span className="text-xs font-black tracking-widest text-soil/50">{levelMarks(drill.level)}</span>
                  </div>
                  <h2 className="mt-3 font-black text-xl text-bark">{drill.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-soil/70">{drill.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${passed ? 'bg-[#24483a] text-[#fff9ea]' : 'bg-[#8b2f25] text-[#fff9ea]'}`}>
                  {passed ? '通過' : '未通過'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-bold text-soil/70">
                <span>{completed}/{drill.items.length} 項</span>
                <span>{percent}%</span>
                <span><span className="emphasis-underline">最低通過標準</span> {drill.passCount}/{drill.items.length}</span>
              </div>

              <div className="mt-3 h-2 rounded-full bg-[#d5c9b4] overflow-hidden">
                <div className="h-full rounded-full bg-[#24483a]" style={{ width: `${percent}%` }} />
              </div>

              <button
                type="button"
                onClick={() => toggleOpen(drill.id)}
                className="btn-secondary mt-4 inline-flex items-center gap-2"
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {isOpen ? '收合檢查清單' : '展開檢查清單'}
              </button>

              {isOpen && (
                <div className="mt-4 space-y-2">
                  {drill.items.map((item, index) => {
                    const itemId = `item-${index}`
                    const isChecked = Boolean(checked[itemId])

                    return (
                      <button
                        key={itemId}
                        type="button"
                        onClick={() => toggleDrillItem(drill.id, itemId)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${isChecked ? 'border-[#24483a]/30 bg-[#edf1e9]' : 'border-soil/10 bg-white/60'}`}
                      >
                        <span className="flex items-start gap-3">
                          {isChecked ? <CheckCircle2 size={18} className="mt-1 shrink-0 text-[#24483a]" /> : <Circle size={18} className="mt-1 shrink-0 text-soil/35" />}
                          <span className="text-sm font-bold leading-7 text-bark">{renderDrillItem(item)}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </article>
          )
        })}
      </section>

      <section className="muji-note">
        <ShieldAlert size={18} />
        <div>
          <strong>安全邊界</strong>
          <p>演練只做室內盤點、清單確認與低風險測試。颱風、豪雨、地震後或夜間 <span className="stop-condition">不進行危險移動</span> 與外出驗證。</p>
        </div>
      </section>
    </div>
  )
}
