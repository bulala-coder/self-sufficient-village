import React from 'react'
import { AlertTriangle, Apple, Backpack, Battery, BookOpen, Calculator, ClipboardCheck, Droplets, FileText, HeartPulse, Leaf, ListChecks, MessageCircle, Package, Radio, Route, ShieldCheck, Trash2 } from 'lucide-react'
import CollapsibleSection from './CollapsibleSection.jsx'

const tools = [
  {
    id: 'waterSystem',
    title: '水資源系統', subtitle: 'Water System｜v6.0 RC',
    description: '管理家庭與動物飲水、儲水、補水、淨水與停水分配方案。',
    button: '打開水資源系統',
    icon: Droplets
  },
  {
    id: 'energySystem',
    title: '能源系統', subtitle: 'Energy System｜v6.0 RC',
    description: '管理家庭停電時的電力、照明、通訊、烹調燃料與必要設備續航。',
    button: '打開能源系統',
    icon: Battery
  },
  {
    id: 'sanitationSystem',
    title: '衛生系統', subtitle: 'Sanitation System｜v6.0 RC',
    description: '管理停水停電時的廁所、排泄、垃圾、清潔、消毒與寵物排泄支撐能力。',
    button: '打開衛生系統',
    icon: Trash2
  },
  {
    id: 'medicalSystem',
    title: '醫療系統', subtitle: 'Medical System｜v6.0 RC',
    description: '管理家庭與寵物的急救用品、常備藥、慢性需求、醫療聯絡人與災害照護方案。',
    button: '打開醫療系統',
    icon: HeartPulse
  },
  { id:'foodSystem', title:'食物系統', subtitle:'Food System｜v6.0 RC', description:'管理家庭與寵物食物、熱量、份數、保存期限、免烹調食物與配給方案。', button:'打開食物系統', icon:Apple },
  { id:'communicationSystem', title:'通訊系統', subtitle:'Communication System｜v6.0 RC', description:'管理緊急聯絡人、通訊設備、離線資訊、集合地點、紙本文件與家庭報平安計畫。', button:'打開通訊系統', icon:Radio },
  { id:'tasks', title:'任務系統', subtitle:'Mission System', description:'依家庭缺口執行可驗證任務，並記錄完成狀態與能力經驗。', button:'打開任務系統', icon:ListChecks },
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
    button: '打開硬核計算器',
    icon: Calculator
  },
  {
    id: 'preparedness',
    title: '72 小時備災',
    description: '檢查基本飲水、食物、照明、醫療、文件與動物用品。',
    button: '打開 72 小時備災清單',
    icon: ShieldCheck
  },
  {
    id: 'skills',
    title: '技能樹與能力任務', subtitle: 'Household Capability',
    description: '以 10 個家庭能力分支、30 項可執行任務與安全演練，補強家庭的實作、判斷、交接與維護能力。',
    button: '打開能力任務',
    icon: ListChecks
  },
  { id:'inventory', title:'庫存管理', subtitle:'Inventory', description:'管理飲水、食物、醫療、能源與動物物資的數量、效期及位置。', button:'打開庫存管理', icon:Package },
  { id:'risk', title:'家庭風險矩陣', subtitle:'Risk Matrix', description:'依住所、地形、補給與醫療距離找出優先處理風險。', button:'打開風險矩陣', icon:AlertTriangle },
  { id:'drills', title:'情境演練', subtitle:'Scenario Drills', description:'用低風險演練驗證家庭流程、停止條件與物資缺口。', button:'開始情境演練', icon:ClipboardCheck },
  { id:'report', title:'作戰報告', subtitle:'Fortress Report', description:'彙整六大系統、任務、庫存、風險與壓力測試結果。', button:'查看作戰報告', icon:FileText },
  { id:'roadmap', title:'能力路線圖', subtitle:'Readiness Roadmap', description:'依目前完成狀態查看近期優先事項與長期能力階段。', button:'查看能力路線圖', icon:Route },
  {
    id: 'plants',
    title: '食物生產',
    description: '記錄作物、採收、留種與每月產出，建立半自給食物基礎。',
    button: '打開食物生產',
    icon: Leaf
  },
  {
    id: 'manual',
    title: '離線手冊',
    description: '保留停水、停電、地震、颱風、動物撤離與偏遠地區處置流程。',
    button: '查看離線手冊',
    icon: BookOpen
  },
  { id:'journal', title:'任務日誌', subtitle:'Mission Journal', description:'查看已完成任務、完成日期與當時記錄的改善重點。', button:'查看任務日誌', icon:FileText },
  { id:'elder', title:'家庭韌性建議', subtitle:'Rule-based Guidance', description:'以內建規則回答常見的陽台、地形、急救準備與能力提升問題。', button:'打開家庭韌性建議', icon:MessageCircle }
]

const coreTools = tools.slice(0, 6)
const supportTools = tools.slice(6)

function ToolGrid({ items, setPage }) {
  return <section className="grid gap-4 md:grid-cols-2">
    {items.map((tool) => {
      const Icon = tool.icon
      return <article key={tool.id} className="muji-card">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-soil/15 bg-white/70 p-3 text-[#24483a]"><Icon size={22}/></div>
          <div className="min-w-0"><h2>{tool.title}</h2>{tool.subtitle && <small className="tool-subtitle">{tool.subtitle}</small>}<p>{tool.description}</p></div>
        </div>
        <button type="button" className="btn-primary mt-5 w-full sm:w-auto" onClick={() => setPage(tool.id)}>{tool.button}</button>
      </article>
    })}
  </section>
}

export default function Tools({ setPage }) {
  return (
    <div className="space-y-5 pb-32">
      <section className="muji-card">
        <p className="muji-kicker">工具總覽｜v6.0 RC</p>
        <h1 className="text-2xl font-black text-bark">工具中心</h1>
        <p className="mt-2 leading-7 text-soil/70">
          集中開啟六大核心系統、任務、庫存、演練、報告、路線圖與離線手冊。
        </p>
      </section>

      <ToolGrid items={coreTools} setPage={setPage}/>
      <CollapsibleSection title="任務與支援工具" subtitle="任務、能力、庫存、風險、演練、報告、路線與離線工具" badge={`${supportTools.length} 項`}>
        <ToolGrid items={supportTools} setPage={setPage}/>
      </CollapsibleSection>
    </div>
  )
}
