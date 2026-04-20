import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

const weekStart = formatDate(getMonday(new Date()))

// ---------------------------------------------------------------------------
// Item catalog — 40 realistic Indian grocery SKUs for Bengaluru, April
// ---------------------------------------------------------------------------

interface ItemSeed {
  name: string
  category: 'produce' | 'dairy' | 'staples' | 'fruit'
  unit: 'kg' | 'g' | 'pc' | 'pack' | 'bunch' | 'dozen' | 'L'
  typical_pack_size: number
  seasonality: { in_season_months: number[]; peak_months: number[] }
}

interface PriceSeed {
  thela_price: number
  zepto_price: number
  bb_price: number
  fairness: 'green' | 'amber' | 'skip'
  fairness_reason: string
  confidence: number
}

const items: (ItemSeed & PriceSeed)[] = [
  // ── PRODUCE (20) ──────────────────────────────────────────────
  {
    name: 'Tomato (Kolar, A-grade)',
    category: 'produce', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 10, 11, 12], peak_months: [1, 2, 11, 12] },
    thela_price: 28, zepto_price: 48, bb_price: 38,
    fairness: 'green', fairness_reason: 'Kolar harvest strong; 42% below Zepto', confidence: 0.95,
  },
  {
    name: 'Onion (Nashik)',
    category: 'produce', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 11, 12], peak_months: [12, 1, 2] },
    thela_price: 25, zepto_price: 42, bb_price: 32,
    fairness: 'green', fairness_reason: 'Rabi crop arriving; stable supply', confidence: 0.95,
  },
  {
    name: 'Potato (Agra)',
    category: 'produce', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [1, 2, 3] },
    thela_price: 22, zepto_price: 38, bb_price: 28,
    fairness: 'green', fairness_reason: 'Year-round staple; cold storage stock healthy', confidence: 0.95,
  },
  {
    name: 'Green Chilli',
    category: 'produce', unit: 'kg', typical_pack_size: 0.25,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 9, 10, 11, 12], peak_months: [10, 11] },
    thela_price: 40, zepto_price: 72, bb_price: 52,
    fairness: 'green', fairness_reason: 'Good supply from AP; 44% below Zepto', confidence: 0.9,
  },
  {
    name: 'Ginger (fresh)',
    category: 'produce', unit: 'kg', typical_pack_size: 0.25,
    seasonality: { in_season_months: [10, 11, 12, 1, 2, 3], peak_months: [11, 12] },
    thela_price: 80, zepto_price: 140, bb_price: 100,
    fairness: 'green', fairness_reason: 'Kerala stock steady; fair wholesale rate', confidence: 0.9,
  },
  {
    name: 'Garlic (Indian)',
    category: 'produce', unit: 'kg', typical_pack_size: 0.25,
    seasonality: { in_season_months: [2, 3, 4, 5, 6], peak_months: [3, 4] },
    thela_price: 120, zepto_price: 199, bb_price: 155,
    fairness: 'amber', fairness_reason: 'New crop arriving but storage stock premium; watch next week', confidence: 0.9,
  },
  {
    name: 'Coriander Leaves (bunch)',
    category: 'produce', unit: 'bunch', typical_pack_size: 1,
    seasonality: { in_season_months: [10, 11, 12, 1, 2, 3], peak_months: [11, 12, 1] },
    thela_price: 10, zepto_price: 20, bb_price: 15,
    fairness: 'green', fairness_reason: 'Good winter crop tail; 50% below Zepto', confidence: 0.95,
  },
  {
    name: 'Curry Leaves (bunch)',
    category: 'produce', unit: 'bunch', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [3, 4, 5] },
    thela_price: 5, zepto_price: 15, bb_price: 10,
    fairness: 'green', fairness_reason: 'Perennial crop; always at fair rates', confidence: 0.95,
  },
  {
    name: 'Capsicum (green)',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [10, 11, 12, 1, 2], peak_months: [11, 12] },
    thela_price: 90, zepto_price: 130, bb_price: 110,
    fairness: 'skip', fairness_reason: 'Unseasonal; price up 65% vs winter avg. Wait for October.', confidence: 0.9,
  },
  {
    name: 'Carrot (Ooty)',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [10, 11, 12, 1, 2, 3], peak_months: [12, 1] },
    thela_price: 35, zepto_price: 60, bb_price: 45,
    fairness: 'green', fairness_reason: 'Ooty tail crop; good quality at wholesale', confidence: 0.95,
  },
  {
    name: 'French Beans',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [9, 10, 11, 12, 1, 2, 3], peak_months: [10, 11] },
    thela_price: 45, zepto_price: 78, bb_price: 58,
    fairness: 'green', fairness_reason: 'End-of-season but still flowing from hills', confidence: 0.9,
  },
  {
    name: 'Brinjal (round, local)',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [9, 10, 11] },
    thela_price: 30, zepto_price: 55, bb_price: 40,
    fairness: 'green', fairness_reason: 'Year-round crop; local farm supply strong', confidence: 0.95,
  },
  {
    name: 'Cabbage',
    category: 'produce', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [9, 10, 11, 12, 1, 2, 3], peak_months: [11, 12] },
    thela_price: 18, zepto_price: 32, bb_price: 24,
    fairness: 'green', fairness_reason: 'Glut season tailing off; still cheap', confidence: 0.95,
  },
  {
    name: 'Cauliflower',
    category: 'produce', unit: 'pc', typical_pack_size: 1,
    seasonality: { in_season_months: [10, 11, 12, 1, 2], peak_months: [11, 12] },
    thela_price: 40, zepto_price: 65, bb_price: 50,
    fairness: 'amber', fairness_reason: 'Season ending; price rising 20% WoW', confidence: 0.9,
  },
  {
    name: 'Beetroot',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [10, 11, 12, 1, 2, 3, 4], peak_months: [12, 1] },
    thela_price: 25, zepto_price: 45, bb_price: 32,
    fairness: 'green', fairness_reason: 'Tail of cool-season crop; fair price', confidence: 0.95,
  },
  {
    name: 'Cucumber',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [2, 3, 4, 5, 6, 7, 8, 9], peak_months: [4, 5, 6] },
    thela_price: 20, zepto_price: 38, bb_price: 28,
    fairness: 'green', fairness_reason: 'Summer crop starts; early arrivals from Karnataka', confidence: 0.9,
  },
  {
    name: 'Drumstick',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [2, 3, 4, 5, 6], peak_months: [3, 4] },
    thela_price: 50, zepto_price: 85, bb_price: 65,
    fairness: 'green', fairness_reason: 'Peak season; abundant local supply', confidence: 0.95,
  },
  {
    name: 'Ladies Finger (Bhindi)',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [3, 4, 5, 6, 7, 8, 9, 10], peak_months: [5, 6, 7] },
    thela_price: 40, zepto_price: 68, bb_price: 52,
    fairness: 'green', fairness_reason: 'Summer crop arriving; good early supply', confidence: 0.9,
  },
  {
    name: 'Ridge Gourd',
    category: 'produce', unit: 'kg', typical_pack_size: 0.5,
    seasonality: { in_season_months: [3, 4, 5, 6, 7, 8], peak_months: [5, 6] },
    thela_price: 35, zepto_price: 58, bb_price: 45,
    fairness: 'amber', fairness_reason: 'Early season; limited supply pushing price up slightly', confidence: 0.9,
  },
  {
    name: 'Palak / Spinach (bunch)',
    category: 'produce', unit: 'bunch', typical_pack_size: 1,
    seasonality: { in_season_months: [10, 11, 12, 1, 2, 3], peak_months: [12, 1] },
    thela_price: 15, zepto_price: 30, bb_price: 20,
    fairness: 'amber', fairness_reason: 'Season ending; quality dropping; last week of good spinach', confidence: 0.9,
  },

  // ── DAIRY (8) ────────────────────────────────────────────────
  {
    name: 'Paneer (Milky Mist 200g)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 85, zepto_price: 110, bb_price: 99,
    fairness: 'green', fairness_reason: 'Branded pack; best price vs quick-commerce', confidence: 0.95,
  },
  {
    name: 'Curd (Nandini 500g)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 27, zepto_price: 35, bb_price: 30,
    fairness: 'green', fairness_reason: 'Price-controlled dairy; consistent MRP', confidence: 0.95,
  },
  {
    name: 'Milk (Nandini Toned 500ml)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 24, zepto_price: 27, bb_price: 25,
    fairness: 'green', fairness_reason: 'MRP product; minimal markup anywhere', confidence: 0.95,
  },
  {
    name: 'Butter (Amul 100g)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 56, zepto_price: 62, bb_price: 58,
    fairness: 'green', fairness_reason: 'Branded product; near MRP across platforms', confidence: 0.95,
  },
  {
    name: 'Ghee (Nandini 500ml)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 255, zepto_price: 310, bb_price: 280,
    fairness: 'amber', fairness_reason: 'Recent MRP hike; Nandini revised rates this month', confidence: 0.9,
  },
  {
    name: 'Cheese Slices (Amul 100g)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 42, zepto_price: 55, bb_price: 48,
    fairness: 'green', fairness_reason: 'Branded product; competitive rate', confidence: 0.95,
  },
  {
    name: 'Buttermilk (Nandini 200ml)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 12, zepto_price: 18, bb_price: 15,
    fairness: 'green', fairness_reason: 'Summer staple; price-controlled SKU', confidence: 0.95,
  },
  {
    name: 'Fresh Cream (Amul 200ml)',
    category: 'dairy', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 62, zepto_price: 80, bb_price: 70,
    fairness: 'amber', fairness_reason: 'Zepto and BB premium markup; but demand consistent', confidence: 0.9,
  },

  // ── STAPLES (8) ──────────────────────────────────────────────
  {
    name: 'Atta (Aashirvaad 5kg)',
    category: 'staples', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 245, zepto_price: 299, bb_price: 275,
    fairness: 'green', fairness_reason: 'Branded staple; best rate in channel', confidence: 0.95,
  },
  {
    name: 'Basmati Rice (India Gate 5kg)',
    category: 'staples', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 420, zepto_price: 549, bb_price: 480,
    fairness: 'green', fairness_reason: 'Warehouse deal; 23% below Zepto', confidence: 0.95,
  },
  {
    name: 'Toor Dal (1kg)',
    category: 'staples', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [1, 2, 3] },
    thela_price: 140, zepto_price: 189, bb_price: 165,
    fairness: 'amber', fairness_reason: 'Maharashtra crop delays; wholesale prices firming up', confidence: 0.9,
  },
  {
    name: 'Moong Dal (1kg)',
    category: 'staples', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [3, 4, 5] },
    thela_price: 115, zepto_price: 160, bb_price: 140,
    fairness: 'green', fairness_reason: 'Summer crop arrivals; price softening', confidence: 0.9,
  },
  {
    name: 'Mustard Oil (Fortune 1L)',
    category: 'staples', unit: 'L', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 172, zepto_price: 210, bb_price: 195,
    fairness: 'green', fairness_reason: 'Branded oil; competitive rate vs platforms', confidence: 0.95,
  },
  {
    name: 'Sunflower Oil (Freedom 1L)',
    category: 'staples', unit: 'L', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 138, zepto_price: 175, bb_price: 155,
    fairness: 'green', fairness_reason: 'South Indian staple; good wholesale rate', confidence: 0.95,
  },
  {
    name: 'Sugar (1kg)',
    category: 'staples', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 46, zepto_price: 60, bb_price: 52,
    fairness: 'green', fairness_reason: 'Commodity; crushing season keeps price down', confidence: 0.95,
  },
  {
    name: 'Salt (Tata 1kg)',
    category: 'staples', unit: 'pack', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 22, zepto_price: 28, bb_price: 24,
    fairness: 'green', fairness_reason: 'MRP product; near-identical across channels', confidence: 0.95,
  },

  // ── FRUIT (4) ────────────────────────────────────────────────
  {
    name: 'Mango (Alphonso, Ratnagiri)',
    category: 'fruit', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [3, 4, 5, 6], peak_months: [4, 5] },
    thela_price: 350, zepto_price: 550, bb_price: 450,
    fairness: 'skip', fairness_reason: 'Early premium batch; wait 2 weeks for peak supply to drop 30%', confidence: 0.9,
  },
  {
    name: 'Banana (Robusta, dozen)',
    category: 'fruit', unit: 'dozen', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [] },
    thela_price: 40, zepto_price: 60, bb_price: 50,
    fairness: 'green', fairness_reason: 'Year-round staple; best price locally', confidence: 0.95,
  },
  {
    name: 'Apple (Shimla, cold storage)',
    category: 'fruit', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [7, 8, 9, 10], peak_months: [8, 9] },
    thela_price: 180, zepto_price: 250, bb_price: 220,
    fairness: 'skip', fairness_reason: 'Off-season cold storage; mealy texture likely. Skip until August.', confidence: 0.9,
  },
  {
    name: 'Papaya (local)',
    category: 'fruit', unit: 'kg', typical_pack_size: 1,
    seasonality: { in_season_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak_months: [3, 4, 5] },
    thela_price: 30, zepto_price: 55, bb_price: 42,
    fairness: 'green', fairness_reason: 'Peak season; 45% below Zepto', confidence: 0.95,
  },
]

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`\n🌱 Seeding ${items.length} items for week starting ${weekStart}...\n`)

  // 1. Fetch any existing items by name so we can skip re-inserting them
  const itemNames = items.map((i) => i.name)
  const { data: existingItems, error: fetchError } = await supabase
    .from('items')
    .select('id, name')
    .in('name', itemNames)

  if (fetchError) {
    console.error('❌ Error fetching existing items:', fetchError.message)
    process.exit(1)
  }

  const existingNames = new Set((existingItems ?? []).map((r) => r.name))
  const nameToId = new Map<string, string>()
  for (const row of existingItems ?? []) {
    nameToId.set(row.name, row.id)
  }

  // Insert only items that don't already exist
  const newItemPayloads = items
    .filter((item) => !existingNames.has(item.name))
    .map((item) => ({
      name: item.name,
      category: item.category,
      unit: item.unit,
      typical_pack_size: item.typical_pack_size,
      seasonality: item.seasonality,
      active: true,
    }))

  if (newItemPayloads.length > 0) {
    const { data: insertedItems, error: itemError } = await supabase
      .from('items')
      .insert(newItemPayloads)
      .select('id, name')

    if (itemError) {
      console.error('❌ Error seeding items:', itemError.message)
      process.exit(1)
    }

    for (const row of insertedItems ?? []) {
      nameToId.set(row.name, row.id)
    }
    console.log(`✅ Inserted ${insertedItems?.length ?? 0} new items (${existingNames.size} already existed)`)
  } else {
    console.log(`✅ All ${items.length} items already exist — skipping insert`)
  }

  // 3. Upsert prices for this week
  const pricePayloads = items.map((item) => {
    const itemId = nameToId.get(item.name)
    if (!itemId) throw new Error(`Item not found for name: ${item.name}`)
    return {
      item_id: itemId,
      week_start: weekStart,
      thela_price: item.thela_price,
      zepto_price: item.zepto_price,
      bb_price: item.bb_price,
      fairness: item.fairness,
      fairness_reason: item.fairness_reason,
      confidence: item.confidence,
    }
  })

  const { error: priceError } = await supabase
    .from('prices')
    .upsert(pricePayloads, { onConflict: 'item_id,week_start', ignoreDuplicates: false })

  if (priceError) {
    console.error('❌ Error seeding prices:', priceError.message)
    process.exit(1)
  }

  console.log(`✅ Upserted ${pricePayloads.length} price rows for week ${weekStart}`)

  // 4. Print summary
  console.log(`\n${'─'.repeat(80)}`)
  console.log(`${'#'.padEnd(4)} ${'Item'.padEnd(35)} ${'Category'.padEnd(10)} ${'₹ Thela'.padEnd(10)} Fairness`)
  console.log(`${'─'.repeat(80)}`)

  items.forEach((item, i) => {
    const fair = item.fairness === 'green' ? '🟢' : item.fairness === 'amber' ? '🟡' : '🔴'
    console.log(
      `${String(i + 1).padEnd(4)} ${item.name.padEnd(35)} ${item.category.padEnd(10)} ₹${String(item.thela_price).padEnd(8)} ${fair} ${item.fairness}`
    )
  })

  console.log(`${'─'.repeat(80)}`)
  console.log(`\nDone! Green: ${items.filter(i => i.fairness === 'green').length} | Amber: ${items.filter(i => i.fairness === 'amber').length} | Skip: ${items.filter(i => i.fairness === 'skip').length}`)
}

seed().catch(console.error)
