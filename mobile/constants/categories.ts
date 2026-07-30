export type AppCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  subtitle: string;
};

/** Starter list mirrored from web mock/popular categories (API later). */
export const categories: AppCategory[] = [
  { id: '2', name: 'Doctors', slug: 'doctors', icon: 'medkit-outline', color: '#EF4444', subtitle: 'Hospitals, Clinics' },
  { id: '4', name: 'Restaurants', slug: 'restaurants', icon: 'restaurant-outline', color: '#10B981', subtitle: 'Delivery, Dine-in' },
  { id: '5', name: 'Hotels', slug: 'hotels', icon: 'bed-outline', color: '#8B5CF6', subtitle: 'Budget, Luxury' },
  { id: '8', name: 'Beauty Spa', slug: 'beauty-spa', icon: 'cut-outline', color: '#F43F5E', subtitle: 'Beauty Parlours' },
  { id: '9', name: 'Gym', slug: 'gym', icon: 'barbell-outline', color: '#06B6D4', subtitle: 'Fitness Centers' },
  { id: '3', name: 'Repairs', slug: 'repairs-services', icon: 'construct-outline', color: '#F59E0B', subtitle: 'Home Services' },
  { id: '12', name: 'Electronics', slug: 'electronics', icon: 'tv-outline', color: '#0EA5E9', subtitle: 'Gadgets & more' },
  { id: '11', name: 'Automobile', slug: 'automobile', icon: 'car-outline', color: '#475569', subtitle: 'Cars & service' },
  { id: '10', name: 'PG/Hostel', slug: 'pg-hostel', icon: 'home-outline', color: '#84CC16', subtitle: 'Stay & lodging' },
  { id: '25', name: 'Lawyers', slug: 'lawyers', icon: 'document-text-outline', color: '#475569', subtitle: 'Legal help' },
  { id: '31', name: 'Tutors', slug: 'tutors', icon: 'school-outline', color: '#F59E0B', subtitle: 'Learning' },
  { id: '13', name: 'Plumbers', slug: 'plumbers', icon: 'water-outline', color: '#3B82F6', subtitle: 'Home Services' },
  { id: '14', name: 'Electricians', slug: 'electricians', icon: 'flash-outline', color: '#EAB308', subtitle: 'Home Services' },
  { id: '23', name: 'Photography', slug: 'photography', icon: 'camera-outline', color: '#8B5CF6', subtitle: 'Studios & events' },
  { id: '29', name: 'Pet Care', slug: 'pet-care', icon: 'paw-outline', color: '#F97316', subtitle: 'Pets & clinics' },
  { id: '7', name: 'College', slug: 'college', icon: 'library-outline', color: '#EC4899', subtitle: 'Admissions' },
];

export const homeGridCategories = categories.slice(0, 7);
