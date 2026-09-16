import type { UserCoords } from '../hooks/useUserLocation';

/** Approximate city-center coords for fast distance without a network geocode. */
export const INDIA_CITY_COORDS: Record<string, UserCoords> = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  thane: { lat: 19.2183, lng: 72.9781 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  patna: { lat: 25.5941, lng: 85.1376 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  ludhiana: { lat: 30.901, lng: 75.8573 },
  agra: { lat: 27.1767, lng: 78.0081 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  faridabad: { lat: 28.4089, lng: 77.3178 },
  meerut: { lat: 28.9845, lng: 77.7064 },
  rajkot: { lat: 22.3039, lng: 70.8022 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  dhanbad: { lat: 23.7957, lng: 86.4304 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  allahabad: { lat: 25.4358, lng: 81.8463 },
  prayagraj: { lat: 25.4358, lng: 81.8463 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  jabalpur: { lat: 23.1815, lng: 79.9864 },
  gwalior: { lat: 26.2183, lng: 78.1828 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  raipur: { lat: 21.2514, lng: 81.6296 },
  kota: { lat: 25.2138, lng: 75.8648 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  chandrapur: { lat: 19.9703, lng: 79.3032 },
  goa: { lat: 15.2993, lng: 74.124 },
  panaji: { lat: 15.4909, lng: 73.8278 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  noida: { lat: 28.5355, lng: 77.391 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  manali: { lat: 32.2432, lng: 77.1892 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  haridwar: { lat: 29.9457, lng: 78.1642 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  puducherry: { lat: 11.9416, lng: 79.8083 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  surat: { lat: 21.1702, lng: 72.8311 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
  ooty: { lat: 11.4102, lng: 76.695 },
  darjeeling: { lat: 27.036, lng: 88.2627 },
  shillong: { lat: 25.5788, lng: 91.8933 },
  imphal: { lat: 24.817, lng: 93.9368 },
  aizawl: { lat: 23.7271, lng: 92.7176 },
  gangtok: { lat: 27.3389, lng: 88.6065 },
  'port blair': { lat: 11.6234, lng: 92.7265 },
  leh: { lat: 34.1526, lng: 77.5771 },
  jammu: { lat: 32.7266, lng: 74.857 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  cuttack: { lat: 20.4625, lng: 85.883 },
  mangalore: { lat: 12.9141, lng: 74.856 },
  mangaluru: { lat: 12.9141, lng: 74.856 },
  belgaum: { lat: 15.8497, lng: 74.4977 },
  hubli: { lat: 15.3647, lng: 75.124 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  nizamabad: { lat: 18.6725, lng: 78.0941 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.146 },
  erode: { lat: 11.341, lng: 77.7172 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  thrissur: { lat: 10.5276, lng: 76.2144 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  calicut: { lat: 11.2588, lng: 75.7804 },
  alappuzha: { lat: 9.4981, lng: 76.3388 },
  alleppey: { lat: 9.4981, lng: 76.3388 },
  jaisalmer: { lat: 26.9157, lng: 70.9083 },
  pushkar: { lat: 26.4896, lng: 74.5511 },
  'mount abu': { lat: 24.5926, lng: 72.7156 },
  khajuraho: { lat: 24.8318, lng: 79.9199 },
};

export const POPULAR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Chandigarh',
  'Lucknow',
  'Indore',
  'Bhopal',
  'Agra',
  'Varanasi',
  'Goa',
  'Noida',
  'Gurugram',
  'Kochi',
  'Udaipur',
] as const;

function normalizeCityKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.]/g, '');
}

/** Resolve coords from a freeform place/city string using the static map. */
export function lookupCityCoords(locationOrCity: string): UserCoords | null {
  const raw = normalizeCityKey(locationOrCity);
  if (!raw) return null;

  const direct = INDIA_CITY_COORDS[raw];
  if (direct) return direct;

  const parts = raw
    .split(/[,|/–—-]/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const hit = INDIA_CITY_COORDS[part];
    if (hit) return hit;
  }

  for (const [key, coords] of Object.entries(INDIA_CITY_COORDS)) {
    if (raw.includes(key) || key.includes(raw)) return coords;
  }

  return null;
}
