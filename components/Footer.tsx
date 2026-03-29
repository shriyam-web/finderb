import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 text-gray-600 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* About & Services Brief */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/boomb logo.png" 
                alt="Boomb Logo" 
                width={140} 
                height={40} 
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                quality={100}
              />
            </Link>
            <div className="space-y-4">
              <h4 className="text-primary font-black text-xs uppercase tracking-widest">About Boomb</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                Boomb is India's premier discovery platform, connecting millions of users with verified local businesses, services, and entertainment. We simplify your search for quality and trust.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-primary font-black text-xs uppercase tracking-widest">Our Services</h4>
              <p className="text-gray-400 text-xs leading-relaxed font-medium italic">
                Verified Professionals • Real-time Bookings • Community Reviews • Local Discovery • Business Scaling
              </p>
            </div>
          </div>

          {/* Quick Links & FAQs */}
          <div>
            <h3 className="text-gray-900 font-black text-sm mb-8 uppercase tracking-[0.2em]">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">About Us</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Pricing Plans</Link></li>
              <li><Link href="/business/register" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">List Your Business</Link></li>
              <li><Link href="/faqs" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">FAQs</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Contact Us</Link></li>
              <li><Link href="/blog" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Latest News</Link></li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h3 className="text-gray-900 font-black text-sm mb-8 uppercase tracking-[0.2em]">Popular Categories</h3>
            <ul className="space-y-4">
              <li><Link href="/categories/real-estate" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Real Estate</Link></li>
              <li><Link href="/categories/doctors" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Doctors</Link></li>
              <li><Link href="/categories/restaurants" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Restaurants</Link></li>
              <li><Link href="/categories/repairs-services" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Repairs & Services</Link></li>
              <li><Link href="/categories/hotels" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Hotels & Stay</Link></li>
              <li><Link href="/categories/gym" className="text-sm hover:text-secondary font-bold transition-colors uppercase tracking-wider">Fitness & Gyms</Link></li>
            </ul>
          </div>

          {/* Follow Us & Contact */}
          <div className="space-y-10">
            <div>
              <h3 className="text-gray-900 font-black text-sm mb-6 uppercase tracking-[0.2em]">Follow Us</h3>
              <div className="flex space-x-4">
                <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-secondary hover:text-white transition-all shadow-sm border border-gray-100">
                  <FaFacebook size={18} />
                </Link>
                <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-secondary hover:text-white transition-all shadow-sm border border-gray-100">
                  <FaTwitter size={18} />
                </Link>
                <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-secondary hover:text-white transition-all shadow-sm border border-gray-100">
                  <FaInstagram size={18} />
                </Link>
                <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-secondary hover:text-white transition-all shadow-sm border border-gray-100">
                  <FaLinkedin size={18} />
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-gray-900 font-black text-sm mb-6 uppercase tracking-[0.2em]">Contact</h3>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Mail size={16} className="text-secondary" />
                <span>support@boomb.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Phone size={16} className="text-secondary" />
                <span>+91 1800-123-4567</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} Boomb Technologies Pvt Ltd. All rights reserved.
          </p>
          <div className="flex space-x-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-secondary transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-secondary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
