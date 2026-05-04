import dynamic from 'next/dynamic'
import s from './page.module.css'

const App = dynamic(() => import('./App'), { ssr: false })

export default function Page() {
  return (
    <>
      <div className={s.loadScreen} id="__shell">
        <div className={s.loadContent}>
          <div className={s.loadOrbit}>
            <div className={s.loadOrbitRing} />
            <div className={s.loadOrbitRing2} />
            <div className={s.loadOrbitDot} />
            <div className={s.loadOrbitDot2} />
            <div className={s.loadOrbitDot3} />
            <div className={s.loadCenter}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15 8.5H22L16.5 12.5L18.5 19L12 15L5.5 19L7.5 12.5L2 8.5H9L12 2Z" fill="#6366f1"/>
              </svg>
            </div>
          </div>
          <div className={s.loadTitle}>
            By <span className={s.loadAccent}>KkSaiko</span>
          </div>
          <div className={s.loadSub}>Loading tracker data...</div>
          <div className={s.loadBar}>
            <div className={s.loadBarFill} />
          </div>
        </div>
      </div>

      {/* App mounts here — never in initial HTML */}
      <App />
    </>
  )
}
