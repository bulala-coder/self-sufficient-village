import React, { useState } from 'react'
import { CalendarDays, Droplets, Leaf, Plus, Sprout, Trash2, Wheat } from 'lucide-react'

const cropTypeLabels = {
  leafy: '葉菜',
  herb: '香草',
  root: '根莖',
  fruit: '果菜',
  sprout: '芽菜',
  grain: '穀物',
  mushroom: '菇類',
  other: '其他'
}

const growingSpaceLabels = {
  balcony: '陽台',
  windowsill: '窗台',
  indoor: '室內',
  yard: '庭院',
  field: '農地',
  hydroponic: '水耕',
  container: '容器'
}

const ediblePartLabels = {
  leaf: '葉',
  stem: '莖',
  root: '根',
  fruit: '果',
  seed: '種子',
  flower: '花'
}

const difficultyLabels = { easy: '低', medium: '中', hard: '高' }
const statusLabels = { planning: '計畫中', growing: '生長中', harvestable: '可採收', harvested: '已採收', failed: '失敗' }
const harvestUnits = ['g', 'kg', 'bunch', 'piece', 'meal']
const harvestUnitLabels = { g: 'g', kg: 'kg', bunch: '把', piece: '顆', meal: '餐' }
const sunlightOptions = ['全日照', '半日照', '散射光', '陰影', '不確定']

const initialForm = {
  name: '',
  location: '',
  plantedAt: '',
  sunlight: '半日照',
  note: '',
  cropType: 'other',
  growingSpace: 'container',
  seedDate: '',
  transplantDate: '',
  expectedHarvestDate: '',
  lastHarvestDate: '',
  harvestAmount: '',
  harvestUnit: 'g',
  edibleParts: [],
  seedSaving: false,
  difficulty: 'easy',
  status: 'growing',
  failureReason: ''
}

function numberValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function todayDate() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function todayText() {
  return new Date().toISOString().slice(0, 10)
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  return Math.floor((date.getTime() - todayDate().getTime()) / 86400000)
}

function daysSince(dateText) {
  const days = daysUntil(dateText)
  return days === null ? null : Math.max(0, -days)
}

function isThisMonth(value) {
  const date = parseDate(value)
  if (!date) return false
  const now = todayDate()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function formatNumber(value) {
  return Number(value.toFixed(1)).toString()
}

function wateringText(lastWateredAt) {
  const days = daysSince(lastWateredAt)
  if (days === null) return '尚未記錄澆水'
  if (days === 0) return '今天已澆水'
  return `距離上次澆水 ${days} 天`
}

function isActivePlant(plant) {
  return ['planning', 'growing', 'harvestable'].includes(plant.status)
}

function isHarvestSoon(plant) {
  const days = daysUntil(plant.expectedHarvestDate)
  return days !== null && days >= 0 && days <= 30
}

export function normalizePlant(plant = {}) {
  const cropType = cropTypeLabels[plant.cropType] ? plant.cropType : 'other'
  const growingSpace = growingSpaceLabels[plant.growingSpace] ? plant.growingSpace : 'container'
  const difficulty = difficultyLabels[plant.difficulty] ? plant.difficulty : 'easy'
  const status = statusLabels[plant.status] ? plant.status : 'growing'
  const harvestUnit = harvestUnits.includes(plant.harvestUnit) ? plant.harvestUnit : 'g'
  const edibleParts = Array.isArray(plant.edibleParts) ? plant.edibleParts.filter((part) => ediblePartLabels[part]) : []

  return {
    ...plant,
    name: plant.name || '未命名作物',
    location: plant.location || '',
    plantedAt: plant.plantedAt || '',
    sunlight: plant.sunlight || '不確定',
    note: plant.note || '',
    lastWateredAt: plant.lastWateredAt || '',
    cropType,
    growingSpace,
    seedDate: plant.seedDate || '',
    transplantDate: plant.transplantDate || '',
    expectedHarvestDate: plant.expectedHarvestDate || '',
    lastHarvestDate: plant.lastHarvestDate || '',
    harvestAmount: numberValue(plant.harvestAmount),
    harvestUnit,
    edibleParts,
    seedSaving: plant.seedSaving === true || plant.seedSaving === 'true',
    difficulty,
    status,
    failureReason: plant.failureReason || ''
  }
}

export function getFoodProductionSummary(plants = []) {
  const normalizedPlants = plants.map(normalizePlant)
  const activePlants = normalizedPlants.filter(isActivePlant)
  const cropTypes = new Set(normalizedPlants.filter((plant) => plant.status !== 'failed').map((plant) => plant.cropType))
  const harvestGroups = normalizedPlants.reduce((groups, plant) => {
    if (plant.harvestAmount > 0) groups[plant.harvestUnit] = (groups[plant.harvestUnit] || 0) + plant.harvestAmount
    return groups
  }, {})
  const harvestSummary = Object.entries(harvestGroups)
    .map(([unit, amount]) => `${formatNumber(amount)}${harvestUnitLabels[unit] || unit}`)
    .join('、') || '尚無採收'
  const spaceCounts = normalizedPlants.reduce((counts, plant) => {
    counts[plant.growingSpace] = (counts[plant.growingSpace] || 0) + 1
    return counts
  }, {})
  const spaceSummary = Object.entries(spaceCounts)
    .map(([space, count]) => `${growingSpaceLabels[space]} ${count}`)
    .join('、') || '尚無資料'
  const harvestRecordCount = normalizedPlants.filter((plant) => plant.harvestAmount > 0 || plant.lastHarvestDate).length
  const seedSavingCount = normalizedPlants.filter((plant) => plant.seedSaving).length
  const harvestableCount = normalizedPlants.filter((plant) => plant.status === 'harvestable').length
  const harvestSoonCount = normalizedPlants.filter(isHarvestSoon).length
  const score = Math.round(Math.min(100,
    Math.min(normalizedPlants.length / 5, 1) * 25 +
    Math.min(cropTypes.size / 4, 1) * 20 +
    Math.min(activePlants.length / 3, 1) * 20 +
    Math.min(harvestRecordCount / 3, 1) * 20 +
    Math.min(seedSavingCount / 3, 1) * 15
  ))
  const highestGap = getFoodProductionGap({
    total: normalizedPlants.length,
    activeCount: activePlants.length,
    harvestRecordCount,
    seedSavingCount
  })

  return {
    plants: normalizedPlants,
    total: normalizedPlants.length,
    activeCount: activePlants.length,
    growingCount: normalizedPlants.filter((plant) => plant.status === 'growing').length,
    harvestableCount,
    harvestedCount: normalizedPlants.filter((plant) => plant.status === 'harvested').length,
    failedCount: normalizedPlants.filter((plant) => plant.status === 'failed').length,
    harvestGroups,
    harvestSummary,
    seedSavingCount,
    spaceCounts,
    spaceSummary,
    monthHarvestCount: normalizedPlants.filter((plant) => isThisMonth(plant.lastHarvestDate)).length,
    harvestSoonCount,
    cropTypeDiversity: cropTypes.size,
    harvestRecordCount,
    score,
    scoreTitle: foodProductionTitle(score),
    highestGap
  }
}

function foodProductionTitle(score) {
  if (score <= 20) return '尚未建立生產系統'
  if (score <= 40) return '初步種植'
  if (score <= 60) return '可產生少量食物'
  if (score <= 80) return '穩定家庭食物補充'
  return '半自給生產基礎'
}

function getFoodProductionGap(summary) {
  if (summary.total === 0) return '尚未建立食物生產'
  if (summary.activeCount === 0) return '目前沒有生長中作物'
  if (summary.harvestRecordCount === 0) return '尚未建立採收紀錄'
  if (summary.seedSavingCount === 0) return '尚未建立留種能力'
  return '食物生產系統已開始運作'
}

function statusBadgeClass(status) {
  if (status === 'harvestable') return 'bg-[#24483a] text-[#fff9ea]'
  if (status === 'failed') return 'bg-[#8b2f25] text-[#fff9ea]'
  if (status === 'harvested') return 'bg-[#c2a25c] text-[#241b10]'
  return 'bg-[#eee5d6] text-[#4b4134]'
}

const filters = [
  ['all', '全部'],
  ['growing', '生長中'],
  ['harvestable', '可採收'],
  ['harvested', '已採收'],
  ['failed', '失敗'],
  ['seedSaving', '可留種'],
  ['harvestSoon', '30 天內可採收']
]

export default function Plants({ state, addPlant, deletePlant, waterPlant, updatePlant }) {
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState('all')
  const [harvestForms, setHarvestForms] = useState({})
  const [failureForms, setFailureForms] = useState({})
  const summary = getFoodProductionSummary(state.plants || [])
  const plants = summary.plants.filter((plant) => {
    if (filter === 'all') return true
    if (filter === 'seedSaving') return plant.seedSaving
    if (filter === 'harvestSoon') return isHarvestSoon(plant)
    return plant.status === filter
  })

  function updateField(field, value) {
    setForm({ ...form, [field]: value })
  }

  function toggleEdiblePart(part) {
    const current = new Set(form.edibleParts)
    if (current.has(part)) current.delete(part)
    else current.add(part)
    updateField('edibleParts', [...current])
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return

    addPlant({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      note: form.note.trim(),
      harvestAmount: numberValue(form.harvestAmount),
      failureReason: form.failureReason.trim()
    })
    setForm(initialForm)
  }

  function recordHarvest(plant) {
    const harvestForm = harvestForms[plant.id] || { amount: '', unit: plant.harvestUnit || 'g' }
    const amount = numberValue(harvestForm.amount)
    if (!amount) return
    updatePlant(plant.id, {
      harvestAmount: plant.harvestAmount + amount,
      harvestUnit: harvestForm.unit,
      lastHarvestDate: todayText(),
      status: 'harvested'
    })
    setHarvestForms({ ...harvestForms, [plant.id]: { amount: '', unit: harvestForm.unit } })
  }

  function markFailed(plant) {
    const reason = (failureForms[plant.id] || '').trim()
    updatePlant(plant.id, { status: 'failed', failureReason: reason || '未記錄原因' })
    setFailureForms({ ...failureForms, [plant.id]: '' })
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Food Production 2.0</p>
        <h1 className="text-2xl font-black text-bark">食物生產</h1>
        <p className="text-soil/70 mt-2 leading-7">
          記錄作物、種植位置、採收、留種與每月產出，建立半自給食物基礎。
        </p>
      </section>

      <section className="muji-card border-[#24483a]/25">
        <div className="muji-section-title">
          <Wheat size={18} />
          <span>生產狀態總覽</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Food Production Score" value={summary.score} detail={summary.scoreTitle} />
          <Metric label="生產項目" value={summary.total} detail={`生長中 ${summary.growingCount}／可採收 ${summary.harvestableCount}`} />
          <Metric label="採收摘要" value={summary.harvestSummary} detail={`本月採收 ${summary.monthHarvestCount} 項`} />
          <Metric label="最高缺口" value={summary.highestGap} detail={`30 天內可採收 ${summary.harvestSoonCount} 項`} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SmallMetric label="已採收" value={`${summary.harvestedCount} 項`} />
          <SmallMetric label="失敗" value={`${summary.failedCount} 項`} />
          <SmallMetric label="可留種" value={`${summary.seedSavingCount} 項`} />
          <SmallMetric label="空間分布" value={summary.spaceSummary} />
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Plus size={18} />
          <span>新增生產項目</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="作物名稱" value={form.name} onChange={(value) => updateField('name', value)} placeholder="例如：九層塔" />
            <Input label="種植位置" value={form.location} onChange={(value) => updateField('location', value)} placeholder="例如：廚房窗邊" />
            <Select label="作物類型" value={form.cropType} onChange={(value) => updateField('cropType', value)} options={cropTypeLabels} />
            <Select label="種植空間" value={form.growingSpace} onChange={(value) => updateField('growingSpace', value)} options={growingSpaceLabels} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="種植日期" type="date" value={form.plantedAt} onChange={(value) => updateField('plantedAt', value)} />
            <Input label="播種日期" type="date" value={form.seedDate} onChange={(value) => updateField('seedDate', value)} />
            <Input label="移植日期" type="date" value={form.transplantDate} onChange={(value) => updateField('transplantDate', value)} />
            <Input label="預估採收日期" type="date" value={form.expectedHarvestDate} onChange={(value) => updateField('expectedHarvestDate', value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="日照條件" value={form.sunlight} onChange={(value) => updateField('sunlight', value)} options={Object.fromEntries(sunlightOptions.map((option) => [option, option]))} />
            <Select label="難度" value={form.difficulty} onChange={(value) => updateField('difficulty', value)} options={difficultyLabels} />
            <Select label="狀態" value={form.status} onChange={(value) => updateField('status', value)} options={statusLabels} />
            <Select label="採收單位" value={form.harvestUnit} onChange={(value) => updateField('harvestUnit', value)} options={harvestUnitLabels} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="最近採收日期" type="date" value={form.lastHarvestDate} onChange={(value) => updateField('lastHarvestDate', value)} />
            <Input label="累計採收量" type="number" value={form.harvestAmount} onChange={(value) => updateField('harvestAmount', value)} placeholder="0" />
            <label className="flex items-center gap-3 rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-sm font-bold text-soil">
              <input type="checkbox" checked={form.seedSaving} onChange={(event) => updateField('seedSaving', event.target.checked)} />
              是否可留種
            </label>
          </div>

          <fieldset className="rounded-2xl border border-soil/15 bg-white/55 p-4">
            <legend className="px-2 text-sm font-black text-soil">可食部位</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(ediblePartLabels).map(([part, label]) => (
                <label key={part} className="inline-flex items-center gap-2 rounded-full bg-[#eee5d6] px-3 py-2 text-sm font-black text-[#3d5143]">
                  <input type="checkbox" checked={form.edibleParts.includes(part)} onChange={() => toggleEdiblePart(part)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-1 text-sm font-bold text-soil">
            備註
            <textarea
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="例如：土乾再澆，先觀察葉片狀態；每週記錄一次生長與採收。"
              rows="3"
              className="resize-none rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            />
          </label>

          <button type="submit" className="btn-primary w-full justify-self-start sm:w-auto">
            新增作物
          </button>
        </form>
      </section>

      <section className="muji-card">
        <div className="flex flex-wrap gap-2">
          {filters.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={filter === id ? 'btn-primary' : 'btn-secondary'}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {plants.length === 0 ? (
          <div className="muji-note">
            <Leaf size={18} />
            <div>
              <strong>目前沒有符合條件的食物生產紀錄</strong>
              <p>先建立一個低門檻作物，例如蔥、九層塔、薄荷、地瓜葉或芽菜，再開始記錄採收與留種能力。</p>
            </div>
          </div>
        ) : (
          plants.map((plant) => (
            <article key={plant.id} className="muji-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-black ${statusBadgeClass(plant.status)}`}>{statusLabels[plant.status]}</span>
                    {isHarvestSoon(plant) && <span className="badge">30 天內可採收</span>}
                    {plant.seedSaving && <span className="badge">可留種</span>}
                    {plant.status === 'failed' && <span className="badge">已失敗</span>}
                    <h2 className="break-words text-xl font-black text-bark">{plant.name}</h2>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm font-bold text-soil/75 sm:grid-cols-2 lg:grid-cols-3">
                    <Info icon={Sprout} text={`${cropTypeLabels[plant.cropType]}｜${growingSpaceLabels[plant.growingSpace]}`} />
                    <Info icon={Leaf} text={plant.location || '未填位置'} />
                    <Info icon={CalendarDays} text={`種植 ${plant.plantedAt || '未填'}`} />
                    <Info icon={CalendarDays} text={`播種 ${plant.seedDate || '未填'}`} />
                    <Info icon={CalendarDays} text={`預估採收 ${plant.expectedHarvestDate || '未填'}`} />
                    <Info icon={CalendarDays} text={`最近採收 ${plant.lastHarvestDate || '未記錄'}`} />
                    <Info icon={Droplets} text={wateringText(plant.lastWateredAt)} />
                    <Info icon={Wheat} text={`採收 ${plant.harvestAmount > 0 ? `${formatNumber(plant.harvestAmount)}${harvestUnitLabels[plant.harvestUnit]}` : '尚無'}`} />
                    <Info icon={Leaf} text={`難度 ${difficultyLabels[plant.difficulty]}｜日照 ${plant.sunlight}`} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(plant.edibleParts.length ? plant.edibleParts : ['leaf']).map((part) => (
                      <span key={part} className="badge">可食：{ediblePartLabels[part] || part}</span>
                    ))}
                  </div>

                  {plant.note && <p className="mt-3 break-words text-sm leading-7 text-soil/70">{plant.note}</p>}
                  {plant.failureReason && <p className="mt-3 break-words text-sm font-bold leading-7 text-[#8b2f25]">失敗原因：{plant.failureReason}</p>}

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-soil/15 bg-white/60 p-3">
                      <p className="text-sm font-black text-bark">記錄採收</p>
                      <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={harvestForms[plant.id]?.amount || ''}
                          onChange={(event) => setHarvestForms({ ...harvestForms, [plant.id]: { amount: event.target.value, unit: harvestForms[plant.id]?.unit || plant.harvestUnit } })}
                          placeholder="數量"
                          className="min-w-0 rounded-2xl border border-soil/15 bg-white/75 px-3 py-2 text-base font-semibold text-bark outline-none"
                        />
                        <select
                          value={harvestForms[plant.id]?.unit || plant.harvestUnit}
                          onChange={(event) => setHarvestForms({ ...harvestForms, [plant.id]: { amount: harvestForms[plant.id]?.amount || '', unit: event.target.value } })}
                          className="rounded-2xl border border-soil/15 bg-white/75 px-3 py-2 text-base font-semibold text-bark outline-none"
                        >
                          {harvestUnits.map((unit) => <option key={unit} value={unit}>{harvestUnitLabels[unit]}</option>)}
                        </select>
                        <button type="button" className="btn-secondary" onClick={() => recordHarvest(plant)}>記錄</button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-soil/15 bg-white/60 p-3">
                      <p className="text-sm font-black text-bark">標記失敗</p>
                      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                        <input
                          value={failureForms[plant.id] || ''}
                          onChange={(event) => setFailureForms({ ...failureForms, [plant.id]: event.target.value })}
                          placeholder="原因"
                          className="min-w-0 rounded-2xl border border-soil/15 bg-white/75 px-3 py-2 text-base font-semibold text-bark outline-none"
                        />
                        <button type="button" className="btn-secondary" onClick={() => markFailed(plant)}>標記</button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={() => waterPlant(plant.id)} className="btn-secondary inline-flex items-center justify-center gap-2">
                      <Droplets size={16} />
                      今天已澆水
                    </button>
                    {plant.lastWateredAt && <span className="inline-flex items-center text-sm font-bold text-soil/60">上次澆水：{plant.lastWateredAt}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deletePlant(plant.id)}
                  className="shrink-0 rounded-2xl border border-soil/15 bg-white/70 p-3 text-soil/70 transition hover:text-red-800"
                  aria-label={`刪除 ${plant.name}`}
                  title="刪除作物"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <p className="summary-meta font-black">{label}</p>
      <p className="summary-value mt-2 break-words">{value}</p>
      <p className="summary-text mt-2">{detail}</p>
    </div>
  )
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-soil/15 bg-white/55 p-3">
      <p className="text-sm font-black text-soil/60">{label}</p>
      <p className="mt-1 break-words text-base font-black text-bark">{value}</p>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
      />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
      >
        {Object.entries(options).map(([id, labelText]) => <option key={id} value={id}>{labelText}</option>)}
      </select>
    </label>
  )
}

function Info({ icon: Icon, text }) {
  return (
    <p className="flex items-center gap-2">
      <Icon size={16} className="shrink-0" />
      <span className="break-words">{text}</span>
    </p>
  )
}
