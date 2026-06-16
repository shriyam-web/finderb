export type CitiesByState = {
  state: string;
  cities: readonly string[];
};

/** Major cities grouped by state/UT for the hero location picker. */
export const HERO_CITIES_BY_STATE: readonly CitiesByState[] = [
  {
    state: 'Delhi NCR',
    cities: [
      'New Delhi',
      'South Delhi',
      'North Delhi',
      'East Delhi',
      'West Delhi',
      'Central Delhi',
      'Noida',
      'Greater Noida',
      'Gurgaon',
      'Faridabad',
      'Ghaziabad',
    ],
  },
  {
    state: 'Uttar Pradesh',
    cities: [
      'Lucknow',
      'Kanpur',
      'Agra',
      'Varanasi',
      'Prayagraj',
      'Meerut',
      'Bareilly',
      'Gorakhpur',
      'Aligarh',
      'Moradabad',
      'Saharanpur',
      'Jhansi',
    ],
  },
  {
    state: 'Maharashtra',
    cities: [
      'Mumbai',
      'Pune',
      'Nagpur',
      'Thane',
      'Nashik',
      'Aurangabad',
      'Solapur',
      'Kolhapur',
      'Amravati',
      'Navi Mumbai',
    ],
  },
  {
    state: 'Karnataka',
    cities: [
      'Bangalore',
      'Mysore',
      'Mangalore',
      'Hubli',
      'Belgaum',
      'Gulbarga',
      'Davangere',
      'Shimoga',
    ],
  },
  {
    state: 'Tamil Nadu',
    cities: [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Tiruchirappalli',
      'Salem',
      'Tirunelveli',
      'Vellore',
      'Erode',
    ],
  },
  {
    state: 'Telangana',
    cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  },
  {
    state: 'Andhra Pradesh',
    cities: [
      'Visakhapatnam',
      'Vijayawada',
      'Guntur',
      'Nellore',
      'Tirupati',
      'Kakinada',
      'Rajahmundry',
    ],
  },
  {
    state: 'West Bengal',
    cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol', 'Kharagpur'],
  },
  {
    state: 'Gujarat',
    cities: [
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Bhavnagar',
      'Jamnagar',
      'Gandhinagar',
      'Anand',
    ],
  },
  {
    state: 'Rajasthan',
    cities: [
      'Jaipur',
      'Jodhpur',
      'Udaipur',
      'Kota',
      'Ajmer',
      'Bikaner',
      'Alwar',
      'Bhilwara',
    ],
  },
  {
    state: 'Madhya Pradesh',
    cities: [
      'Bhopal',
      'Indore',
      'Gwalior',
      'Jabalpur',
      'Ujjain',
      'Sagar',
      'Ratlam',
    ],
  },
  {
    state: 'Punjab',
    cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  },
  {
    state: 'Haryana',
    cities: ['Panipat', 'Ambala', 'Karnal', 'Rohtak', 'Hisar', 'Sonipat'],
  },
  {
    state: 'Kerala',
    cities: [
      'Kochi',
      'Thiruvananthapuram',
      'Kozhikode',
      'Thrissur',
      'Kollam',
      'Kannur',
    ],
  },
  {
    state: 'Bihar',
    cities: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia'],
  },
  {
    state: 'Odisha',
    cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
  },
  {
    state: 'Assam',
    cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur'],
  },
  {
    state: 'Jharkhand',
    cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  },
  {
    state: 'Chhattisgarh',
    cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  },
  {
    state: 'Uttarakhand',
    cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Nainital'],
  },
  {
    state: 'Himachal Pradesh',
    cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'],
  },
  {
    state: 'Goa',
    cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  },
  {
    state: 'Chandigarh',
    cities: ['Chandigarh'],
  },
  {
    state: 'Jammu & Kashmir',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  },
  {
    state: 'Puducherry',
    cities: ['Puducherry', 'Karaikal'],
  },
] as const;

/** Flat list of all hero picker cities (deduplicated). */
export const HERO_POPULAR_CITIES = [
  ...new Set(HERO_CITIES_BY_STATE.flatMap((group) => group.cities)),
] as const;

function normalizeCity(value: string): string {
  return value.trim().toLowerCase();
}

export function isHeroCitySelected(
  effectiveSearchLocation: string | null | undefined,
  city: string
): boolean {
  if (!effectiveSearchLocation) return false;
  const location = normalizeCity(effectiveSearchLocation);
  const target = normalizeCity(city);
  if (location === target) return true;
  if (location.endsWith(`, ${target}`)) return true;
  if (location.startsWith(`${target},`)) return true;
  return location.split(',').some((part) => part.trim() === target);
}
