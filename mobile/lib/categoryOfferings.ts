export type CategoryOfferings = {
  services: string[];
  keywords: string[];
};

type Profile = {
  match: string[];
  services: string[];
  keywords: string[];
};

/**
 * Services and search phrases for FinderB categories.
 * Longer phrases win, so "Wedding Photographers" stays wedding photography
 * and does not fall through to a generic photographer or "Home visit" list.
 * Needles match whole words (and simple plurals), not letters inside another word.
 */
const PROFILES: Profile[] = [
  { match: ['wedding photographer'], services: ['Wedding photography', 'Pre-wedding shoot', 'Candid photography', 'Album design'], keywords: ['wedding photographer', 'candid wedding', 'pre wedding shoot', 'wedding album'] },
  { match: ['wedding caterer'], services: ['Wedding catering', 'Live counters', 'Bulk meals', 'Menu tasting'], keywords: ['wedding caterer', 'wedding food', 'marriage catering', 'live counter'] },
  { match: ['wedding decorator'], services: ['Wedding decor', 'Stage decor', 'Mandap decor', 'Flower decor'], keywords: ['wedding decorator', 'marriage decoration', 'stage decor', 'mandap'] },
  { match: ['wedding planning', 'wedding planner'], services: ['Wedding planning', 'Vendor coordination', 'Guest management', 'Day-of coordination'], keywords: ['wedding planner', 'wedding planning', 'marriage planner'] },
  { match: ['bridal makeup'], services: ['Bridal makeup', 'Engagement makeup', 'Hair styling', 'Family makeup'], keywords: ['bridal makeup', 'bridal makeup artist', 'wedding makeup'] },
  { match: ['makeup artist', 'makeup'], services: ['Party makeup', 'Bridal makeup', 'Engagement makeup', 'Hairstyling'], keywords: ['makeup artist', 'party makeup', 'bridal makeup'] },
  { match: ['hair stylist', 'hairstylist'], services: ['Haircut', 'Hair colour', 'Hair spa', 'Keratin treatment'], keywords: ['hair stylist', 'hair colour', 'haircut', 'hair spa'] },
  { match: ['nail'], services: ['Nail art', 'Manicure', 'Pedicure', 'Gel nails'], keywords: ['nail art', 'nail studio', 'manicure', 'pedicure'] },
  { match: ['unisex'], services: ['Haircut', 'Beard trim', 'Hair colour', 'Facial'], keywords: ['unisex salon', 'haircut', 'salon near me'] },
  { match: ['parlour', 'parlor'], services: ['Haircut', 'Facial', 'Bleach', 'Waxing', 'Bridal makeup'], keywords: ['beauty parlour', 'facial', 'waxing', 'parlour'] },
  { match: ['massage'], services: ['Body massage', 'Aromatherapy', 'Couple massage', 'Head massage'], keywords: ['massage center', 'body massage', 'spa massage'] },
  { match: ['beauty spa', 'spa'], services: ['Body massage', 'Spa package', 'Facial', 'Cleanup'], keywords: ['spa', 'beauty spa', 'body spa', 'massage'] },
  { match: ['salon'], services: ['Haircut', 'Hair colour', 'Facial', 'Waxing', 'Beard styling'], keywords: ['salon', 'haircut', 'beauty salon', 'hair colour'] },

  { match: ['chinese restaurant', 'chinese'], services: ['Chinese meals', 'Dine-in', 'Home delivery', 'Takeaway'], keywords: ['chinese restaurant', 'noodles', 'fried rice', 'chinese food'] },
  { match: ['north indian'], services: ['North Indian meals', 'Thali', 'Dine-in', 'Home delivery'], keywords: ['north indian restaurant', 'thali', 'north indian food'] },
  { match: ['south indian'], services: ['South Indian meals', 'Dosa and idli', 'Dine-in', 'Home delivery'], keywords: ['south indian restaurant', 'dosa', 'idli', 'south indian food'] },
  { match: ['fast food'], services: ['Burgers', 'Wraps and rolls', 'Takeaway', 'Home delivery'], keywords: ['fast food', 'burger', 'quick bites'] },
  { match: ['fine dining'], services: ['Fine dining', 'Table reservation', 'Set menu', 'Private dining'], keywords: ['fine dining', 'restaurant reservation', 'dinner'] },
  { match: ['bakery'], services: ['Cakes', 'Pastries', 'Custom cakes', 'Snacks'], keywords: ['bakery', 'cake shop', 'custom cake', 'pastry'] },
  { match: ['cafe', 'coffee'], services: ['Coffee', 'Snacks', 'Dine-in', 'Takeaway'], keywords: ['cafe', 'coffee shop', 'coffee'] },
  { match: ['caterer', 'catering'], services: ['Party catering', 'Wedding catering', 'Bulk meals', 'Live counters'], keywords: ['caterer', 'catering', 'party food', 'wedding food'] },
  { match: ['restaurant', 'dhaba', 'diner'], services: ['Dine-in', 'Home delivery', 'Takeaway', 'Party booking'], keywords: ['restaurant', 'dine in', 'food delivery', 'lunch'] },
  { match: ['sweet', 'mithai'], services: ['Sweets', 'Namkeen', 'Gift boxes', 'Festival orders'], keywords: ['sweet shop', 'mithai', 'namkeen'] },
  { match: ['tiffin', 'cloud kitchen'], services: ['Tiffin service', 'Monthly meals', 'Home delivery', 'Office lunch'], keywords: ['tiffin service', 'cloud kitchen', 'home food'] },
  { match: ['ice cream'], services: ['Ice cream', 'Party packs', 'Takeaway'], keywords: ['ice cream parlour', 'ice cream'] },
  { match: ['florist', 'flower'], services: ['Fresh flowers', 'Bouquets', 'Wedding flowers', 'Home delivery'], keywords: ['florist', 'flower shop', 'bouquet'] },

  { match: ['budget hotel'], services: ['Budget rooms', 'Daily booking', 'Couple rooms', 'Wi-Fi'], keywords: ['budget hotel', 'cheap hotel', 'rooms'] },
  { match: ['business hotel'], services: ['Business rooms', 'Conference room', 'Airport pickup', 'Wi-Fi'], keywords: ['business hotel', 'corporate stay', 'hotel'] },
  { match: ['luxury hotel'], services: ['Luxury rooms', 'Suite booking', 'Fine dining', 'Airport pickup'], keywords: ['luxury hotel', '5 star hotel', 'suite'] },
  { match: ['couple friendly'], services: ['Couple rooms', 'Hourly and night stay', 'Room service'], keywords: ['couple friendly hotel', 'couple rooms'] },
  { match: ['resort'], services: ['Resort stay', 'Package booking', 'Meals', 'Banquet'], keywords: ['resort', 'resort booking', 'weekend stay'] },
  { match: ['marriage hall', 'banquet', 'marriage'], services: ['Marriage hall', 'Party lawn', 'Catering tie-up', 'Decor tie-up'], keywords: ['marriage hall', 'banquet hall', 'wedding venue'] },
  { match: ['guest house', 'lodge', 'service apartment'], services: ['Room booking', 'Daily stay', 'Monthly stay', 'Wi-Fi'], keywords: ['guest house', 'lodge', 'service apartment'] },
  { match: ['hotel'], services: ['Room booking', 'Restaurant', 'Banquet', 'Airport pickup'], keywords: ['hotel', 'rooms', 'hotel booking', 'stay'] },

  { match: ['boys pg'], services: ['Boys PG', 'Single and shared rooms', 'Meals', 'Wi-Fi'], keywords: ['boys pg', 'pg for boys', 'paying guest'] },
  { match: ['girls pg'], services: ['Girls PG', 'Single and shared rooms', 'Meals', 'Wi-Fi'], keywords: ['girls pg', 'pg for girls', 'paying guest'] },
  { match: ['paying guest'], services: ['PG search', 'Site visits', 'Rent agreement', 'Boys and girls PG'], keywords: ['pg consultant', 'paying guest', 'pg near me'] },
  { match: ['shared room'], services: ['Shared rooms', 'Bed booking', 'Meals', 'Wi-Fi'], keywords: ['shared room', 'pg', 'roommate'] },
  { match: ['student accommodation'], services: ['Student rooms', 'Hostel stay', 'Meals', 'Study area'], keywords: ['student accommodation', 'student hostel', 'pg for students'] },
  { match: ['pg hostel', 'hostel', 'pg'], services: ['PG rooms', 'Hostel stay', 'Meals', 'Wi-Fi'], keywords: ['pg', 'hostel', 'paying guest', 'rooms for rent'] },

  { match: ['car ac repair', 'car ac'], services: ['Car AC repair', 'Gas refilling', 'Cooling check', 'Compressor check'], keywords: ['car ac repair', 'car ac gas', 'car ac service'] },
  { match: ['car wash', 'detailing'], services: ['Car wash', 'Interior cleaning', 'Polishing', 'Ceramic coating'], keywords: ['car wash', 'car detailing', 'interior cleaning'] },
  { match: ['denting and painting', 'denting'], services: ['Denting', 'Car painting', 'Scratch repair', 'Insurance claim'], keywords: ['denting painting', 'car dent', 'scratch repair'] },
  { match: ['tyre', 'wheel care', 'wheel alignment'], services: ['Tyre change', 'Wheel alignment', 'Balancing', 'Puncture repair'], keywords: ['tyre shop', 'wheel alignment', 'puncture', 'tyre'] },
  { match: ['car accessor'], services: ['Seat covers', 'Audio and lights', 'Floor mats', 'Fitting'], keywords: ['car accessories', 'seat cover', 'car audio'] },
  { match: ['car dealer'], services: ['New cars', 'Used cars', 'Exchange', 'Finance help'], keywords: ['car dealer', 'car showroom', 'used cars', 'new cars'] },
  { match: ['car hire'], services: ['Self-drive cars', 'Car with driver', 'Outstation hire', 'Airport drop'], keywords: ['car hire', 'self drive', 'car rental'] },
  { match: ['cab', 'taxi'], services: ['Local cab', 'Outstation cab', 'Airport pickup', 'Hourly rental'], keywords: ['cab service', 'taxi', 'outstation cab', 'airport taxi'] },
  { match: ['car service', 'car repair', 'garage', 'mechanic'], services: ['Car service', 'Engine repair', 'Denting painting', 'Pickup and drop'], keywords: ['car service', 'car garage', 'car repair', 'mechanic'] },
  { match: ['driving school', 'driving'], services: ['Car driving classes', 'Bike training', 'License help'], keywords: ['driving school', 'driving classes', 'learning license'] },
  { match: ['bike', 'two wheeler'], services: ['Bike service', 'Engine repair', 'Pickup and drop'], keywords: ['bike service', 'two wheeler repair', 'bike garage'] },

  { match: ['orthodont'], services: ['Braces', 'Aligners', 'Retainers', 'Bite correction'], keywords: ['orthodontist', 'braces', 'aligners', 'teeth braces'] },
  { match: ['root canal'], services: ['Root canal', 'Tooth pain treatment', 'Crown fixing', 'Re-RCT'], keywords: ['root canal', 'rct', 'tooth pain', 'dental crown'] },
  { match: ['dental implant', 'implant'], services: ['Dental implants', 'Crowns', 'Tooth replacement', 'Implant consult'], keywords: ['dental implant', 'tooth implant', 'dental crown'] },
  { match: ['cosmetic dentist'], services: ['Teeth whitening', 'Smile design', 'Veneers', 'Tooth bonding'], keywords: ['cosmetic dentist', 'teeth whitening', 'smile design'] },
  { match: ['dental hospital', 'dentist', 'dental'], services: ['Dental checkup', 'Teeth cleaning', 'Root canal', 'Tooth extraction', 'Braces'], keywords: ['dentist', 'dental clinic', 'teeth cleaning', 'root canal'] },

  { match: ['eye hospital', 'optician', 'optical', 'eye'], services: ['Eye test', 'Cataract consult', 'Spectacle fitting', 'Contact lenses'], keywords: ['eye hospital', 'eye specialist', 'eye test', 'optician'] },
  { match: ['children hospital', 'pediatric', 'paediatric'], services: ['Child consultation', 'Vaccination', 'Newborn care', 'Growth checkup'], keywords: ['pediatrician', 'child specialist', 'children hospital', 'vaccination'] },
  { match: ['gynecolog', 'gynaecolog', 'ivf', 'fertility'], services: ['Women consultation', 'Pregnancy care', 'Fertility consult', 'Ultrasound'], keywords: ['gynecologist', 'gynaecologist', 'pregnancy doctor', 'ivf'] },
  { match: ['cardiolog'], services: ['Heart consultation', 'ECG', 'Blood pressure care', 'Follow-up'], keywords: ['cardiologist', 'heart specialist', 'ecg', 'heart doctor'] },
  { match: ['orthopedic', 'orthopaedic'], services: ['Bone and joint care', 'Fracture care', 'Back pain', 'Physiotherapy advice'], keywords: ['orthopedic', 'bone doctor', 'joint pain', 'fracture'] },
  { match: ['dermatolog', 'skin'], services: ['Skin consultation', 'Acne treatment', 'Hair loss treatment', 'Laser consult'], keywords: ['dermatologist', 'skin doctor', 'acne', 'hair fall'] },
  { match: ['ent'], services: ['Ear consultation', 'Nose and sinus', 'Throat care', 'Hearing check'], keywords: ['ent specialist', 'ear doctor', 'sinus', 'throat doctor'] },
  { match: ['ayurved'], services: ['Ayurvedic consultation', 'Panchakarma', 'Herbal medicines'], keywords: ['ayurveda', 'ayurvedic doctor', 'panchakarma'] },
  { match: ['homeopath'], services: ['Homeopathy consult', 'Chronic care', 'Follow-up', 'Medicines'], keywords: ['homeopathy', 'homeopathic doctor'] },
  { match: ['physio'], services: ['Physiotherapy', 'Sports injury rehab', 'Home visit physio', 'Back pain'], keywords: ['physiotherapy', 'physio', 'pain relief', 'rehab'] },
  { match: ['dietician', 'nutrition'], services: ['Diet plan', 'Weight management', 'Diabetes diet', 'Follow-up'], keywords: ['dietician', 'diet plan', 'nutritionist'] },
  { match: ['psychiat', 'psycholog'], services: ['Mental health consult', 'Counselling', 'Follow-up session'], keywords: ['psychiatrist', 'psychologist', 'counselling'] },
  { match: ['neurolog'], services: ['Neuro consultation', 'Headache care', 'Follow-up'], keywords: ['neurologist', 'brain specialist', 'neuro doctor'] },
  { match: ['patholog', 'diagnostic', 'scan centre', 'ultrasound'], services: ['Blood test', 'Full body checkup', 'Ultrasound', 'Home sample pickup'], keywords: ['pathology', 'blood test', 'diagnostic centre', 'lab test'] },
  { match: ['nursing'], services: ['Home nursing', 'Patient attendant', 'Injection at home', 'Elder care'], keywords: ['nursing service', 'home nurse', 'patient care', 'attendant'] },
  { match: ['medical store', 'pharmacist', 'pharmacy', 'chemist'], services: ['Prescription medicines', 'OTC medicines', 'Home delivery'], keywords: ['medical store', 'pharmacy', 'chemist', 'medicine shop'] },
  { match: ['multispeciality', 'super speciality', 'private hospital'], services: ['OPD', 'Emergency', 'Surgery', 'Diagnostics', 'Admission'], keywords: ['hospital', 'multispeciality', 'emergency', 'opd'] },
  { match: ['general physician', 'physician'], services: ['General consultation', 'Fever and infection', 'Health checkup', 'Follow-up'], keywords: ['general physician', 'doctor', 'checkup', 'opd'] },
  { match: ['hospital', 'doctor', 'clinic', 'medical', 'health'], services: ['Doctor consultation', 'OPD', 'Health checkup', 'Follow-up visit'], keywords: ['doctor', 'hospital', 'clinic', 'checkup', 'health'] },
  { match: ['veterinar', 'pet clinic'], services: ['Pet consultation', 'Vaccination', 'Deworming', 'Surgery consult'], keywords: ['vet', 'veterinary', 'pet clinic', 'dog doctor'] },
  { match: ['pet groom', 'dog train'], services: ['Pet grooming', 'Bath and haircut', 'Dog training'], keywords: ['pet grooming', 'dog training', 'pet salon'] },
  { match: ['pet'], services: ['Pet food', 'Pet accessories', 'Grooming', 'Medicines'], keywords: ['pet shop', 'dog food', 'pet store'] },

  { match: ['admission'], services: ['College admission', 'Course shortlist', 'Form filling', 'Counselling'], keywords: ['admission consultant', 'college admission', 'admission guidance'] },
  { match: ['study abroad'], services: ['Study abroad', 'University shortlist', 'Visa file', 'Test prep'], keywords: ['study abroad', 'overseas education', 'student visa'] },
  { match: ['computer training'], services: ['Computer courses', 'Tally and Excel', 'Certification', 'Job support'], keywords: ['computer training', 'computer institute', 'tally class'] },
  { match: ['vocational'], services: ['Job-oriented courses', 'Skill training', 'Certification', 'Placement help'], keywords: ['vocational training', 'skill course', 'job course'] },
  { match: ['online class'], services: ['Online classes', 'Live batches', 'Recorded lessons', 'Doubt sessions'], keywords: ['online classes', 'online coaching', 'live class'] },
  { match: ['coaching'], services: ['Batch classes', 'Exam coaching', 'Test series', 'Doubt classes'], keywords: ['coaching', 'coaching institute', 'tuition', 'exam coaching'] },
  { match: ['spoken english', 'ielts'], services: ['Spoken English', 'IELTS coaching', 'Interview prep'], keywords: ['spoken english', 'ielts', 'english classes'] },
  { match: ['preschool', 'play school', 'daycare'], services: ['Daycare', 'Preschool', 'Activity classes', 'Admission'], keywords: ['play school', 'preschool', 'daycare'] },
  { match: ['dance class', 'dance'], services: ['Dance classes', 'Wedding choreography', 'Kids batches'], keywords: ['dance class', 'choreographer', 'dance academy'] },
  { match: ['music class', 'music teacher'], services: ['Music classes', 'Instrument training', 'Vocals'], keywords: ['music class', 'guitar class', 'singing class'] },
  { match: ['school'], services: ['Admissions', 'Day school', 'Transport', 'Campus visit'], keywords: ['school', 'school admission', 'cbse', 'icse'] },
  { match: ['college', 'university'], services: ['Admissions', 'Courses', 'Campus visit'], keywords: ['college', 'college admission', 'degree'] },
  { match: ['education'], services: ['Admissions', 'Courses', 'Counselling', 'Campus visit'], keywords: ['education', 'admission', 'courses'] },
  { match: ['placement', 'recruit'], services: ['Job placement', 'Resume help', 'Campus hiring', 'Interview prep'], keywords: ['placement service', 'recruitment', 'job consultant'] },

  { match: ['immigration'], services: ['Visa filing', 'Immigration consult', 'Document check', 'Appeal support'], keywords: ['immigration lawyer', 'visa lawyer', 'immigration'] },
  { match: ['criminal lawyer', 'criminal'], services: ['Criminal cases', 'Bail', 'FIR consult', 'Court hearing'], keywords: ['criminal lawyer', 'bail lawyer', 'criminal advocate'] },
  { match: ['family lawyer', 'family law'], services: ['Divorce cases', 'Maintenance', 'Custody', 'Family settlement'], keywords: ['family lawyer', 'divorce lawyer', 'family court'] },
  { match: ['corporate lawyer', 'corporate law'], services: ['Company law', 'Contracts', 'Compliance', 'Legal notice'], keywords: ['corporate lawyer', 'company lawyer', 'legal contract'] },
  { match: ['property lawyer'], services: ['Property disputes', 'Title check', 'Sale deed', 'Registration help'], keywords: ['property lawyer', 'civil lawyer property', 'sale deed'] },
  { match: ['civil lawyer', 'civil law'], services: ['Civil cases', 'Legal notice', 'Documentation', 'Court filing'], keywords: ['civil lawyer', 'civil advocate', 'legal notice'] },
  { match: ['notary'], services: ['Notary', 'Affidavit', 'Attestation'], keywords: ['notary', 'affidavit', 'attestation'] },
  { match: ['lawyer', 'advocate', 'legal'], services: ['Legal consultation', 'Documentation', 'Court filing', 'Legal notice'], keywords: ['lawyer', 'advocate', 'legal advice'] },

  { match: ['gst'], services: ['GST registration', 'GST returns', 'GST notice reply', 'E-way bill'], keywords: ['gst consultant', 'gst return', 'gst registration'] },
  { match: ['bookkeep'], services: ['Bookkeeping', 'Monthly accounts', 'Tally', 'Payroll'], keywords: ['bookkeeping', 'accounting', 'tally'] },
  { match: ['audit'], services: ['Statutory audit', 'Tax audit', 'Internal audit', 'Stock audit'], keywords: ['audit firm', 'tax audit', 'statutory audit'] },
  { match: ['company secretar', 'secretar'], services: ['Company incorporation', 'ROC filing', 'Annual compliance', 'Director KYC'], keywords: ['company secretary', 'roc filing', 'incorporation'] },
  { match: ['ca and tax', 'chartered', 'accountant'], services: ['ITR filing', 'GST returns', 'Accounting', 'Company registration'], keywords: ['chartered accountant', 'ca firm', 'income tax', 'itr'] },
  { match: ['tax'], services: ['ITR filing', 'Tax planning', 'TDS returns', 'Notice reply'], keywords: ['tax consultant', 'income tax', 'itr filing', 'tds'] },
  { match: ['registration consultant', 'registration'], services: ['Property registration', 'Firm registration', 'Document drafting', 'Stamp duty help'], keywords: ['registration consultant', 'property registration', 'firm registration'] },
  { match: ['loan', 'finance', 'nbfc'], services: ['Personal loan', 'Business loan', 'Home loan', 'Document help'], keywords: ['loan', 'personal loan', 'business loan', 'finance'] },
  { match: ['insurance'], services: ['Health insurance', 'Motor insurance', 'Life insurance', 'Claim help'], keywords: ['insurance agent', 'health insurance', 'policy'] },

  { match: ['commercial property'], services: ['Office on rent', 'Shop on rent', 'Commercial sale', 'Site visit'], keywords: ['commercial property', 'office for rent', 'shop for rent'] },
  { match: ['plot'], services: ['Residential plots', 'Site visit', 'Registry help', 'Investment plots'], keywords: ['plot dealer', 'plots for sale', 'residential plot'] },
  { match: ['real estate agent', 'property dealer', 'property agent'], services: ['Buy property', 'Rent property', 'Site visit', 'Paperwork'], keywords: ['property dealer', 'real estate agent', 'flat for rent', 'property'] },
  { match: ['real estate', 'builder', 'developer'], services: ['Buy property', 'New projects', 'Site visit', 'Home loan help'], keywords: ['real estate', 'builder', 'flat for sale', 'property dealer'] },

  { match: ['interior designer'], services: ['Home interiors', 'Modular kitchen', '3D design', 'Turnkey work'], keywords: ['interior designer', 'modular kitchen', 'home interior'] },
  { match: ['interior decorator'], services: ['Home styling', 'Furnishings', 'Curtains and decor', 'Space planning'], keywords: ['interior decorator', 'home decor', 'furnishings'] },
  { match: ['home decor'], services: ['Home decor items', 'Furnishings', 'Gifts', 'Custom orders'], keywords: ['home decor', 'home decoration', 'furnishings'] },
  { match: ['curtain'], services: ['Curtains', 'Blinds', 'Custom stitching', 'Installation'], keywords: ['curtain dealer', 'curtains', 'blinds', 'window curtain'] },
  { match: ['wallpaper'], services: ['Wallpapers', 'Custom design', 'Installation', 'Bedroom and living'], keywords: ['wallpaper', 'wall paper dealer', 'wall covering'] },
  { match: ['lighting'], services: ['Decorative lights', 'LED lights', 'Installation', 'Bulk orders'], keywords: ['lighting store', 'led lights', 'decorative lights'] },
  { match: ['architect'], services: ['House plans', '3D elevation', 'Approval drawings', 'Site visit'], keywords: ['architect', 'house plan', 'building design'] },
  { match: ['civil engineer'], services: ['Construction consult', 'Site supervision', 'Estimate', 'Plan approval'], keywords: ['civil engineer', 'construction consultant', 'building'] },
  { match: ['modular kitchen'], services: ['Modular kitchen', 'Wardrobes', '3D design', 'Installation'], keywords: ['modular kitchen', 'kitchen design', 'wardrobe'] },
  { match: ['carpenter', 'furniture repair'], services: ['Furniture repair', 'Custom furniture', 'Door fitting', 'Modular work'], keywords: ['carpenter', 'furniture repair', 'wood work'] },
  { match: ['furniture store', 'furniture shop', 'furniture'], services: ['Home furniture', 'Office furniture', 'Custom furniture', 'Home delivery'], keywords: ['furniture shop', 'sofa', 'bed', 'furniture'] },
  { match: ['painting contractor', 'painting', 'painter'], services: ['Home painting', 'Texture paint', 'Waterproofing', 'Office painting'], keywords: ['painter', 'house painting', 'painting contractor'] },
  { match: ['plumber', 'plumb'], services: ['Tap repair', 'Pipe leakage', 'Bathroom fitting', 'Drain cleaning'], keywords: ['plumber', 'plumbing', 'leakage', 'tap repair'] },
  { match: ['electrician', 'electric'], services: ['Wiring', 'Fan installation', 'Switchboard repair', 'Inverter setup'], keywords: ['electrician', 'wiring', 'electrical repair'] },
  { match: ['hardware', 'building material', 'sanitary'], services: ['Cement and steel', 'Plumbing fittings', 'Paint', 'Tools'], keywords: ['hardware store', 'building material', 'sanitary', 'cement'] },
  { match: ['fabricat', 'welder', 'welding'], services: ['Metal fabrication', 'Gates and grills', 'Shed work', 'On-site welding'], keywords: ['fabricator', 'welding', 'ms fabrication', 'gate grill'] },
  { match: ['contractor'], services: ['House construction', 'Renovation', 'Labour contract', 'Material work'], keywords: ['contractor', 'building contractor', 'civil work', 'renovation'] },
  { match: ['waterproof'], services: ['Terrace waterproofing', 'Bathroom waterproofing', 'Leak repair'], keywords: ['waterproofing', 'terrace leakage', 'seepage'] },
  { match: ['false ceiling', 'pop'], services: ['False ceiling', 'POP design', 'Lights in ceiling'], keywords: ['false ceiling', 'pop contractor', 'gypsum ceiling'] },
  { match: ['tile', 'marble', 'granite'], services: ['Tiles', 'Marble and granite', 'Flooring', 'Installation'], keywords: ['tile shop', 'marble', 'granite', 'flooring'] },
  { match: ['borewell'], services: ['Borewell drilling', 'Pump installation', 'Bore repair'], keywords: ['borewell', 'boring', 'submersible pump'] },
  { match: ['water tanker'], services: ['Tanker supply', 'Drinking water', 'Construction water'], keywords: ['water tanker', 'tanker supply'] },

  { match: ['packers and movers', 'packer', 'mover', 'shifting'], services: ['Home shifting', 'Office shifting', 'Packing', 'Local transport'], keywords: ['packers and movers', 'shifting', 'relocation', 'household shifting'] },
  { match: ['courier', 'logistics', 'cargo'], services: ['Parcel delivery', 'Same-day courier', 'Cargo', 'Packing'], keywords: ['courier', 'parcel', 'logistics', 'cargo'] },
  { match: ['tempo', 'transport'], services: ['Tempo on hire', 'Goods transport', 'Local shifting'], keywords: ['tempo service', 'transport', 'goods carrier'] },

  { match: ['laptop', 'computer and laptop', 'computer repair'], services: ['Laptop repair', 'Desktop repair', 'Data recovery', 'Software setup'], keywords: ['laptop repair', 'computer repair', 'data recovery'] },
  { match: ['website', 'web design', 'internet website'], services: ['Website design', 'E-commerce site', 'Landing pages', 'Maintenance'], keywords: ['website designer', 'web design', 'website development'] },
  { match: ['graphic design'], services: ['Logo design', 'Social media creatives', 'Visiting cards', 'Brochures'], keywords: ['graphic designer', 'logo design', 'banner design'] },
  { match: ['digital marketing', 'seo'], services: ['Social media marketing', 'Google ads', 'SEO', 'Lead generation'], keywords: ['digital marketing', 'seo', 'social media marketing'] },
  { match: ['software', 'app develop'], services: ['Website development', 'App development', 'Software support'], keywords: ['software company', 'app development', 'web development'] },
  { match: ['mobile repair', 'phone repair'], services: ['Screen replacement', 'Battery replacement', 'Water damage repair'], keywords: ['mobile repair', 'phone screen', 'battery replacement'] },
  { match: ['cctv', 'security system', 'security camera'], services: ['CCTV installation', 'CCTV repair', 'Biometric setup', 'AMC'], keywords: ['cctv', 'security camera', 'cctv installation', 'biometric'] },
  { match: ['solar', 'inverter dealer'], services: ['Solar panels', 'Inverter and battery', 'Installation', 'Subsidy guidance'], keywords: ['solar panel', 'inverter', 'solar dealer', 'battery'] },
  { match: ['ac service', 'ac repair', 'air condition'], services: ['AC service', 'AC installation', 'Gas refilling', 'AC repair'], keywords: ['ac service', 'ac repair', 'air conditioner'] },
  { match: ['ro service', 'water purif', 'ro'], services: ['RO installation', 'RO service', 'Filter change', 'AMC'], keywords: ['ro service', 'water purifier', 'ro filter'] },
  { match: ['appliance', 'washing machine', 'refrigerat', 'fridge'], services: ['Washing machine repair', 'Fridge repair', 'Microwave repair'], keywords: ['appliance repair', 'fridge repair', 'washing machine'] },
  { match: ['electronics', 'mobile shop'], services: ['Mobiles', 'Home appliances', 'Warranty support', 'Exchange'], keywords: ['electronics shop', 'mobile shop', 'appliances'] },
  { match: ['printing', 'xerox', 'stationery'], services: ['Printing', 'Photocopy', 'Visiting cards', 'Stationery'], keywords: ['printing', 'xerox', 'stationery', 'visiting card'] },

  { match: ['event organiser', 'event planner', 'event'], services: ['Birthday events', 'Corporate events', 'Wedding events', 'Artist booking'], keywords: ['event organiser', 'event planner', 'party organiser'] },
  { match: ['mehendi', 'mehndi'], services: ['Bridal mehendi', 'Party mehendi', 'Arabic design'], keywords: ['mehendi artist', 'bridal mehendi', 'mehndi'] },
  { match: ['choreograph'], services: ['Wedding choreography', 'Sangeet', 'Couple dance'], keywords: ['choreographer', 'sangeet dance', 'wedding dance'] },
  { match: ['tent house', 'tent'], services: ['Tent booking', 'Chairs and tables', 'Lighting', 'Wedding setup'], keywords: ['tent house', 'wedding tent', 'shamiana'] },
  { match: ['balloon'], services: ['Balloon decor', 'Birthday decor', 'Theme decor'], keywords: ['balloon decoration', 'birthday decor'] },
  { match: ['dj'], services: ['Wedding DJ', 'Party DJ', 'Sound system', 'Lighting'], keywords: ['dj', 'wedding dj', 'sound system'] },
  { match: ['videograph'], services: ['Wedding video', 'Event video', 'Reels and highlights'], keywords: ['videographer', 'wedding video', 'cinematic video'] },
  { match: ['photographer', 'photography', 'photo studio'], services: ['Portrait shoot', 'Event photography', 'Product shoot', 'Passport photos'], keywords: ['photographer', 'photo studio', 'photoshoot'] },

  { match: ['dry cleaner', 'laundry'], services: ['Laundry', 'Dry cleaning', 'Ironing', 'Pickup and drop'], keywords: ['dry cleaner', 'laundry', 'dry cleaning', 'ironing'] },
  { match: ['house keeping', 'housekeeping', 'maid'], services: ['Home cleaning', 'Maid service', 'Deep cleaning', 'Office housekeeping'], keywords: ['housekeeping', 'maid service', 'home cleaning', 'deep cleaning'] },
  { match: ['pest', 'termite'], services: ['Cockroach control', 'Termite treatment', 'Rodent control', 'AMC'], keywords: ['pest control', 'termite', 'cockroach'] },
  { match: ['security guard', 'guard', 'bouncer'], services: ['Security guards', 'Event security', 'Bouncer service'], keywords: ['security guard', 'bouncer', 'guard agency'] },

  { match: ['palmist', 'palmistry'], services: ['Palm reading', 'Face reading', 'Kundli', 'Remedies'], keywords: ['palmist', 'palmistry', 'palm reading'] },
  { match: ['vastu'], services: ['Vastu consult', 'Home vastu', 'Office vastu', 'Remedies'], keywords: ['vastu', 'vastu consultant', 'vastu shastra'] },
  { match: ['astrolog'], services: ['Horoscope', 'Kundli', 'Match making', 'Remedies'], keywords: ['astrologer', 'kundli', 'horoscope', 'jyotish'] },
  { match: ['pandit', 'priest'], services: ['Puja', 'Wedding rituals', 'Griha pravesh', 'Havan'], keywords: ['pandit', 'puja', 'wedding priest'] },

  { match: ['crossfit'], services: ['CrossFit classes', 'Strength training', 'Membership'], keywords: ['crossfit', 'crossfit gym', 'functional training'] },
  { match: ['personal trainer'], services: ['Personal training', 'Weight loss plan', 'Home training', 'Diet guidance'], keywords: ['personal trainer', 'fitness trainer', 'home workout'] },
  { match: ['zumba'], services: ['Zumba classes', 'Dance fitness', 'Ladies batches'], keywords: ['zumba', 'zumba class', 'dance fitness'] },
  { match: ['yoga'], services: ['Yoga classes', 'Meditation', 'Prenatal yoga', 'Online yoga'], keywords: ['yoga', 'yoga classes', 'meditation'] },
  { match: ['fitness'], services: ['Gym workouts', 'Group classes', 'Personal training', 'Membership'], keywords: ['fitness center', 'gym', 'workout', 'fitness'] },
  { match: ['gym'], services: ['Gym membership', 'Personal training', 'Cardio and weights', 'Group classes'], keywords: ['gym', 'fitness', 'personal trainer', 'workout'] },

  { match: ['jewellery', 'jeweller'], services: ['Gold jewellery', 'Silver jewellery', 'Custom designs', 'Repair'], keywords: ['jewellery showroom', 'gold', 'jeweller'] },
  { match: ['tailor', 'boutique'], services: ['Stitching', 'Alterations', 'Blouse stitching', 'Designer wear'], keywords: ['tailor', 'boutique', 'stitching', 'alteration'] },
  { match: ['footwear', 'shoe'], services: ['Shoes', 'Shoe repair', 'Custom fit'], keywords: ['shoe shop', 'footwear', 'shoe repair'] },
  { match: ['kirana', 'grocery', 'supermarket'], services: ['Groceries', 'Home delivery', 'Daily essentials'], keywords: ['kirana', 'grocery', 'supermarket'] },
  { match: ['scrap'], services: ['Scrap buying', 'Iron and paper', 'On-site pickup', 'Rate quote'], keywords: ['scrap dealer', 'scrap buyer', 'kabadi'] },
  { match: ['industrial supplier', 'industrial'], services: ['Industrial supply', 'Bulk material', 'Machinery parts', 'Dealer network'], keywords: ['industrial supplier', 'industrial', 'machinery'] },
  { match: ['raw material'], services: ['Raw material supply', 'Bulk orders', 'Dealer rates'], keywords: ['raw material', 'raw material supplier', 'bulk supply'] },
  { match: ['office suppl'], services: ['Office stationery', 'Printer supplies', 'Bulk orders', 'Delivery'], keywords: ['office supplies', 'stationery wholesale', 'office stationery'] },
  { match: ['manufacturer'], services: ['Manufacturing', 'Bulk orders', 'OEM supply', 'Dealer rates'], keywords: ['manufacturer', 'manufacturing', 'oem', 'bulk order'] },
  { match: ['distributor'], services: ['Distribution', 'Dealer supply', 'Bulk stock', 'Territory sales'], keywords: ['distributor', 'dealership', 'wholesale distribution'] },
  { match: ['wholesaler', 'wholesale'], services: ['Wholesale supply', 'Bulk rates', 'Dealer orders', 'Delivery'], keywords: ['wholesaler', 'wholesale', 'bulk price'] },
  { match: ['b2b'], services: ['Bulk supply', 'Dealer rates', 'Business orders', 'Delivery'], keywords: ['b2b', 'wholesale', 'bulk supplier'] },

  { match: ['rent and hire', 'on rent', 'rental'], services: ['Equipment on hire', 'Daily rental', 'Delivery and pickup'], keywords: ['rent and hire', 'on rent', 'equipment rental'] },
  { match: ['travel', 'tour'], services: ['Tour packages', 'Flight tickets', 'Hotel booking', 'Visa help'], keywords: ['travel agent', 'tour package', 'holiday'] },
  { match: ['hr consult'], services: ['Hiring support', 'HR policy', 'Payroll consult'], keywords: ['hr consultant', 'recruitment', 'hr consultancy'] },
];

const STOP = new Set(['and', 'the', 'for', 'with', 'near', 'services', 'service']);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokens(value: string): string[] {
  return normalize(value).split(' ').filter(Boolean);
}

function tokenMatches(hayToken: string, needleToken: string): boolean {
  if (hayToken === needleToken) return true;
  return needleToken.length >= 4 && hayToken.startsWith(needleToken);
}

function phraseMatches(hayTokens: string[], needle: string): boolean {
  const needleTokens = tokens(needle);
  if (!needleTokens.length || needleTokens.length > hayTokens.length) return false;
  for (let start = 0; start <= hayTokens.length - needleTokens.length; start += 1) {
    let matched = true;
    for (let index = 0; index < needleTokens.length; index += 1) {
      if (!tokenMatches(hayTokens[start + index], needleTokens[index])) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
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

function primaryLabel(category: string): string {
  return (category.split(/\s*\|\|\|\s*/)[0] || category).trim();
}

function leafLabel(category: string): string {
  const primary = primaryLabel(category);
  const parts = primary.split(/\s*[›>]\s*/).map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || primary;
}

function fallback(category: string): CategoryOfferings {
  const leaf = leafLabel(category);
  const name = titleCase(leaf) || 'Local business';
  const hay = normalize(leaf);
  const words = tokens(leaf).filter((word) => word.length > 2 && !STOP.has(word));
  const phrase = words.slice(0, 3).join(' ') || name.toLowerCase();
  let services = [name, `${name} booking`, 'Walk-in', 'Appointment'];
  if (/(dealer|showroom|store|shop|wholesaler|supplier)/.test(hay)) {
    services = [name, 'Product range', 'Custom orders', 'Home delivery'];
  } else if (/(repair|service)/.test(hay)) {
    services = [name, 'Inspection', 'Repair', 'Installation'];
  } else if (/(consultant|lawyer|expert|advisor)/.test(hay)) {
    services = [name, 'Consultation', 'Documentation', 'Follow-up'];
  } else if (/(hospital|clinic|doctor|physician)/.test(hay)) {
    services = [name, 'Consultation', 'Treatment', 'Follow-up visit'];
  } else if (/(class|institute|training|school|college|coaching)/.test(hay)) {
    services = [name, 'Admissions', 'Batch classes', 'Demo class'];
  } else if (/(hotel|hostel|resort|accommodation)/.test(hay)) {
    services = [name, 'Room booking', 'Monthly stay', 'Meals'];
  } else if (/(restaurant|cafe|bakery|cater)/.test(hay)) {
    services = [name, 'Dine-in', 'Takeaway', 'Home delivery'];
  }
  return {
    services: unique(services, 8),
    keywords: unique([phrase, `${phrase} near me`, name.toLowerCase(), ...words], 8),
  };
}

function bestProfile(category: string): Profile | null {
  const hayTokens = tokens(primaryLabel(category));
  if (!hayTokens.length) return null;
  let best: Profile | null = null;
  let bestScore = 0;
  for (const profile of PROFILES) {
    let score = 0;
    for (const needle of profile.match) {
      if (!phraseMatches(hayTokens, needle)) continue;
      score = Math.max(score, normalize(needle).length);
    }
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }
  return best;
}

/** Suggestions for the services and keywords editors, based on the listing category. */
export function offeringsForCategory(category: string | null | undefined): CategoryOfferings {
  const raw = String(category || '').trim();
  if (!raw) return fallback('Local business');
  const profile = bestProfile(raw);
  if (!profile) return fallback(raw);
  return {
    services: unique(profile.services, 8),
    keywords: unique(profile.keywords, 8),
  };
}
