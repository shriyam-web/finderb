import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 text-gray-600 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand and About */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/boomb logo.png" 
                alt="Boomb Logo" 
                width={150} 
                height={50} 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                quality={100}
              />
            </Link>
            <p className="text-gray-500 text-base leading-relaxed font-medium">
              Connect with the best local services in your city. From home repairs to professional consulting, Boomb helps you find trusted experts quickly and easily.
            </p>
            <div className="flex space-x-5">
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><FaFacebook size={18} /></Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><FaTwitter size={18} /></Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><FaInstagram size={18} /></Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><FaLinkedin size={18} /></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-black text-lg mb-8 tracking-tight">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link href="/categories/all" className="hover:text-blue-600 font-medium transition-colors">All Categories</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600 font-medium transition-colors">Pricing Plans</Link></li>
              <li><Link href="/business/register" className="hover:text-blue-600 font-medium transition-colors">Register Business</Link></li>
              <li><Link href="/about" className="hover:text-blue-600 font-medium transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 font-medium transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-gray-900 font-black text-lg mb-8 tracking-tight">Popular Categories</h3>
            <ul className="space-y-4">
              <li><Link href="/categories/plumbers" className="hover:text-blue-600 font-medium transition-colors">Plumbers</Link></li>
              <li><Link href="/categories/electricians" className="hover:text-blue-600 font-medium transition-colors">Electricians</Link></li>
              <li><Link href="/categories/hospitals" className="hover:text-blue-600 font-medium transition-colors">Hospitals</Link></li>
              <li><Link href="/categories/restaurants" className="hover:text-blue-600 font-medium transition-colors">Restaurants</Link></li>
              <li><Link href="/categories/gyms" className="hover:text-blue-600 font-medium transition-colors">Gyms</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 font-black text-lg mb-8 tracking-tight">Contact Us</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <span className="text-sm font-medium leading-relaxed">123 Business Avenue, Tech Park, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                  <Phone size={20} />
                </div>
                <span className="text-sm font-medium">+91 1800-123-4567</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                  <Mail size={20} />
                </div>
                <span className="text-sm font-medium">support@boomb.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Boomb Technologies Pvt Ltd.
          </p>
          <div className="flex space-x-8 text-sm font-bold uppercase tracking-widest text-gray-400">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-blue-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
