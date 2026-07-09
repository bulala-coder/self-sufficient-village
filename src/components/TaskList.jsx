import React, { useState } from 'react'
import { CheckCircle2, Circle, ClipboardList } from 'lucide-react'

export default function TaskList({ state, tasks, completeTask }) {
  const [selected, setSelected] = useState(null)
  const [reflection, setReflection] = useState('')

  return (
    <div className="space-y-5 pb-32">
      <section className="card p-5">
        <h1 className="text-2xl font-black text-bark">30 天實用自足任務</h1>
        <p className="text-soil/70 mt-1">
          每個任務都以「今天真的能完成」為原則，建立家庭韌性、備災、種植與生活能力。
        </p>

        <div className="mt-5 space-y-3">
          {tasks.map((task) => {
            const done = state.completed?.[task.id]

            return (
              <button
                key={task.id}
                onClick={() => {
                  setSelected(task)
                  setReflection('')
                  setTimeout(() => {
                    document.getElementById('task-detail-panel')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }, 50)
                }}
                className={`w-full text-left p-4 rounded-2xl border flex gap-3 items-start ${
                  done
                    ? 'bg-moss/10 border-moss/20'
                    : 'bg-white/70 border-soil/10 hover:bg-cream'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="text-moss shrink-0 mt-1" />
                ) : (
                  <Circle className="text-soil/40 shrink-0 mt-1" />
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <b className="text-bark">
                      Day {task.day}：{task.title}
                    </b>
                    <span className="badge">{task.category}</span>
                  </div>

                  <p className="text-sm text-soil/70 mt-1">
                    {task.purpose || task.description}
                  </p>
                </div>

                <span className="text-sm font-bold text-soil shrink-0">
                  {task.xp} XP
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section id="task-detail-panel" className="card p-5 scroll-mt-6">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-moss" />
          <h2 className="text-xl font-black text-bark">任務詳情</h2>
        </div>

        {selected ? (
          <div className="mt-4 space-y-5">
            <div>
              <span className="badge">{selected.category}</span>
              <h3 className="font-black text-2xl text-bark mt-3">
                {selected.title}
              </h3>
            </div>

            <TaskBlock title="任務目的">
              <p>{selected.purpose || selected.description}</p>
            </TaskBlock>

            <TaskBlock title="需要材料">
              <p>{selected.materials || '紙筆、手機或家中現有物品。'}</p>
            </TaskBlock>

            <TaskBlock title="具體步驟">
              <ol className="list-decimal pl-5 space-y-2">
                {(selected.steps || []).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </TaskBlock>

            <TaskBlock title="完成標準">
              <p>{selected.completion || '完成紀錄並寫下一個發現。'}</p>
            </TaskBlock>

            <div className="text-sm bg-cream rounded-2xl p-4 text-soil leading-7">
              <b>安全提醒：</b>
              {selected.safety}
            </div>

            {state.completed?.[selected.id] ? (
              <p className="font-bold text-moss">
                已完成。這個任務已經加入你的自足日誌。
              </p>
            ) : (
              <>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="寫下你完成了什麼、發現什麼、還缺什麼……"
                  className="w-full min-h-40 rounded-2xl border border-soil/10 p-3 bg-white/80"
                />

                <button
                  className="btn-primary w-full"
                  onClick={() =>
                    completeTask(
                      selected,
                      reflection || '完成任務，持續累積自足能力。'
                    )
                  }
                >
                  完成任務
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-soil/70 mt-4">
            請先選擇上方任務，任務詳情會顯示在這裡。
          </p>
        )}
      </section>
    </div>
  )
}

function TaskBlock({ title, children }) {
  return (
    <div className="rounded-2xl bg-white/65 border border-soil/10 p-4 text-soil leading-7">
      <h4 className="font-black text-bark mb-2">{title}</h4>
      {children}
    </div>
  )
}
