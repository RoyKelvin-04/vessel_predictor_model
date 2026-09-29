// Seeded PRNG (mulberry32) so synthetic data is identical on every load
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VESSEL_TYPES = ['Container', 'Bulk Carrier', 'Tanker', 'General Cargo', 'Ro-Ro'];
const BERTHS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

// Base service time per vessel type (hours) — Tankers & Bulk Carriers take longest, Ro-Ro is quickest
const SERVICE_BASE = {
  'Container': 18,
  'Bulk Carrier': 32,
  'Tanker': 36,
  'General Cargo': 22,
  'Ro-Ro': 10,
};

const FIRST_NAMES = ['Nordic Star', 'Ocean Trader', 'Sea Breeze', 'Pacific Dawn', 'Atlantic Crest',
  'Blue Horizon', 'Cape Falcon', 'Mariner', 'Deep Blue', 'Northern Light',
  'Coral Wave', 'Stellar Wind', 'Harbor Queen', 'Tidal Force', 'Silent Tide',
  'Golden Shell', 'Iron Clad', 'Sea Spirit', 'Coastal Pride', 'Voyager'];

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function gaussian(rng, mean, std) {
  // Box-Muller transform for normally-distributed noise
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

// Generate ~600 synthetic port-call records with realistic relationships:
//   - larger cargo & longer vessels → longer service
//   - tanker / bulk carrier service > Ro-Ro
//   - longer queue at arrival → longer wait
//   - weather delay adds extra hours
//   - random noise on every measurement
function generatePortCalls(count = 600, seed = 42) {
  const rng = mulberry32(seed);
  const records = [];
  const now = new Date('2026-09-01T00:00:00Z');

  for (let i = 0; i < count; i++) {
    const vesselType = pick(VESSEL_TYPES, rng);
    const berth = pick(BERTHS, rng);

    // Vessel length ranges vary by type
    const lengthM = round1(clamp(
      gaussian(rng,
        vesselType === 'Tanker' ? 240 : vesselType === 'Bulk Carrier' ? 220 : vesselType === 'Container' ? 200 : 120,
        vesselType === 'Ro-Ro' ? 25 : 50),
      40, 360));

    // Cargo tonnage correlates with vessel length
    const cargoTonnes = Math.max(50, Math.round(
      gaussian(rng, lengthM * 120, 4000)));

    const queueLengthAtArrival = Math.floor(rng() * 9); // 0–8 vessels waiting
    const weatherDelay = rng() < 0.28; // 28% of calls hit a weather delay

    // Service hours = base(type) + length effect + cargo effect + weather + noise
    const lengthEffect = (lengthM - 150) * 0.06;
    const cargoEffect = (cargoTonnes / 1000) * 1.4;
    const weatherServiceExtra = weatherDelay ? gaussian(rng, 5, 2) : 0;
    const serviceHours = round1(clamp(
      SERVICE_BASE[vesselType] + lengthEffect + cargoEffect + weatherServiceExtra + gaussian(rng, 0, 3),
      4, 80));

    // Wait hours = queue effect + weather + noise
    const queueEffect = queueLengthAtArrival * gaussian(rng, 2.8, 0.6);
    const weatherWaitExtra = weatherDelay ? gaussian(rng, 4, 1.5) : 0;
    const waitHours = round1(clamp(
      queueEffect + weatherWaitExtra + gaussian(rng, 0, 2),
      0.2, 60));

    const turnaroundHours = round1(waitHours + serviceHours);

    // Arrival spread across the last 12 months
    const daysAgo = Math.floor(rng() * 365);
    const arrivalDate = new Date(now);
    arrivalDate.setUTCDate(arrivalDate.getUTCDate() - daysAgo);
    arrivalDate.setUTCHours(Math.floor(rng() * 24), Math.floor(rng() * 60));
    const arrivalTime = arrivalDate.toISOString();

    const vesselName = `${pick(FIRST_NAMES, rng)} ${romanish(i + 1)}`;

    records.push({
      id: `PC-${String(i + 1).padStart(4, '0')}`,
      vesselName,
      vesselType,
      lengthM,
      cargoTonnes,
      berth,
      arrivalTime,
      waitHours,
      serviceHours,
      turnaroundHours,
      queueLengthAtArrival,
      weatherDelay,
    });
  }

  return records;
}

function romanish(n) {
  // simple numeric suffix for vessel names
  return String(100 + (n % 900));
}

export { generatePortCalls, VESSEL_TYPES, BERTHS };
