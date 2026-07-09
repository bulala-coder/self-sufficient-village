import React, { useState } from 'react'
import { Package, Plus, Trash2 } from 'lucide-react'

const categories = ['飲水', '食物', '照明', '醫療', '動物', '工具', '種植', '其他']

const initialForm = {
  name: '',
  category: '飲水',
  quantity: '',
  unit: '',
  note: ''
}

export default function Inventory({ state, addInventoryItem, deleteInventoryItem }) {
  const [form, setForm] = useState(initialForm)
  const inventory = state.inventory || []

  function updateField(field, value) {
    setForm({ ...form, [field]: value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return

    addInventoryItem({
      name: form.name.trim(),
      category: form.category,
      quantity: form.quantity.trim(),
      unit: form.unit.trim(),
      note: form.note.trim()
    })
    setForm(initialForm)
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Household Inventory</p>
        <h1 className="text-2xl font-black text-bark">物資庫存</h1>
        <p className="text-soil/70 mt-2 leading-7">
          記錄家中的飲水、食物、照明、醫療與工具物資。少量、清楚、知道放在哪裡，比一次買很多更實用。
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eee5d6] px-4 py-2 text-sm font-bold text-[#3d5143]">
          <Package size={16} />
          <span>{inventory.length} 項物資</span>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Plus size={18} />
          <span>新增物資</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-bold text-soil">
            名稱
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例如：瓶裝水"
              className="rounded-2xl border border-soil/15 bg-white/75 px-4 py-3 text-base font-semibold text-bark outline-none focus:border-[#3d5143]"
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm font-bold text-soil">
              類別
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
          </div>

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

          <button type="submit" className="btn-primary w-full sm:w-auto justify-self-start">
            新增物資
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {inventory.length === 0 ? (
          <div className="muji-note">
            <Package size={18} />
            <div>
              <strong>目前沒有物資紀錄</strong>
              <p>先從家中已經有的飲水、乾糧、手電筒或急救用品開始整理。</p>
            </div>
          </div>
        ) : (
          inventory.map((item) => (
            <article key={item.id} className="muji-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">{item.category}</span>
                    <h2 className="font-black text-xl text-bark break-words">{item.name}</h2>
                  </div>
                  <p className="mt-2 text-soil/80 font-bold">
                    {[item.quantity, item.unit].filter(Boolean).join(' ') || '未填數量'}
                  </p>
                  {item.note && (
                    <p className="mt-2 text-sm leading-7 text-soil/70 break-words">{item.note}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => deleteInventoryItem(item.id)}
                  className="shrink-0 rounded-2xl border border-soil/15 bg-white/70 p-3 text-soil/70 transition hover:text-red-800"
                  aria-label={`刪除 ${item.name}`}
                  title="刪除物資"
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
