import React from 'react'
import { Backpack, BookOpen, Calculator, Droplets, Leaf, ShieldCheck } from 'lucide-react'

const tools = [
  {
    id: 'waterSystem',
    title: 'Water System 2.0',
    description: '管理家庭與動物飲水、儲水、補水、淨水與停水分配方案。',
    button: '打開水資源系統',
    icon: Droplets
  },
  {
    id: 'evacuationKit',
    title: '撤離包',
    description: '管理人用、動物用、醫療、文件、通訊與防護物資。',
    button: '打開撤離包',
    icon: Backpack
  },
  {
    id: 'calculators',
    title: '硬核計算器',
    description: '估算飲水、食物、電力與撤離包重量。',
    button: '打開計算器',
    icon: Calculator
  },
  {
    id: 'preparedness',
    title: '72 小時備災',
    description: '檢查基本飲水、食物、照明、醫療、文件與動物用品。',
    button: '打開備災',
    icon: ShieldCheck
  },
  {
    id: 'plants',
    title: '食物生產',
    description: '記錄作物、採收、留種與每月產出，建立半自給食物基礎。',
    button: '打開生產',
    icon: Leaf
  },
  {
    id: 'manual',
    title: '離線手冊',
    description: '保留停水、停電、地震、颱風、動物撤離與偏遠地區處置流程。',
    button: '打開手冊',
    icon: BookOpen
  }
]

export default function Tools({ setPage }) {
  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">Tools Center</p>
        <h1 className="text-2xl font-black text-bark">工具中心</h1>
        <p className="mt-2 leading-7 text-soil/70">
          集中管理撤離包、硬核計算器、72 小時備災、長期自給工具與離線手冊。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon

          return (
            <article key={tool.id} className="muji-card">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-soil/15 bg-white/70 p-3 text-[#24483a]">
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <h2>{tool.title}</h2>
                  <p>{tool.description}</p>
                </div>
              </div>
              <button type="button" className="btn-primary mt-5 w-full sm:w-auto" onClick={() => setPage(tool.id)}>
                {tool.button}
              </button>
            </article>
          )
        })}
      </section>
    </div>
  )
}
