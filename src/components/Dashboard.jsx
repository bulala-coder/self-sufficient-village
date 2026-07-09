import React from 'react'
import { Leaf, ListChecks, ShieldCheck, Package, Sprout, HeartPulse } from 'lucide-react'

const routeLabels = {
  balcony_beginner: '城市陽台路線',
  rural_beginner: '平地農村路線',
  mountain_living: '山區生活路線',
  coastal_living: '海邊生活路線',
  riverside_valley: '河邊／溪谷路線',
  island_resilience: '離島韌性路線',
  family_nature_education: '親子自然教育路線',
}

function getLevel(xp) {
  if (xp >= 15000) return { level: 50, title: '半自足者' }
  if (xp >= 6000) return { level: 30, title: '農村實習生' }
  if (xp >= 3000) return { level: 20, title: '菜園學徒' }
  if (xp >= 1000) return { level: 10, title: '陽台農夫' }
  if (xp >= 350) return { level: 5, title: '發芽學徒' }
  return { level: 1, title: '城市種子' }
}

export default function Dashboard({ state, tasks, completedCount, setPage }) {
  const { level, title } = getLevel(state.xp || 0)
  const score = Math.min(
    100,
    Math.round(
      (completedCount / Math.max(tasks.length, 1)) * 45 +
      Math.min((state.xp || 0) / 1000, 1) * 25 +
      Math.min((state.journal?.length || 0) / 10, 1) * 30
    )
  )

  const todayTask = tasks.find((task) => !state.completed?.[task.id]) || tasks[0]

  return (
    <div className="muji-dashboard space-y-5 pb-28">
      <section className="muji-hero">
        <div>
          <p className="muji-kicker">Self-Sufficient Village</p>
          <h1>自足村</h1>
          <p className="muji-subtitle">
            今天，從一件小事開始。慢慢建立食物、水、工具、健康與生活韌性。
          </p>
        </div>

        <div className="muji-route">
          {routeLabels[state.routeType] || '城市陽台路線'}
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <Leaf size={18} />
          <span>今日任務</span>
        </div>

        <h2>{todayTask?.title || '建立你的第一個自足任務'}</h2>

        <p>
          {todayTask?.description ||
            '先完成一件小事，讓自足生活從可以做到的地方開始。'}
        </p>

        <div className="muji-task-meta">
          <span>{todayTask?.category || '入門'}</span>
          <span>{todayTask?.xp || 10} XP</span>
        </div>

        <button className="muji-primary" onClick={() => setPage('tasks')}>
          查看任務
        </button>
      </section>

      <section className="muji-grid">
        <div className="muji-stat">
          <span>等級</span>
          <strong>Lv.{level}</strong>
          <small>{title}</small>
        </div>

        <div className="muji-stat">
          <span>自足度</span>
          <strong>{score}%</strong>
          <small>持續累積中</small>
        </div>

        <div className="muji-stat">
          <span>任務</span>
          <strong>{completedCount}/{tasks.length}</strong>
          <small>已完成</small>
        </div>

        <div className="muji-stat">
          <span>日誌</span>
          <strong>{state.journal?.length || 0}</strong>
          <small>篇紀錄</small>
        </div>
      </section>

      <section className="muji-card">
        <div className="muji-section-title">
          <ListChecks size={18} />
          <span>生活工具</span>
        </div>

        <div className="muji-tool-grid">
          <button onClick={() => setPage('tasks')}>
            <ListChecks size={18} />
            <span>30 天任務</span>
          </button>

          <button onClick={() => setPage('preparedness')}>
            <ShieldCheck size={18} />
            <span>家庭備災</span>
          </button>

          <button onClick={() => setPage('inventory')}>
            <Package size={18} />
            <span>物資庫存</span>
          </button>

          <button onClick={() => setPage('plants')}>
            <Leaf size={18} />
            <span>種植紀錄</span>
          </button>

          <button onClick={() => setPage('health')}>
            <HeartPulse size={18} />
            <span>健康急救</span>
          </button>

          <button onClick={() => setPage('skills')}>
            <Sprout size={18} />
            <span>技能樹</span>
          </button>

          <button onClick={() => setPage('score')}>
            <ShieldCheck size={18} />
            <span>自足度</span>
          </button>
        </div>
      </section>

      <section className="muji-note">
        <Package size={18} />
        <div>
          <strong>村長提醒</strong>
          <p>
            不要急著做很多。今天只要完成一件小事，記錄下來，就是生活能力的累積。
          </p>
        </div>
      </section>
    </div>
  )
}
