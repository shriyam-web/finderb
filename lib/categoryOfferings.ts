export type CategoryOfferings = {
  services: string[];
  keywords: string[];
};

type Profile = {
  match: string[];
  services: string[];
  keywords: string[];
};

/** Common services and search phrases for local categories on FinderB. */
const PROFILES: Profile[] = [
  { match: ['doctor', 'physician', 'clinic', 'hospital', 'medical'], services: ['General consultation', 'Health checkup', 'Follow-up visit', 'Online consultation'], keywords: ['doctor near me', 'clinic', 'physician', 'checkup', 'opd'] },
  { match: ['dentist', 'dental'], services: ['Dental checkup', 'Teeth cleaning', 'Root canal', 'Braces', 'Tooth extraction'], keywords: ['dentist', 'dental clinic', 'teeth cleaning', 'root canal', 'braces'] },
  { match: ['eye', 'optic', 'ophthal'], services: ['Eye test', 'Spectacle fitting', 'Contact lenses', 'Cataract consultation'], keywords: ['eye specialist', 'optician', 'eye test', 'spectacles'] },
  { match: ['skin', 'derma'], services: ['Skin consultation', 'Acne treatment', 'Hair loss treatment'], keywords: ['dermatologist', 'skin doctor', 'acne', 'hair fall'] },
  { match: ['pharma', 'chemist', 'medical store', 'drug'], services: ['Prescription medicines', 'OTC medicines', 'Home delivery'], keywords: ['pharmacy', 'chemist', 'medicine shop', 'medical store'] },
  { match: ['diagnostic', 'pathology', 'lab', 'scan', 'x-ray', 'xray'], services: ['Blood test', 'Full body checkup', 'X-ray', 'Ultrasound'], keywords: ['pathology', 'blood test', 'diagnostic centre', 'lab test'] },
  { match: ['physio'], services: ['Physiotherapy session', 'Sports injury rehab', 'Home visit physiotherapy'], keywords: ['physiotherapy', 'physio', 'pain relief', 'rehab'] },
  { match: ['ayurved'], services: ['Ayurvedic consultation', 'Panchakarma', 'Herbal medicines'], keywords: ['ayurveda', 'ayurvedic doctor', 'panchakarma'] },
  { match: ['veterinar', 'vet ', 'pet clinic'], services: ['Pet consultation', 'Vaccination', 'Deworming', 'Pet grooming'], keywords: ['vet', 'veterinary', 'pet clinic', 'dog doctor'] },
  { match: ['restaurant', 'dhaba', 'diner', 'eatery'], services: ['Dine-in', 'Home delivery', 'Takeaway', 'Party booking'], keywords: ['restaurant', 'food delivery', 'dine in', 'lunch', 'dinner'] },
  { match: ['cafe', 'coffee', 'bakery', 'cake'], services: ['Coffee', 'Bakery items', 'Custom cakes', 'Snacks'], keywords: ['cafe', 'coffee shop', 'bakery', 'cake shop'] },
  { match: ['sweet', 'mithai'], services: ['Sweets', 'Gift boxes', 'Bulk orders', 'Festival hampers'], keywords: ['sweet shop', 'mithai', 'namkeen'] },
  { match: ['cater'], services: ['Wedding catering', 'Party catering', 'Bulk meals', 'Live counters'], keywords: ['catering', 'wedding food', 'party catering'] },
  { match: ['hotel', 'resort', 'lodge'], services: ['Room booking', 'Restaurant', 'Banquet', 'Airport pickup'], keywords: ['hotel', 'rooms', 'stay', 'resort', 'lodge'] },
  { match: ['pg', 'hostel', 'paying guest'], services: ['PG accommodation', 'Shared rooms', 'Meals included', 'Wi-Fi'], keywords: ['pg', 'paying guest', 'hostel', 'rooms for rent'] },
  { match: ['salon', 'parlour', 'parlor', 'beauty'], services: ['Haircut', 'Hair colour', 'Facial', 'Bridal makeup', 'Manicure'], keywords: ['salon', 'beauty parlour', 'haircut', 'bridal makeup'] },
  { match: ['spa', 'massage'], services: ['Body massage', 'Spa package', 'Couple spa'], keywords: ['spa', 'massage', 'body spa'] },
  { match: ['gym', 'fitness', 'crossfit'], services: ['Gym membership', 'Personal training', 'Group classes', 'Weight loss plan'], keywords: ['gym', 'fitness', 'personal trainer', 'workout'] },
  { match: ['yoga'], services: ['Yoga classes', 'Meditation', 'Prenatal yoga'], keywords: ['yoga', 'yoga classes', 'meditation'] },
  { match: ['plumb'], services: ['Tap repair', 'Pipe leakage', 'Bathroom fitting', 'Drain cleaning'], keywords: ['plumber', 'plumbing', 'leakage', 'tap repair'] },
  { match: ['electric'], services: ['Wiring', 'Fan installation', 'Switchboard repair', 'Inverter setup'], keywords: ['electrician', 'wiring', 'electrical repair'] },
  { match: ['carpenter', 'furniture repair'], services: ['Furniture repair', 'Custom furniture', 'Door fitting', 'Modular work'], keywords: ['carpenter', 'furniture repair', 'wood work'] },
  { match: ['painter', 'painting'], services: ['Home painting', 'Wall texture', 'Waterproofing'], keywords: ['painter', 'house painting', 'wall paint'] },
  { match: ['ac repair', 'air condition', 'hvac'], services: ['AC service', 'AC installation', 'Gas refilling', 'AC repair'], keywords: ['ac repair', 'ac service', 'air conditioner'] },
  { match: ['appliance', 'washing machine', 'refrigerat', 'fridge'], services: ['Washing machine repair', 'Fridge repair', 'Microwave repair'], keywords: ['appliance repair', 'fridge repair', 'washing machine'] },
  { match: ['mobile repair', 'phone repair', 'cellphone'], services: ['Screen replacement', 'Battery replacement', 'Water damage repair'], keywords: ['mobile repair', 'phone screen', 'battery replacement'] },
  { match: ['computer', 'laptop', 'it service'], services: ['Laptop repair', 'Desktop repair', 'Data recovery', 'Software setup'], keywords: ['laptop repair', 'computer repair', 'data recovery'] },
  { match: ['cctv', 'security system'], services: ['CCTV installation', 'CCTV repair', 'Biometric setup'], keywords: ['cctv', 'security camera', 'cctv installation'] },
  { match: ['automobile', 'car repair', 'garage', 'mechanic', 'car service'], services: ['Car service', 'Denting painting', 'Engine repair', 'Wheel alignment'], keywords: ['car garage', 'car service', 'mechanic', 'car repair'] },
  { match: ['car wash', 'detailing'], services: ['Car wash', 'Interior cleaning', 'Ceramic coating'], keywords: ['car wash', 'car detailing'] },
  { match: ['bike', 'two wheeler'], services: ['Bike service', 'Engine repair', 'Pickup and drop'], keywords: ['bike service', 'two wheeler repair'] },
  { match: ['driving school', 'driving'], services: ['Car driving classes', 'Bike training', 'License assistance'], keywords: ['driving school', 'driving classes'] },
  { match: ['lawyer', 'advocate', 'legal'], services: ['Legal consultation', 'Property cases', 'Family law', 'Documentation'], keywords: ['lawyer', 'advocate', 'legal advice'] },
  { match: ['ca ', 'chartered', 'accountant', 'tax'], services: ['ITR filing', 'GST registration', 'Accounting', 'Company registration'], keywords: ['chartered accountant', 'gst', 'income tax', 'itr'] },
  { match: ['tutor', 'coaching', 'tuition', 'classes'], services: ['Home tuition', 'Batch classes', 'Exam coaching', 'Online classes'], keywords: ['tuition', 'coaching', 'home tutor', 'classes'] },
  { match: ['school'], services: ['Admissions', 'Day school', 'Transport'], keywords: ['school', 'admission', 'cbse', 'icse'] },
  { match: ['college', 'university'], services: ['Admissions', 'Courses', 'Campus visit'], keywords: ['college', 'admission', 'degree'] },
  { match: ['photo', 'studio'], services: ['Portrait shoot', 'Wedding photography', 'Product shoot', 'Passport photos'], keywords: ['photographer', 'photo studio', 'wedding photographer'] },
  { match: ['event', 'wedding plan'], services: ['Wedding planning', 'Birthday decor', 'Corporate events'], keywords: ['event planner', 'wedding planner', 'party organiser'] },
  { match: ['decorat'], services: ['Wedding decor', 'Balloon decor', 'Stage decor'], keywords: ['decorator', 'wedding decoration'] },
  { match: ['dj', 'band', 'music'], services: ['DJ for wedding', 'Sound system', 'Party DJ'], keywords: ['dj', 'wedding dj', 'sound system'] },
  { match: ['packers', 'movers', 'shifting'], services: ['Home shifting', 'Office shifting', 'Packing', 'Local transport'], keywords: ['packers and movers', 'shifting', 'relocation'] },
  { match: ['courier', 'logistics', 'transport'], services: ['Parcel delivery', 'Same-day courier', 'Cargo'], keywords: ['courier', 'parcel', 'logistics'] },
  { match: ['real estate', 'property', 'broker'], services: ['Buy property', 'Rent property', 'Site visit'], keywords: ['real estate', 'property dealer', 'flat for rent'] },
  { match: ['interior', 'architect'], services: ['Home interiors', 'Modular kitchen', '3D design'], keywords: ['interior designer', 'modular kitchen', 'architect'] },
  { match: ['jewell'], services: ['Gold jewellery', 'Silver jewellery', 'Custom designs', 'Repair'], keywords: ['jeweller', 'gold', 'jewellery shop'] },
  { match: ['cloth', 'garment', 'boutique', 'apparel', 'fashion'], services: ['Ready-made clothes', 'Custom stitching', 'Alterations'], keywords: ['boutique', 'clothing', 'tailor', 'fashion'] },
  { match: ['tailor'], services: ['Stitching', 'Alterations', 'Blouse stitching', 'Suit stitching'], keywords: ['tailor', 'stitching', 'alteration'] },
  { match: ['footwear', 'shoe'], services: ['Shoes', 'Shoe repair', 'Custom fit'], keywords: ['shoe shop', 'footwear', 'shoe repair'] },
  { match: ['grocery', 'kirana', 'supermarket'], services: ['Groceries', 'Home delivery', 'Daily essentials'], keywords: ['grocery', 'kirana', 'supermarket'] },
  { match: ['furniture'], services: ['Home furniture', 'Office furniture', 'Custom furniture'], keywords: ['furniture shop', 'sofa', 'bed'] },
  { match: ['electron'], services: ['Mobiles', 'Home appliances', 'Warranty support'], keywords: ['electronics shop', 'mobile shop', 'appliances'] },
  { match: ['hardware', 'sanitary'], services: ['Building material', 'Plumbing fittings', 'Paint', 'Tools'], keywords: ['hardware store', 'sanitary', 'building material'] },
  { match: ['print', 'xerox', 'stationery'], services: ['Printing', 'Photocopy', 'Visiting cards', 'Stationery'], keywords: ['printing', 'xerox', 'stationery'] },
  { match: ['travel', 'tour', 'ticketing'], services: ['Tour packages', 'Flight tickets', 'Hotel booking', 'Visa help'], keywords: ['travel agent', 'tour package', 'holiday'] },
  { match: ['insurance'], services: ['Health insurance', 'Motor insurance', 'Life insurance'], keywords: ['insurance agent', 'health insurance', 'policy'] },
  { match: ['bank', 'finance', 'loan', 'nbfc'], services: ['Personal loan', 'Business loan', 'Account opening'], keywords: ['loan', 'finance', 'bank'] },
  { match: ['laundry', 'dry clean'], services: ['Laundry', 'Dry cleaning', 'Ironing', 'Pickup and drop'], keywords: ['laundry', 'dry clean', 'ironing'] },
  { match: ['pest', 'termite'], services: ['Cockroach control', 'Termite treatment', 'Rodent control'], keywords: ['pest control', 'termite', 'cockroach'] },
  { match: ['clean'], services: ['Home cleaning', 'Deep cleaning', 'Sofa cleaning', 'Bathroom cleaning'], keywords: ['cleaning service', 'home cleaning', 'deep cleaning'] },
  { match: ['security guard', 'guard'], services: ['Security guards', 'Bouncer service', 'Event security'], keywords: ['security guard', 'bouncer'] },
  { match: ['astrolog'], services: ['Horoscope', 'Kundli', 'Vastu consultation'], keywords: ['astrologer', 'kundli', 'horoscope'] },
  { match: ['pandit', 'priest'], services: ['Puja', 'Wedding rituals', 'Griha pravesh'], keywords: ['pandit', 'puja', 'wedding priest'] },
  { match: ['nursery', 'plant', 'garden'], services: ['Plants', 'Garden setup', 'Landscaping'], keywords: ['plant nursery', 'garden', 'landscaping'] },
  { match: ['pet shop', 'pet store', 'pet care'], services: ['Pet food', 'Pet accessories', 'Grooming'], keywords: ['pet shop', 'dog food', 'pet care'] },
  { match: ['gym equipment'], services: ['Gym equipment', 'Installation', 'Maintenance'], keywords: ['gym equipment'] },
  { match: ['solar'], services: ['Solar installation', 'Solar maintenance', 'Subsidy guidance'], keywords: ['solar panel', 'solar installation'] },
  { match: ['water purif', 'ro service', 'ro '], services: ['RO installation', 'RO service', 'Filter change'], keywords: ['ro service', 'water purifier'] },
  { match: ['internet', 'broadband', 'wifi'], services: ['New connection', 'Wi-Fi installation', 'Plan upgrade'], keywords: ['broadband', 'wifi', 'internet'] },
  { match: ['marketing', 'advertis', 'digital'], services: ['Social media marketing', 'Google ads', 'Website design'], keywords: ['digital marketing', 'seo', 'website'] },
  { match: ['software', 'web develop', 'app develop', 'it compan'], services: ['Website development', 'App development', 'Software support'], keywords: ['software company', 'web development', 'app development'] },
  { match: ['consult'], services: ['Business consultation', 'Strategy session', 'On-site visit'], keywords: ['consultant', 'consulting'] },
];

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function unique(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const text = item.replace(/\s+/g, ' ').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text.slice(0, 40));
    if (out.length >= max) break;
  }
  return out;
}

function fallback(category: string): CategoryOfferings {
  const name = titleCase(category.trim()) || 'This category';
  const words = tokens(category);
  const phrase = words.slice(0, 3).join(' ');
  return {
    services: unique(
      [name, `${name} consultation`, 'Home visit', 'On-site service', 'Same-day service'],
      8,
    ),
    keywords: unique(
      [phrase, `${phrase} near me`, name.toLowerCase(), ...words, 'booking', 'price'],
      10,
    ),
  };
}

/** Suggestions for the services and keywords editors, based on the listing category. */
export function offeringsForCategory(category: string | null | undefined): CategoryOfferings {
  const raw = String(category || '').trim();
  if (!raw) return fallback('Local business');
  const hay = ` ${raw.toLowerCase()} `;
  let best: Profile | null = null;
  let bestScore = 0;
  for (const profile of PROFILES) {
    let score = 0;
    for (const needle of profile.match) {
      if (hay.includes(needle)) score += needle.length;
    }
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }
  if (!best) return fallback(raw);
  const base = fallback(raw);
  return {
    services: unique([...best.services, ...base.services], 10),
    keywords: unique([...best.keywords, ...base.keywords], 12),
  };
}
