import React, { useState } from 'react'
import { CalendarDays, Droplets, Leaf, Plus, Trash2 } from 'lucide-react'

const initialForm = {
  name: '',
  location: '',
  plantedAt: '',
  sunlight: '半日照',
  note: ''
}

const sunlightOptions = ['全日照', '半日照', '散射光', '陰影', '不確定']

function daysSince(dateText) {
  if (!dateText) return null
  const date = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.floor((todayStart - date) / 86400000))
}

function wateringText(lastWateredAt) {
  const days = daysSince(lastWateredAt)
  if (days === null) return '尚未記錄澆水'
  if (days === 0) return '今天已澆水'
  return `距離上次澆水 ${days} 天`
}

export default function Plants({ state, addPlant, deletePlant, waterPlant }) {
  const [form, setForm] = useState(initialForm)
  const plants = state.plants || []

  function updateField(field, value) {
    setForm({ ...form, [field]: value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return

    addPlant({
      name: form.name.trim(),
      location: form.location.trim(),
      plantedAt: form.plantedAt,
      sunlight: form.sunlight,
      note: form.note.trim()
    })
    setForm(initialForm)
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Plant Log</p>
        <h1 className="text-2xl font-black text-bark">種植紀錄</h1>
        <p className="text-soil/70 mt-2 leading-7">
          記下植物、位置、日照與澆水時間。先把照顧變成可追蹤的小習慣，再慢慢擴大。
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eee5d6] px-4 py-2 text-sm font-bold text-[#3d5143]">
          <Leaf size={16} />
          <span>{plants.length} 株植物</span>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Plus size={18} />
          <span>新增植物</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-bold text-soil">
            植物名稱
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例如：九層塔"
              className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm font-bold text-soil">
              種植位置
              <input
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="例如：廚房窗邊"
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              種植日期
              <input
                type="date"
                value={form.plantedAt}
                onChange={(event) => updateField('plantedAt', event.target.value)}
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-soil">
              日照條件
              <select
                value={form.sunlight}
                onChange={(event) => updateField('sunlight', event.target.value)}
                className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
              >
                {sunlightOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-bold text-soil">
            備註
            <textarea
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="例如：土乾再澆，先觀察葉片狀態"
              rows="3"
              className="resize-none rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            />
          </label>

          <button type="submit" className="btn-primary w-full sm:w-auto justify-self-start">
            新增植物
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {plants.length === 0 ? (
          <div className="muji-note">
            <Leaf size={18} />
            <div>
              <strong>目前沒有種植紀錄</strong>
              <p>先從蔥、九層塔、薄荷、地瓜葉等低門檻植物開始。</p>
            </div>
          </div>
        ) : (
          plants.map((plant) => (
            <article key={plant.id} className="muji-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">{plant.sunlight || '不確定'}</span>
                    <h2 className="font-black text-xl text-bark break-words">{plant.name}</h2>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm font-bold text-soil/75 sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <Leaf size={16} />
                      <span>{plant.location || '未填位置'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      <span>{plant.plantedAt || '未填種植日期'}</span>
                    </p>
                    <p className="flex items-center gap-2 sm:col-span-2">
                      <Droplets size={16} />
                      <span>{wateringText(plant.lastWateredAt)}</span>
                    </p>
                  </div>

                  {plant.note && (
                    <p className="mt-3 text-sm leading-7 text-soil/70 break-words">{plant.note}</p>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => waterPlant(plant.id)}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Droplets size={16} />
                      今天已澆水
                    </button>
                    {plant.lastWateredAt && (
                      <span className="inline-flex items-center text-sm font-bold text-soil/60">
                        上次澆水：{plant.lastWateredAt}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deletePlant(plant.id)}
                  className="shrink-0 rounded-2xl border border-soil/15 bg-white/70 p-3 text-soil/70 transition hover:text-red-800"
                  aria-label={`刪除 ${plant.name}`}
                  title="刪除植物"
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
