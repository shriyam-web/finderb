export interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  location: string;
  description: string;
  contact: string;
  services: string[];
  image: string;
  priceRange: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export const categories: Category[] = [
  { id: '1', name: 'Plumbers', icon: 'Wrench', slug: 'plumbers' },
  { id: '2', name: 'Electricians', icon: 'Zap', slug: 'electricians' },
  { id: '3', name: 'Beauty Parlors', icon: 'Scissors', slug: 'beauty-parlors' },
  { id: '4', name: 'Hospitals', icon: 'Hospital', slug: 'hospitals' },
  { id: '5', name: 'Restaurants', icon: 'Utensils', slug: 'restaurants' },
  { id: '6', name: 'Gyms', icon: 'Dumbbell', slug: 'gyms' },
  { id: '7', name: 'AC Repair', icon: 'Wind', slug: 'ac-repair' },
  { id: '8', name: 'Packers & Movers', icon: 'Truck', slug: 'packers-movers' },
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
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    role: 'Homeowner',
    content: 'Boomb made it so easy to find a reliable plumber when I had an emergency. The service was quick and the pricing was transparent.',
    avatar: 'https://i.pravatar.cc/150?u=rahul'
  },
  {
    id: '2',
    name: 'Priya Patel',
    role: 'Business Owner',
    content: 'I listed my salon on Boomb and saw a 30% increase in new customers within the first month. Highly recommended for local businesses!',
    avatar: 'https://i.pravatar.cc/150?u=priya'
  },
  {
    id: '3',
    name: 'Amit Kumar',
    role: 'Software Engineer',
    content: 'The review system is genuine. I found a great gym near my office thanks to the detailed feedback from other users.',
    avatar: 'https://i.pravatar.cc/150?u=amit'
  }
];

export const featuredBusinesses = businesses.slice(0, 4);
