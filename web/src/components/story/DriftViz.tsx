import { META } from '../../data'

export function DriftViz() {
  return (
    <div className="teach-card">
      <h3 className="teach-card__title">The stream flips at a known time</h3>
      <div className="split-row">
        <div className="split-col">
          <p className="meta split-col__head">Before the change</p>
          <div className="split-chips">
            <span className="chip chip--train">events 0–{META.driftT - 1}</span>
            <span className="chip chip--train">old rule</span>
          </div>
        </div>
        <div className="split-arrow" aria-hidden="true">
          t*
        </div>
        <div className="split-col">
          <p className="meta split-col__head">After the change</p>
          <div className="split-chips">
            <span className="chip chip--held">events {META.driftT}–{META.nEvents - 1}</span>
            <span className="chip chip--held">new rule</span>
          </div>
        </div>
      </div>
      <p className="meta" style={{ margin: '0.75rem 0 0', textTransform: 'none', letterSpacing: 0 }}>
        The frozen model trains only on the left. The online model scores each event on the right, then
        updates. The number I report is how often each is right on the right-hand window.
      </p>
    </div>
  )
}
