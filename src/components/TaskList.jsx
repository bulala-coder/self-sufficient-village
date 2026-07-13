import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Circle, ClipboardList, Filter, Target } from 'lucide-react'
import { getCompletedMap, getRecommendedTask, taskSystemLabels, taskSystems } from '../data/tasks.js'

const riskFilters = [
  ['all', '全部'],
  ['low', 'Level 1-2'],
  ['mid', 'Level 3'],
  ['high', 'Level 4-5']
]

function riskMatches(task, filter) {
  if (filter === 'low') return task.riskLevel <= 2
  if (filter === 'mid') return task.riskLevel === 3
  if (filter === 'high') return task.riskLevel >= 4
  return true
}

function riskClass(level) {
  if (level >= 4) return 'bg-[#8b2f25] text-[#fff9ea]'
  if (level === 3) return 'bg-[#c2a25c] text-[#241b10]'
  return 'bg-[#24483a] text-[#fff9ea]'
}

export default function TaskList({ state, tasks, toggleTaskCompletion }) {
  const [openTasks, setOpenTasks] = useState({})
  const [reflections, setReflections] = useState({})
  const [systemFilter, setSystemFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const completed = getCompletedMap(state.completed)
  const recommendation = getRecommendedTask(tasks, state)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const systemOk = systemFilter === 'all' || task.system === systemFilter
      return systemOk && riskMatches(task, riskFilter)
    })
  }, [tasks, systemFilter, riskFilter])

  function openTask(task) {
    setOpenTasks((current) => ({ ...current, [task.id]: true }))
  }

  function toggleTask(taskId) {
    setOpenTasks((current) => ({ ...current, [taskId]: !current[taskId] }))
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Mission System v3.0</p>
        <h1 className="text-2xl font-black text-bark">硬核任務系統</h1>
        <p className="text-soil/70 mt-2 leading-7">
          根據水、食物、電力、醫療、動物、地形與撤離缺口，建立可驗證的生存能力。
        </p>
      </section>

      {recommendation && (
        <section className="muji-card border-[#8b2f25]/25">
          <div className="muji-section-title">
            <Target size={18} />
            <span>建議優先任務</span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge">{taskSystemLabels[recommendation.task.system]}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClass(recommendation.task.riskLevel)}`}>
                  Level {recommendation.task.riskLevel}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-black text-bark">{recommendation.task.title}</h2>
              <p className="mt-2 text-sm font-bold text-[#8b2f25]"><span className="critical-point">對應缺口</span>：{recommendation.gap}</p>
              <p className="mt-2 leading-7 text-soil/70">依目前資料，先處理 <span className="emphasis-underline">風險等級</span> Level {recommendation.task.riskLevel} 的任務。{recommendation.reason}</p>
            </div>

            <button type="button" className="btn-primary shrink-0" onClick={() => openTask(recommendation.task)}>
              查看任務
            </button>
          </div>
        </section>
      )}

      <section className="muji-card">
        <div className="muji-section-title">
          <Filter size={18} />
          <span>任務篩選</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-soil">
            系統分類
            <select
              value={systemFilter}
              onChange={(event) => setSystemFilter(event.target.value)}
              className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            >
              {taskSystems.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-bold text-soil">
            風險等級
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            >
              {riskFilters.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <ClipboardList size={18} />
          <span>能力任務</span>
        </div>

        <div className="mt-5 space-y-3">
          {filteredTasks.map((task) => {
            const done = Boolean(completed[task.id])
            const open = Boolean(openTasks[task.id])
            const detailId = `task-details-${task.id}`

            return (
              <article
                key={task.id}
                id={`task-${task.id}`}
                className={`task-card ${
                  done
                    ? 'task-card-complete'
                    : ''
                }`}
              >
                <div className="task-summary-row">
                  {done ? (
                    <CheckCircle2 className="mt-1 shrink-0 text-[#24483a]" />
                  ) : (
                    <Circle className="mt-1 shrink-0 text-soil/40" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge">{taskSystemLabels[task.system]}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClass(task.riskLevel)}`}>
                        Level {task.riskLevel}
                      </span>
                      <span className="badge">{task.estimatedMinutes} 分鐘</span>
                      {done && <span className="badge bg-[#24483a] text-[#fff9ea]">已完成</span>}
                    </div>

                    <h2 className="mt-3 font-black text-lg text-bark">{task.title}</h2>
                    {task.relatedGap && <p className="mt-2 font-bold text-soil/70">{task.relatedGap}</p>}
                  </div>

                  <span className="shrink-0 text-sm font-black text-soil/70">{task.xp} XP</span>
                </div>

                <div className="task-completion-row">
                  <button
                    type="button"
                    className={`task-complete-button ${done ? 'is-complete' : ''}`}
                    aria-pressed={done}
                    onClick={() => toggleTaskCompletion(task, reflections[task.id] || '完成任務，已記錄可驗證結果與後續缺口。')}
                  >
                    {done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                    <span>{done ? '取消完成' : '標記完成'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="task-detail-toggle"
                  aria-expanded={open}
                  aria-controls={detailId}
                  onClick={() => toggleTask(task.id)}
                >
                  <span>{open ? '收起詳情' : '任務詳情'}</span>
                  {open ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>

                <div id={detailId} className="task-detail-panel" hidden={!open}>
                  <TaskDetails task={task}/>

                  <div className="task-safety-note">
                    XP：{task.xp}。任務只要求安全範圍內的盤點、測試、記錄與補缺口，不要求冒險行動。
                  </div>

                  {done ? (
                    <p className="font-bold text-[#24483a]">已完成。這個任務已經加入你的自足日誌，仍可隨時查看詳情。</p>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={reflections[task.id] || ''}
                        onChange={(event) => setReflections((current) => ({ ...current, [task.id]: event.target.value }))}
                        placeholder="寫下完成結果、發現的缺口、下一個補強動作。"
                        className="min-h-32 w-full rounded-2xl border border-soil/15 bg-white p-4 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
                      />
                      <button
                        type="button"
                        className="btn-primary w-full"
                        onClick={() => toggleTaskCompletion(task, reflections[task.id] || '完成任務，已記錄可驗證結果與後續缺口。')}
                      >
                        完成任務
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="muji-note mt-4">
            <AlertTriangle size={18} />
            <div>
              <strong>沒有符合條件的任務</strong>
              <p>調整系統分類或風險等級篩選。</p>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}

function hasContent(value) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== ''
}

function TaskDetails({ task }) {
  return <div className="space-y-4">
    {hasContent(task.purpose) && <TaskBlock title="任務說明"><p>{task.purpose}</p></TaskBlock>}
    {hasContent(task.steps) && <TaskBlock title="執行步驟"><ol className="task-detail-list list-decimal">{task.steps.map((step, index) => <li key={`${task.id}-step-${index}`}>{step}</li>)}</ol></TaskBlock>}
    {hasContent(task.completion) && <TaskBlock title="完成標準"><p>{task.completion}</p></TaskBlock>}
    {hasContent(task.tools) && <TaskBlock title="所需物品"><TagList items={task.tools}/></TaskBlock>}
    {hasContent(task.failureConditions) && <TaskBlock title="注意事項"><ul className="task-detail-list list-disc">{task.failureConditions.map((condition, index) => <li key={`${task.id}-condition-${index}`}>{condition}</li>)}</ul></TaskBlock>}
    {hasContent(task.relatedDrills) && <TaskBlock title="相關演練"><TagList items={task.relatedDrills}/></TaskBlock>}
  </div>
}

function TaskBlock({ title, children }) {
  const titleClass = title === '完成標準' ? 'action-point' : title === '失敗條件' ? 'critical-point' : ''

  return (
    <div className="task-detail-section">
      <h4 className={`task-detail-title ${titleClass}`}>{title}</h4>
      {children}
    </div>
  )
}

function TagList({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Array.isArray(items) ? items : []).filter(hasContent).map((item) => (
        <span key={item} className="badge">{item}</span>
      ))}
    </div>
  )
}
