import React from 'react';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaHeart,
  FaShieldAlt,
  FaTruck,
  FaClock
} from 'react-icons/fa';

function Footer() {
  return (
    <footer className="relative bg-gradient-to-tr from-[#0f172a] to-[#1e293b] text-white py-12 px-6 sm:px-10 rounded-t-3xl shadow-2xl mt-12 overflow-hidden">
      
      {/* Background Blur Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)] pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

        {/* About Taaza */}
        <div className="backdrop-blur-sm bg-white/5 p-6 rounded-xl border border-white/10 transition hover:scale-105 duration-300 hidden sm:block">
          <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2 mb-4">
            <FaShieldAlt />
            About Taaza
          </h3>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            Premium fresh meat and fish delivered to your doorstep. We ensure the highest quality products with competitive prices and exceptional service.
          </p>
          <div className="flex items-center gap-2 text-sm text-sky-300 mb-2">
            <FaTruck className="text-yellow-400" />
            Free Delivery on orders above ₹500
          </div>
          <div className="flex items-center gap-2 text-sm text-sky-300">
            <FaClock className="text-yellow-400" />
            Same day delivery available
          </div>
        </div>

        {/* Contact Info */}
        <div className="backdrop-blur-sm bg-white/5 p-6 rounded-xl border border-white/10 transition hover:scale-105 duration-300">
          <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2 mb-4">
            <FaEnvelope />
            Contact Info
          </h3>
          <div className="flex items-center gap-2 text-sm text-blue-200 mb-2">
            <FaPhone />
            ‪+91 98765 43210‬
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-200 mb-2">
            <FaEnvelope />
            info@taaza.com
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <FaMapMarkerAlt />
            123 Main Street, City, State
          </div>
        </div>

        {/* Social Media */}
        <div className="backdrop-blur-sm bg-white/5 p-6 rounded-xl border border-white/10 transition hover:scale-105 duration-300 hidden sm:block">
          <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2 mb-4">
            <FaHeart />
            Follow Us
          </h3>
          <div className="flex items-center gap-4 mt-2">
            {[FaFacebook, FaInstagram, FaTwitter, FaYoutube].map((Icon, i) => (
              <a key={i} href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-slate-200 hover:-translate-y-1 hover:text-yellow-300 transition-all duration-300">
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 border-t border-white/10 pt-6 flex justify-center items-center text-sm text-slate-400 gap-2">
        <FaHeart className="text-pink-500" />
        © {new Date().getFullYear()} Taaza Non-Veg Market. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
