import React from 'react'
import { AlertTriangle, BatteryCharging, Calculator, PackageCheck, Scale, Utensils } from 'lucide-react'

function numberValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return '0'
  return value.toFixed(digits).replace(/\.0$/, '')
}

function riskForDays(days) {
  if (days < 1) return '危險'
  if (days < 3) return '不足'
  if (days < 7) return '基本'
  return '良好'
}

function riskForPower(days) {
  if (days < 0.5) return '危險'
  if (days < 1) return '不足'
  if (days < 3) return '基本'
  return '良好'
}

function riskForLoad(percent) {
  if (percent < 10) return '良好'
  if (percent < 15) return '可接受'
  if (percent < 20) return '偏重'
  return '危險'
}

function riskClass(risk) {
  if (risk === '良好') return 'bg-[#24483a] text-[#fff9ea]'
  if (risk === '基本' || risk === '可接受') return 'bg-[#c2a25c] text-[#241b10]'
  if (risk === '不足' || risk === '偏重') return 'bg-[#9b5d25] text-[#fff9ea]'
  return 'bg-[#8b2f25] text-[#fff9ea]'
}

function Field({ label, value, onChange, suffix, type = 'number' }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <div className="flex items-center gap-2">
        <input
          type={type}
          min="0"
          step="0.1"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
        />
        {suffix && <span className="shrink-0 text-sm font-black text-soil/60">{suffix}</span>}
      </div>
    </label>
  )
}

function SwitchField({ label, value, onChange }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-soil">
      {label}
      <select
        value={value || 'no'}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
      >
        <option value="yes">是</option>
        <option value="no">否</option>
      </select>
    </label>
  )
}

function ResultBlock({ primary, secondary, risk, notes = [] }) {
  return (
    <div className="mt-5 rounded-2xl border border-soil/15 bg-[#f5eee1] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-soil/60">估算結果</p>
          <strong className="block mt-1 text-2xl text-bark">{primary}</strong>
          <p className="mt-1 text-sm font-bold text-soil/70">{secondary}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClass(risk)}`}>{risk}</span>
      </div>

      {notes.length > 0 && (
        <div className="mt-4 space-y-2">
          {notes.map((note) => (
            <p key={note} className="flex items-start gap-2 text-sm leading-6 text-soil/75">
              <AlertTriangle size={15} className="mt-1 shrink-0 text-[#8b2f25]" />
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function CalculatorCard({ title, icon: Icon, children }) {
  return (
    <section className="muji-card">
      <div className="muji-section-title">
        <Icon size={18} />
        <span>{title}</span>
      </div>
      {children}
    </section>
  )
}

export default function Calculators({ state, updateCalculator }) {
  const calculators = state.calculators || {}

  function values(id) {
    return calculators[id] || {}
  }

  function setValue(id, key, value) {
    updateCalculator(id, { ...values(id), [key]: value })
  }

  const water = values('water')
  const waterDaily =
    numberValue(water.adults) * 3 +
    numberValue(water.children) * 2 +
    numberValue(water.smallAnimals) * 0.5 +
    numberValue(water.largeAnimals) * 3
  const waterDays = waterDaily > 0 ? numberValue(water.liters) / waterDaily : 0

  const food = values('food')
  const foodDaily = numberValue(food.adults) * 3 + numberValue(food.children) * 2
  const foodDays = foodDaily > 0 ? numberValue(food.servings) / foodDaily : 0

  const power = values('power')
  const powerDaily =
    numberValue(power.phones) * numberValue(power.chargesPerPhone) * 4000 +
    numberValue(power.lights) * numberValue(power.lightHours) * 500
  const powerDays = powerDaily > 0 ? numberValue(power.capacity) / powerDaily : 0

  const bag = values('bag')
  const loadPercent = numberValue(bag.bodyWeight) > 0 ? (numberValue(bag.bagWeight) / numberValue(bag.bodyWeight)) * 100 : 0
  const loadRisk = riskForLoad(loadPercent)

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Survival Calculators</p>
        <h1 className="text-2xl font-black text-bark">硬核計算器</h1>
        <p className="text-soil/70 mt-2 leading-7">
          估算補給中斷時，家庭系統實際能撐多久。
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <CalculatorCard title="飲水可撐天數" icon={Calculator}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="家中可飲用水總量" value={water.liters} suffix="公升" onChange={(value) => setValue('water', 'liters', value)} />
            <Field label="成人數" value={water.adults} onChange={(value) => setValue('water', 'adults', value)} />
            <Field label="兒童數" value={water.children} onChange={(value) => setValue('water', 'children', value)} />
            <Field label="狗／貓等中小型動物數" value={water.smallAnimals} onChange={(value) => setValue('water', 'smallAnimals', value)} />
            <Field label="大型動物數" value={water.largeAnimals} onChange={(value) => setValue('water', 'largeAnimals', value)} />
          </div>
          <ResultBlock
            primary={`可撐 ${formatNumber(waterDays)} 天`}
            secondary={`每日最低飲水需求 ${formatNumber(waterDaily)} 公升`}
            risk={riskForDays(waterDays)}
            notes={['這是最低飲水估算，不含煮飯、清潔與沖廁用水。']}
          />
        </CalculatorCard>

        <CalculatorCard title="食物可撐天數" icon={Utensils}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="成人份食物總份數" value={food.servings} suffix="份" onChange={(value) => setValue('food', 'servings', value)} />
            <Field label="成人數" value={food.adults} onChange={(value) => setValue('food', 'adults', value)} />
            <Field label="兒童數" value={food.children} onChange={(value) => setValue('food', 'children', value)} />
            <SwitchField label="動物每日食物是否已另外準備" value={food.animalsPrepared} onChange={(value) => setValue('food', 'animalsPrepared', value)} />
          </div>
          <ResultBlock
            primary={`可撐 ${formatNumber(foodDays)} 天`}
            secondary={`每日最低食物份數需求 ${formatNumber(foodDaily)} 份`}
            risk={riskForDays(foodDays)}
            notes={[
              '優先計算免冷藏、可直接食用或簡單加熱的食物。',
              food.animalsPrepared === 'yes' ? null : '動物食物未另外準備，家庭總撐天數會被高估。'
            ].filter(Boolean)}
          />
        </CalculatorCard>

        <CalculatorCard title="電力照明可撐時間" icon={BatteryCharging}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="行動電源總容量" value={power.capacity} suffix="mAh" onChange={(value) => setValue('power', 'capacity', value)} />
            <Field label="手機數量" value={power.phones} onChange={(value) => setValue('power', 'phones', value)} />
            <Field label="每支手機每日充電次數" value={power.chargesPerPhone} onChange={(value) => setValue('power', 'chargesPerPhone', value)} />
            <Field label="手電筒／照明設備數量" value={power.lights} onChange={(value) => setValue('power', 'lights', value)} />
            <Field label="每個照明設備每日使用小時數" value={power.lightHours} suffix="小時" onChange={(value) => setValue('power', 'lightHours', value)} />
          </div>
          <ResultBlock
            primary={`可撐 ${formatNumber(powerDays)} 天`}
            secondary={`每日估算用電量 ${formatNumber(powerDaily, 0)} mAh`}
            risk={riskForPower(powerDays)}
            notes={['這是粗估，不同設備耗電差異很大。', '醫療設備、保溫設備、通訊設備應另外計算。']}
          />
        </CalculatorCard>

        <CalculatorCard title="撤離包重量檢查" icon={Scale}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="使用者體重" value={bag.bodyWeight} suffix="公斤" onChange={(value) => setValue('bag', 'bodyWeight', value)} />
            <Field label="撤離包重量" value={bag.bagWeight} suffix="公斤" onChange={(value) => setValue('bag', 'bagWeight', value)} />
            <SwitchField label="是否需要攜帶動物" value={bag.carryAnimals} onChange={(value) => setValue('bag', 'carryAnimals', value)} />
            <SwitchField label="是否需要抱小孩或攜帶大型物品" value={bag.carryChildOrLargeItem} onChange={(value) => setValue('bag', 'carryChildOrLargeItem', value)} />
          </div>
          <ResultBlock
            primary={`負重比例 ${formatNumber(loadPercent)}%`}
            secondary={loadRisk === '危險' ? '行動建議：降重、分裝或重新規劃撤離方式' : '行動建議：實走測試樓梯、門口、車輛與集合點路線'}
            risk={loadRisk}
            notes={[
              bag.carryAnimals === 'yes' ? '需要攜帶動物，重量與機動性要重新評估。' : null,
              bag.carryChildOrLargeItem === 'yes' ? '需要抱小孩或大型物品，不應只看背包重量。' : null
            ].filter(Boolean)}
          />
        </CalculatorCard>
      </div>

      <section className="muji-note">
        <PackageCheck size={18} />
        <div>
          <strong>安全提醒</strong>
          <p>這些計算器是粗估工具，不能取代政府防災指引、醫療建議、獸醫建議或現場專業判斷。</p>
        </div>
      </section>
    </div>
  )
}
