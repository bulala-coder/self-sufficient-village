import React from 'react'
import { AlertTriangle, BarChart3, RotateCcw, ShieldAlert } from 'lucide-react'
import { getWaterIntelligenceSummary } from '../utils/waterStorage.js'

export const residenceLabels = {
  apartment: '公寓',
  townhouse: '透天',
  ruralHouse: '農村住宅',
  mountain: '山區住宅',
  coastal: '海邊住宅',
  riverside: '河邊／溪谷',
  island: '離島／偏遠地區'
}

const distanceLabels = {
  under15: '15 分鐘內',
  '15to30': '15–30 分鐘',
  '30to60': '30–60 分鐘',
  over60: '超過 60 分鐘',
  none: '不適用'
}

const riskLabels = {
  low: '低',
  medium: '中',
  high: '高'
}

const terrainOptions = [
  ['earthquake', '地震'],
  ['typhoon', '颱風'],
  ['flood', '淹水'],
  ['landslide', '土石流／落石'],
  ['stormSurge', '暴潮'],
  ['isolation', '交通或補給中斷'],
  ['heat', '高溫'],
  ['cold', '低溫']
]

const terrainLabels = Object.fromEntries(terrainOptions)

const baseRisk = { low: 20, medium: 50, high: 75 }
const medicalDistanceScore = { under15: 15, '15to30': 35, '30to60': 65, over60: 85 }
const vetDistanceScore = { under15: 5, '15to30': 15, '30to60': 30, over60: 45, none: 0 }

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function hasTerrain(profile, key) {
  return Array.isArray(profile.terrainRisks) && profile.terrainRisks.includes(key)
}

export function riskLevel(score) {
  if (score <= 25) return '低'
  if (score <= 50) return '中'
  if (score <= 75) return '高'
  return '極高'
}

export function riskLevelClass(score) {
  const level = riskLevel(score)
  if (level === '極高') return 'bg-[#8b2f25] text-[#fff9ea]'
  if (level === '高') return 'bg-[#9b5d25] text-[#fff9ea]'
  if (level === '中') return 'bg-[#c2a25c] text-[#241b10]'
  return 'bg-[#24483a] text-[#fff9ea]'
}

export function getRiskCards(riskProfile = {}) {
  const profile = {
    residenceType: 'apartment',
    householdSize: '',
    hasAnimals: false,
    hasVulnerableMembers: false,
    medicalDistance: 'under15',
    vetDistance: 'none',
    waterOutageRisk: 'low',
    powerOutageRisk: 'low',
    terrainRisks: [],
    ...riskProfile
  }
  const householdSize = Number(profile.householdSize) || 0
  const remoteResidence = ['island', 'ruralHouse', 'mountain', 'riverside'].includes(profile.residenceType)
  const exposedPowerResidence = ['mountain', 'coastal', 'island', 'ruralHouse'].includes(profile.residenceType)

  const waterScore = clampScore(
    (baseRisk[profile.waterOutageRisk] || 20) +
    (remoteResidence ? 10 : 0) +
    (householdSize >= 4 ? 10 : 0) +
    (profile.hasAnimals ? 10 : 0)
  )

  const powerScore = clampScore(
    (baseRisk[profile.powerOutageRisk] || 20) +
    (exposedPowerResidence ? 10 : 0) +
    (profile.hasVulnerableMembers ? 10 : 0) +
    (profile.hasAnimals ? 5 : 0)
  )

  const foodBase = profile.residenceType === 'island'
    ? 80
    : ['mountain', 'ruralHouse', 'coastal', 'riverside'].includes(profile.residenceType)
      ? 60
      : 35
  const foodScore = clampScore(foodBase + (householdSize >= 4 ? 10 : 0) + (hasTerrain(profile, 'isolation') ? 20 : 0))

  const medicalScore = clampScore((medicalDistanceScore[profile.medicalDistance] || 15) + (profile.hasVulnerableMembers ? 15 : 0))

  const animalScore = profile.hasAnimals
    ? clampScore(45 + (vetDistanceScore[profile.vetDistance] || 0) + (['island', 'mountain', 'ruralHouse'].includes(profile.residenceType) ? 10 : 0))
    : 0

  const earthquakeScore = clampScore((hasTerrain(profile, 'earthquake') ? 70 : 35) + (profile.residenceType === 'apartment' ? 10 : 0) + (profile.hasVulnerableMembers ? 10 : 0))

  const floodScore = clampScore(
    (hasTerrain(profile, 'flood') ? 25 : 0) +
    (hasTerrain(profile, 'stormSurge') ? 25 : 0) +
    (hasTerrain(profile, 'landslide') ? 25 : 0) +
    (profile.residenceType === 'riverside' ? 25 : 0) +
    (profile.residenceType === 'coastal' ? 25 : 0) +
    (profile.residenceType === 'mountain' ? 25 : 0) +
    (hasTerrain(profile, 'typhoon') ? 10 : 0)
  )

  const transportBase = hasTerrain(profile, 'isolation')
    ? 75
    : profile.residenceType === 'island'
      ? 85
      : ['mountain', 'ruralHouse'].includes(profile.residenceType)
        ? 65
        : ['coastal', 'riverside'].includes(profile.residenceType)
          ? 50
          : 30
  const transportScore = clampScore(transportBase + (profile.medicalDistance === 'over60' ? 10 : 0))

  return [
    {
      id: 'water',
      title: '停水風險',
      riskScore: waterScore,
      reason: `停水頻率為${riskLabels[profile.waterOutageRisk] || '低'}，${remoteResidence ? '住所型態提高補水難度，' : ''}${profile.hasAnimals ? '且動物飲水需納入。' : '需確認 72 小時飲水基準。'}`,
      action: '建立 72 小時飲水基準，並用計算器估算可撐天數。',
      tools: ['計算', '庫存', '演練', '手冊']
    },
    {
      id: 'power',
      title: '停電風險',
      riskScore: powerScore,
      reason: `停電風險為${riskLabels[profile.powerOutageRisk] || '低'}，${exposedPowerResidence ? '地形或住宅型態增加復電不確定性。' : '仍需確認照明與通訊備援。'}`,
      action: '測試 12 小時照明能力，建立手機與行動電源策略。',
      tools: ['計算', '庫存', '演練', '手冊']
    },
    {
      id: 'food',
      title: '食物補給中斷',
      riskScore: foodScore,
      reason: profile.residenceType === 'island' ? '離島／偏遠地區補給中斷成本高。' : hasTerrain(profile, 'isolation') ? '已標記交通或補給中斷風險。' : '依住所型態估算基礎補給風險。',
      action: '建立 72 小時免冷藏食物，偏遠環境提高到 7 天盤點。',
      tools: ['任務', '庫存', '報告', '手冊']
    },
    {
      id: 'medical',
      title: '醫療距離風險',
      riskScore: medicalScore,
      reason: `最近醫療距離：${distanceLabels[profile.medicalDistance] || '15 分鐘內'}。${profile.hasVulnerableMembers ? '家中有高風險成員。' : ''}`,
      action: '建立家庭急救箱、常備藥清單與轉送計畫。',
      tools: ['任務', '庫存', '報告', '手冊']
    },
    {
      id: 'animal',
      title: '動物照護風險',
      riskScore: animalScore,
      stateLabel: profile.hasAnimals ? null : '未設定',
      reason: profile.hasAnimals ? `最近獸醫距離：${distanceLabels[profile.vetDistance] || '不適用'}。` : '目前未設定動物資料，不列為主要缺口。',
      action: profile.hasAnimals ? '建立動物 7 天補給、撤離籠與醫療資訊卡。' : '若家中有動物，先啟用動物風險資料。',
      tools: ['任務', '庫存', '演練', '手冊']
    },
    {
      id: 'earthquake',
      title: '地震風險',
      riskScore: earthquakeScore,
      reason: hasTerrain(profile, 'earthquake') ? '已標記地震為主要地形風險。' : '即使未標記，仍保留基本地震風險基準。',
      action: '建立地震後 72 小時飲水、急救、火源與集合點流程。',
      tools: ['演練', '任務', '報告', '手冊']
    },
    {
      id: 'flood',
      title: '水災／暴潮／土石流風險',
      riskScore: floodScore,
      reason: ['flood', 'stormSurge', 'landslide', 'typhoon'].filter((key) => hasTerrain(profile, key)).map((key) => terrainLabels[key]).join('、') || '未標記主要水文地形風險。',
      action: '建立撤離判斷表，設定不涉水、不靠海、不夜間豪雨移動條件。',
      tools: ['演練', '任務', '報告', '手冊']
    },
    {
      id: 'transport',
      title: '交通與補給中斷風險',
      riskScore: transportScore,
      reason: profile.residenceType === 'island' ? '離島／偏遠地區預設為高補給中斷風險。' : hasTerrain(profile, 'isolation') ? '已標記交通或補給中斷。' : `住所型態：${residenceLabels[profile.residenceType] || '公寓'}。`,
      action: '建立 7 天飲水、食物、醫療與動物補給。',
      tools: ['計算', '庫存', '報告', '手冊']
    }
  ].map((card) => ({ ...card, level: card.stateLabel || riskLevel(card.riskScore) }))
}

export function getHighestRisk(riskProfile = {}) {
  return getRiskCards(riskProfile).filter((card) => card.level !== '未設定').sort((a, b) => b.riskScore - a.riskScore)[0] || null
}

export function getRiskCounts(riskProfile = {}) {
  return getRiskCards(riskProfile).reduce((counts, card) => {
    if (card.level !== '未設定') counts[card.level] = (counts[card.level] || 0) + 1
    return counts
  }, { 極高: 0, 高: 0, 中: 0, 低: 0 })
}

const riskEmphasisTerms = ['極高', '第一行動', '醫療距離', '補給中斷', '動物照護', '地形風險', '交通或補給中斷', '7 天', '停水', '停電', '撤離', '不夜間豪雨移動']

function renderRiskEmphasis(text, maxMatches = 3) {
  const escapedTerms = [...riskEmphasisTerms].sort((a, b) => b.length - a.length).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'g')
  let matchCount = 0

  return String(text).split(pattern).map((part, index) => {
    if (!riskEmphasisTerms.includes(part) || matchCount >= maxMatches) return part
    matchCount += 1
    const className = part.includes('第一行動') || part.includes('7 天') || part.includes('撤離') ? 'action-point' : part.includes('極高') ? 'critical-point' : 'emphasis-underline'
    return <span key={`${part}-${index}`} className={className}>{part}</span>
  })
}

export default function RiskMatrix({ state, updateRiskProfile }) {
  const water = getWaterIntelligenceSummary()
  const waterRisk = water.days.overallDays < 1 ? 'Critical' : water.days.overallDays < 3 ? 'High' : water.days.overallDays < 7 ? 'Moderate' : 'Lower'
  const riskProfile = state.riskProfile || {}
  const cards = getRiskCards(riskProfile)
  const highestRisk = getHighestRisk(riskProfile)
  const counts = getRiskCounts(riskProfile)

  function updateField(field, value) {
    updateRiskProfile({ ...riskProfile, [field]: value })
  }

  function toggleTerrain(key) {
    const current = Array.isArray(riskProfile.terrainRisks) ? riskProfile.terrainRisks : []
    updateField('terrainRisks', current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Risk Matrix v3.3</p>
        <h1 className="text-2xl font-black text-bark">家庭風險矩陣</h1>
        <p className="mt-2 leading-7 text-soil/70">
          依照住所、地形、補給與醫療距離，找出最需要優先處理的風險。
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <section className="muji-card lg:col-span-2">
          <div className="muji-section-title">
            <AlertTriangle size={18} />
            <span>最高風險</span>
          </div>
          <h2 className="mt-4">{highestRisk?.title || '尚未建立風險資料'}</h2>
          {highestRisk && (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${riskLevelClass(highestRisk.riskScore)}`}>
                  {highestRisk.level} {highestRisk.riskScore}
                </span>
                {highestRisk.tools.map((tool) => <span key={tool} className="badge">{tool}</span>)}
              </div>
              <p>{renderRiskEmphasis(highestRisk.reason)}</p>
              <p className="font-black text-bark"><span className="action-point">第一行動</span>：{renderRiskEmphasis(highestRisk.action)}</p>
            </>
          )}
        </section>

        <aside className="muji-card">
          <div className="muji-section-title">
            <BarChart3 size={18} />
            <span>風險矩陣摘要</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <RiskCount label="極高" value={counts.極高} />
            <RiskCount label="高" value={counts.高} />
            <RiskCount label="中" value={counts.中} />
            <RiskCount label="低" value={counts.低} />
          </div>
        </aside>
      </section>

      <section className="muji-card border-[#24483a]/25">
        <div className="muji-section-title"><ShieldAlert size={18}/><span>水資源風險情報</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <WaterRiskMetric label="整體水支撐" value={`${Number(water.days.overallDays.toFixed(1))} 天`} />
          <WaterRiskMetric label="72 小時停水" value={water.days.overallDays >= 3 ? '可承受' : '不可承受'} />
          <WaterRiskMetric label="7 天停水" value={water.days.overallDays >= 7 ? '可承受' : '不可承受'} />
          <WaterRiskMetric label="水風險等級" value={waterRisk} />
          <WaterRiskMetric label="72 小時飲水" value={water.days.drinkingDays >= 3 ? '足夠' : '不足'} />
          <WaterRiskMetric label="72 小時生活用水" value={water.days.utilityDays >= 3 ? '足夠' : '不足'} />
        </div>
        <p className="mt-4 rounded-2xl border border-soil/15 bg-white/60 p-4 text-sm font-bold leading-7 text-soil/75"><span className="action-point">第一行動</span>：{water.recommendations[0]}</p>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <ShieldAlert size={18} />
          <span>基本環境資料</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField label="住所型態" value={riskProfile.residenceType || 'apartment'} onChange={(value) => updateField('residenceType', value)} options={Object.entries(residenceLabels)} />
          <NumberField label="家庭成員" value={riskProfile.householdSize || ''} onChange={(value) => updateField('householdSize', value)} />
          <CheckField label="是否有動物" checked={Boolean(riskProfile.hasAnimals)} onChange={(checked) => updateField('hasAnimals', checked)} />
          <CheckField label="是否有高風險成員" description="嬰幼兒、長者、慢性病患、行動不便者" checked={Boolean(riskProfile.hasVulnerableMembers)} onChange={(checked) => updateField('hasVulnerableMembers', checked)} />
          <SelectField label="最近醫療距離" value={riskProfile.medicalDistance || 'under15'} onChange={(value) => updateField('medicalDistance', value)} options={Object.entries(distanceLabels).filter(([key]) => key !== 'none')} />
          <SelectField label="最近獸醫距離" value={riskProfile.vetDistance || 'none'} onChange={(value) => updateField('vetDistance', value)} options={Object.entries(distanceLabels)} />
          <SelectField label="是否常遇停水" value={riskProfile.waterOutageRisk || 'low'} onChange={(value) => updateField('waterOutageRisk', value)} options={Object.entries(riskLabels)} />
          <SelectField label="是否常遇停電" value={riskProfile.powerOutageRisk || 'low'} onChange={(value) => updateField('powerOutageRisk', value)} options={Object.entries(riskLabels)} />
        </div>

        <div className="mt-5">
          <p className="text-sm font-black text-soil">主要地形風險</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {terrainOptions.map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl border border-soil/15 bg-white/65 px-4 py-3 text-sm font-bold text-soil">
                <input
                  type="checkbox"
                  checked={Array.isArray(riskProfile.terrainRisks) && riskProfile.terrainRisks.includes(key)}
                  onChange={() => toggleTerrain(key)}
                  className="h-5 w-5 accent-[#24483a]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="button" className="btn-secondary mt-5 inline-flex items-center gap-2" onClick={() => updateRiskProfile({})}>
          <RotateCcw size={16} />
          清除風險資料
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <article key={card.id} className="muji-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2>{card.title}</h2>
                <p>{renderRiskEmphasis(card.reason)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${card.level === '未設定' ? 'bg-[#c2a25c] text-[#241b10]' : riskLevelClass(card.riskScore)}`}>
                {card.level} {card.level === '未設定' ? '' : card.riskScore}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d5c9b4]">
              <div className="h-full rounded-full bg-[#24483a]" style={{ width: `${card.riskScore}%` }} />
            </div>
            <p className="mt-4 font-black text-bark"><span className="action-point">建議行動</span>：{renderRiskEmphasis(card.action)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.tools.map((tool) => <span key={tool} className="badge">{tool}</span>)}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function RiskCount({ label, value }) {
  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-soil/50">{label}風險</p>
      <p className="mt-2 text-2xl font-black text-bark">{value} 項</p>
    </div>
  )
}

function WaterRiskMetric({ label, value }) {
  return <div className="rounded-2xl border border-soil/15 bg-white/65 p-4"><p className="text-xs font-black text-soil/50">{label}</p><p className="mt-2 text-xl font-black text-bark">{value}</p></div>
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]">
        {options.map(([key, optionLabel]) => <option key={key} value={key}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]" />
    </label>
  )
}

function CheckField({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-soil/15 bg-white/65 px-4 py-3 text-sm font-bold text-soil">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#24483a]" />
      <span>
        {label}
        {description && <span className="mt-1 block text-xs leading-5 text-soil/60">{description}</span>}
      </span>
    </label>
  )
}
