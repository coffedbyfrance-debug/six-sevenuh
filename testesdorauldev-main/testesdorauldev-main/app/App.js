'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import s from './page.module.css'
import { fetchAnimalsList, fetchAnimalDetail, fetchServerStats } from './actions'

const MEMES = [
  { img: 'https://i.imgur.com/yZd8XqE.gif', text: 'bro really tried to download my site 💀', sub: 'skill issue' },
  { img: 'https://i.imgur.com/yZd8XqE.gif', text: 'HACKER DETECTED 🚨', sub: 'the feds are on their way' },
  { img: 'https://i.imgur.com/yZd8XqE.gif', text: 'caught in 4K trying to steal 😭', sub: 'by KkSaiko — make your own site lil bro' },
  { img: 'https://i.imgur.com/yZd8XqE.gif', text: 'nuh uh uh 🫵', sub: 'nice try tho' },
  { img: 'https://i.imgur.com/yZd8XqE.gif', text: 'L + ratio + no download for u', sub: 'go touch grass' },
]

function TrollOverlay({ onClose }) {
  const meme = MEMES[Math.floor(Math.random() * MEMES.length)]
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={s.trollOverlay} onClick={onClose}>
      <div className={s.trollBox}>
        <div className={s.trollTop}>🚨 DOWNLOAD BLOCKED 🚨</div>
        <img src={meme.img} alt="meme" className={s.trollGif} onError={e=>{e.target.style.display='none'}}/>
        <div className={s.trollText}>{meme.text}</div>
        <div className={s.trollSub}>{meme.sub}</div>
        <div className={s.trollTimer}>closes automatically...</div>
      </div>
    </div>
  )
}

function AntiCopy() {
  const [troll, setTroll] = useState(false)
  const showTroll = () => setTroll(true)

  useEffect(() => {
    const noCtx = (e) => e.preventDefault()
    const noKeys = (e) => {
      const k = e.key.toLowerCase()
      if (e.ctrlKey && k === 's') { e.preventDefault(); e.stopPropagation(); showTroll(); return false }
      if ((e.ctrlKey && k === 'u') || (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(k)) || e.key === 'F12')
        { e.preventDefault(); e.stopPropagation(); return false }
    }
    const noCopy = (e) => e.preventDefault()
    const noDownload = (e) => {
      const el = e.target.closest('a')
      if (!el) return
      if (el.hasAttribute('download') || el.textContent.toLowerCase().includes('download') || el.textContent.toLowerCase().includes('save'))
        { e.preventDefault(); showTroll() }
    }
    const observer = new MutationObserver(() => {
      document.querySelectorAll('a[download]').forEach(a => {
        a.removeAttribute('download')
        a.addEventListener('click', (e) => { e.preventDefault(); showTroll() }, { once: true })
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('contextmenu', noCtx)
    document.addEventListener('keydown', noKeys, true)
    document.addEventListener('copy', noCopy)
    document.addEventListener('cut', noCopy)
    document.addEventListener('dragstart', noCopy)
    document.addEventListener('click', noDownload, true)
    return () => {
      document.removeEventListener('contextmenu', noCtx)
      document.removeEventListener('keydown', noKeys, true)
      document.removeEventListener('copy', noCopy)
      document.removeEventListener('cut', noCopy)
      document.removeEventListener('dragstart', noCopy)
      document.removeEventListener('click', noDownload, true)
      observer.disconnect()
    }
  }, [])

  return troll ? <TrollOverlay onClose={() => setTroll(false)} /> : null
}

const RARITY_ORDER = ['Common','Rare','Epic','Legendary','Mythic','Brainrot God','Secret','OG']
const RARITY_COLORS = {
  Common:'#71717a', Rare:'#3b82f6', Epic:'#a855f7', Legendary:'#f59e0b',
  Mythic:'#ef4444', 'Brainrot God':'#ec4899', Secret:'#94a3b8', OG:'#e2e8f0',
}
const MUT_COLORS = {
  Gold:'#f59e0b', Diamond:'#22d3ee', Rainbow:'#ec4899', Galaxy:'#8b5cf6',
  Lava:'#ef4444', Bloodrot:'#dc2626', Divine:'#fbbf24', Candy:'#f472b6',
  YinYang:'#94a3b8', Radioactive:'#84cc16', Cursed:'#6366f1',
}
const TRAIT_COLORS = {
  Fire:'#ef4444', Sombrero:'#f59e0b', Lightning:'#facc15', Rainbow:'#ec4899',
  Indonesia:'#22c55e', Explosive:'#f97316', Spider:'#9ca3af', Strawberry:'#fb7185',
}

const StarIcon = ({ color }) => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill={color||'currentColor'}>
    <path d="M6 0L7.5 4.5H12L8.25 7.25L9.75 12L6 9L2.25 12L3.75 7.25L0 4.5H4.5L6 0Z"/>
  </svg>
)
const TagIcon = ({ color }) => (
  <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
    <path d="M1 1h4l4.5 4.5-4.5 4.5L1 5.5V1z" stroke={color||'#6b7280'} strokeWidth="1.3" fill="none"/>
    <circle cx="2.8" cy="2.8" r="0.7" fill={color||'#6b7280'}/>
  </svg>
)
const PeopleIcon = () => (
  <svg className={s.barPeople} width="13" height="11" viewBox="0 0 13 11" fill="none">
    <circle cx="4.5" cy="3" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M0.5 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <circle cx="9.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
    <path d="M8 10c0-1.4.9-2.6 2-3" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
)

function StatCard({ label, value, sub, green }) {
  return (
    <div className={s.statCard}>
      <div className={s.statLabel}>{label}</div>
      <div className={green ? s.statValueGreen : s.statValue}>{value}</div>
      {sub && <div className={s.statSub}>{sub}</div>}
    </div>
  )
}

function BarRow({ name, count, total, color, icon }) {
  const pct  = total > 0 ? Math.min((count/total)*100, 100) : 0
  const pStr = total > 0 ? ((count/total)*100).toFixed(1) : '0.0'
  const cnt  = Math.floor(count).toLocaleString('en-US')
  const isColored = !!color && color !== '#374151'
  return (
    <div className={s.barRow}>
      <div className={s.barDot} style={{ background: color||'#2a2e3d' }}/>
      <span className={s.barIcon}>
        {icon==='mut' ? <StarIcon color={isColored?color:'#374151'}/> : <TagIcon color={isColored?color:'#374151'}/>}
      </span>
      <div className={s.barName} style={{ color: isColored?color:'#9ca3af' }}>{name}</div>
      <div className={s.barTrack}>
        <div className={s.barFill} style={{ width:`${pct}%`, background:color||'#2a2e3d' }}/>
      </div>
      <div className={s.barCount}>{cnt}</div>
      <div className={s.barPct}>({pStr}%)</div>
      <PeopleIcon/>
    </div>
  )
}

function Modal({ name, onClose }) {
  const [data, setData] = useState(null)
  const [, start] = useTransition()
  useEffect(() => { start(async () => { setData(await fetchAnimalDetail(name)) }) }, [name])
  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const rc    = data?.rarityColor || '#6366f1'
  const total = data?.stats?.totalExists || 0

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e)=>e.stopPropagation()}
        style={{ boxShadow:`0 0 0 1px ${rc}25, 0 32px 100px rgba(0,0,0,0.85)` }}>
        {!data ? <div className={s.loading}>Loading...</div> : (
          <>
            <div className={s.modalHead}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                {data.image
                  ? <img src={data.image} alt={data.name} className={s.modalImg}/>
                  : <div className={s.modalImgFallback} style={{ background:rc+'18', border:`1px solid ${rc}30` }}/>
                }
                <div>
                  <div className={s.modalTitle}>{data.name}</div>
                  <div className={s.modalBadge} style={{ color:rc, background:rc+'18', border:`1px solid ${rc}40` }}>
                    {data.rarity}
                  </div>
                </div>
              </div>
              <button className={s.closeBtn} onClick={onClose}>ESC</button>
            </div>
            <div className={s.statsGrid}>
              <StatCard label="Total Exists" value={data.stats.totalExistsFmt}/>
              <StatCard label="Avg Rebirth"  value={String(data.stats.avgRebirth)}/>
              <StatCard label="Price"         value={data.stats.priceFmt}/>
            </div>
            <div className={s.statsGrid2}>
              <StatCard label="Base Gen/s"  value={data.stats.baseGenFmt}  green/>
              <StatCard label="Total Gen/s" value={data.stats.totalGenFmt} sub={data.stats.perEaFmt} green/>
            </div>
            <div className={s.panel}>
              <div className={s.panelTitle}>Mutations &amp; Traits</div>
              <div className={s.sectionHead}>Mutations</div>
              {data.mutations.length===0
                ? <div className={s.noData}>No mutation data yet</div>
                : data.mutations.map(m=>(
                    <BarRow key={m.name} name={m.name} count={m.count} total={total} color={MUT_COLORS[m.name]} icon="mut"/>
                  ))}
              <div className={s.divider}/>
              <div className={s.sectionHead}>
                Traits{data.traitTotal>10&&` (top 10 of ${data.traitTotal})`}
              </div>
              {data.traits.length===0
                ? <div className={s.noData}>No trait data yet</div>
                : data.traits.map(t=>(
                    <BarRow key={t.name} name={t.name} count={t.count} total={total} color={TRAIT_COLORS[t.name]} icon="trait"/>
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ animal, onClick }) {
  const rc = animal.rarityColor
  return (
    <button className={s.row} onClick={()=>onClick(animal.name)}>
      <div className={s.rowImgWrap}>
        {animal.image
          ? <img src={animal.image} alt={animal.name} className={s.rowImg} loading="lazy"/>
          : <div className={s.rowImgFallback} style={{ background:rc+'22', border:`1px solid ${rc}33` }}>
              <div className={s.rowDot} style={{ background:rc }}/>
            </div>
        }
      </div>
      <span className={s.rowName}>{animal.name}</span>
      <span className={s.rowRarity} style={{ color:rc }}>{animal.rarity}</span>
      <span className={s.rowTotal} style={{ color:animal.totalExists>0?'#94a3b8':'#2a2e3d' }}>
        {animal.totalExists>0?animal.totalExists.toLocaleString('en-US'):'—'}
      </span>
      <span className={s.rowArrow}>›</span>
    </button>
  )
}

export default function App() {
  const [list,     setList]     = useState([])
  const [stats,    setStats]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('All')
  const [selected, setSelected] = useState(null)
  const [ready,    setReady]    = useState(false)
  const [, start] = useTransition()

  const load = useCallback(() => {
    start(async () => {
      const [animals, sv] = await Promise.all([fetchAnimalsList(), fetchServerStats()])
      setList(animals)
      setStats(sv)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 10_000)
    return () => clearInterval(iv)
  }, [load])

useEffect(() => {
    if (ready) {
      const shell = document.getElementById('__shell')
      if (shell) shell.style.display = 'none'
    }
  }, [ready])

  const filtered = list.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter==='All' || a.rarity===filter)
  )

  const liveCount = list.filter(a=>a.totalExists>0).length
  const lastStr   = stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleTimeString('en-US') : null

  if (!ready) return null

  return (
    <main className={s.root}>
      <AntiCopy/>

      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.navTop}>
            <div className={s.brand}>
              By <span className={s.brandAccent}>KkSaiko</span>
            </div>
            <div className={s.pills}>
              {stats?.playerCount>0 && (
                <span className={`${s.pill} ${s.pillGreen}`}>
                  <span className={s.pillDot}/>
                  {stats.playerCount} online
                </span>
              )}
              {liveCount>0 && (
                <span className={`${s.pill} ${s.pillBlue}`}>{liveCount} tracked</span>
              )}
              {!lastStr && (
                <span className={`${s.pill} ${s.pillAmber}`}>Waiting for server</span>
              )}
              {lastStr && (
                <span className={`${s.pill} ${s.pillMuted}`}>updated {lastStr}</span>
              )}
            </div>
          </div>

          <div className={s.searchRow}>
            <div className={s.searchBox}>
              <svg className={s.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#4b5563" strokeWidth="1.5"/>
                <path d="M11 11l3.5 3.5" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className={s.searchInput}
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search animals..."
              />
              {search && (
                <button className={s.searchClear} onClick={()=>setSearch('')}>✕</button>
              )}
            </div>
            <div className={s.filterRow}>
              {['All',...RARITY_ORDER].map(r=>{
                const rc=RARITY_COLORS[r]; const active=filter===r
                return (
                  <button key={r} className={s.filterBtn} onClick={()=>setFilter(r)}
                    style={active&&rc?{color:rc,borderColor:rc+'55',background:rc+'18'}:{}}>
                    {active&&rc&&<span className={s.filterDot} style={{background:rc}}/>}
                    {r}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      <div className={s.tableWrap}>
        <div className={s.tableHead}>
          <div style={{width:36}}/>
          <div className={s.thName}>Name</div>
          <div className={s.thRarity}>Rarity</div>
          <div className={s.thTotal}>Total</div>
          <div style={{width:20}}/>
        </div>

        {filtered.length===0
          ? <div className={s.tableEmpty}>No results for &quot;{search}&quot;</div>
          : filtered.map(a=><Row key={a.name} animal={a} onClick={setSelected}/>)
        }

        <div className={s.tableCount}>{filtered.length} / {list.length} animals</div>
      </div>

      {selected && <Modal name={selected} onClose={()=>setSelected(null)}/>}
    </main>
  )
}
