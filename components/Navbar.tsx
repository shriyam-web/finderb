'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Search, User, Briefcase } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <Image 
              src="/boomb logo.png" 
              alt="Boomb Logo" 
              width={180} 
              height={60} 
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
              quality={100}
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8 ml-auto mr-8">
            <Link href="/categories/all" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Categories
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/business/register" 
              className="flex items-center gap-2 text-blue-900 font-semibold hover:text-blue-700 transition-colors"
            >
              <Briefcase size={18} />
              For Business
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2 transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
            >
              Sign Up
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-blue-600 p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/categories/all" 
              className="block px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              Categories
            </Link>
            <Link 
              href="/pricing" 
              className="block px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/about" 
              className="block px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="block px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link 
              href="/business/register" 
              className="block px-3 py-2 text-blue-900 hover:bg-blue-50 font-semibold rounded-md"
              onClick={() => setIsOpen(false)}
            >
              For Business
            </Link>
            <div className="pt-4 flex flex-col space-y-2">
              <Link 
                href="/login" 
                className="w-full text-center py-2 text-gray-600 font-medium border border-gray-200 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="w-full text-center py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
