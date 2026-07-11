import React, { useMemo, useState } from 'react'
import { Sprout, Home, ListChecks, Wrench, RotateCcw, AlertTriangle, Package, ClipboardCheck, FileText, Route } from 'lucide-react'
import Welcome from './components/Welcome.jsx'
import Onboarding from './components/Onboarding.jsx'
import Dashboard from './components/Dashboard.jsx'
import TaskList from './components/TaskList.jsx'
import SkillTree from './components/SkillTree.jsx'
import SelfScore from './components/SelfScore.jsx'
import HealthSafety from './components/HealthSafety.jsx'
import Preparedness from './components/Preparedness.jsx'
import RiskMatrix from './components/RiskMatrix.jsx'
import Inventory from './components/Inventory.jsx'
import Plants from './components/Plants.jsx'
import Tools from './components/Tools.jsx'
import Drills from './components/Drills.jsx'
import Calculators from './components/Calculators.jsx'
import EvacuationKit from './components/EvacuationKit.jsx'
import Report from './components/Report.jsx'
import Manual from './components/Manual.jsx'
import Roadmap from './components/Roadmap.jsx'
import Journal from './components/Journal.jsx'
import VillageElder from './components/VillageElder.jsx'
import WaterSystem from './components/WaterSystem.jsx'
import { getCompletedMap, getTasks, taskSystemLabels } from './data/tasks.js'
import { decideRoute } from './data/routes.js'

const STORAGE_KEY = 'self_sufficient_village_v1'
const defaultState = { started: false, onboarded: false, profile: null, routeType: null, completed: {}, journal: [], xp: 0, preparedness: {}, riskProfile: {}, inventory: [], plants: [], drills: {}, calculators: {}, evacuationKit: {}, roadmap: {} }

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return savedState && typeof savedState === 'object' ? { ...defaultState, ...savedState } : defaultState
  } catch {
    return defaultState
  }
}
function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }

const navItems = [
  ['dashboard','首頁',Home], ['tasks','任務',ListChecks], ['risk','風險',AlertTriangle], ['inventory','庫存',Package], ['tools','工具',Wrench], ['drills','演練',ClipboardCheck], ['report','報告',FileText], ['roadmap','路線',Route]
]

export default function App() {
  const [state, setState] = useState(loadState)
  const [page, setPage] = useState('dashboard')
  const tasks = useMemo(() => getTasks(state.routeType), [state.routeType])
  const completedCount = Object.keys(getCompletedMap(state.completed)).length

  function update(next) { const newState = typeof next === 'function' ? next(state) : next; setState(newState); saveState(newState) }
  function start() { update({ ...state, started: true }) }
  function finishOnboarding(profile) { const routeType = decideRoute(profile); update({ ...state, onboarded: true, profile, routeType, started: true }) }
  function togglePreparedness(itemId) {
    update({ ...state, preparedness: { ...(state.preparedness || {}), [itemId]: !state.preparedness?.[itemId] } })
  }
  function updateRiskProfile(values) {
    update({ ...state, riskProfile: values || {} })
  }
  function addInventoryItem(item) {
    update({ ...state, inventory: [{ ...item, id: Date.now() }, ...(state.inventory || [])] })
  }
  function deleteInventoryItem(itemId) {
    update({ ...state, inventory: (state.inventory || []).filter((item) => item.id !== itemId) })
  }
  function addPlant(plant) {
    update({ ...state, plants: [{ ...plant, id: Date.now(), lastWateredAt: '' }, ...(state.plants || [])] })
  }
  function deletePlant(plantId) {
    update({ ...state, plants: (state.plants || []).filter((plant) => plant.id !== plantId) })
  }
  function updatePlant(plantId, values) {
    update({ ...state, plants: (state.plants || []).map((plant) => plant.id === plantId ? { ...plant, ...values } : plant) })
  }
  function waterPlant(plantId) {
    const today = new Date().toISOString().slice(0, 10)
    update({ ...state, plants: (state.plants || []).map((plant) => plant.id === plantId ? { ...plant, lastWateredAt: today } : plant) })
  }
  function toggleDrillItem(drillId, itemId) {
    const currentDrill = state.drills?.[drillId] || {}
    update({
      ...state,
      drills: {
        ...(state.drills || {}),
        [drillId]: { ...currentDrill, [itemId]: !currentDrill[itemId] }
      }
    })
  }
  function updateCalculator(calculatorId, values) {
    update({ ...state, calculators: { ...(state.calculators || {}), [calculatorId]: values } })
  }
  function updateEvacuationKit(values) {
    update({ ...state, evacuationKit: values || {} })
  }
  function updateRoadmap(values) {
    update({ ...state, roadmap: values || {} })
  }

  function completeTask(task, reflection) {
    const completedMap = getCompletedMap(state.completed)
    if (completedMap[task.id]) return
    const entry = { id: Date.now(), taskId: task.id, title: task.title, category: taskSystemLabels[task.system] || task.category || '任務', reflection, date: new Date().toLocaleDateString('zh-TW') }
    update({ ...state, completed: { ...completedMap, [task.id]: true }, journal: [entry, ...(state.journal || [])], xp: state.xp + task.xp })
  }
  function reset() {
    if (confirm('確定要清除本機資料，重新開始嗎？')) { localStorage.removeItem(STORAGE_KEY); setState(defaultState); setPage('dashboard') }
  }

  if (!state.started) return <Welcome onStart={start} />
  if (!state.onboarded) return <Onboarding onFinish={finishOnboarding} />

  const commonProps = { state, tasks, completedCount, completeTask, setPage, togglePreparedness, updateRiskProfile, addInventoryItem, deleteInventoryItem, addPlant, deletePlant, updatePlant, waterPlant, toggleDrillItem, updateCalculator, updateEvacuationKit, updateRoadmap }

  return <div className="ink-page min-h-screen pb-28">
    <header className="ink-header sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="ink-logo w-12 h-12 rounded-2xl grid place-items-center"><Sprout size={25}/></div>
          <div><h1 className="ink-title font-black text-2xl">Fortress OS｜自足堡壘</h1><p className="text-sm text-[#8b7455] font-semibold">家庭韌性、補給中斷與自給生存管理系統</p></div>
        </div>
        <button className="btn-secondary text-sm" onClick={reset}><RotateCcw size={14} className="inline mr-1"/>重新開始</button>
      </div>
    </header>
    <main className="max-w-6xl mx-auto px-4 py-6">
      {page === 'dashboard' && <Dashboard {...commonProps}/>} 
      {page === 'tasks' && <TaskList {...commonProps}/>} 
      {page === 'preparedness' && <Preparedness {...commonProps}/>} 
      {page === 'risk' && <RiskMatrix {...commonProps}/>} 
      {page === 'inventory' && <Inventory {...commonProps}/>} 
      {page === 'tools' && <Tools {...commonProps}/>} 
      {page === 'waterSystem' && <WaterSystem {...commonProps}/>}
      {page === 'plants' && <Plants {...commonProps}/>} 
      {page === 'drills' && <Drills {...commonProps}/>} 
      {page === 'calculators' && <Calculators {...commonProps}/>} 
      {(page === 'evacuationKit' || page === 'evacuation') && <EvacuationKit {...commonProps}/>} 
      {page === 'report' && <Report {...commonProps}/>} 
      {page === 'manual' && <Manual {...commonProps}/>} 
      {page === 'roadmap' && <Roadmap {...commonProps}/>} 
      {page === 'skills' && <SkillTree {...commonProps}/>} 
      {page === 'score' && <SelfScore {...commonProps}/>} 
      {page === 'health' && <HealthSafety/>} 
      {page === 'journal' && <Journal entries={state.journal}/>} 
      {page === 'elder' && <VillageElder state={state}/>} 
    </main>
    <nav className="ink-nav fixed bottom-0 inset-x-0">
      <div className="max-w-6xl mx-auto grid grid-cols-4 sm:grid-cols-8 gap-1 px-2 py-2">
        {navItems.map(([id,label,Icon]) => <button key={id} onClick={() => setPage(id)} className={`rounded-2xl py-2 text-xs flex flex-col items-center gap-1 transition ${page===id?'bg-[#24483a] text-[#fff9ea] shadow-soft':'text-[#6f5b43] hover:text-[#24483a]'}`}><Icon size={18}/>{label}</button>)}
      </div>
    </nav>
  </div>
}
