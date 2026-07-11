import React from 'react'
import { buildCategoryUsageChartData, buildDailyUsageSeries, calculateUsageTypeSplit, findOverBudgetUsageDays, getUsageTrendSummary } from '../utils/waterUsage.js'

const safe = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
const fmt = (value) => Number(safe(value).toFixed(1)).toString()
const width = (value, maximum) => maximum > 0 ? Math.min(100, Math.max(0, safe(value) / maximum * 100)) : 0

function DailyBars({ series, overBudgetDates, compact = false }) {
  const maximum = Math.max(0, ...series.map((item) => item.totalLiters))
  return <div className={compact ? 'water-mini-bars' : 'water-bar-chart'}>
    {series.map((item) => <div key={item.date} className={`water-mini-bar ${overBudgetDates.has(item.date) ? 'water-over-budget' : ''}`} title={`${item.date}：${fmt(item.totalLiters)} L`}>
      <span className="water-bar-value">{fmt(item.totalLiters)} L</span>
      <div className="water-vertical-track"><span style={{ height: `${width(item.totalLiters, maximum)}%` }} /></div>
      <span className="water-bar-label">{item.label}</span>
      {overBudgetDates.has(item.date) && <span className="water-budget-mark" aria-label="超過計畫用水">!</span>}
    </div>)}
  </div>
}

export default function WaterUsageCharts({ usageLogs = [], summary = {} }) {
  const logs = Array.isArray(usageLogs) ? usageLogs : []
  const series7 = buildDailyUsageSeries(logs, 7)
  const series30 = buildDailyUsageSeries(logs, 30)
  const categories = buildCategoryUsageChartData(logs, 30)
  const split = calculateUsageTypeSplit(logs, 30)
  const overBudget = findOverBudgetUsageDays(logs, summary, 30)
  const trend = getUsageTrendSummary(logs, summary)
  const overBudgetDates = new Set(overBudget.map((item) => item.date))
  const categoryMaximum = Math.max(0, ...categories.map((item) => item.liters))
  const highest = [...series30].sort((a, b) => b.totalLiters - a.totalLiters)[0]

  if (!logs.some((log) => safe(log?.volumeLiters) > 0)) return <div className="water-chart-empty">尚無足夠用水紀錄。新增幾筆用水紀錄後，這裡會顯示趨勢。</div>

  return <div className="water-charts-grid">
    <section className="water-chart-card"><div className="water-chart-heading"><h3>7 日用水趨勢</h3><span>{trend.directionLabel}</span></div><DailyBars series={series7} overBudgetDates={overBudgetDates}/>{trend.overBudgetDays7 > 0 && <p className="water-chart-alert">最近 7 天有 {trend.overBudgetDays7} 天超過計畫用水。</p>}</section>
    <section className="water-chart-card"><div className="water-chart-heading"><h3>30 日用水趨勢</h3><span>平均 {fmt(trend.recent30Average)} L/日</span></div><div className="water-chart-scroll"><DailyBars series={series30} overBudgetDates={overBudgetDates} compact/></div><p className="water-chart-note">最高日：{highest?.totalLiters > 0 ? `${highest.label}・${fmt(highest.totalLiters)} L` : '尚無用量'}</p></section>
    <section className="water-chart-card"><h3>最近 30 日分類用水</h3><div className="water-category-bars">{categories.map((item) => <div className="water-bar-row" key={item.category}><div className="water-bar-meta"><span>{item.label}</span><strong>{fmt(item.liters)} L・{fmt(item.percentage)}%</strong></div><div className="water-bar-track"><span className="water-bar-fill" style={{ width: `${width(item.liters, categoryMaximum)}%` }}/></div></div>)}</div></section>
    <section className="water-chart-card"><h3>飲用型 / 生活型比例</h3><div className="water-split-bar" aria-label={`飲用型 ${fmt(split.drinkingPercentage)}%，生活型 ${fmt(split.utilityPercentage)}%`}><span className="water-split-drinking" style={{ width: `${Math.min(100, split.drinkingPercentage)}%` }}/><span className="water-split-utility" style={{ width: `${Math.min(100, split.utilityPercentage)}%` }}/></div><div className="water-split-legend"><p><i className="water-dot-drinking"/>飲用型 {fmt(split.drinkingLiters)} L・{fmt(split.drinkingPercentage)}%</p><p><i className="water-dot-utility"/>生活型 {fmt(split.utilityLiters)} L・{fmt(split.utilityPercentage)}%</p></div></section>
  </div>
}
