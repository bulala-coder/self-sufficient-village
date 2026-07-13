import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { createDefaultSanitationSystem, sanitationModes, sanitationTypeLabels } from '../data/sanitationDefaults.js'
import { evaluateSanitationPlan } from '../utils/sanitationCalculations.js'
import { getSanitationSystemSummary, loadSanitationSystemData, saveSanitationSystemData } from '../utils/sanitationStorage.js'
import CollapsibleSection from './CollapsibleSection.jsx'

const fmt = (value) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(1)).toString() : '0'
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
const lists = {
  toiletPlans: { title: '廁所與排泄方案', types: ['flushToilet','bucketToilet','portableToilet','compostToilet','emergencyBags','outdoorLatrine','other'], fields: [['capacityUses','可處理次數'],['waterRequired','每次需水量 L']], checks: [['requiresBags','需要袋材'],['requiresAbsorbent','需要吸附材料'],['indoorSafe','室內安全'],['odorControl','具除臭控制']] },
  hygieneSupplies: { title: '個人衛生耗材', types: ['toiletPaper','wetWipes','handSanitizer','soap','menstrualProducts','diapers','towels','gloves','masks','other'], fields: [['quantity','數量'],['usesPerUnit','每單位可用次數'],['dailyUseEstimate','每日估算用量']], unit: true },
  wasteSupplies: { title: '垃圾與排泄物處理', types: ['trashBags','heavyDutyBags','zipBags','absorbent','lime','deodorizer','container','other'], fields: [['quantity','數量'],['capacityUses','每單位處理次數'],['dailyUseEstimate','每日估算用量']], unit: true, checks: [['sealed','可密封'],['odorControl','具除臭控制']] },
  cleaningSupplies: { title: '清潔與消毒用品', types: ['bleach','alcohol','disinfectant','detergent','dishSoap','surfaceWipes','gloves','other'], fields: [['quantity','數量'],['mlPerUse','每單位容量／用量 ml'],['dailyUseEstimate','每日估算用量']], unit: true, checks: [['safeForPets','寵物環境可用']] },
  petWasteSupplies: { title: '寵物排泄管理', types: ['litter','peePads','poopBags','cageLiners','bedding','disinfectant','other'], fields: [['quantity','數量'],['usesPerUnit','每單位可用次數'],['dailyUseEstimate','每日估算用量']], unit: true },
  sanitationPlans: { title: '停水衛生分配方案', plan: true, fields: [['durationDays','方案天數'],['toiletUsesPerDay','每日排泄次數'],['wasteBagsPerDay','每日垃圾袋'],['wipesPerDay','每日濕紙巾'],['handSanitizerMlPerDay','每日乾洗手 ml'],['disinfectantMlPerDay','每日消毒液 ml'],['petWasteUsesPerDay','每日寵物排泄耗材']] }
}
const emptyItem = (key) => ({ id: '', name: '', type: lists[key].types?.[0] || '', unit: '個', notes: '', ...Object.fromEntries((lists[key].fields || []).map(([field]) => [field, 0])), ...Object.fromEntries((lists[key].checks || []).map(([field]) => [field, false])) })

export default function SanitationSystem({ setPage }) {
  const [data, setData] = useState(loadSanitationSystemData)
  const [editing, setEditing] = useState({ key: '', item: null })
  useEffect(() => { saveSanitationSystemData(data) }, [data])
  const summary = useMemo(() => getSanitationSystemSummary(data), [data])
  const recommendations = [...new Set(summary.recommendations)].slice(0, 5)
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))
  const updateNested = (group, key, value) => update(group, { ...data[group], [key]: value })
  const begin = (key, item) => setEditing({ key, item: item ? { ...item } : emptyItem(key) })
  const save = (event) => {
    event.preventDefault(); const { key, item } = editing; if (!item?.name?.trim()) return
    update(key, item.id ? data[key].map((entry) => entry.id === item.id ? item : entry) : [{ ...item, id: uid() }, ...data[key]])
    setEditing({ key: '', item: null })
  }
  const remove = (key, item) => { if (confirm(`確定刪除「${item.name}」？`)) update(key, data[key].filter((entry) => entry.id !== item.id)) }

  return <div className="sanitation-system space-y-5 pb-32">
    <button className="btn-secondary" onClick={() => setPage('tools')}><ArrowLeft size={16} className="inline"/> 返回工具中心</button>
    <section className="muji-card sanitation-summary-card"><p className="muji-kicker">Sanitation System 1.0</p><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-2xl font-black text-bark">衛生與排泄系統</h1><p className="mt-1 text-sm">停水停電時的廁所、垃圾、清潔、消毒與寵物排泄能力。</p></div><div className="sanitation-score-card"><span>Sanitation Score</span><strong>{summary.score}</strong><small>{summary.status}</small></div></div><div className="metric-strip mt-3"><Metric label="家庭人數" value={`${fmt(summary.totals.householdSize)} 人`}/><Metric label="每日排泄估算" value={`${fmt(summary.totals.dailyToiletUses)} 次`}/><Metric label="整體衛生支撐" value={`${fmt(summary.days.overallDays)} 天`}/><Metric label="衛生模式" value={sanitationModes[data.sanitationMode]}/></div><p className="mt-3 rounded-xl bg-white/55 p-3 text-sm font-bold">最高優先建議：{recommendations[0] || '持續輪替衛生耗材並實際演練。'}</p></section>

    <section className="muji-card"><Title>衛生總覽</Title><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="廁所支撐" value={`${fmt(summary.days.toiletDays)} 天`}/><Metric label="個人衛生支撐" value={`${fmt(summary.days.hygieneDays)} 天`}/><Metric label="垃圾處理支撐" value={`${fmt(summary.days.wasteDays)} 天`}/><Metric label="清潔消毒支撐" value={`${fmt(summary.days.cleaningDays)} 天`}/><Metric label="寵物排泄支撐" value={data.household.pets > 0 ? `${fmt(summary.days.petWasteDays)} 天` : '無需求'}/></div></section>

    <section className="muji-card"><Title>家庭與衛生設定</Title><div className="sanitation-form-grid mt-3"><Field label="衛生模式"><select value={data.sanitationMode} onChange={(e) => update('sanitationMode', e.target.value)}>{Object.entries(sanitationModes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>{[['adults','成人'],['children','兒童'],['seniors','高齡者'],['specialNeeds','特殊需求者'],['pets','寵物數']].map(([key,label]) => <Field key={key} label={label}><NumberInput value={data.household[key]} onChange={(value) => updateNested('household', key, value)}/></Field>)}{[['toiletUsesPerPersonPerDay','每人每日排泄次數'],['wasteBagsPerPersonPerDay','每人每日垃圾袋'],['wipesPerPersonPerDay','每人每日濕紙巾'],['handSanitizerMlPerPersonPerDay','每人每日乾洗手 ml'],['disinfectantMlPerDay','每日消毒液 ml'],['petWasteBagsPerPetPerDay','每隻寵物每日排泄耗材']].map(([key,label]) => <Field key={key} label={label}><NumberInput value={data.settings[key]} onChange={(value) => updateNested('settings', key, value)}/></Field>)}</div></section>

    {Object.entries(lists).map(([key, config]) => <CollapsibleSection key={key} title={config.title} subtitle={`${data[key].length} 筆資料`}><div className="flex items-center justify-between gap-3"><Title>{config.title}</Title><button className="btn-secondary" onClick={() => begin(key)}><Plus size={16} className="inline"/> 新增</button></div>{editing.key === key && <ItemForm config={config} item={editing.item} setItem={(item) => setEditing({ key, item })} save={save} cancel={() => setEditing({ key: '', item: null })}/>}<div className="sanitation-card-grid">{data[key].map((item) => <article key={item.id} className={config.plan ? 'sanitation-plan-card' : 'sanitation-supply-card'}><div className="flex items-start justify-between gap-3"><div><h3>{item.name}</h3>{item.type && <p>{sanitationTypeLabels[item.type] || item.type}</p>}</div><div className="shrink-0"><button aria-label={`編輯${item.name}`} className="p-2" onClick={() => begin(key,item)}><Pencil size={16}/></button><button aria-label={`刪除${item.name}`} className="p-2 text-[#8b2f25]" onClick={() => remove(key,item)}><Trash2 size={16}/></button></div></div>{config.plan ? <PlanSummary item={item} summary={summary}/> : <p className="mt-2 text-sm font-bold">{config.fields.map(([field,label]) => `${label} ${fmt(item[field])}`).join(' · ')}</p>}{item.notes && <small>{item.notes}</small>}</article>)}</div>{!data[key].length && <p className="mt-3 rounded-xl bg-white/55 p-3 text-sm font-bold">尚未建立資料。</p>}</CollapsibleSection>)}

    <section className="muji-card compact-card"><Title>衛生系統改善建議</Title><ol className="dense-list mt-3">{recommendations.map((item,index) => <li key={item} className="rounded-xl bg-[#f2dfd4] p-2 text-sm font-bold"><strong className="mr-2 text-[#8b2f25]">{index+1}.</strong>{item}</li>)}</ol></section>
    <section className="muji-card compact-card bg-[#f2dfd4]"><div className="flex gap-3"><ShieldCheck size={20} className="shrink-0"/><p className="text-sm font-bold">衛生與排泄系統為家庭韌性規劃工具。排泄物、垃圾、漂白水、消毒劑與燃燒或化學用品可能造成感染、中毒、刺激或火災風險。請依產品標示與安全規範操作，避免混合漂白水與酸性或含氨清潔劑。</p></div></section>
  </div>
}

function ItemForm({ config, item, setItem, save, cancel }) { return <form className="sanitation-form" onSubmit={save}><div className="sanitation-form-grid"><Field label="名稱"><input required value={item.name} onChange={(e) => setItem({...item,name:e.target.value})}/></Field>{config.types && <Field label="類型"><select value={item.type} onChange={(e) => setItem({...item,type:e.target.value})}>{config.types.map((type)=><option key={type} value={type}>{sanitationTypeLabels[type] || type}</option>)}</select></Field>}{config.unit && <Field label="單位"><input value={item.unit} onChange={(e)=>setItem({...item,unit:e.target.value})}/></Field>}{config.fields.map(([field,label])=><Field key={field} label={label}><NumberInput value={item[field]} onChange={(value)=>setItem({...item,[field]:value})}/></Field>)}</div><div className="mt-3 flex flex-wrap gap-3">{(config.checks||[]).map(([field,label])=><label key={field} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(item[field])} onChange={(e)=>setItem({...item,[field]:e.target.checked})}/>{label}</label>)}</div><Field label="備註"><textarea rows="2" value={item.notes} onChange={(e)=>setItem({...item,notes:e.target.value})}/></Field><div className="action-row mt-3"><button className="btn-primary" type="submit">儲存</button><button className="btn-secondary" type="button" onClick={cancel}>取消</button></div></form> }
function PlanSummary({ item, summary }) { const result=evaluateSanitationPlan(item,summary); return <p className={`mt-2 text-sm font-black ${result.enough?'text-[#24483a]':'text-[#8b2f25]'}`}>{fmt(result.durationDays)} 天方案 · {result.status}</p> }
function Field({ label, children }) { return <label className="block text-sm font-bold text-bark"><span className="mb-1 block">{label}</span>{children}</label> }
function NumberInput({ value, onChange }) { return <input type="number" min="0" step="0.1" value={value} onChange={(e)=>onChange(e.target.value)}/> }
function Title({ children }) { return <div className="muji-section-title"><Sparkles size={18}/><span>{children}</span></div> }
function Metric({ label, value }) { return <div className="rounded-xl border border-soil/15 bg-white/60 p-3"><p className="text-xs font-black text-soil/55">{label}</p><strong className="block text-lg text-bark">{value}</strong></div> }
