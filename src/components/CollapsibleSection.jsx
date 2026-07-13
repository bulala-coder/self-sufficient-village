import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function CollapsibleSection({ title, subtitle, defaultOpen = false, children, badge, tone = 'default', className = '' }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = `collapsible-${String(title).replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, '-').toLowerCase()}`

  return (
    <section className={`collapsible-section collapsible-section-${tone} ${className}`.trim()}>
      <button
        type="button"
        className="collapsible-header"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="collapsible-heading">
          <span className="collapsible-title">{title}</span>
          {subtitle && <span className="collapsible-subtitle">{subtitle}</span>}
        </span>
        <span className="collapsible-toggle">
          {badge && <span className="badge">{badge}</span>}
          <span>{open ? '收合' : '展開'}</span>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      <div id={contentId} className="collapsible-content" hidden={!open}>{children}</div>
    </section>
  )
}
