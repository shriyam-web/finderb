import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6';

export default function Footer() {
  const topCities = [
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 
    'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'
  ];

  const popularSearches = [
    'Best Plumbers near me', 'Top rated Restaurants', 'Verified Doctors in India',
    'Real Estate Agents', 'Local Gyms & Fitness', 'Professional CA Services',
    'Wedding Photographers', 'Home Cleaning Services', 'Emergency Hospital services'
  ];

  return (
    <footer className="bg-white border-t border-gray-100 text-gray-600 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* About & SEO Description */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/logo-n.png" 
                alt="Boomb Logo" 
                width={140} 
                height={40} 
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                quality={100}
              />
            </Link>
            <div className="space-y-4">
              <h4 className="text-primary font-black text-[10px] uppercase tracking-widest">About Boomb</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                Boomb is India's premier **local discovery platform**, connecting millions of users with **verified local businesses**, professional services, and entertainment. We are your go-to destination for finding **top-rated plumbers, doctors, restaurants, and real estate** across 500+ cities in India.
              </p>
            </div>
          </div>

          {/* Business Links */}
          <div>
            <h3 className="text-gray-900 font-black text-sm mb-8 tracking-tight">Business Solutions</h3>
            <ul className="space-y-4">
              <li><Link href="/business/register" className="text-sm hover:text-secondary font-medium transition-colors flex items-center gap-2 group">List Your Business <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
              <li><Link href="/advertisements" className="text-sm hover:text-secondary font-medium transition-colors">Advertise with Us</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-secondary font-medium transition-colors">Premium Plans</Link></li>
              <li><Link href="/hirings" className="text-sm hover:text-secondary font-medium transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-secondary font-medium transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Popular Categories for SEO */}
          <div>
            <h3 className="text-gray-900 font-black text-sm mb-8 tracking-tight">Top Categories</h3>
            <ul className="space-y-4">
              <li><Link href="/categories/real-estate" className="text-sm hover:text-secondary font-medium transition-colors">Real Estate & Property</Link></li>
              <li><Link href="/categories/doctors" className="text-sm hover:text-secondary font-medium transition-colors">Doctors & Healthcare</Link></li>
              <li><Link href="/categories/restaurants" className="text-sm hover:text-secondary font-medium transition-colors">Top Rated Restaurants</Link></li>
              <li><Link href="/categories/repairs-services" className="text-sm hover:text-secondary font-medium transition-colors">Home Repairs & Services</Link></li>
              <li><Link href="/categories/education" className="text-sm hover:text-secondary font-medium transition-colors">Education & Coaching</Link></li>
              <li><Link href="/categories/finance" className="text-sm hover:text-secondary font-medium transition-colors">Finance & Legal Services</Link></li>
            </ul>
          </div>

          {/* Follow Us & App Links */}
          <div className="space-y-10">
            <div>
              <h3 className="text-gray-900 font-black text-sm mb-6 tracking-tight">Follow Our Journey</h3>
              <div className="flex space-x-3">
                {[
                  { icon: FaFacebook, href: '#' },
                  { icon: FaTwitter, href: '#' },
                  { icon: FaInstagram, href: '#' },
                  { icon: FaLinkedin, href: '#' }
                ].map((social, i) => (
                  <Link key={i} href={social.href} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-secondary hover:text-white transition-all shadow-sm border border-gray-100">
                    <social.icon size={18} />
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Get our mobile app</p>
              <div className="flex flex-wrap gap-2">
                <div className="h-10 px-4 bg-gray-900 text-white rounded-xl flex items-center gap-2 cursor-not-allowed grayscale hover:grayscale-0 transition-all">
                  <div className="text-[8px] font-bold leading-none">Coming soon on <br/><span className="text-sm">App Store</span></div>
                </div>
                <div className="h-10 px-4 bg-gray-900 text-white rounded-xl flex items-center gap-2 cursor-not-allowed grayscale hover:grayscale-0 transition-all">
                  <div className="text-[8px] font-bold leading-none">Coming soon on <br/><span className="text-sm">Google Play</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO - Cities & Searches */}
        <div className="border-t border-gray-100 py-12 space-y-10">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Top Cities in India</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {topCities.map((city) => (
                <Link key={city} href={`/cities/${city.toLowerCase()}`} className="text-xs font-medium text-gray-500 hover:text-secondary transition-colors underline decoration-gray-200 underline-offset-4 decoration-1">
                  {city}
                </Link>
              ))}
              <Link href="/cities" className="text-xs font-black text-primary hover:underline underline-offset-4 decoration-2">View All Cities</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Popular Searches</h4>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search) => (
                <Link key={search} href={`/search?q=${search.replace(/ /g, '+')}`} className="px-3 py-1.5 bg-gray-50 hover:bg-white border border-gray-100 text-[10px] font-bold text-gray-500 hover:text-primary hover:border-primary/20 rounded-lg transition-all">
                  {search}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              © {new Date().getFullYear()} Boomb Technologies Pvt Ltd.
            </p>
            <p className="text-[10px] text-gray-400 font-medium max-w-xl">
              Boomb helps you find the best services and businesses in your locality. Verified profiles, user reviews, and instant contact details for thousands of categories.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-secondary transition-colors">Terms</Link>
            <Link href="/sitemap" className="hover:text-secondary transition-colors">Sitemap</Link>
            <Link href="/cookies" className="hover:text-secondary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
