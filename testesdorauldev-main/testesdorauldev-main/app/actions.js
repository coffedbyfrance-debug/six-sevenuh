'use server'

import clientPromise from '../lib/mongodb'
import { ANIMALS_STATIC, RARITY_ORDER, RARITY_COLORS } from '../lib/animalsData'
import { getAnimalImage } from '../lib/animalImages'

function fmtShort(n) {
  if (!n || isNaN(n)) return '0'
  if (n >= 1e15) return (n / 1e15).toFixed(2) + 'Qa'
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K'
  return String(Math.floor(n))
}

function fmtFull(n) {
  return Math.floor(n || 0).toLocaleString('en-US')
}

async function getDb() {
  const client = await clientPromise
  return client.db('brainrot')
}

async function buildAnimalMap() {
  const db = await getDb()
  const players = await db.collection('players').find({}).toArray()

  const map = {}

  for (const player of players) {
    let counted = false
    for (const pod of player.podiums || []) {
      const name = pod.index
      if (!name) continue

      if (!map[name]) {
        map[name] = { total: 0, mutations: {}, traits: {}, rebirthSum: 0, ownerCount: 0 }
      }

      const e = map[name]
      e.total++

      if (!counted) {
        e.rebirthSum += player.rebirths || 0
        e.ownerCount++
        counted = true
      }

      if (pod.mutation) {
        e.mutations[pod.mutation] = (e.mutations[pod.mutation] || 0) + 1
      }
      for (const trait of pod.traits || []) {
        e.traits[trait] = (e.traits[trait] || 0) + 1
      }
    }
  }

  return map
}

export async function fetchAnimalsList() {
  const map = await buildAnimalMap()

  const sorted = Object.keys(ANIMALS_STATIC).sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(ANIMALS_STATIC[a].Rarity)
    const rb = RARITY_ORDER.indexOf(ANIMALS_STATIC[b].Rarity)
    if (ra !== rb) return ra - rb
    return (ANIMALS_STATIC[a].Price || 0) - (ANIMALS_STATIC[b].Price || 0)
  })

  return sorted.map((name) => {
    const s = ANIMALS_STATIC[name]
    const live = map[name]
    return {
      name,
      rarity: s.Rarity,
      rarityColor: RARITY_COLORS[s.Rarity] || '#a1a1aa',
      price: s.Price,
      totalExists: live?.total || 0,
      image: getAnimalImage(name),
    }
  })
}

export async function fetchAnimalDetail(name) {
  const s = ANIMALS_STATIC[name]
  if (!s) return null

  const db = await getDb()
  const players = await db.collection('players').find({ 'podiums.index': name }).toArray()

  const agg = { total: 0, mutations: {}, traits: {}, rebirthSum: 0, ownerCount: 0 }

  for (const player of players) {
    let counted = false
    for (const pod of player.podiums || []) {
      if (pod.index !== name) continue
      agg.total++

      if (!counted) {
        agg.rebirthSum += player.rebirths || 0
        agg.ownerCount++
        counted = true
      }

      if (pod.mutation) {
        agg.mutations[pod.mutation] = (agg.mutations[pod.mutation] || 0) + 1
      }
      for (const trait of pod.traits || []) {
        agg.traits[trait] = (agg.traits[trait] || 0) + 1
      }
    }
  }

  const avgRebirth =
    agg.ownerCount > 0 ? Math.round((agg.rebirthSum / agg.ownerCount) * 10) / 10 : 0

  const mutations = Object.entries(agg.mutations)
    .map(([n, count]) => ({ name: n, count }))
    .sort((a, b) => b.count - a.count)

  const traitsAll = Object.entries(agg.traits)
    .map(([n, count]) => ({ name: n, count }))
    .sort((a, b) => b.count - a.count)

  const total = agg.total
  const baseGen = s.Generation || 0
  const totalGen = total * baseGen

  return {
    name,
    rarity: s.Rarity,
    rarityColor: RARITY_COLORS[s.Rarity] || '#a1a1aa',
    price: s.Price,
    image: getAnimalImage(name),
    stats: {
      totalExistsFmt: fmtFull(total),
      totalExists: total,
      avgRebirth,
      baseGenFmt: fmtShort(baseGen),
      totalGenFmt: fmtShort(totalGen),
      perEaFmt: '~' + fmtShort(baseGen) + '/ea avg',
      priceFmt: '$' + fmtShort(s.Price),
    },
    mutations,
    traits: traitsAll.slice(0, 10),
    traitTotal: traitsAll.length,
  }
}

export async function fetchServerStats() {
  const db = await getDb()

const cutoff = new Date(Date.now() - 30 * 1000)
  const onlineCount = await db.collection('players').countDocuments({ lastSeen: { $gte: cutoff } })

  const agg = await db
    .collection('players')
    .aggregate([
      { $project: { c: { $size: { $ifNull: ['$podiums', []] } } } },
      { $group: { _id: null, total: { $sum: '$c' } } },
    ])
    .toArray()

  return {
    playerCount: onlineCount,
    totalPodiums: agg[0]?.total || 0,
    lastUpdate: Date.now(),
  }
}
