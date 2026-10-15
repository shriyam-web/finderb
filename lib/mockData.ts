export interface Business {
  id: string;
  slug?: string | null;
  name: string;
  category: string;
  rating: number | null;
  reviewsCount: number;
  location: string;
  city?: string | null;
  state?: string | null;
  description: string;
  contact: string;
  services: string[];
  
  image?: string; // mock
  profilePictureUrl?: string; // real DB
  images?: string[];
  
  priceRange: string;

  // New fields from DB
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  timings?: any;
  yearsInBusiness?: number | null;
  isFinderBVerified?: boolean;
  paymentModes?: string[];
  email?: string;
  businessAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  hasVerifiedBadge?: boolean;
  review?: unknown;
  reviewReply?: unknown;
  keywords?: string[];
  discountRange?: string | null;
  displayName?: string | null;
  about?: string | null;
  registrationNumber?: string | null;
  /** True when the merchant has at least one active public job posting. */
  hasActiveJobs?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  whatsappVerified?: boolean;
  hasMapPin?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  image?: string | null;
  slug: string;
  businessCount: number;
  color?: string;
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'Real Estate',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
    slug: 'real-estate',
    businessCount: 1500,
    color: '#3B82F6' // Blue
  },
  {
    id: '2',
    name: 'Doctors',
    icon: 'UserPlus',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800',
    slug: 'doctors',
    businessCount: 2800,
    color: '#EF4444' // Red
  },
  {
    id: '3',
    name: 'Repairs & Services',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800',
    slug: 'repairs-services',
    businessCount: 3200,
    color: '#F59E0B' // Amber
  },
  {
    id: '4',
    name: 'Restaurants',
    icon: 'Utensils',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    slug: 'restaurants',
    businessCount: 4500,
    color: '#10B981' // Emerald
  },
  {
    id: '5',
    name: 'Hotels',
    icon: 'Hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    slug: 'hotels',
    businessCount: 1200,
    color: '#8B5CF6' // Violet
  },
  {
    id: '6',
    name: 'B2B',
    icon: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800',
    slug: 'b2b',
    businessCount: 900,
    color: '#6366F1' // Indigo
  },
  {
    id: '7',
    name: 'College',
    icon: 'GraduationCap',
    image: 'https://images.unsplash.com/photo-152305085306e-8a3d3ecf047d?auto=format&fit=crop&q=80&w=800',
    slug: 'college',
    businessCount: 350,
    color: '#EC4899' // Pink
  },
  {
    id: '8',
    name: 'Beauty Spa',
    icon: 'Scissors',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800',
    slug: 'beauty-spa',
    businessCount: 1800,
    color: '#F43F5E' // Rose
  },
  {
    id: '9',
    name: 'Gym',
    icon: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    slug: 'gym',
    businessCount: 1100,
    color: '#06B6D4' // Cyan
  },
  {
    id: '10',
    name: 'PG/Hostel',
    icon: 'Bed',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=800',
    slug: 'pg-hostel',
    businessCount: 750,
    color: '#84CC16' // Lime
  },
  {
    id: '11',
    name: 'Automobile',
    icon: 'Car',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800',
    slug: 'automobile',
    businessCount: 1400,
    color: '#475569' // Slate
  },
  {
    id: '12',
    name: 'Electronics',
    icon: 'Tv',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800',
    slug: 'electronics',
    businessCount: 2000,
    color: '#0EA5E9' // Sky
  },
  { id: '13', name: 'Plumbers', icon: 'Wrench', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800', slug: 'plumbers', businessCount: 450, color: '#3B82F6' },
  { id: '14', name: 'Electricians', icon: 'Zap', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800', slug: 'electricians', businessCount: 380, color: '#EAB308' },
  { id: '15', name: 'Cleaning', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&q=80&w=800', slug: 'cleaning', businessCount: 290, color: '#06B6D4' },
  { id: '16', name: 'Painters', icon: 'Palette', image: 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=800', slug: 'painters', businessCount: 120, color: '#F43F5E' },
  { id: '17', name: 'Carpenters', icon: 'Hammer', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800', slug: 'carpenters', businessCount: 85, color: '#B45309' },
  { id: '18', name: 'Packers & Movers', icon: 'Truck', image: 'https://images.unsplash.com/photo-1600518464441-9154a4dba216?auto=format&fit=crop&q=80&w=800', slug: 'packers-movers', businessCount: 210, color: '#6366F1' },
  { id: '19', name: 'Pest Control', icon: 'Bug', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=800', slug: 'pest-control', businessCount: 95, color: '#10B981' },
  { id: '20', name: 'AC Repair', icon: 'Wind', image: 'https://images.unsplash.com/photo-1558227691-41ea78d1f631?auto=format&fit=crop&q=80&w=800', slug: 'ac-repair', businessCount: 160, color: '#0EA5E9' },
  { id: '21', name: 'Wedding Planner', icon: 'Heart', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800', slug: 'wedding-planner', businessCount: 75, color: '#EC4899' },
  { id: '22', name: 'Catering', icon: 'Coffee', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800', slug: 'catering', businessCount: 130, color: '#F97316' },
  { id: '23', name: 'Photography', icon: 'Camera', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', slug: 'photography', businessCount: 190, color: '#8B5CF6' },
  { id: '24', name: 'Yoga Classes', icon: 'Activity', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800', slug: 'yoga', businessCount: 110, color: '#10B981' },
  { id: '25', name: 'Lawyers', icon: 'Scale', image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=800', slug: 'lawyers', businessCount: 420, color: '#475569' },
  { id: '26', name: 'Architecture', icon: 'PencilRuler', image: 'https://images.unsplash.com/photo-1503387762-592dea58ef21?auto=format&fit=crop&q=80&w=800', slug: 'architecture', businessCount: 140, color: '#6366F1' },
  { id: '27', name: 'Interior Design', icon: 'Layout', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800', slug: 'interior-design', businessCount: 310, color: '#8B5CF6' },
  { id: '28', name: 'Car Wash', icon: 'Waves', image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800', slug: 'car-wash', businessCount: 180, color: '#06B6D4' },
  { id: '29', name: 'Pet Care', icon: 'Dog', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800', slug: 'pet-care', businessCount: 65, color: '#F97316' },
  { id: '30', name: 'Event Management', icon: 'Music', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800', slug: 'event-management', businessCount: 240, color: '#EC4899' },
  { id: '31', name: 'Tutors', icon: 'BookOpen', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800', slug: 'tutors', businessCount: 550, color: '#F59E0B' },
  { id: '32', name: 'Dance Classes', icon: 'Framer', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800', slug: 'dance-classes', businessCount: 90, color: '#8B5CF6' },
];

export const businesses: Business[] = [
  {
    id: '1',
    name: 'Elite Plumbing Solutions',
    category: 'Plumbers',
    rating: 4.8,
    reviewsCount: 124,
    location: 'Andheri West, Mumbai',
    description: 'Expert plumbing services for residential and commercial needs. We fix leaks, install pipes, and provide 24/7 emergency support.',
    contact: '+91 98765 43210',
    services: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning', 'Water Heater Repair'],
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800',
    priceRange: '₹500 - ₹5000'
  },
  {
    id: '2',
    name: 'Sparky Electricians',
    category: 'Electricians',
    rating: 4.5,
    reviewsCount: 89,
    location: 'Sector 62, Noida',
    description: 'Professional electrical services including wiring, panel upgrades, and appliance repair. Safe and reliable solutions for your home.',
    contact: '+91 98765 43211',
    services: ['House Wiring', 'Panel Upgrade', 'Appliance Repair', 'Lighting Installation'],
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800',
    priceRange: '₹300 - ₹3000'
  },
  {
    id: '3',
    name: 'Glow Beauty Salon',
    category: 'Beauty Parlors',
    rating: 4.7,
    reviewsCount: 210,
    location: 'Koramangala, Bangalore',
    description: 'Premium beauty and hair care services. From haircuts to bridal makeup, we provide the best grooming experience.',
    contact: '+91 98765 43212',
    services: ['Haircut', 'Facial', 'Bridal Makeup', 'Manicure & Pedicure'],
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800',
    priceRange: '₹1000 - ₹15000'
  },
  {
    id: '4',
    name: 'City Care Hospital',
    category: 'Hospitals',
    rating: 4.2,
    reviewsCount: 450,
    location: 'Anna Nagar, Chennai',
    description: 'Multispecialty hospital with state-of-the-art facilities and experienced doctors. Dedicated to providing quality healthcare.',
    contact: '+91 98765 43213',
    services: ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics'],
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
    priceRange: '₹500 - ₹50000+'
  },
  {
    id: '5',
    name: 'The Tasty Spoon',
    category: 'Restaurants',
    rating: 4.6,
    reviewsCount: 320,
    location: 'Salt Lake, Kolkata',
    description: 'Authentic Indian and continental cuisine. Perfect for family dinners and corporate lunches.',
    contact: '+91 98765 43214',
    services: ['Dine-in', 'Takeaway', 'Catering', 'Home Delivery'],
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    priceRange: '₹800 - ₹3000'
  }
];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
  gender: 'male' | 'female';
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    role: 'Homeowner, Delhi',
    content:
      'FinderB made it so easy to find a reliable plumber when I had an emergency. The service was quick and the pricing was transparent.',
    avatar: '/testimonials/rahul-sharma.jpg',
    gender: 'male',
  },
  {
    id: '2',
    name: 'Priya Patel',
    role: 'Business Owner, Ahmedabad',
    content:
      'I listed my salon on FinderB and saw a 30% increase in new customers within the first month. Highly recommended for local businesses!',
    avatar: '/testimonials/priya-patel.jpg',
    gender: 'female',
  },
  {
    id: '3',
    name: 'Amit Kumar',
    role: 'Software Engineer, Bengaluru',
    content:
      'The review system is genuine. I found a great gym near my office thanks to the detailed feedback from other users.',
    avatar: '/testimonials/amit-kumar.jpg',
    gender: 'male',
  },
];

export const featuredBusinesses = businesses.slice(0, 4);

export interface City {
  id: string;
  name: string;
  image: string;
}

export const cities: City[] = [
  { id: '1', name: 'Mumbai', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80&w=800' },
  { id: '2', name: 'Delhi', image: 'https://images.unsplash.com/photo-1515091943-9d5c0ad475af?auto=format&fit=crop&q=80&w=800' },
  { id: '3', name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800' },
  { id: '4', name: 'Hyderabad', image: 'https://images.unsplash.com/photo-1617503752587-97d2103a96ea?auto=format&fit=crop&q=80&w=800' },
  { id: '5', name: 'Chennai', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800' },
  { id: '6', name: 'Kolkata', image: 'https://images.unsplash.com/photo-1601004113227-6f0270a4a836?auto=format&fit=crop&q=80&w=800' },
  { id: '7', name: 'Pune', image: 'https://images.unsplash.com/photo-1562076044-24637748437d?auto=format&fit=crop&q=80&w=800' },
  { id: '8', name: 'Ahmedabad', image: 'https://images.unsplash.com/photo-1627319020037-eb4a4a159e1e?auto=format&fit=crop&q=80&w=800' },
  { id: '9', name: 'Jaipur', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800' },
  { id: '10', name: 'Chandigarh', image: 'https://images.unsplash.com/photo-1616423640203-0931551221f7?auto=format&fit=crop&q=80&w=800' },
];

export interface Movie {
  id: string;
  title: string;
  genre: string;
  image: string;
  rating: number;
}

export const movies: Movie[] = [
  { id: '1', title: 'The Silent Hour', genre: 'Thriller', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800', rating: 4.5 },
  { id: '2', title: 'Urban Legend', genre: 'Horror', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800', rating: 4.2 },
  { id: '3', title: 'Ocean\'s Deep', genre: 'Documentary', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800', rating: 4.8 },
  { id: '4', title: 'Midnight City', genre: 'Drama', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=800', rating: 4.0 },
];

export interface TouristPlace {
  id: string;
  name: string;
  location: string;
  image: string;
  distance: string;
  rating: number;
}

export const touristPlaces: TouristPlace[] = [
  { id: '1', name: 'Marine Drive', location: 'Mumbai', image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=800', distance: '5 km away', rating: 4.8 },
  { id: '2', name: 'Gateway of India', location: 'Mumbai', image: 'https://images.unsplash.com/photo-1570160897040-30430aac2ec3?auto=format&fit=crop&q=80&w=800', distance: '8 km away', rating: 4.7 },
  { id: '3', name: 'Elephanta Caves', location: 'Gharapuri', image: 'https://images.unsplash.com/photo-1514222139-b786bb23c82e?auto=format&fit=crop&q=80&w=800', distance: '15 km away', rating: 4.5 },
];

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
}

export const articles: Article[] = [
  {
    id: '1',
    title: 'Top 10 Places to Visit in Mumbai',
    excerpt: 'Discover the hidden gems of the city of dreams.',
    content: 'Mumbai, the city of dreams, is a vibrant metropolis that offers a unique blend of history, culture, and modernity. From the iconic Gateway of India to the serene Marine Drive, there is something for everyone in this bustling city. In this article, we explore the top 10 places you must visit in Mumbai, including hidden gems like the Elephanta Caves and the bustling markets of Colaba.',
    image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80&w=800',
    date: 'Oct 15, 2024'
  },
  {
    id: '2',
    title: 'Best Street Food in Delhi',
    excerpt: 'A guide to the most delicious street food in the capital.',
    content: 'Delhi is a food lover\'s paradise, and its street food is legendary. From the spicy chaat of Chandni Chowk to the succulent kebabs of Karol Bagh, the capital offers a culinary journey like no other. This guide takes you through the must-try street foods in Delhi, providing tips on where to find the best flavors and how to navigate the city\'s vibrant food scene.',
    image: 'https://images.unsplash.com/photo-1585938389612-a552a28d6914?auto=format&fit=crop&q=80&w=800',
    date: 'Oct 12, 2024'
  },
  {
    id: '3',
    title: 'How to Choose the Right Gym',
    excerpt: 'Everything you need to know before joining a fitness center.',
    content: 'Choosing the right gym is crucial for staying motivated and achieving your fitness goals. With so many options available, it can be overwhelming to decide. We break down the key factors to consider, such as location, equipment, personal training services, and membership costs. Whether you are a beginner or an experienced athlete, this guide will help you find the perfect fitness center for your needs.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    date: 'Oct 10, 2024'
  },
  {
    id: '4',
    title: 'Home Maintenance Tips for Monsoon',
    excerpt: 'Prepare your home for the rainy season with these essential tips.',
    content: 'The monsoon season brings relief from the heat but also presents challenges for home maintenance. From preventing dampness to ensuring proper drainage, there are several steps you can take to protect your home. We provide practical tips on waterproofing your roof, checking electrical connections, and maintaining your garden during the rains.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    date: 'Oct 08, 2024'
  },
  {
    id: '5',
    title: 'Finding the Best Schools in Bangalore',
    excerpt: 'A comprehensive guide to top-rated educational institutions.',
    content: 'Bangalore is home to some of India\'s most prestigious schools, offering a range of curricula from CBSE and ICSE to International Baccalaureate. This guide helps parents navigate the school admission process in Bangalore, highlighting the top-rated institutions based on academic excellence, extracurricular activities, and infrastructure.',
    image: 'https://images.unsplash.com/photo-152305085306e-8a3d3ecf047d?auto=format&fit=crop&q=80&w=800',
    date: 'Oct 05, 2024'
  },
  {
    id: '6',
    title: 'Weekend Getaways from Hyderabad',
    excerpt: 'Perfect short trips to refresh your mind and soul.',
    content: 'If you are looking to escape the hustle and bustle of Hyderabad for a weekend, there are several beautiful destinations just a short drive away. From the historical charm of Warangal to the scenic beauty of Ananthagiri Hills, we list the best weekend getaways from Hyderabad for every type of traveler.',
    image: 'https://images.unsplash.com/photo-1617503752587-97d2103a96ea?auto=format&fit=crop&q=80&w=800',
    date: 'Oct 02, 2024'
  },
];

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  image: string | null;
  date: string;
  category: string;
  source?: string;
  link?: string;
}

