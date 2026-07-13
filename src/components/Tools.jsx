import React from 'react'
import { Apple, Backpack, Battery, BookOpen, Calculator, Droplets, HeartPulse, Leaf, ListChecks, Radio, ShieldCheck, Trash2 } from 'lucide-react'

const tools = [
  {
    id: 'waterSystem',
    title: '水資源系統', subtitle: 'Water System 2.0',
    description: '管理家庭與動物飲水、儲水、補水、淨水與停水分配方案。',
    button: '打開水資源系統',
    icon: Droplets
  },
  {
    id: 'energySystem',
    title: '能源系統', subtitle: 'Energy System 1.0',
    description: '管理家庭停電時的電力、照明、通訊、烹調燃料與必要設備續航。',
    button: '打開能源系統',
    icon: Battery
  },
  {
    id: 'sanitationSystem',
    title: '衛生系統', subtitle: 'Sanitation System 1.0',
    description: '管理停水停電時的廁所、排泄、垃圾、清潔、消毒與寵物排泄支撐能力。',
    button: '打開衛生系統',
    icon: Trash2
  },
  {
    id: 'medicalSystem',
    title: '醫療系統', subtitle: 'Medical System 1.0',
    description: '管理家庭與寵物的急救用品、常備藥、慢性需求、醫療聯絡人與災害照護方案。',
    button: '打開醫療系統',
    icon: HeartPulse
  },
  { id:'foodSystem', title:'食物系統', subtitle:'Food System 1.0', description:'管理家庭與寵物食物、熱量、份數、保存期限、免烹調食物與配給方案。', button:'打開食物系統', icon:Apple },
  { id:'communicationSystem', title:'通訊系統', subtitle:'Communication System 1.0', description:'管理緊急聯絡人、通訊設備、離線資訊、集合地點、紙本文件與家庭報平安計畫。', button:'打開通訊系統', icon:Radio },
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
    id: 'skills',
    title: '技能樹與能力任務',
    description: '查看各系統能力進度，並在每個任務卡片內展開完整任務詳情。',
    button: '打開能力任務',
    icon: ListChecks
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
                  {tool.subtitle && <small className="tool-subtitle">{tool.subtitle}</small>}
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
