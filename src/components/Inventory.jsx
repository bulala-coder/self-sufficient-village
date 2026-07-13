import React, { useState } from 'react'
import { AlertTriangle, CalendarClock, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { inventoryWaterCategories, inventoryWaterStorageTypes, normalizeInventoryWaterItem } from '../utils/inventoryWaterLink.js'

const categories = ['飲水', '食物', '照明', '醫療', '動物', '工具', '種植', '其他']

const typeOptions = [
  ['water', '飲水'],
  ['food', '食物'],
  ['medical', '醫療'],
  ['power', '電力'],
  ['animal', '動物'],
  ['tool', '工具'],
  ['hygiene', '衛生'],
  ['other', '其他']
]

const priorityOptions = [
  ['high', '高'],
  ['medium', '中'],
  ['low', '低']
]

const typeLabels = Object.fromEntries(typeOptions)
const priorityLabels = Object.fromEntries(priorityOptions)
const waterCategoryLabels = { drinking: '飲用水', cooking: '煮食用水', utility: '生活用水', rainwater: '雨水', emergency: '緊急備用水', animal: '動物用水', other: '其他' }
const waterStorageLabels = { bottled: '瓶裝', container: '桶裝', tank: '水塔或水箱', dispenser: '飲水機', bathtub: '浴缸儲水', rainBarrel: '雨水桶', other: '其他' }

const typeHints = {
  water: '飲水類請填「飲水公升數」，用來估算最低 72 小時飲水線。',
  food: '食物類請填「成人食物份數」，並標記是否免冷藏。',
  animal: '動物類請填「動物補給天數」，避免低估飼料與飲水。',
  medical: '醫療類請填保存期限與重要程度，便於輪替常備藥與耗材。'
}

const initialForm = {
  name: '',
  category: '飲水',
  quantity: '',
  unit: '',
  note: '',
  type: 'water',
  expiresAt: '',
  shelfStable: false,
  servings: '',
  liters: '',
  animalDays: '',
  priority: 'medium', isWaterResource: false,
  waterMeta: { volumeLitersPerUnit: '', potable: true, requiresTreatment: false, waterCategory: 'drinking', storageType: 'bottled' }
}

function inferType(category = '') {
  const text = String(category)
  if (text.includes('飲水') || text.includes('水')) return 'water'
  if (text.includes('食物')) return 'food'
  if (text.includes('醫療')) return 'medical'
  if (text.includes('照明') || text.includes('電力')) return 'power'
  if (text.includes('動物')) return 'animal'
  if (text.includes('工具')) return 'tool'
  return 'other'
}

function numberValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function todayDate() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
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

export function normalizeInventoryItem(item = {}) {
  const type = typeLabels[item.type] ? item.type : inferType(item.category)
  const priority = priorityLabels[item.priority] ? item.priority : 'medium'

  return {
    ...item,
    name: item.name || '未命名物資',
    category: item.category || typeLabels[type] || '其他',
    quantity: item.quantity || '',
    unit: item.unit || '',
    note: item.note || '',
    type,
    expiresAt: item.expiresAt || '',
    shelfStable: item.shelfStable === true || item.shelfStable === 'true',
    servings: item.servings ?? '',
    liters: item.liters ?? '',
    animalDays: item.animalDays ?? '',
    priority,
    isWaterResource: item.isWaterResource === true,
    waterMeta: { ...initialForm.waterMeta, ...(item.waterMeta || {}) }
  }
}

export function getInventorySummary(items = []) {
  const normalizedItems = items.map(normalizeInventoryItem)

  return normalizedItems.reduce((summary, item) => {
    const expiryDays = daysUntil(item.expiresAt)

    if (item.type === 'water') summary.waterLiters += numberValue(item.liters)
    if (item.type === 'food') summary.foodServings += numberValue(item.servings)
    if (item.type === 'food' && item.shelfStable) summary.shelfStableServings += numberValue(item.servings)
    if (item.type === 'animal') summary.animalDays += numberValue(item.animalDays)
    if (item.priority === 'high') summary.highPriorityCount += 1
    if (item.type === 'animal' || String(item.category).includes('動物')) summary.hasAnimalDemand = true
    if (expiryDays !== null && expiryDays < 0) summary.expiredCount += 1
    if (expiryDays !== null && expiryDays >= 0 && expiryDays <= 30) summary.expiringSoonCount += 1

    return summary
  }, {
    waterLiters: 0,
    foodServings: 0,
    shelfStableServings: 0,
    animalDays: 0,
    highPriorityCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    hasAnimalDemand: false
  })
}

export function getFoodRotationList(items = []) {
  return items
    .map(normalizeInventoryItem)
    .filter((item) => item.type === 'food' && item.expiresAt && parseDate(item.expiresAt))
    .sort((a, b) => parseDate(a.expiresAt).getTime() - parseDate(b.expiresAt).getTime())
}

function formatNumber(value) {
  return Number(value.toFixed(1)).toString()
}

function expiryStatus(item) {
  const expiryDays = daysUntil(item.expiresAt)
  if (expiryDays === null) return null
  if (expiryDays < 0) return 'expired'
  if (expiryDays <= 30) return 'soon'
  return null
}

function getSupplyGap(summary) {
  if (summary.waterLiters < 9) return '飲水不足：至少先建立 72 小時最低飲水'
  if (summary.shelfStableServings < 9) return '免冷藏食物不足：至少準備 72 小時可直接食用食物'
  if (summary.hasAnimalDemand && summary.animalDays < 3) return '動物補給不足：至少準備 3 天飼料與飲水'
  if (summary.expiredCount > 0) return '有已過期物資：立即檢查與替換'
  if (summary.expiringSoonCount > 0) return '有即期物資：安排輪替'
  if (summary.highPriorityCount === 0) return '尚未標記高優先物資'
  return '目前沒有重大補給缺口'
}

export default function Inventory({ state, addInventoryItem, deleteInventoryItem, updateInventoryItem }) {
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const inventory = (state.inventory || []).map(normalizeInventoryItem)
  const summary = getInventorySummary(state.inventory || [])
  const supplyGap = getSupplyGap(summary)
  const foodRotationList = getFoodRotationList(state.inventory || []).slice(0, 5)

  function updateField(field, value) {
    setForm({ ...form, [field]: value })
  }
  function updateWaterMeta(field, value) { setForm({ ...form, waterMeta: { ...form.waterMeta, [field]: value } }) }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return

    const values = {
      name: form.name.trim(),
      category: form.category,
      quantity: form.quantity.trim(),
      unit: form.unit.trim(),
      note: form.note.trim(),
      type: form.type,
      expiresAt: form.expiresAt,
      shelfStable: form.shelfStable,
      servings: form.servings,
      liters: form.liters,
      animalDays: form.animalDays,
      priority: form.priority, isWaterResource: form.isWaterResource, waterMeta: { ...form.waterMeta }
    }
    if (editingId) updateInventoryItem(editingId, values)
    else addInventoryItem(values)
    setForm(initialForm)
    setEditingId(null)
  }

  function editItem(item) { setEditingId(item.id); setForm({ ...initialForm, ...item, waterMeta: { ...initialForm.waterMeta, ...(item.waterMeta || {}) } }); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">庫存管理｜v6.0 RC</p>
        <h1 className="text-2xl font-black text-bark">補給庫存系統</h1>
        <p className="text-soil/70 mt-2 leading-7">
          盤點飲水、免冷藏食物、醫療、電力與動物補給。庫存資料會用來判斷最低補給線、保存期限與替換優先序。
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eee5d6] px-4 py-2 text-sm font-bold text-[#3d5143]">
          <Package size={16} />
          <span>{inventory.length} 項物資</span>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Package size={18} />
          <span>補給狀態總覽</span>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryMetric label="飲水總量" value={`${formatNumber(summary.waterLiters)} L`} />
          <SummaryMetric label="成人食物" value={`${formatNumber(summary.foodServings)} 份`} />
          <SummaryMetric label="免冷藏食物" value={`${formatNumber(summary.shelfStableServings)} 份`} />
          <SummaryMetric label="動物補給" value={`${formatNumber(summary.animalDays)} 天`} />
          <SummaryMetric label="高優先物資" value={`${summary.highPriorityCount} 項`} />
          <SummaryMetric label="30 天內到期" value={`${summary.expiringSoonCount} 項`} />
          <SummaryMetric label="已過期" value={`${summary.expiredCount} 項`} />
        </div>

        <div className="mt-4 rounded-2xl border border-soil/15 bg-white/65 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-1 shrink-0 text-[#8b2f25]" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-soil/55">最高補給缺口</p>
              <p className="mt-1 font-black text-bark leading-7">{supplyGap}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <CalendarClock size={18} />
          <span>滾動式備糧提醒</span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {['優先選日常會吃的食物', '先到期先吃', '吃掉後補回', '免冷藏食物優先'].map((item) => (
            <div key={item} className="rounded-2xl border border-soil/15 bg-white/65 p-4">
              <p className="summary-text font-black text-bark">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-soil/15 bg-white/65 p-4">
          <p className="summary-meta font-black">輪替優先清單</p>
          {foodRotationList.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {foodRotationList.map((item) => (
                <div key={item.id || `${item.name}-${item.expiresAt}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f7f2e8] px-4 py-3">
                  <span className="font-black text-bark">{item.name}</span>
                  <span className="text-sm font-bold text-soil/75">{item.expiresAt}</span>
                  <span className="badge">{item.shelfStable ? '免冷藏' : '需確認保存條件'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 summary-text">尚未建立輪替資料。請在食物類物資填入保存期限，才能依先到期先吃排序。</p>
          )}
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Plus size={18} />
          <span>新增物資</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm font-bold text-soil">
            名稱
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例如：瓶裝水"
              className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-bold text-soil">
              物資類型
              <select
                value={form.type}
                onChange={(event) => updateField('type', event.target.value)}
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              >
                {typeOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              原類別
              <select
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          {typeHints[form.type] && (
            <div className="rounded-2xl border border-[#c2a25c]/35 bg-[#fbf7ec] px-4 py-3 text-sm font-bold leading-6 text-soil/75">
              {typeHints[form.type]}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm font-bold text-soil">
              數量
              <input
                value={form.quantity}
                onChange={(event) => updateField('quantity', event.target.value)}
                inputMode="decimal"
                placeholder="例如：12"
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              單位
              <input
                value={form.unit}
                onChange={(event) => updateField('unit', event.target.value)}
                placeholder="例如：瓶"
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              重要程度
              <select
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value)}
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              >
                {priorityOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="grid gap-1 text-sm font-bold text-soil">
              保存期限
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) => updateField('expiresAt', event.target.value)}
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              飲水公升數
              <input
                value={form.liters}
                onChange={(event) => updateField('liters', event.target.value)}
                inputMode="decimal"
                placeholder="例如：9"
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              成人食物份數
              <input
                value={form.servings}
                onChange={(event) => updateField('servings', event.target.value)}
                inputMode="decimal"
                placeholder="例如：9"
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              動物補給天數
              <input
                value={form.animalDays}
                onChange={(event) => updateField('animalDays', event.target.value)}
                inputMode="decimal"
                placeholder="例如：3"
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-soil/15 bg-white/65 px-4 py-3 text-sm font-bold text-soil">
            <input
              type="checkbox"
              checked={form.shelfStable}
              onChange={(event) => updateField('shelfStable', event.target.checked)}
              className="h-5 w-5 accent-[#24483a]"
            />
            <span>免冷藏，可直接食用或簡單加熱</span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-[#24483a]/25 bg-[#edf1e9] px-4 py-3 text-sm font-bold text-soil">
            <input type="checkbox" checked={form.isWaterResource} onChange={(event) => updateField('isWaterResource', event.target.checked)} className="h-5 w-5 accent-[#24483a]" />
            <span>納入水資源系統</span>
          </label>

          {form.isWaterResource && <div className="grid gap-3 rounded-2xl border border-soil/15 bg-white/55 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm font-bold">每單位容量（L）<input type="number" min="0" step="0.1" value={form.waterMeta.volumeLitersPerUnit} onChange={(e) => updateWaterMeta('volumeLitersPerUnit', e.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">水類型<select value={form.waterMeta.waterCategory} onChange={(e) => updateWaterMeta('waterCategory', e.target.value)}>{inventoryWaterCategories.map((value) => <option key={value} value={value}>{waterCategoryLabels[value]}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-bold">儲存方式<select value={form.waterMeta.storageType} onChange={(e) => updateWaterMeta('storageType', e.target.value)}>{inventoryWaterStorageTypes.map((value) => <option key={value} value={value}>{waterStorageLabels[value]}</option>)}</select></label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.waterMeta.potable} onChange={(e) => updateWaterMeta('potable', e.target.checked)}/>可直接飲用</label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.waterMeta.requiresTreatment} onChange={(e) => updateWaterMeta('requiresTreatment', e.target.checked)}/>需要淨水處理</label>
          </div>}

          <label className="grid gap-1 text-sm font-bold text-soil">
            備註
            <textarea
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="例如：放在廚房下層櫃，月底檢查效期"
              rows="3"
              className="resize-none rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            />
          </label>

          <div className="flex gap-2"><button type="submit" className="btn-primary w-full sm:w-auto">{editingId ? '儲存修改' : '新增物資'}</button>{editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(initialForm) }}>取消編輯</button>}</div>
        </form>
      </section>

      <section className="space-y-3">
        {inventory.length === 0 ? (
          <div className="muji-note">
            <Package size={18} />
            <div>
              <strong>目前沒有物資紀錄</strong>
              <p>先建立水、免冷藏食物、照明、急救與動物補給的最低線。</p>
            </div>
          </div>
        ) : (
          inventory.map((item) => (
            <InventoryCard key={item.id || `${item.name}-${item.category}`} item={item} onDelete={deleteInventoryItem} onEdit={editItem} />
          ))
        )}
      </section>
    </div>
  )
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-soil/50">{label}</p>
      <p className="mt-2 text-xl font-black text-bark">{value}</p>
    </div>
  )
}

function InventoryCard({ item, onDelete, onEdit }) {
  const status = expiryStatus(item)
  const water = item.isWaterResource ? normalizeInventoryWaterItem(item) : null
  const quantityText = [item.quantity, item.unit].filter(Boolean).join(' ') || '未填數量'

  return (
    <article className="muji-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">{typeLabels[item.type]}</span>
            <h2 className="font-black text-xl text-bark break-words">{item.name}</h2>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {status === 'expired' && <span className="badge bg-[#8b2f25] text-[#fff9ea]">已過期</span>}
            {status === 'soon' && <span className="badge bg-[#c2a25c] text-[#241b10]">30 天內到期</span>}
            {item.priority === 'high' && <span className="badge bg-[#24483a] text-[#fff9ea]">高優先</span>}
            {item.shelfStable && <span className="badge">免冷藏</span>}
            {water && <span className="badge bg-[#24483a] text-[#fff9ea]">水資源</span>}
          </div>

          <div className="mt-3 grid gap-1 text-sm font-bold text-soil/80">
            <p>數量：{quantityText}</p>
            {numberValue(item.liters) > 0 && <p>飲水：{formatNumber(numberValue(item.liters))} L</p>}
            {numberValue(item.servings) > 0 && <p>成人食物：{formatNumber(numberValue(item.servings))} 份</p>}
            {numberValue(item.animalDays) > 0 && <p>動物補給：{formatNumber(numberValue(item.animalDays))} 天</p>}
            {item.expiresAt && (
              <p className="inline-flex items-center gap-1">
                <CalendarClock size={14} />
                保存期限：{item.expiresAt}
              </p>
            )}
            <p>重要程度：{priorityLabels[item.priority]}</p>
            {water && <><p>總水量：{formatNumber(water.volumeLiters)} L</p><p>{water.isIncomplete ? '需補齊每單位容量' : water.potable ? '可飲用' : water.requiresTreatment ? '需處理' : '生活用水'}</p></>}
          </div>

          {item.note && (
            <p className="mt-3 text-sm leading-7 text-soil/70 break-words">{item.note}</p>
          )}
        </div>

        <div className="flex gap-1"><button type="button" onClick={() => onEdit(item)} className="shrink-0 rounded-2xl border border-soil/15 bg-white/70 p-3" aria-label={`編輯 ${item.name}`}><Pencil size={18}/></button><button
          type="button"
          onClick={() => onDelete(item.id)}
          className="shrink-0 rounded-2xl border border-soil/15 bg-white/70 p-3 text-soil/70 transition hover:text-red-800"
          aria-label={`刪除 ${item.name}`}
          title="刪除物資"
        >
          <Trash2 size={18} />
        </button></div>
      </div>
    </article>
  )
}
