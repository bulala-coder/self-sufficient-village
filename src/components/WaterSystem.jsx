import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, CloudRain, Droplets, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { createDefaultWaterSystem, sourceTypes, storageCategories, treatmentTypes, WATER_STORAGE_KEY, waterLabels } from '../data/waterDefaults.js'
import { calculateAnimalDrinkingDemand, calculateDailyDrinkingDemand, calculateDailyUtilityDemand, calculateDrinkingDays, calculateHumanDrinkingDemand, calculateNonPotableStorage, calculateOverallWaterDays, calculatePotableStorage, calculatePurificationCapacity, calculateTreatmentRequiredStorage, calculateUtilityDays, calculateWaterScore, generateWaterRecommendations, getPlanMetrics, getWaterStatus } from '../utils/waterCalculations.js'
import { getWaterIntelligenceSummary } from '../utils/waterStorage.js'

const emptyStorage = { name: '', volumeLiters: '', category: 'bottled', potable: true, requiresTreatment: false, location: '', storedAt: '', expiresAt: '', notes: '' }
const emptySource = { name: '', type: 'tap', distance: '', estimatedVolume: '', stable: false, potable: false, requiresTreatment: false, dependsOnElectricity: false, dependsOnTransport: false, notes: '' }
const emptyTreatment = { name: '', type: 'boiling', owned: true, treatmentTargets: '', batchCapacity: '', dailyCapacity: '', requiresElectricity: false, requiresFuel: true, requiresConsumables: false, consumablesRemaining: '', instructions: '', notes: '' }
const emptyPlan = { name: '', durationDays: 1, drinking: '', cooking: '', cleaning: '', toilet: '', animals: '', emergencyReserve: '', notes: '' }
const modeLabels = { survival: '生存', conservation: '節水', normal: '一般' }
const n = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
const fmt = (value) => Number(n(value).toFixed(1)).toString()
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function loadWaterData() {
  const fallback = createDefaultWaterSystem()
  try {
    const saved = JSON.parse(localStorage.getItem(WATER_STORAGE_KEY))
    if (!saved || typeof saved !== 'object') return fallback
    return {
      ...fallback, ...saved,
      household: { ...fallback.household, ...(saved.household || {}), needs: { ...fallback.household.needs, ...(saved.household?.needs || {}) } },
      modes: { ...fallback.modes, ...(saved.modes || {}) },
      rainwater: { ...fallback.rainwater, ...(saved.rainwater || {}) },
      storage: Array.isArray(saved.storage) ? saved.storage : [], sources: Array.isArray(saved.sources) ? saved.sources : [], treatments: Array.isArray(saved.treatments) ? saved.treatments : [], plans: Array.isArray(saved.plans) ? saved.plans : fallback.plans
    }
  } catch { return fallback }
}

function Field({ label, children }) { return <label className="block text-sm font-bold text-soil/75"><span className="block mb-1">{label}</span>{children}</label> }
function Input({ value, onChange, type = 'text', ...props }) { return <input className="w-full rounded-xl border border-soil/20 bg-white/70 px-3 py-2" type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} /> }
function Check({ label, checked, onChange }) { return <label className="flex items-center gap-2 rounded-xl border border-soil/15 bg-white/55 px-3 py-2 text-sm font-bold"><input type="checkbox" checked={checked === true} onChange={(event) => onChange(event.target.checked)} />{label}</label> }
function Metric({ label, value, hint }) { return <article className="rounded-2xl border border-soil/15 bg-white/60 p-4"><p className="text-xs font-black tracking-wide text-soil/55">{label}</p><strong className="mt-1 block text-2xl text-[#24483a]">{value}</strong>{hint && <p className="mt-1 text-xs text-soil/60">{hint}</p>}</article> }
function SectionTitle({ icon: Icon, children }) { return <div className="muji-section-title"><Icon size={18}/><span>{children}</span></div> }

function CrudForm({ kind, initial, options, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const isStorage = kind === 'storage', isSource = kind === 'source', isTreatment = kind === 'treatment'
  return <form className="mt-4 rounded-2xl border border-soil/15 bg-white/45 p-4" onSubmit={(event) => { event.preventDefault(); if (!String(form.name).trim()) return; onSave({ ...form, name: String(form.name).trim() }) }}>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="名稱 *"><Input value={form.name} onChange={(v) => set('name', v)}/></Field>
      <Field label="類型"><select className="w-full" value={isStorage ? form.category : form.type} onChange={(e) => set(isStorage ? 'category' : 'type', e.target.value)}>{options.map((value) => <option key={value} value={value}>{waterLabels[value] || value}</option>)}</select></Field>
      {isStorage && <><Field label="水量（L）"><Input type="number" min="0" step="0.1" value={form.volumeLiters} onChange={(v) => set('volumeLiters', v)}/></Field><Field label="位置"><Input value={form.location} onChange={(v) => set('location', v)}/></Field><Field label="儲存日期"><Input type="date" value={form.storedAt} onChange={(v) => set('storedAt', v)}/></Field><Field label="保存期限"><Input type="date" value={form.expiresAt} onChange={(v) => set('expiresAt', v)}/></Field></>}
      {isSource && <><Field label="距離"><Input value={form.distance} onChange={(v) => set('distance', v)} placeholder="例如 500 m"/></Field><Field label="估計可取得水量（L）"><Input type="number" min="0" value={form.estimatedVolume} onChange={(v) => set('estimatedVolume', v)}/></Field></>}
      {isTreatment && <><Field label="處理目標"><Input value={form.treatmentTargets} onChange={(v) => set('treatmentTargets', v)} placeholder="細菌、原生動物等"/></Field><Field label="單批容量（L）"><Input type="number" min="0" value={form.batchCapacity} onChange={(v) => set('batchCapacity', v)}/></Field><Field label="每日容量（L）"><Input type="number" min="0" value={form.dailyCapacity} onChange={(v) => set('dailyCapacity', v)}/></Field><Field label="剩餘耗材"><Input value={form.consumablesRemaining} onChange={(v) => set('consumablesRemaining', v)}/></Field><Field label="操作說明"><Input value={form.instructions} onChange={(v) => set('instructions', v)}/></Field></>}
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {isStorage && <><Check label="可直接飲用" checked={form.potable} onChange={(v) => set('potable', v)}/><Check label="飲用前需處理" checked={form.requiresTreatment} onChange={(v) => set('requiresTreatment', v)}/></>}
      {isSource && <><Check label="來源穩定" checked={form.stable} onChange={(v) => set('stable', v)}/><Check label="可直接飲用" checked={form.potable} onChange={(v) => set('potable', v)}/><Check label="需要處理" checked={form.requiresTreatment} onChange={(v) => set('requiresTreatment', v)}/><Check label="依賴電力" checked={form.dependsOnElectricity} onChange={(v) => set('dependsOnElectricity', v)}/><Check label="依賴交通" checked={form.dependsOnTransport} onChange={(v) => set('dependsOnTransport', v)}/></>}
      {isTreatment && <><Check label="已擁有" checked={form.owned} onChange={(v) => set('owned', v)}/><Check label="需要電力" checked={form.requiresElectricity} onChange={(v) => set('requiresElectricity', v)}/><Check label="需要燃料" checked={form.requiresFuel} onChange={(v) => set('requiresFuel', v)}/><Check label="需要耗材" checked={form.requiresConsumables} onChange={(v) => set('requiresConsumables', v)}/></>}
    </div>
    <Field label="備註"><textarea className="mt-1 w-full" rows="2" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)}/></Field>
    <div className="mt-3 flex gap-2"><button className="btn-primary" type="submit">儲存</button><button className="btn-secondary" type="button" onClick={onCancel}>取消</button></div>
  </form>
}

function CrudSection({ title, icon, kind, items, empty, options, onChange, extra }) {
  const [editing, setEditing] = useState(null)
  const save = (item) => { onChange(editing?.id ? items.map((x) => x.id === editing.id ? { ...item, id: editing.id } : x) : [{ ...item, id: uid() }, ...items]); setEditing(null) }
  return <section className="muji-card">
    <div className="flex items-center justify-between gap-3"><SectionTitle icon={icon}>{title}</SectionTitle><button className="btn-secondary" type="button" onClick={() => setEditing({ ...empty })}><Plus size={16} className="inline"/> 新增</button></div>
    {extra}
    {editing && <CrudForm kind={kind} initial={editing} options={options} onSave={save} onCancel={() => setEditing(null)}/>} 
    <div className="mt-4 grid gap-3 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-soil/15 bg-white/60 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-black text-bark">{item.name}</h3><p className="text-sm text-soil/65">{waterLabels[item.category || item.type] || item.category || item.type}</p></div><div className="flex gap-1"><button className="p-2" aria-label="編輯" onClick={() => setEditing({ ...item })}><Pencil size={17}/></button><button className="p-2 text-[#8b2f25]" aria-label="刪除" onClick={() => { if (confirm(`確定刪除「${item.name}」？`)) onChange(items.filter((x) => x.id !== item.id)) }}><Trash2 size={17}/></button></div></div>
      {kind === 'storage' && <p className="mt-2 font-bold">{fmt(item.volumeLiters)} L · {item.potable ? '可飲用' : item.requiresTreatment ? '需處理' : '非飲用'}</p>}
      {kind === 'source' && <p className="mt-2 text-sm">{item.distance || '未填距離'} · {item.stable ? '穩定' : '穩定性未確認'} · {item.potable ? '可飲用' : '不可直接飲用'}</p>}
      {kind === 'treatment' && <p className="mt-2 text-sm">每日 {fmt(item.dailyCapacity)} L · {item.owned ? '已擁有' : '尚未擁有'}</p>}
    </article>)}</div>
    {!items.length && <p className="mt-4 rounded-2xl border border-dashed border-soil/25 p-5 text-center text-soil/60">尚無資料</p>}
  </section>
}

export default function WaterSystem({ setPage }) {
  const [data, setData] = useState(loadWaterData)
  const [planForm, setPlanForm] = useState(null)
  useEffect(() => { localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify({ ...data, version: '4.3', updatedAt: new Date().toISOString() })) }, [data])
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))
  const metrics = useMemo(() => {
    const intelligence = getWaterIntelligenceSummary(data)
    const mode = data.modes?.[data.activeMode] || {}
    const human = calculateHumanDrinkingDemand(data.household), animal = calculateAnimalDrinkingDemand(data.household), drinking = calculateDailyDrinkingDemand(data.household), utility = calculateDailyUtilityDemand(mode)
    const potable = intelligence.totals.potableLiters, nonPotable = intelligence.totals.nonPotableLiters
    const drinkingDays = calculateDrinkingDays(potable, drinking), utilityDays = calculateUtilityDays(nonPotable, utility)
    const score = intelligence.score
    return { human, animal, drinking, utility, total: drinking + utility, potable, nonPotable, treatmentRequired: intelligence.totals.treatmentRequiredLiters, drinkingDays, utilityDays, overall: calculateOverallWaterDays(drinkingDays, utilityDays), purification: calculatePurificationCapacity(data.treatments), score, status: getWaterStatus(score), recommendations: intelligence.recommendations, intelligence }
  }, [data])
  const setHousehold = (key, value) => update('household', { ...data.household, [key]: value })
  const setNeed = (key, value) => update('household', { ...data.household, needs: { ...data.household.needs, [key]: value } })
  const savePlan = (event) => { event.preventDefault(); if (!planForm.name.trim()) return; update('plans', planForm.id ? data.plans.map((p) => p.id === planForm.id ? planForm : p) : [{ ...planForm, id: uid() }, ...data.plans]); setPlanForm(null) }

  return <div className="water-system-page space-y-5 pb-32">
    <button className="btn-secondary" onClick={() => setPage('tools')}><ArrowLeft size={16} className="inline"/> 返回工具中心</button>
    <section className="muji-card bg-[#e7dfd0]"><p className="muji-kicker">Water System 2.0</p><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black text-bark">家庭水資源管理</h1><p className="mt-2">目前家庭的水，可以支撐所有成員與動物多久？</p></div><div className="flex gap-5"><div><span className="text-xs font-black">水系統分數</span><strong className="block text-4xl text-[#24483a]">{metrics.score}</strong></div><div><span className="text-xs font-black">狀態</span><strong className="block text-xl">{metrics.status}</strong></div><div><span className="text-xs font-black">整體支撐</span><strong className="block text-xl">{fmt(metrics.overall)} 天</strong></div></div></div></section>
    <section className="muji-card"><SectionTitle icon={Droplets}>水資源總覽</SectionTitle><div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="可飲用水" value={`${fmt(metrics.potable)} L`}/><Metric label="非飲用水" value={`${fmt(metrics.nonPotable)} L`} hint={`其中需處理 ${fmt(metrics.treatmentRequired)} L`}/><Metric label="每日飲水需求" value={`${fmt(metrics.drinking)} L`}/><Metric label="每日生活用水" value={`${fmt(metrics.utility)} L`}/><Metric label="每日總需求" value={`${fmt(metrics.total)} L`}/><Metric label="飲水支撐" value={`${fmt(metrics.drinkingDays)} 天`}/><Metric label="生活用水支撐" value={`${fmt(metrics.utilityDays)} 天`}/><Metric label="淨水能力" value={`${fmt(metrics.purification)} L/日`}/></div></section>

    <section className="muji-card border-[#24483a]/25"><SectionTitle icon={Droplets}>Inventory 水資源連結</SectionTitle><p className="mt-3 text-sm leading-7 text-soil/70">以下資料唯讀引用自 Inventory，不是 Water System 手動儲水。若要修改 Inventory 水品項，請至庫存頁編輯。</p><div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="已連結品項" value={`${metrics.intelligence.inventoryWater.items.length} 項`}/><Metric label="Inventory 可飲用水" value={`${fmt(metrics.intelligence.inventoryWater.potableLiters)} L`}/><Metric label="Inventory 非飲用水" value={`${fmt(metrics.intelligence.inventoryWater.nonPotableLiters)} L`}/><Metric label="資料不完整" value={`${metrics.intelligence.inventoryWater.incompleteCount} 項`}/></div><div className="mt-4 grid gap-3 md:grid-cols-2">{metrics.intelligence.inventoryWater.items.map((item) => <article key={item.id} className="rounded-2xl border border-soil/15 bg-white/60 p-4"><div className="flex justify-between gap-2"><h3 className="font-black">{item.name}</h3><span className="badge">來源：Inventory</span></div><p className="mt-2 text-sm font-bold">{fmt(item.volumeLiters)} L · {item.potable ? '可飲用' : '非飲用'} · {item.requiresTreatment ? '需要處理' : '不需處理'}</p>{item.isIncomplete && <p className="mt-2 font-black text-[#8b2f25]">需補齊每單位容量</p>}</article>)}</div>{!metrics.intelligence.inventoryWater.items.length && <p className="mt-4 text-sm text-soil/60">尚無已標記的 Inventory 水品項。</p>}</section>

    <section className="muji-card"><SectionTitle icon={ShieldCheck}>家庭需求</SectionTitle><p className="mt-3 rounded-2xl bg-[#eee5d6] p-3 text-sm">本系統數值為家庭韌性規劃估算，實際需求會依氣候、健康、活動量、飲食與個體狀況改變。</p><div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">{[['adults','成人數'],['children','兒童數'],['seniors','高齡者數'],['specialNeeds','特殊需求者數'],['dogs','狗數量'],['cats','貓數量'],['otherAnimals','其他動物數量']].map(([key,label]) => <Field key={key} label={label}><Input type="number" min="0" value={data.household[key]} onChange={(v) => setHousehold(key,v)}/></Field>)}<Field label="其他動物名稱"><Input value={data.household.otherAnimalName} onChange={(v) => setHousehold('otherAnimalName',v)}/></Field></div><h3 className="mt-5 font-black">每人／每隻每日最低飲水（L）</h3><div className="mt-3 grid gap-3 grid-cols-2 lg:grid-cols-3">{[['adult','成人'],['child','兒童'],['senior','高齡者'],['specialNeeds','特殊需求者'],['dog','狗'],['cat','貓'],['otherAnimal','其他動物']].map(([key,label]) => <Field key={key} label={label}><Input type="number" min="0" step="0.1" value={data.household.needs[key]} onChange={(v) => setNeed(key,v)}/></Field>)}</div><div className="mt-4 grid grid-cols-3 gap-3"><Metric label="人類飲水" value={`${fmt(metrics.human)} L/日`}/><Metric label="動物飲水" value={`${fmt(metrics.animal)} L/日`}/><Metric label="合計" value={`${fmt(metrics.drinking)} L/日`}/></div></section>

    <section className="muji-card"><SectionTitle icon={Droplets}>每日用水模式</SectionTitle><div className="mt-4 grid grid-cols-3 gap-2">{Object.keys(modeLabels).map((key) => <button key={key} className={data.activeMode === key ? 'btn-primary' : 'btn-secondary'} onClick={() => update('activeMode',key)}>{modeLabels[key]}</button>)}</div><div className="mt-4 grid gap-4 md:grid-cols-3">{Object.entries(modeLabels).map(([key,label]) => <article key={key} className="rounded-2xl border border-soil/15 bg-white/55 p-4"><h3 className="font-black">{label}模式</h3>{[['cooking','煮食'],['cleaning','清潔'],['toilet','廁所']].map(([field,name]) => <Field key={field} label={`${name}（L/日）`}><Input type="number" min="0" step="0.1" value={data.modes[key]?.[field]} onChange={(v) => update('modes',{...data.modes,[key]:{...data.modes[key],[field]:v}})}/></Field>)}</article>)}</div></section>

    <CrudSection title="儲水管理" icon={Droplets} kind="storage" items={data.storage} empty={emptyStorage} options={storageCategories} onChange={(v) => update('storage',v)} extra={<p className="mt-3 text-sm">總量 {fmt(metrics.potable + metrics.nonPotable)} L · 可飲用 {fmt(metrics.potable)} L · 非飲用 {fmt(metrics.nonPotable)} L · 需處理 {fmt(metrics.treatmentRequired)} L</p>}/>
    <CrudSection title="補水來源" icon={Droplets} kind="source" items={data.sources} empty={emptySource} options={sourceTypes} onChange={(v) => update('sources',v)}/>
    <CrudSection title="淨水方式" icon={ShieldCheck} kind="treatment" items={data.treatments} empty={emptyTreatment} options={treatmentTypes} onChange={(v) => update('treatments',v)} extra={<p className="mt-3 rounded-2xl bg-[#f2dfd4] p-3 text-sm">不同淨水方式只能處理特定風險。化學污染、重金屬、海水或未知污染源，不一定能靠煮沸或一般濾水器處理。</p>}/>

    <section className="muji-card"><SectionTitle icon={CloudRain}>雨水與備用水</SectionTitle><div className="mt-4"><Check label="啟用雨水／備用水管理" checked={data.rainwater.enabled} onChange={(v) => update('rainwater',{...data.rainwater,enabled:v})}/></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['collectionArea','集水面積（m²）'],['storageCapacity','儲存容量（L）'],['currentVolume','目前水量（L）']].map(([key,label]) => <Field key={key} label={label}><Input type="number" min="0" value={data.rainwater[key]} onChange={(v) => update('rainwater',{...data.rainwater,[key]:v})}/></Field>)}<Field label="預定用途"><Input value={data.rainwater.intendedUses} onChange={(v) => update('rainwater',{...data.rainwater,intendedUses:v})}/></Field></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[['firstFlush','初期雨水排除'],['meshFilter','網狀過濾'],['covered','儲水有加蓋'],['mosquitoProtected','防蚊措施']].map(([key,label]) => <Check key={key} label={label} checked={data.rainwater[key]} onChange={(v) => update('rainwater',{...data.rainwater,[key]:v})}/>)}</div><Field label="備註"><textarea rows="2" className="w-full" value={data.rainwater.notes} onChange={(e) => update('rainwater',{...data.rainwater,notes:e.target.value})}/></Field><p className="mt-3 text-sm">安全狀態：{data.rainwater.enabled && data.rainwater.firstFlush && data.rainwater.meshFilter && data.rainwater.covered && data.rainwater.mosquitoProtected ? '基礎防護完整，仍須依用途判斷是否需進一步處理。' : '尚有防護缺口，不可假設可直接飲用。'}</p></section>

    <section className="muji-card"><div className="flex justify-between gap-3"><SectionTitle icon={ShieldCheck}>停水分配方案</SectionTitle><button className="btn-secondary" onClick={() => setPlanForm({...emptyPlan})}><Plus size={16} className="inline"/> 新增</button></div>{planForm && <form className="mt-4 rounded-2xl border border-soil/15 p-4" onSubmit={savePlan}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['name','方案名稱','text'],['durationDays','天數','number'],['drinking','每日人類飲水','number'],['animals','每日動物飲水','number'],['cooking','每日煮食','number'],['cleaning','每日清潔','number'],['toilet','每日廁所','number'],['emergencyReserve','緊急保留水','number']].map(([key,label,type]) => <Field key={key} label={label}><Input type={type} min="0" step="0.1" value={planForm[key]} onChange={(v) => setPlanForm({...planForm,[key]:v})}/></Field>)}</div><Field label="備註"><textarea className="w-full" rows="2" value={planForm.notes} onChange={(e) => setPlanForm({...planForm,notes:e.target.value})}/></Field><div className="mt-3 flex gap-2"><button className="btn-primary">儲存</button><button type="button" className="btn-secondary" onClick={() => setPlanForm(null)}>取消</button></div></form>}<div className="mt-4 grid gap-3 md:grid-cols-2">{data.plans.map((plan) => { const p = getPlanMetrics(plan,metrics.drinking,metrics.potable+metrics.nonPotable); return <article key={plan.id} className="rounded-2xl border border-soil/15 bg-white/60 p-4"><div className="flex justify-between"><h3 className="font-black">{plan.name}</h3><div><button className="p-2" onClick={() => setPlanForm({...plan})}><Pencil size={17}/></button><button className="p-2 text-[#8b2f25]" onClick={() => {if(confirm('確定刪除此方案？')) update('plans',data.plans.filter(x=>x.id!==plan.id))}}><Trash2 size={17}/></button></div></div><p className="mt-2">每日 {fmt(p.daily)} L · {fmt(plan.durationDays)} 天總需求 {fmt(p.total)} L</p><p className={`mt-2 font-black ${p.enough?'text-[#24483a]':'text-[#8b2f25]'}`}>{p.enough?'現有總水量足夠':'現有總水量不足'} · {p.belowMinimum?'飲水低於家庭最低需求':'飲水符合最低需求'}</p></article>})}</div><button className="btn-secondary mt-4" onClick={() => update('plans',createDefaultWaterSystem().plans)}>套用預設 24h／72h／7 天方案</button></section>

    <section className="muji-card"><SectionTitle icon={AlertTriangle}>水系統改善建議</SectionTitle><ol className="mt-4 space-y-2">{metrics.recommendations.map((item,index)=><li key={item} className="rounded-2xl border border-soil/15 bg-white/60 p-3"><strong className="mr-2 text-[#8b2f25]">{index+1}.</strong>{item}</li>)}</ol></section>
  </div>
}
