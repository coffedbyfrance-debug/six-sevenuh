import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

export const dynamic = 'force-dynamic'

const FALLBACK_SECRET = 'rauldevelindodemais'

function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a, b) {
  const na = norm(a), nb = norm(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  const wa = new Set(na.split(' ')), wb = new Set(nb.split(' '))
  const intersection = [...wa].filter(w => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  return intersection / union
}

export async function POST(req) {
  try {
const secret = req.headers.get('x-secret')
    const expected = (process.env.ROBLOX_SECRET || FALLBACK_SECRET).trim()
    if (!secret || secret.trim() !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

const res = await fetch('https://beebom.com/all-brainrots-in-steal-a-brainrot/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Beebom returned ${res.status}` }, { status: 502 })
    }

    const html = await res.text()

const imgMap = {}

    const imgRegex = /<img[^>]+src=["'](https?:\/\/static\.beebom\.com\/[^"'?]+)[^"']*["'][^>]*alt=["']([^"']+)["'][^>]*>/gi
    let m
    while ((m = imgRegex.exec(html)) !== null) {
      let [, src, alt] = m
      src = src.split('?')[0]
      const key = norm(alt)
      if (key && src) imgMap[key] = src
    }

 const imgRegex2 = /<img[^>]+alt=["']([^"']+)["'][^>]+src=["'](https?:\/\/static\.beebom\.com\/[^"'?]+)[^"']*["'][^>]*>/gi
    while ((m = imgRegex2.exec(html)) !== null) {
      let [, alt, src] = m
      src = src.split('?')[0]
      const key = norm(alt)
      if (key && src && !imgMap[key]) imgMap[key] = src
    }

    const total = Object.keys(imgMap).length

const client = await clientPromise
    const db = client.db('brainrot')
    const col = db.collection('images')

    if (total > 0) {
      const ops = Object.entries(imgMap).map(([key, url]) => ({
        updateOne: {
          filter: { _id: key },
          update: { $set: { url, updatedAt: new Date() } },
          upsert: true,
        },
      }))
      await col.bulkWrite(ops, { ordered: false })
    }

    return NextResponse.json({
      ok: true,
      scraped: total,
      sample: Object.entries(imgMap).slice(0, 5).map(([k, v]) => ({ name: k, url: v })),
    })
  } catch (e) {
    console.error('[scrape-images]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('brainrot')
    const count = await db.collection('images').countDocuments()
    const sample = await db.collection('images').find({}).limit(5).toArray()
    return NextResponse.json({ count, sample })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
