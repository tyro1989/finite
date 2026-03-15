import { useState, useEffect } from 'react'

const STEPS = ['welcome', 'name', 'birthday', 'expectancy', 'reveal']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ name: '', birthday: '', lifeExpectancy: 80 })

  const totalWeeks = data.lifeExpectancy * 52
  const weeksLived = data.birthday
    ? Math.max(0, Math.floor((new Date() - new Date(data.birthday)) / (7 * 24 * 60 * 60 * 1000)))
    : 0
  const weeksRemaining = totalWeeks - weeksLived
  const pctLived = totalWeeks > 0 ? ((weeksLived / totalWeeks) * 100).toFixed(1) : 0

  const canNext = () => {
    const s = STEPS[step]
    if (s === 'name') return data.name.trim().length > 0
    if (s === 'birthday') return data.birthday.length > 0
    return true
  }

  const handleNext = () => {
    if (STEPS[step] === 'reveal') { onComplete(data); return }
    if (canNext()) setStep(s => s + 1)
  }

  // Key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && canNext()) handleNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, data])

  return (
    <div style={s.overlay}>
      <div style={s.container} className="fade-in">

        {STEPS[step] === 'welcome' && (
          <div style={s.step}>
            <div style={s.bigNum}>4,680</div>
            <p style={s.bigSub}>weeks in a 90-year life.</p>
            <div style={s.divider} />
            <p style={s.body}>You could fit your entire existence on a single poster.</p>
            <p style={s.body}>Most of those boxes are already filled in. The rest are up to you.</p>
            <p style={s.body}>This is not a productivity app. It's a mirror.</p>
            <button style={s.btn} onClick={handleNext}>Begin →</button>
          </div>
        )}

        {STEPS[step] === 'name' && (
          <div style={s.step} className="fade-in">
            <p style={s.question}>What is your name?</p>
            <input
              style={s.input}
              type="text"
              placeholder="Your name"
              value={data.name}
              onChange={e => setData(d => ({ ...d, name: e.target.value }))}
              autoFocus
            />
            <button style={{ ...s.btn, opacity: canNext() ? 1 : 0.35 }} onClick={handleNext} disabled={!canNext()}>
              Continue →
            </button>
          </div>
        )}

        {STEPS[step] === 'birthday' && (
          <div style={s.step} className="fade-in">
            <p style={s.question}>When were you born,<br /><em style={{ color: 'var(--accent)' }}>{data.name}</em>?</p>
            <input
              style={s.input}
              type="date"
              value={data.birthday}
              onChange={e => setData(d => ({ ...d, birthday: e.target.value }))}
              autoFocus
            />
            <button style={{ ...s.btn, opacity: canNext() ? 1 : 0.35 }} onClick={handleNext} disabled={!canNext()}>
              Continue →
            </button>
          </div>
        )}

        {STEPS[step] === 'expectancy' && (
          <div style={s.step} className="fade-in">
            <p style={s.question}>How long do you intend to live?</p>
            <div style={s.sliderWrap}>
              <div style={s.sliderVal}>{data.lifeExpectancy}</div>
              <div style={s.sliderUnit}>years</div>
              <input
                style={s.slider}
                type="range"
                min={50}
                max={100}
                value={data.lifeExpectancy}
                onChange={e => setData(d => ({ ...d, lifeExpectancy: parseInt(e.target.value) }))}
              />
              <div style={s.sliderLabels}>
                <span>50</span>
                <span style={{ color: 'var(--text3)' }}>{totalWeeks.toLocaleString()} weeks total</span>
                <span>100</span>
              </div>
            </div>
            <button style={s.btn} onClick={handleNext}>Show me my life →</button>
          </div>
        )}

        {STEPS[step] === 'reveal' && (
          <div style={s.step} className="slide-up">
            <p style={s.revealName}>{data.name},</p>
            <p style={s.revealLabel}>you have already lived</p>
            <div style={s.revealBig}>{weeksLived.toLocaleString()}</div>
            <p style={s.revealLabel}>of your <span style={{ color: 'var(--text2)' }}>{totalWeeks.toLocaleString()}</span> weeks</p>
            <div style={s.pctBar}>
              <div style={{ ...s.pctFill, width: `${pctLived}%` }} />
            </div>
            <p style={s.revealPct}>{pctLived}% lived</p>
            <div style={s.divider} />
            <div style={s.revealRemaining}>{weeksRemaining.toLocaleString()}</div>
            <p style={s.revealLabel2}>weeks remain.</p>
            <p style={s.revealCoda}>What will you do with them?</p>
            <button style={s.btn} onClick={handleNext}>See your grid →</button>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  overlay: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  container: {
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  bigNum: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(72px, 18vw, 128px)',
    color: '#f4f0e8',
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },
  bigSub: {
    fontFamily: 'var(--font-serif)',
    fontSize: '20px',
    color: 'var(--text3)',
    fontStyle: 'italic',
  },
  divider: {
    width: '48px',
    height: '1px',
    background: 'var(--border)',
    margin: '4px 0',
  },
  body: {
    fontSize: '15px',
    color: '#7a7470',
    lineHeight: 1.8,
    maxWidth: '380px',
  },
  question: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(24px, 6vw, 36px)',
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  input: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    color: 'var(--text)',
    padding: '14px 20px',
    borderRadius: '8px',
    fontSize: '18px',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
    outline: 'none',
  },
  btn: {
    background: 'var(--accent)',
    color: '#0a0a0a',
    padding: '14px 36px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    marginTop: '8px',
    border: 'none',
    transition: 'all 0.2s',
  },
  sliderWrap: {
    width: '100%',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  sliderVal: {
    fontFamily: 'var(--font-serif)',
    fontSize: '64px',
    color: 'var(--accent)',
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  sliderUnit: {
    fontSize: '13px',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '-8px',
  },
  slider: {
    width: '100%',
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '11px',
    color: 'var(--text3)',
  },
  revealName: {
    fontFamily: 'var(--font-serif)',
    fontSize: '28px',
    color: 'var(--accent)',
    fontStyle: 'italic',
  },
  revealLabel: {
    fontSize: '12px',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  revealBig: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(56px, 14vw, 96px)',
    color: 'var(--text)',
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  pctBar: {
    width: '100%',
    maxWidth: '340px',
    height: '4px',
    background: '#1e1e1e',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  pctFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '2px',
    transition: 'width 1s ease',
  },
  revealPct: {
    fontSize: '12px',
    color: 'var(--text3)',
    letterSpacing: '0.06em',
    marginTop: '-8px',
  },
  revealRemaining: {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(48px, 12vw, 80px)',
    color: 'var(--accent)',
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  revealLabel2: {
    fontSize: '12px',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  revealCoda: {
    fontFamily: 'var(--font-serif)',
    fontSize: '18px',
    color: 'var(--text3)',
    fontStyle: 'italic',
    marginTop: '4px',
  },
}
