import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

export const dynamic = 'force-dynamic'

const FALLBACK_SECRET = 'rauldevelindodemais'

export async function POST(request) {
  try {
    const secret = request.headers.get('x-secret')
    const expected = (process.env.ROBLOX_SECRET || FALLBACK_SECRET).trim()

    if (!secret || secret.trim() !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const players = body.players || []

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json({ ok: true, saved: 0 })
    }

    const client = await clientPromise
    const db = client.db('brainrot')
    const col = db.collection('players')

    const ops = players.map((p) => ({
      updateOne: {
        filter: { _id: String(p.userId) },
        update: {
          $set: {
            username: p.username,
            podiums: p.podiums || [],
            rebirths: p.rebirths || 0,
            online: p.online !== false,
            lastSeen: new Date(),
          },
        },
        upsert: true,
      },
    }))

    await col.bulkWrite(ops, { ordered: false })

    return NextResponse.json({ ok: true, saved: ops.length })
  } catch (e) {
    console.error('[update]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

