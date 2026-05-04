
import { NextResponse } from "next/server"
import { ANIMALS_STATIC, RARITY_COLORS, RARITY_ORDER, formatNum } from "../../../lib/animalsData"
import { getLiveData } from "../../../lib/store"

export const dynamic = "force-dynamic"

function buildAnimalResponse(name, staticData, liveAnimal) {
  const total = liveAnimal?.total || 0
  const mutations = liveAnimal?.mutations || {}
  const traits = liveAnimal?.traits || {}
  const avgRebirth = liveAnimal?.avgRebirth || 0
  const avgCoins = liveAnimal?.avgCoins || 0

  const mutationList = Object.entries(mutations)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const traitList = Object.entries(traits)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const baseGen = staticData.Generation || 0
  const totalGen = total > 0 ? total * baseGen : 0

  return {
    id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, ""),
    name,
    rarity: staticData.Rarity,
    rarityColor: RARITY_COLORS[staticData.Rarity] || "#a1a1aa",
    price: staticData.Price,
    generation: baseGen,
    stats: {
      totalExists: total,
      avgRebirth,
      avgCoins: "$" + formatNum(avgCoins),
      baseGenS: formatNum(baseGen),
      totalGenS: formatNum(totalGen),
    },
    mutations: mutationList,
    traits: traitList.slice(0, 10),
    traitTotal: traitList.length,
    hasLiveData: total > 0,
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const live = getLiveData()

  if (id) {
const name = Object.keys(ANIMALS_STATIC).find(n =>
      n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") === id
    )
    if (!name) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const staticData = ANIMALS_STATIC[name]
    const liveAnimal = live.animals?.[name]
    return NextResponse.json(buildAnimalResponse(name, staticData, liveAnimal))
  }

const sorted = Object.keys(ANIMALS_STATIC).sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(ANIMALS_STATIC[a].Rarity)
    const rb = RARITY_ORDER.indexOf(ANIMALS_STATIC[b].Rarity)
    if (ra !== rb) return ra - rb
    return (ANIMALS_STATIC[a].Price || 0) - (ANIMALS_STATIC[b].Price || 0)
  })

  const list = sorted.map(name => {
    const s = ANIMALS_STATIC[name]
    const liveAnimal = live.animals?.[name]
    return {
      id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, ""),
      name,
      rarity: s.Rarity,
      rarityColor: RARITY_COLORS[s.Rarity] || "#a1a1aa",
      price: s.Price,
      totalExists: liveAnimal?.total || 0,
      hasLiveData: !!(liveAnimal?.total),
    }
  })

  return NextResponse.json({
    animals: list,
    lastUpdate: live.lastUpdate,
    serverStats: live.serverStats || {},
  })
}
