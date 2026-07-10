import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Circle, ClipboardList, Filter, Target } from 'lucide-react'
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

export default function TaskList({ state, tasks, completeTask }) {
  const [selected, setSelected] = useState(null)
  const [reflection, setReflection] = useState('')
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
    setSelected(task)
    setReflection('')
    setTimeout(() => {
      document.getElementById('task-detail-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
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
              <p className="mt-2 text-sm font-bold text-[#8b2f25]">{recommendation.gap}</p>
              <p className="mt-2 leading-7 text-soil/70">{recommendation.reason}</p>
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

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  done
                    ? 'border-[#24483a]/25 bg-[#24483a]/10'
                    : 'border-soil/10 bg-white/70 hover:bg-[#fbf7ec]'
                }`}
              >
                <div className="flex items-start gap-3">
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
                    <p className="mt-2 text-sm font-bold text-soil/70">{task.relatedGap}</p>
                  </div>

                  <span className="shrink-0 text-sm font-black text-soil/70">{task.xp} XP</span>
                </div>
              </button>
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

      <section id="task-detail-panel" className="muji-card scroll-mt-6">
        <div className="muji-section-title">
          <ClipboardList size={20} />
          <span>任務詳情</span>
        </div>

        {selected ? (
          <div className="mt-4 space-y-5">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="badge">{taskSystemLabels[selected.system]}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${riskClass(selected.riskLevel)}`}>
                  Level {selected.riskLevel}
                </span>
                <span className="badge">{selected.estimatedMinutes} 分鐘</span>
              </div>
              <h3 className="mt-3 text-2xl font-black text-bark">{selected.title}</h3>
              <p className="mt-2 text-sm font-bold text-[#8b2f25]">{selected.relatedGap}</p>
            </div>

            <TaskBlock title="目的">
              <p>{selected.purpose}</p>
            </TaskBlock>

            <TaskBlock title="需要工具">
              <TagList items={selected.tools} />
            </TaskBlock>

            <TaskBlock title="步驟">
              <ol className="list-decimal space-y-2 pl-5">
                {selected.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </TaskBlock>

            <TaskBlock title="完成標準">
              <p>{selected.completion}</p>
            </TaskBlock>

            <TaskBlock title="失敗條件">
              <ul className="list-disc space-y-2 pl-5">
                {selected.failureConditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            </TaskBlock>

            <TaskBlock title="對應演練">
              {selected.relatedDrills.length > 0 ? (
                <TagList items={selected.relatedDrills} />
              ) : (
                <p>無直接對應演練。</p>
              )}
            </TaskBlock>

            <div className="rounded-2xl border border-soil/15 bg-[#fbf7ec] p-4 text-sm font-bold leading-7 text-soil/75">
              XP：{selected.xp}。任務只要求安全範圍內的盤點、測試、記錄與補缺口，不要求冒險行動。
            </div>

            {completed[selected.id] ? (
              <p className="font-bold text-[#24483a]">已完成。這個任務已經加入你的自足日誌。</p>
            ) : (
              <>
                <textarea
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="寫下完成結果、發現的缺口、下一個補強動作。"
                  className="min-h-36 w-full rounded-2xl border border-soil/10 bg-white/80 p-4 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
                />

                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() =>
                    completeTask(
                      selected,
                      reflection || '完成任務，已記錄可驗證結果與後續缺口。'
                    )
                  }
                >
                  完成任務
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="mt-4 text-soil/70">請先選擇上方任務，任務詳情會顯示在這裡。</p>
        )}
      </section>
    </div>
  )
}

function TaskBlock({ title, children }) {
  return (
    <div className="rounded-2xl border border-soil/10 bg-white/65 p-4 leading-7 text-soil">
      <h4 className="mb-2 font-black text-bark">{title}</h4>
      {children}
    </div>
  )
}

function TagList({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="badge">{item}</span>
      ))}
    </div>
  )
}
