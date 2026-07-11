import React from 'react'
import { CheckCircle2, Circle, Flag, Route, Target } from 'lucide-react'
import { getInventorySummary } from './Inventory.jsx'
import { getEvacuationKitSummary } from './EvacuationKit.jsx'
import { getCompletedMap } from '../data/tasks.js'

export const abilityDomains = {
  water: '水',
  food: '食物',
  power: '能源',
  medical: '醫療',
  animal: '動物',
  evacuation: '撤離',
  repair: '修繕',
  production: '生產',
  community: '社區'
}

export const ROADMAP_STAGES = [
  {
    id: 'stage-1-72h',
    name: 'Stage 1：72 小時生存',
    goal: '能在停水、停電、災害初期維持基本安全。',
    threshold: 70,
    abilities: [
      { id: 's1-water-72h', title: '72 小時飲水', domain: 'water', description: '建立最低 3 天飲水基準，先保住家庭與動物的基本飲水線。', evidenceType: 'auto', suggestedAction: '到備災或庫存補齊至少 9L 可飲用水。' },
      { id: 's1-food-72h', title: '72 小時免冷藏食物', domain: 'food', description: '建立斷電時仍可直接食用或簡單加熱的核心食物線。', evidenceType: 'auto', suggestedAction: '在庫存建立至少 9 份免冷藏成人食物。' },
      { id: 's1-basic-light', title: '基礎照明', domain: 'power', description: '確認夜間停電時仍有手電筒、頭燈或行動電源支援。', evidenceType: 'auto', suggestedAction: '完成照明與行動電源檢查。' },
      { id: 's1-first-aid', title: '基礎急救', domain: 'medical', description: '建立急救箱、常備藥或最低醫療耗材，不把等待救援變成空窗。', evidenceType: 'auto', suggestedAction: '完成急救箱與常備藥清單。' },
      { id: 's1-contacts', title: '緊急聯絡', domain: 'community', description: '準備紙本聯絡人與家人聯絡規則，手機失效時仍能決策。', evidenceType: 'auto', suggestedAction: '在 72 小時備災完成緊急聯絡人。' },
      { id: 's1-kit', title: '撤離包', domain: 'evacuation', description: '建立可拿了就走的撤離包，至少達到半數核心項目。', evidenceType: 'auto', suggestedAction: '到撤離包模組補齊水、藥、文件與聯絡資料。' }
    ]
  },
  {
    id: 'stage-2-7d',
    name: 'Stage 2：7 天補給中斷',
    goal: '能面對交通、物流、船班或商店供應中斷。',
    threshold: 70,
    abilities: [
      { id: 's2-water-food-7d', title: '7 天飲水與食物', domain: 'food', description: '把 72 小時基準升級到 7 天補給線，降低物流中斷壓力。', evidenceType: 'auto', suggestedAction: '庫存水量達 21L，或成人食物達 21 份。' },
      { id: 's2-animal-7d', title: '動物 7 天補給', domain: 'animal', description: '動物飼料、飲水、用藥與轉送物品要獨立盤點。', evidenceType: 'auto', suggestedAction: '建立動物 7 天補給或撤離包動物項目。' },
      { id: 's2-meds-backup', title: '常用藥與急救備援', domain: 'medical', description: '常用藥、慢性病藥與急救耗材有替換週期與固定位置。', evidenceType: 'auto', suggestedAction: '完成醫療備災或在庫存標記高優先醫療物資。' },
      { id: 's2-power-comms', title: '電力與通訊備援', domain: 'power', description: '手機、行動電源、照明與紙本資料能支援補給中斷期。', evidenceType: 'auto', suggestedAction: '確認行動電源、手電筒與充電線。' },
      { id: 's2-supply-rotation', title: '補給輪替', domain: 'food', description: '食物與藥品不是堆放，而是能被消耗、補回、檢查期限。', evidenceType: 'manual', suggestedAction: '建立每月輪替日期與補貨下限。' },
      { id: 's2-community-contact', title: '社區聯絡', domain: 'community', description: '建立鄰里、親友、醫療與動物支援聯絡網。', evidenceType: 'auto', suggestedAction: '補齊緊急聯絡人或風險矩陣環境資料。' }
    ]
  },
  {
    id: 'stage-3-30d',
    name: 'Stage 3：30 天家庭韌性',
    goal: '能建立一個月級別的家庭補給與輪替系統。',
    threshold: 70,
    abilities: [
      { id: 's3-food-30d', title: '30 天食物盤點', domain: 'food', description: '建立一個月級別的食物盤點，不把安全感建立在印象上。', evidenceType: 'manual', suggestedAction: '建立 30 天食物清單與缺口表。' },
      { id: 's3-food-rotation', title: '食物輪替', domain: 'food', description: '按保存期限使用庫存，避免過期與重複採買。', evidenceType: 'manual', suggestedAction: '建立先進先出與即期品處理規則。' },
      { id: 's3-water-source', title: '儲水與備用水源', domain: 'water', description: '除了瓶裝飲水，也要有容器、清潔與補水方案。', evidenceType: 'auto', suggestedAction: '完成備用取水與淨水相關任務。' },
      { id: 's3-repair-tools', title: '工具修繕', domain: 'repair', description: '家庭基本維修工具、耗材與清單固定位置。', evidenceType: 'auto', suggestedAction: '完成工具修繕任務或在庫存建立工具物資。' },
      { id: 's3-doc-cash', title: '文件與現金備援', domain: 'evacuation', description: '重要文件、現金與備用鑰匙能在斷電斷網時使用。', evidenceType: 'auto', suggestedAction: '完成重要文件、現金或撤離包文件項目。' },
      { id: 's3-risk-matrix', title: '家庭風險矩陣', domain: 'community', description: '用住所、地形、醫療距離與補給風險建立個人化風險模型。', evidenceType: 'auto', suggestedAction: '完成家庭風險矩陣基本環境資料。' }
    ]
  },
  {
    id: 'stage-4-90d',
    name: 'Stage 4：90 天半自給計畫',
    goal: '開始建立可持續產生資源的生活系統。',
    threshold: 70,
    abilities: [
      { id: 's4-food-production', title: '食物生產', domain: 'production', description: '至少開始記錄一項可持續食物生產或種植活動。', evidenceType: 'auto', suggestedAction: '新增一筆植物或食物生產紀錄。' },
      { id: 's4-simple-growing', title: '簡易種植', domain: 'production', description: '用蔥、香草、芽菜或葉菜建立低門檻生產基礎。', evidenceType: 'auto', suggestedAction: '建立至少 3 筆植物紀錄。' },
      { id: 's4-sprouts-herbs', title: '芽菜／香草／葉菜', domain: 'production', description: '選擇室內或陽台可控的短週期食物來源。', evidenceType: 'manual', suggestedAction: '完成一個可重複收成的小型生產流程。' },
      { id: 's4-food-preservation', title: '食物保存', domain: 'food', description: '建立乾燥、罐頭、冷凍或輪替保存原則，降低浪費。', evidenceType: 'manual', suggestedAction: '記錄一套食物保存方法與安全邊界。' },
      { id: 's4-water-management', title: '雨水或備用水管理', domain: 'water', description: '建立非飲用水與備用水的收集、標示、清潔與使用邊界。', evidenceType: 'manual', suggestedAction: '建立備用水容器標示與清潔週期。' },
      { id: 's4-energy-backup', title: '基礎能源備援', domain: 'power', description: '讓照明、通訊與必要設備有明確備援策略。', evidenceType: 'auto', suggestedAction: '完成停電演練或電力通訊任務。' }
    ]
  },
  {
    id: 'stage-5-yearly',
    name: 'Stage 5：年度自給生活系統',
    goal: '建立季節性、年度性的自給與社區韌性系統。',
    threshold: 70,
    abilities: [
      { id: 's5-annual-growing', title: '年度種植計畫', domain: 'production', description: '依季節、空間與家庭需求規劃年度食物生產。', evidenceType: 'manual', suggestedAction: '手動標記年度種植計畫完成。' },
      { id: 's5-long-preservation', title: '長期食物保存', domain: 'food', description: '建立跨季節保存、輪替與安全丟棄標準。', evidenceType: 'manual', suggestedAction: '完成長期食物保存清單。' },
      { id: 's5-repair-skill', title: '工具維修能力', domain: 'repair', description: '具備修繕、替換耗材與基礎故障排除能力。', evidenceType: 'manual', suggestedAction: '完成年度工具與修繕清單。' },
      { id: 's5-animal-system', title: '動物照護系統', domain: 'animal', description: '動物補給、醫療、撤離與日常照護形成固定流程。', evidenceType: 'auto', suggestedAction: '建立動物 7 天補給與撤離資料。' },
      { id: 's5-medical-transfer', title: '醫療距離與轉送計畫', domain: 'medical', description: '偏遠、山區、海邊或離島環境需有就醫與轉送備案。', evidenceType: 'auto', suggestedAction: '完成醫療距離風險資料或轉送任務。' },
      { id: 's5-mutual-aid', title: '社區互助網絡', domain: 'community', description: '把家庭韌性連到可信任的鄰里、親友與專業支援。', evidenceType: 'auto', suggestedAction: '建立緊急聯絡人與社區互助資料。' }
    ]
  }
]

function kitItemPrepared(state, itemId) {
  return Boolean(state.evacuationKit?.items?.[itemId]?.prepared)
}

function hasCompletedTask(state, taskId) {
  return Boolean(getCompletedMap(state.completed)[taskId])
}

function getAutoCompletion(abilityId, state, supplySummary, kitSummary) {
  const preparedness = state.preparedness || {}
  const inventory = state.inventory || []
  const plants = state.plants || []
  const drills = state.drills || {}
  const riskProfile = state.riskProfile || {}
  const hasMedicalHigh = inventory.some((item) => item.type === 'medical' && item.priority === 'high')
  const hasToolInventory = inventory.some((item) => item.type === 'tool' || String(item.category).includes('工具'))
  const hasPowerDrill = Object.values(drills.power_12h || drills['power-12h'] || {}).some(Boolean)
  const animalKit = kitSummary.categories.find((category) => category.id === 'animal')
  const animalKitReady = animalKit ? animalKit.percent >= 50 : false

  const rules = {
    's1-water-72h': preparedness.water || supplySummary.waterLiters >= 9,
    's1-food-72h': preparedness.food || supplySummary.shelfStableServings >= 9,
    's1-basic-light': preparedness.light || preparedness.power,
    's1-first-aid': preparedness.firstaid || preparedness.medicine,
    's1-contacts': preparedness.contacts,
    's1-kit': kitSummary.percent >= 50,
    's2-water-food-7d': supplySummary.waterLiters >= 21 || supplySummary.foodServings >= 21,
    's2-animal-7d': preparedness.animals || supplySummary.animalDays >= 7 || animalKitReady,
    's2-meds-backup': preparedness.medicine || preparedness.firstaid || hasMedicalHigh,
    's2-power-comms': preparedness.power || kitItemPrepared(state, 'comms-power-bank') || kitItemPrepared(state, 'comms-light'),
    's2-community-contact': preparedness.contacts || Boolean(riskProfile.residenceType),
    's3-water-source': hasCompletedTask(state, 'water-backup-purification') || preparedness.water,
    's3-repair-tools': hasCompletedTask(state, 'longterm-tools-repair-list') || hasToolInventory,
    's3-doc-cash': preparedness.documents || kitItemPrepared(state, 'documents-id-copy') || kitItemPrepared(state, 'documents-cash'),
    's3-risk-matrix': Boolean(riskProfile.residenceType),
    's4-food-production': plants.length >= 1,
    's4-simple-growing': plants.length >= 3,
    's4-energy-backup': preparedness.power || hasPowerDrill || hasCompletedTask(state, 'power-12h-lighting-test'),
    's5-animal-system': preparedness.animals || supplySummary.animalDays >= 7 || animalKitReady,
    's5-medical-transfer': hasCompletedTask(state, 'medical-remote-transfer-plan') || Boolean(riskProfile.medicalDistance),
    's5-mutual-aid': preparedness.contacts || Boolean(riskProfile.residenceType)
  }

  return Boolean(rules[abilityId])
}

export function getRoadmapSummary(state = {}) {
  const roadmap = state.roadmap || {}
  const checks = roadmap.checks || {}
  const supplySummary = getInventorySummary(state.inventory || [])
  const kitSummary = getEvacuationKitSummary(state.evacuationKit || {})
  let completedAbilities = 0
  let totalAbilities = 0

  const stages = ROADMAP_STAGES.map((stage) => {
    const abilities = stage.abilities.map((ability) => {
      const autoCompleted = getAutoCompletion(ability.id, state, supplySummary, kitSummary)
      const manualCompleted = Boolean(checks[ability.id])
      const completed = autoCompleted || manualCompleted
      if (completed) completedAbilities += 1
      totalAbilities += 1

      return { ...ability, autoCompleted, manualCompleted, completed }
    })
    const completedCount = abilities.filter((ability) => ability.completed).length
    const percent = abilities.length ? Math.round((completedCount / abilities.length) * 100) : 0

    return {
      ...stage,
      abilities,
      completedCount,
      totalCount: abilities.length,
      percent,
      passed: percent >= stage.threshold
    }
  })

  const currentStage = stages.find((stage) => !stage.passed) || stages[stages.length - 1]
  const nextAbility = currentStage?.abilities.find((ability) => !ability.completed) || null
  const score = totalAbilities ? Math.round((completedAbilities / totalAbilities) * 100) : 0

  return {
    stages,
    currentStage,
    nextAbility,
    score,
    completedAbilities,
    totalAbilities
  }
}

function domainClass(domain) {
  const classes = {
    water: 'bg-[#dce8e5] text-[#1d463f]',
    food: 'bg-[#eee1bf] text-[#594215]',
    power: 'bg-[#e9dfc7] text-[#4c3c18]',
    medical: 'bg-[#ead6d1] text-[#742d24]',
    animal: 'bg-[#e4ded0] text-[#4d4637]',
    evacuation: 'bg-[#d8e0d9] text-[#284838]',
    repair: 'bg-[#e7e1d6] text-[#3f3930]',
    production: 'bg-[#dce7d4] text-[#355029]',
    community: 'bg-[#ddd9cc] text-[#3d4636]'
  }
  return classes[domain] || 'bg-[#eee5d6] text-[#4b4134]'
}

export default function Roadmap({ state, updateRoadmap }) {
  const summary = getRoadmapSummary(state)
  const roadmap = state.roadmap || {}
  const checks = roadmap.checks || {}

  function toggleAbility(abilityId) {
    updateRoadmap({
      ...roadmap,
      checks: {
        ...checks,
        [abilityId]: !checks[abilityId]
      }
    })
  }

  return (
    <div className="roadmap-page space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Self-Reliance Roadmap v4.0</p>
        <h1 className="text-2xl font-black text-bark">自給能力路線圖</h1>
        <p className="mt-2 leading-7 text-soil/70">
          從 72 小時生存、7 天補給中斷，到 30 天家庭韌性與 90 天半自給計畫。
        </p>
      </section>

      <section className="muji-card border-[#24483a]/25">
        <div className="muji-section-title">
          <Route size={18} />
          <span>目前階段</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-soil/15 bg-white/65 p-4 lg:col-span-2">
            <p className="summary-title">{summary.currentStage.name}</p>
            <p className="summary-text mt-2">{summary.currentStage.goal}</p>
          </div>
          <Metric label="總體自給能力分數" value={`${summary.score}`} />
          <Metric label="已完成能力" value={`${summary.completedAbilities}/${summary.totalAbilities}`} />
        </div>
        <div className="mt-4 rounded-2xl border border-soil/15 bg-white/65 p-4">
          <p className="summary-meta font-black">下一個最重要能力</p>
          <h2 className="mt-2 text-xl font-black text-bark">{summary.nextAbility?.title || '全部階段已達標，進入年度壓力測試。'}</h2>
          <p className="summary-text mt-2">{summary.nextAbility?.suggestedAction || '持續做年度補給、種植、修繕與社區互助系統檢查。'}</p>
        </div>
      </section>

      <section className="grid gap-4">
        {summary.stages.map((stage) => (
          <article key={stage.id} className="muji-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="muji-section-title">
                  <Flag size={18} />
                  <span>{stage.name}</span>
                </div>
                <p className="summary-text mt-3">{stage.goal}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge">完成率 {stage.percent}%</span>
                <span className="badge">{stage.completedCount}/{stage.totalCount}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${stage.passed ? 'bg-[#24483a] text-[#fff9ea]' : 'bg-[#c2a25c] text-[#241b10]'}`}>
                  {stage.passed ? '已達標' : '未達 70%'}
                </span>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#d5c9b4]">
              <div className="h-full rounded-full bg-[#24483a]" style={{ width: `${stage.percent}%` }} />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {stage.abilities.map((ability) => (
                <article key={ability.id} className="rounded-2xl border border-soil/15 bg-white/65 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-bark">{ability.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-sm font-black ${domainClass(ability.domain)}`}>
                          {abilityDomains[ability.domain]}
                        </span>
                        {ability.autoCompleted && <span className="badge">由系統資料判定完成</span>}
                        {ability.manualCompleted && <span className="badge">手動標記完成</span>}
                        {!ability.completed && <span className="badge">下一步</span>}
                      </div>
                    </div>
                    {ability.completed ? <CheckCircle2 className="shrink-0 text-[#24483a]" size={24} /> : <Circle className="shrink-0 text-soil/35" size={24} />}
                  </div>
                  <p className="summary-text mt-3">{ability.description}</p>
                  <p className="mt-3 text-base font-bold leading-7 text-soil/75">
                    <span className="action-point">建議行動</span>：{ability.suggestedAction}
                  </p>
                  <label className="mt-4 flex items-center gap-3 rounded-2xl border border-soil/15 bg-[#f7f2e8] p-3 font-black text-bark">
                    <input
                      type="checkbox"
                      checked={Boolean(checks[ability.id])}
                      onChange={() => toggleAbility(ability.id)}
                    />
                    手動完成
                  </label>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="muji-note">
        <Target size={18} />
        <div>
          <strong>使用邊界</strong>
          <p>路線圖用於能力盤點與低風險準備。自動完成只代表資料已出現，仍需要定期實測、輪替與家人共同確認。</p>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <p className="summary-meta font-black">{label}</p>
      <p className="summary-value mt-2">{value}</p>
    </div>
  )
}
