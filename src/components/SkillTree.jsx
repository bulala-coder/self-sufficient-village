import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Circle } from 'lucide-react'
import { getCompletedMap, taskSystemLabels, taskSystems } from '../data/tasks.js'
import { HOUSEHOLD_CAPABILITY_SYSTEMS } from '../data/householdCapabilities.js'
import CollapsibleSection from './CollapsibleSection.jsx'

const skillSystems = taskSystems.filter(([id]) => id !== 'all')
const capabilitySystemIds = new Set(HOUSEHOLD_CAPABILITY_SYSTEMS.map(([id]) => id))

function hasContent(value) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== ''
}

function safeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

function DetailSection({ title, value, ordered = false }) {
  if (!hasContent(value)) return null
  const values = Array.isArray(value) ? value.filter(hasContent) : null
  return <section className="task-detail-section">
    <h4 className="task-detail-title">{title}</h4>
    {values ? ordered
      ? <ol className="task-detail-list list-decimal">{values.map((item,index)=><li key={`${title}-${index}`}>{item}</li>)}</ol>
      : <ul className="task-detail-list list-disc">{values.map((item,index)=><li key={`${title}-${index}`}>{item}</li>)}</ul>
      : <p>{value}</p>}
  </section>
}

function SkillTaskCard({ task, completed, open, toggleDetails, toggleCompletion }) {
  const detailId = `skill-task-details-${task.id}`
  return <article className={`task-card skill-task-card ${completed ? 'task-card-complete' : ''}`}>
    <div className="task-summary-row skill-task-summary-row">
      {completed ? <CheckCircle2 className="mt-1 shrink-0 text-[#24483a]"/> : <Circle className="mt-1 shrink-0 text-soil/40"/>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <span className="badge">{taskSystemLabels[task.system] || task.system || '能力任務'}</span>
          <span className="badge">Level {safeNumber(task.riskLevel)}</span>
          {safeNumber(task.estimatedMinutes) > 0 && <span className="badge">{safeNumber(task.estimatedMinutes)} 分鐘</span>}
          {completed && <span className="badge bg-[#24483a] text-[#fff9ea]">已完成</span>}
        </div>
        <h3 className="mt-3 text-lg font-black text-bark">{task.title || '未命名任務'}</h3>
        {hasContent(task.relatedGap) && <p className="mt-2 font-bold text-soil/70">{task.relatedGap}</p>}
      </div>
      <strong className="shrink-0 text-sm text-soil/70">{safeNumber(task.xp)} XP</strong>
    </div>

    <div className="task-completion-row skill-task-completion-row">
      <button
        type="button"
        className={`task-complete-button skill-task-complete-button ${completed ? 'is-complete' : ''}`}
        aria-pressed={completed}
        onClick={toggleCompletion}
      >
        {completed ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
        <span>{completed ? '取消完成' : '標記完成'}</span>
      </button>
    </div>

    <button type="button" className="task-detail-toggle skill-task-detail-toggle" aria-expanded={open} aria-controls={detailId} onClick={toggleDetails}>
      <span>{open ? '收起詳情' : '任務詳情'}</span>
      {open ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
    </button>

    <div id={detailId} className="task-detail-panel skill-task-detail-panel" hidden={!open}>
      <div className="space-y-3">
        <DetailSection title="任務說明" value={task.purpose || task.description}/>
        <DetailSection title="為什麼要做" value={task.why}/>
        <DetailSection title="執行步驟" value={task.steps} ordered/>
        <DetailSection title="完成標準" value={task.completion || task.completionCriteria}/>
        <DetailSection title="所需物品" value={task.tools || task.materials}/>
        <DetailSection title="注意事項" value={task.failureConditions || task.safety}/>
        <DetailSection title="相關演練" value={task.relatedDrills}/>
        <DetailSection title="對應缺口" value={task.relatedGap || task.gap}/>
      </div>
      <div className="task-safety-note">完成可獲得 {safeNumber(task.xp)} XP。只在安全範圍內執行盤點、測試與記錄，不要求冒險行動。</div>
      <p className={completed ? 'font-bold text-[#24483a]' : 'font-bold text-soil/70'}>{completed ? '此任務已完成，詳情仍可隨時查看。' : '可直接在此卡片標記完成；完成狀態會與「任務」頁同步。'}</p>
    </div>
  </article>
}

export default function SkillTree({ state, tasks = [], toggleTaskCompletion }) {
  const [expandedTaskIds, setExpandedTaskIds] = useState({})
  const completed = getCompletedMap(state.completed)

  function toggleTaskDetails(taskId) {
    setExpandedTaskIds((current) => ({ ...current, [taskId]: !current[taskId] }))
  }

  return <div className="space-y-5 pb-32">
    <section className="muji-card">
      <p className="muji-kicker">Skill Progress</p>
      <h1 className="text-2xl font-black text-bark">技能樹與能力任務</h1>
      <p className="mt-2 text-soil/70">完成不同系統的能力任務，累積 XP 並提升對應能力等級。</p>
    </section>

    <section className="muji-card compact-card household-capability-intro">
      <p className="muji-kicker">Household Capability</p>
      <h2 className="text-xl font-black text-bark">家庭能力升級</h2>
      <p className="mt-2 text-soil/70">十個能力分支共 30 項任務。各分支與任務詳情預設收合，可在原卡片內查看，不會跳離目前位置。</p>
    </section>

    {skillSystems.map(([system,label]) => {
      const systemTasks = tasks.filter((task) => task.system === system)
      if (!systemTasks.length) return null
      const xp = systemTasks.reduce((sum,task) => completed[task.id] ? sum + safeNumber(task.xp) : sum, 0)
      const totalXp = systemTasks.reduce((sum,task) => sum + safeNumber(task.xp), 0)
      const level = Math.max(1, Math.floor(xp / 50) + 1)
      const percent = totalXp > 0 ? Math.min(100, Math.round((xp / totalXp) * 100)) : 0
      const content = <>
        <div className="skill-system-summary">
          <div><span className="badge">Lv.{level}</span><h2 className="mt-2 text-xl font-black text-bark">{label}</h2><p>{xp} / {totalXp} XP · 完成 {systemTasks.filter((task)=>completed[task.id]).length}/{systemTasks.length}</p></div>
          <strong>{percent}%</strong>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#d5c9b4]"><div className="h-full rounded-full bg-[#24483a]" style={{width:`${percent}%`}}/></div>
        <div className="mt-4 space-y-3">
          {systemTasks.map((task)=><SkillTaskCard key={task.id} task={task} completed={Boolean(completed[task.id])} open={Boolean(expandedTaskIds[task.id])} toggleDetails={()=>toggleTaskDetails(task.id)} toggleCompletion={()=>toggleTaskCompletion(task, '從技能樹完成能力任務。')}/>) }
        </div>
      </>

      if (capabilitySystemIds.has(system)) {
        return <CollapsibleSection key={system} title={label} subtitle={`Lv.${level} · ${xp}/${totalXp} XP · 完成 ${systemTasks.filter((task)=>completed[task.id]).length}/${systemTasks.length}`} badge={`${percent}%`} className="skill-system-section household-skill-branch">
          {content}
        </CollapsibleSection>
      }

      return <section key={system} className="muji-card skill-system-section">{content}</section>
    })}
  </div>
}
