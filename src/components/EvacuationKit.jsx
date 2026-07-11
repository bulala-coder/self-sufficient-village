import React, { useMemo, useState } from 'react'
import { AlertTriangle, Backpack, CalendarClock, CheckCircle2, Circle, Clipboard, Printer, ShieldAlert, Star } from 'lucide-react'

export const KIT_CATEGORIES = [
  {
    id: 'survival',
    label: '生存基本',
    items: [
      ['survival-water', '飲用水'],
      ['survival-shelf-food', '免冷藏食物'],
      ['survival-bars', '能量棒／乾糧'],
      ['survival-tableware', '個人餐具'],
      ['survival-can-opener', '開罐器'],
      ['survival-filter', '簡易淨水器或淨水錠']
    ]
  },
  {
    id: 'medical',
    label: '醫療急救',
    items: [
      ['medical-daily-meds', '個人常用藥'],
      ['medical-chronic-meds', '慢性病用藥'],
      ['medical-prescription-copy', '處方箋影本'],
      ['medical-bandage-small', 'OK 繃'],
      ['medical-gauze', '紗布'],
      ['medical-elastic-bandage', '彈性繃帶'],
      ['medical-disinfectant', '消毒用品'],
      ['medical-bleeding-control', '止血用品'],
      ['medical-info-card', '醫療資訊卡']
    ]
  },
  {
    id: 'comms',
    label: '通訊照明',
    items: [
      ['comms-phone-cable', '手機充電線'],
      ['comms-power-bank', '行動電源'],
      ['comms-light', '手電筒或頭燈'],
      ['comms-battery', '備用電池'],
      ['comms-radio', '小型收音機'],
      ['comms-whistle', '哨子'],
      ['comms-paper-contacts', '紙本緊急聯絡人'],
      ['comms-paper-map', '紙本地圖'],
      ['comms-waterproof-notebook', '防水筆記本與筆']
    ]
  },
  {
    id: 'documents',
    label: '文件金錢',
    items: [
      ['documents-id-copy', '身分證影本'],
      ['documents-health-card-copy', '健保卡影本'],
      ['documents-important-copy', '重要證件影本'],
      ['documents-insurance-copy', '保險或存摺資料影本'],
      ['documents-cash', '少量現金'],
      ['documents-spare-key', '備用鑰匙'],
      ['documents-backup', '重要資料 USB 或紙本備份'],
      ['documents-waterproof-bag', '防水袋']
    ]
  },
  {
    id: 'protection',
    label: '防護保暖',
    items: [
      ['protection-raincoat', '雨衣'],
      ['protection-jacket', '保暖外套'],
      ['protection-gloves', '手套'],
      ['protection-mask', '口罩'],
      ['protection-hat', '帽子'],
      ['protection-socks', '備用襪子'],
      ['protection-shoes', '輕便鞋或備用鞋'],
      ['protection-blanket', '急救毯／保溫毯']
    ]
  },
  {
    id: 'tools',
    label: '工具衛生',
    items: [
      ['tools-multitool', '多功能工具'],
      ['tools-tape', '膠帶'],
      ['tools-rope', '繩子'],
      ['tools-lighter', '打火機'],
      ['tools-trash-bag', '垃圾袋'],
      ['tools-toilet-paper', '衛生紙'],
      ['tools-wipes', '濕紙巾'],
      ['tools-alcohol-pad', '酒精棉片'],
      ['tools-period-products', '女性生理用品'],
      ['tools-toiletries', '簡易盥洗用品']
    ]
  },
  {
    id: 'animal',
    label: '動物撤離',
    items: [
      ['animal-food-3d', '3 天飼料'],
      ['animal-water', '飲水'],
      ['animal-bowl', '摺疊碗'],
      ['animal-leash', '牽繩／胸背'],
      ['animal-carrier', '外出籠'],
      ['animal-pad-litter', '尿布墊／貓砂少量'],
      ['animal-meds', '常用藥'],
      ['animal-medical-summary', '病歷摘要'],
      ['animal-vaccine-record', '疫苗紀錄'],
      ['animal-vet-contact', '獸醫院聯絡方式'],
      ['animal-photo', '動物照片'],
      ['animal-blanket', '熟悉氣味的小毯子']
    ]
  }
]

const categoryFilters = [['all', '全部'], ...KIT_CATEGORIES.map((category) => [category.id, category.label])]
const allKitItems = KIT_CATEGORIES.flatMap((category) => category.items.map(([id, label]) => ({ id, label, categoryId: category.id, categoryLabel: category.label })))

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

function getItemState(kit, itemId) {
  return kit.items?.[itemId] || {}
}

function isPrepared(kit, itemId) {
  return Boolean(getItemState(kit, itemId).prepared)
}

function expiryStatus(itemState = {}) {
  const expiryDays = daysUntil(itemState.expiresAt)
  if (expiryDays === null) return null
  if (expiryDays < 0) return 'expired'
  if (expiryDays <= 30) return 'soon'
  return null
}

export function getBurdenStatus(userWeight, bagWeight) {
  const user = numberValue(userWeight)
  const bag = numberValue(bagWeight)
  const ratio = user > 0 ? (bag / user) * 100 : 0
  let label = '未計算'
  if (user > 0 && bag > 0) {
    if (ratio < 10) label = '良好'
    else if (ratio < 15) label = '可接受'
    else if (ratio < 20) label = '偏重'
    else label = '危險'
  }

  return { ratio, label }
}

function formatPercent(value) {
  return `${Math.round(value)}%`
}

function formatRatio(value) {
  return value > 0 ? `${Number(value.toFixed(1)).toString()}%` : '未計算'
}

function getHighestKitGap(kit, summary) {
  if (summary.burden.ratio >= 20) return '撤離包過重：立即減重或分包'
  if (!isPrepared(kit, 'survival-water')) return '飲水缺口：撤離包至少要有最低飲水'
  if (!isPrepared(kit, 'medical-daily-meds') || !isPrepared(kit, 'medical-chronic-meds')) return '醫療缺口：常用藥與慢性病用藥優先'
  if (!isPrepared(kit, 'comms-paper-contacts')) return '通訊缺口：建立紙本緊急聯絡人'
  if (!isPrepared(kit, 'documents-id-copy') || !isPrepared(kit, 'documents-health-card-copy')) return '文件缺口：補齊基本證件影本'
  if (kit.hasAnimals && !isPrepared(kit, 'animal-carrier')) return '動物撤離缺口：外出籠優先'
  if (summary.expiredCount > 0) return '有已過期物資：立即替換'
  if (summary.expiringSoonCount > 0) return '有即期物資：安排輪替'
  return '撤離包目前沒有重大缺口'
}

export function getEvacuationKitSummary(evacuationKit = {}) {
  const kit = { items: {}, targetDays: '3', ...evacuationKit }
  const totalItems = allKitItems.length
  let preparedCount = 0
  let highPriorityGapCount = 0
  let expiringSoonCount = 0
  let expiredCount = 0

  const categories = KIT_CATEGORIES.map((category) => {
    let categoryPrepared = 0
    let categoryExpiring = 0
    let categoryExpired = 0

    category.items.forEach(([itemId]) => {
      const itemState = getItemState(kit, itemId)
      const prepared = Boolean(itemState.prepared)
      const status = expiryStatus(itemState)

      if (prepared) {
        preparedCount += 1
        categoryPrepared += 1
      }
      if (itemState.highPriority && !prepared) highPriorityGapCount += 1
      if (status === 'soon') {
        expiringSoonCount += 1
        categoryExpiring += 1
      }
      if (status === 'expired') {
        expiredCount += 1
        categoryExpired += 1
      }
    })

    return {
      id: category.id,
      label: category.label,
      total: category.items.length,
      prepared: categoryPrepared,
      percent: category.items.length ? Math.round((categoryPrepared / category.items.length) * 100) : 0,
      expiringSoonCount: categoryExpiring,
      expiredCount: categoryExpired
    }
  })

  const burden = getBurdenStatus(kit.userWeight, kit.bagWeight)
  const summary = {
    totalItems,
    preparedCount,
    percent: totalItems ? Math.round((preparedCount / totalItems) * 100) : 0,
    highPriorityGapCount,
    expiringSoonCount,
    expiredCount,
    burden,
    categories
  }

  return { ...summary, highestGap: getHighestKitGap(kit, summary) }
}

function badgeClass(status) {
  if (status === 'prepared') return 'bg-[#24483a] text-[#fff9ea]'
  if (status === 'expired') return 'bg-[#8b2f25] text-[#fff9ea]'
  if (status === 'soon' || status === 'priority') return 'bg-[#c2a25c] text-[#241b10]'
  return ''
}

function buildTextChecklist(kit, summary) {
  const missingByCategory = KIT_CATEGORIES.map((category) => {
    const missing = category.items.filter(([itemId]) => !isPrepared(kit, itemId)).map(([, label]) => label)
    return `${category.label}：${missing.join('、') || '無'}`
  })
  const datedItems = allKitItems.filter((item) => {
    const status = expiryStatus(getItemState(kit, item.id))
    return status === 'soon' || status === 'expired'
  }).map((item) => {
    const state = getItemState(kit, item.id)
    const status = expiryStatus(state) === 'expired' ? '已過期' : '30 天內到期'
    return `${item.categoryLabel}｜${item.label}｜${status}｜${state.expiresAt}`
  })

  return [
    'Fortress OS｜自足堡壘 撤離包清單',
    `目標天數：${kit.targetDays || 3} 天`,
    `使用者體重：${kit.userWeight || '未填'} kg`,
    `撤離包重量：${kit.bagWeight || '未填'} kg`,
    `負重比例：${formatRatio(summary.burden.ratio)}｜${summary.burden.label}`,
    `總完成率：${formatPercent(summary.percent)}（${summary.preparedCount}/${summary.totalItems}）`,
    `最高缺口：${summary.highestGap}`,
    '',
    '各分類未準備項目',
    ...missingByCategory,
    '',
    '即期與過期項目',
    ...(datedItems.length ? datedItems : ['無'])
  ].join('\n')
}

export default function EvacuationKit({ state, updateEvacuationKit }) {
  const [filter, setFilter] = useState('all')
  const [copyStatus, setCopyStatus] = useState('')
  const kit = { items: {}, targetDays: '3', ...(state.evacuationKit || {}) }
  const summary = getEvacuationKitSummary(kit)
  const visibleCategories = filter === 'all' ? KIT_CATEGORIES : KIT_CATEGORIES.filter((category) => category.id === filter)
  const textChecklist = useMemo(() => buildTextChecklist(kit, summary), [kit, summary])

  function updateKit(values) {
    updateEvacuationKit({ ...kit, ...values })
  }

  function updateItem(itemId, values) {
    updateKit({
      items: {
        ...(kit.items || {}),
        [itemId]: { ...getItemState(kit, itemId), ...values }
      }
    })
  }

  async function copyChecklist() {
    try {
      await navigator.clipboard.writeText(textChecklist)
      setCopyStatus('已複製')
    } catch {
      setCopyStatus('複製失敗')
    }
  }

  return (
    <div className="evacuation-kit-page space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Evacuation Kit v3.4</p>
        <h1 className="text-2xl font-black text-bark">撤離包</h1>
        <p className="mt-2 leading-7 text-soil/70">
          管理人用、動物用、醫療、文件、通訊與防護物資，確認能拿了就走。
        </p>

        <div className="evacuation-actions mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-primary inline-flex items-center justify-center gap-2" onClick={copyChecklist}>
            <Clipboard size={16} />
            複製撤離包清單
          </button>
          <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => window.print()}>
            <Printer size={16} />
            列印撤離包清單
          </button>
        </div>
        {copyStatus && <p className="evacuation-actions mt-3 text-sm font-black text-[#24483a]">{copyStatus}</p>}
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Backpack size={18} />
          <span>撤離包總覽</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryMetric label="總完成率" value={formatPercent(summary.percent)} />
          <SummaryMetric label="已準備" value={`${summary.preparedCount}/${summary.totalItems}`} />
          <SummaryMetric label="高優先缺口" value={`${summary.highPriorityGapCount} 項`} />
          <SummaryMetric label="即期／過期" value={`${summary.expiringSoonCount}/${summary.expiredCount}`} />
          <SummaryMetric label="負重比例" value={formatRatio(summary.burden.ratio)} />
          <SummaryMetric label="負重判定" value={summary.burden.label} />
        </div>

        <div className="mt-4 rounded-2xl border border-soil/15 bg-white/65 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-1 shrink-0 text-[#8b2f25]" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-soil/55">最高撤離包缺口</p>
              <p className="mt-1 font-black text-bark leading-7">{summary.highestGap}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <ShieldAlert size={18} />
          <span>撤離包基本資料</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NumberField label="使用者體重，kg" value={kit.userWeight || ''} onChange={(value) => updateKit({ userWeight: value })} />
          <NumberField label="撤離包重量，kg" value={kit.bagWeight || ''} onChange={(value) => updateKit({ bagWeight: value })} />
          <SelectField label="目標天數" value={String(kit.targetDays || '3')} onChange={(value) => updateKit({ targetDays: value })} />
          <CheckField label="需要攜帶動物" checked={Boolean(kit.hasAnimals)} onChange={(checked) => updateKit({ hasAnimals: checked })} />
          <CheckField label="需要攜帶小孩或大型物品" checked={Boolean(kit.hasChildren)} onChange={(checked) => updateKit({ hasChildren: checked })} />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-soil/50">負重判定</p>
            <p className="mt-2 text-xl font-black text-bark">{formatRatio(summary.burden.ratio)}｜{summary.burden.label}</p>
          </div>
          <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
            <p className="font-black text-bark">行動提醒</p>
            <p className="mt-2 text-sm leading-7 text-soil/75">
              {kit.hasAnimals ? '動物重量、外出籠與機動性要另外評估。' : '若需要動物撤離，請先啟用動物條件。'}
              {kit.hasChildren ? ' 不應只看背包重量，還要考慮抱小孩或大型物品。' : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Backpack size={18} />
          <span>分類篩選</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {categoryFilters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${
                filter === value
                  ? 'border-[#24483a] bg-[#24483a] text-[#fff9ea]'
                  : 'border-soil/15 bg-white/70 text-soil/75 hover:bg-[#fbf7ec]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {visibleCategories.map((category) => {
          const categorySummary = summary.categories.find((item) => item.id === category.id)

          return (
            <article key={category.id} className="muji-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2>{category.label}</h2>
                  <p className="mt-2 text-sm font-bold text-soil/70">
                    {categorySummary.percent}%｜{categorySummary.prepared}/{categorySummary.total} 已準備｜即期 {categorySummary.expiringSoonCount}｜過期 {categorySummary.expiredCount}
                  </p>
                </div>
                <span className="badge">{categorySummary.percent}%</span>
              </div>

              <div className="mt-4 space-y-3">
                {category.items.map(([itemId, label]) => (
                  <KitItem
                    key={itemId}
                    label={label}
                    itemState={getItemState(kit, itemId)}
                    onChange={(values) => updateItem(itemId, values)}
                  />
                ))}
              </div>
            </article>
          )
        })}
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

function NumberField({ label, value, onChange }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <input
        type="number"
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
      />
    </label>
  )
}

function SelectField({ label, value, onChange }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]">
        {['1', '2', '3', '7'].map((days) => <option key={days} value={days}>{days} 天</option>)}
      </select>
    </label>
  )
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-soil/15 bg-white/65 px-4 py-3 text-sm font-bold text-soil">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#24483a]" />
      <span>{label}</span>
    </label>
  )
}

function KitItem({ label, itemState, onChange }) {
  const prepared = Boolean(itemState.prepared)
  const highPriority = Boolean(itemState.highPriority)
  const status = expiryStatus(itemState)

  return (
    <div className="rounded-2xl border border-soil/15 bg-white/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => onChange({ prepared: !prepared })}>
          {prepared ? <CheckCircle2 size={20} className="mt-1 shrink-0 text-[#24483a]" /> : <Circle size={20} className="mt-1 shrink-0 text-soil/35" />}
          <span>
            <span className="block font-black text-bark">{label}</span>
            <span className="mt-2 flex flex-wrap gap-2">
              <span className={`badge ${badgeClass(prepared ? 'prepared' : 'gap')}`}>{prepared ? '已準備' : '缺口'}</span>
              {highPriority && <span className={`badge ${badgeClass('priority')}`}>高優先</span>}
              {status === 'soon' && <span className={`badge ${badgeClass('soon')}`}>30 天內到期</span>}
              {status === 'expired' && <span className={`badge ${badgeClass('expired')}`}>已過期</span>}
            </span>
          </span>
        </button>

        <button type="button" className={`rounded-2xl border border-soil/15 p-3 ${highPriority ? 'bg-[#c2a25c] text-[#241b10]' : 'bg-white/70 text-soil/70'}`} onClick={() => onChange({ highPriority: !highPriority })} title="標記高優先">
          <Star size={17} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-soil">
          保存期限
          <input
            type="date"
            value={itemState.expiresAt || ''}
            onChange={(event) => onChange({ expiresAt: event.target.value })}
            className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-soil">
          備註
          <input
            value={itemState.note || ''}
            onChange={(event) => onChange({ note: event.target.value })}
            placeholder="位置、數量、替換提醒"
            className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
          />
        </label>
      </div>
      {itemState.expiresAt && (
        <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-soil/70">
          <CalendarClock size={14} />
          保存期限：{itemState.expiresAt}
        </p>
      )}
    </div>
  )
}
