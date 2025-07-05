import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import bgImg from '../../../assets/bg.jpg'; // This import is essential for the header
import wholeChicken from "../../../assets/wholeChicken.png";
import goatMeat from "../../../assets/goatMeat.png";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

// --- DEFINITIVE, ILLUSTRATIVE & RECOGNIZABLE ICONS ---
const AllIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 21h8v-8h-8v8zm6-6h-4v4h4v-4z" />
  </svg>
);

// Advanced Chicken Icon with detailed features and gradients
const ChickenIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Chicken body with gradient */}
    <ellipse cx="12" cy="14" rx="8" ry="6" fill="url(#chickenBody)" stroke="#E65100" strokeWidth="0.8"/>
    
    {/* Chicken head with gradient */}
    <circle cx="12" cy="8" r="3" fill="url(#chickenHead)" stroke="#E65100" strokeWidth="0.8"/>
    
    {/* Beak with 3D effect */}
    <path d="M12 5L14.5 7.5L12 10L9.5 7.5L12 5Z" fill="url(#beakGradient)"/>
    <path d="M12 5L13.5 6.5L12 8L10.5 6.5L12 5Z" fill="#FF6F00" opacity="0.7"/>
    
    {/* Eye with depth */}
    <circle cx="13" cy="7" r="1" fill="#1A1A1A"/>
    <circle cx="13" cy="7" r="0.4" fill="#FFFFFF"/>
    <circle cx="13.2" cy="6.8" r="0.2" fill="#1A1A1A"/>
    
    {/* Comb with texture */}
    <path d="M9 6C9 6 10.5 3.5 12 3.5C13.5 3.5 15 6 15 6L14 7.5L12 6.5L10 7.5L9 6Z" fill="url(#combGradient)"/>
    <path d="M10 5.5C10 5.5 11 4 12 4C13 4 14 5.5 14 5.5" stroke="#B71C1C" strokeWidth="0.3" fill="none"/>
    
    {/* Wings with feather detail */}
    <ellipse cx="8" cy="13" rx="2.5" ry="3.5" fill="url(#wingGradient)" stroke="#E65100" strokeWidth="0.5"/>
    <ellipse cx="16" cy="13" rx="2.5" ry="3.5" fill="url(#wingGradient)" stroke="#E65100" strokeWidth="0.5"/>
    <path d="M6 12C6 12 7.5 10.5 9 12" stroke="#E65100" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    <path d="M18 12C18 12 16.5 10.5 15 12" stroke="#E65100" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    
    {/* Legs with texture */}
    <rect x="10.5" y="19" width="1" height="2.5" fill="#5D4037" stroke="#3E2723" strokeWidth="0.3"/>
    <rect x="12.5" y="19" width="1" height="2.5" fill="#5D4037" stroke="#3E2723" strokeWidth="0.3"/>
    
    {/* Feet with detail */}
    <path d="M10.5 21.5L9 23L12 23L10.5 21.5Z" fill="#3E2723"/>
    <path d="M12.5 21.5L11 23L14 23L12.5 21.5Z" fill="#3E2723"/>
    <circle cx="9.5" cy="22.5" r="0.3" fill="#1A1A1A"/>
    <circle cx="13.5" cy="22.5" r="0.3" fill="#1A1A1A"/>
    
    {/* Gradients */}
    <defs>
      <linearGradient id="chickenBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD54F"/>
        <stop offset="50%" stopColor="#FFB300"/>
        <stop offset="100%" stopColor="#FF8F00"/>
      </linearGradient>
      <linearGradient id="chickenHead" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD54F"/>
        <stop offset="100%" stopColor="#FFB300"/>
      </linearGradient>
      <linearGradient id="beakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8F00"/>
        <stop offset="100%" stopColor="#E65100"/>
      </linearGradient>
      <linearGradient id="combGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D32F2F"/>
        <stop offset="100%" stopColor="#B71C1C"/>
      </linearGradient>
      <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB74D"/>
        <stop offset="100%" stopColor="#FF8F00"/>
      </linearGradient>
    </defs>
  </svg>
);

// Advanced Mutton/Lamb Icon with wool texture and realistic features
const MuttonIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Lamb body with wool texture */}
    <ellipse cx="12" cy="15" rx="7" ry="5" fill="url(#woolBody)" stroke="#E0E0E0" strokeWidth="0.8"/>
    
    {/* Lamb head with wool texture */}
    <circle cx="12" cy="9" r="3.5" fill="url(#woolHead)" stroke="#E0E0E0" strokeWidth="0.8"/>
    
    {/* Ears with detail */}
    <ellipse cx="10" cy="7" rx="1.2" ry="1.8" fill="url(#earGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    <ellipse cx="14" cy="7" rx="1.2" ry="1.8" fill="url(#earGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    <ellipse cx="10" cy="7" rx="0.6" ry="0.9" fill="#F5F5F5"/>
    <ellipse cx="14" cy="7" rx="0.6" ry="0.9" fill="#F5F5F5"/>
    
    {/* Eyes with depth */}
    <circle cx="11" cy="8.5" r="0.8" fill="#2E2E2E"/>
    <circle cx="13" cy="8.5" r="0.8" fill="#2E2E2E"/>
    <circle cx="11" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="13" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="11.2" cy="8.3" r="0.15" fill="#2E2E2E"/>
    <circle cx="13.2" cy="8.3" r="0.15" fill="#2E2E2E"/>
    
    {/* Nose with texture */}
    <ellipse cx="12" cy="10" rx="1" ry="0.6" fill="url(#noseGradient)"/>
    <ellipse cx="12" cy="10" rx="0.5" ry="0.3" fill="#9E9E9E"/>
    
    {/* Mouth */}
    <path d="M11.5 10.5C11.5 10.5 12 11.2 12.5 10.5" stroke="#9E9E9E" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    
    {/* Wool texture circles */}
    <circle cx="8" cy="14" r="1" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    <circle cx="16" cy="14" r="1" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    <circle cx="12" cy="16" r="1" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    <circle cx="10" cy="15" r="0.7" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.2"/>
    <circle cx="14" cy="15" r="0.7" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.2"/>
    
    {/* Legs with texture */}
    <rect x="9.5" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    <rect x="13.3" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    
    {/* Hooves with detail */}
    <ellipse cx="10" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="14" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="10" cy="22" rx="0.5" ry="0.2" fill="#757575"/>
    <ellipse cx="14" cy="22" rx="0.5" ry="0.2" fill="#757575"/>
    
    {/* Tail with wool */}
    <ellipse cx="19" cy="15" rx="1.8" ry="1.2" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    
    {/* Gradients */}
    <defs>
      <radialGradient id="woolBody" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="50%" stopColor="#F5F5F5"/>
        <stop offset="100%" stopColor="#E8E8E8"/>
      </radialGradient>
      <radialGradient id="woolHead" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#F5F5F5"/>
      </radialGradient>
      <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8E8E8"/>
        <stop offset="100%" stopColor="#D0D0D0"/>
      </linearGradient>
      <linearGradient id="noseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#BDBDBD"/>
        <stop offset="100%" stopColor="#9E9E9E"/>
      </linearGradient>
      <radialGradient id="woolTexture" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FAFAFA"/>
        <stop offset="100%" stopColor="#E0E0E0"/>
      </radialGradient>
      <linearGradient id="legGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E0E0"/>
        <stop offset="100%" stopColor="#D0D0D0"/>
      </linearGradient>
      <linearGradient id="hoofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9E9E9E"/>
        <stop offset="100%" stopColor="#757575"/>
      </linearGradient>
    </defs>
  </svg>
);

// Advanced Goat Icon with realistic features and textures
const GoatIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Goat body with fur texture */}
    <ellipse cx="12" cy="15" rx="7" ry="5" fill="url(#goatBody)" stroke="#6D4C41" strokeWidth="0.8"/>
    
    {/* Goat head with fur texture */}
    <ellipse cx="12" cy="9" rx="3" ry="3.5" fill="url(#goatHead)" stroke="#6D4C41" strokeWidth="0.8"/>
    
    {/* Horns with realistic curves */}
    <path d="M10 6C10 6 9 3.5 10 2.5C11 1.5 12 2.5 12 3.5" stroke="url(#hornGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M14 6C14 6 15 3.5 14 2.5C13 1.5 12 2.5 12 3.5" stroke="url(#hornGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M10 6C10 6 9.5 4.5 10 3.5" stroke="#5D4037" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    <path d="M14 6C14 6 14.5 4.5 14 3.5" stroke="#5D4037" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    
    {/* Ears with detail */}
    <ellipse cx="10" cy="7" rx="1" ry="1.4" fill="url(#earGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    <ellipse cx="14" cy="7" rx="1" ry="1.4" fill="url(#earGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    <ellipse cx="10" cy="7" rx="0.5" ry="0.7" fill="#8D6E63"/>
    <ellipse cx="14" cy="7" rx="0.5" ry="0.7" fill="#8D6E63"/>
    
    {/* Eyes with depth */}
    <circle cx="11" cy="8.5" r="0.8" fill="#1A1A1A"/>
    <circle cx="13" cy="8.5" r="0.8" fill="#1A1A1A"/>
    <circle cx="11" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="13" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="11.2" cy="8.3" r="0.15" fill="#1A1A1A"/>
    <circle cx="13.2" cy="8.3" r="0.15" fill="#1A1A1A"/>
    
    {/* Nose with texture */}
    <ellipse cx="12" cy="10.5" rx="0.8" ry="0.5" fill="url(#noseGradient)"/>
    <ellipse cx="12" cy="10.5" rx="0.4" ry="0.25" fill="#5D4037"/>
    
    {/* Mouth */}
    <path d="M11.5 11C11.5 11 12 11.8 12.5 11" stroke="#5D4037" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    
    {/* Beard with texture */}
    <path d="M12 11.5C12 11.5 11 13.5 9.5 13" stroke="url(#beardGradient)" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M12 11.5C12 11.5 13 13.5 14.5 13" stroke="url(#beardGradient)" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M12 12C12 12 11.5 13 10.5 12.5" stroke="#5D4037" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
    <path d="M12 12C12 12 12.5 13 13.5 12.5" stroke="#5D4037" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
    
    {/* Fur texture on body */}
    <path d="M8 14C8 14 9 12.5 10.5 14" stroke="#6D4C41" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
    <path d="M16 14C16 14 15 12.5 13.5 14" stroke="#6D4C41" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
    <path d="M10 15C10 15 11 13.5 12.5 15" stroke="#6D4C41" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    <path d="M14 15C14 15 13 13.5 11.5 15" stroke="#6D4C41" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    
    {/* Legs with texture */}
    <rect x="9.5" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    <rect x="13.3" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    
    {/* Hooves with detail */}
    <ellipse cx="10" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="14" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="10" cy="22" rx="0.5" ry="0.2" fill="#4E342E"/>
    <ellipse cx="14" cy="22" rx="0.5" ry="0.2" fill="#4E342E"/>
    
    {/* Tail with fur */}
    <ellipse cx="19" cy="15" rx="1.8" ry="1.2" fill="url(#tailGradient)" stroke="#6D4C41" strokeWidth="0.3"/>
    
    {/* Gradients */}
    <defs>
      <radialGradient id="goatBody" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A1887F"/>
        <stop offset="50%" stopColor="#8D6E63"/>
        <stop offset="100%" stopColor="#6D4C41"/>
      </radialGradient>
      <radialGradient id="goatHead" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A1887F"/>
        <stop offset="100%" stopColor="#8D6E63"/>
      </radialGradient>
      <linearGradient id="hornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D4C41"/>
        <stop offset="100%" stopColor="#4E342E"/>
      </linearGradient>
      <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8D6E63"/>
        <stop offset="100%" stopColor="#6D4C41"/>
      </linearGradient>
      <linearGradient id="noseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D4C41"/>
        <stop offset="100%" stopColor="#5D4037"/>
      </linearGradient>
      <linearGradient id="beardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D4C41"/>
        <stop offset="100%" stopColor="#4E342E"/>
      </linearGradient>
      <linearGradient id="legGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8D6E63"/>
        <stop offset="100%" stopColor="#6D4C41"/>
      </linearGradient>
      <linearGradient id="hoofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5D4037"/>
        <stop offset="100%" stopColor="#4E342E"/>
      </linearGradient>
      <radialGradient id="tailGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A1887F"/>
        <stop offset="100%" stopColor="#8D6E63"/>
      </radialGradient>
    </defs>
  </svg>
);

const EggIcon = (props) => (
  <span role="img" aria-label="Eggs" {...props}>🥚</span>
);
const MasalaIcon = (props) => (
  <span role="img" aria-label="Masalas" {...props}>🧂</span>
);

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    function handleResize() { setWindowWidth(window.innerWidth); }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []); 

  return windowWidth;
};

function SectionHeading({ children, id }) {
    return (
    <div id={id} className="flex items-center text-center mb-8 sm:mb-10">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h2 className="flex-shrink-0 px-4 sm:px-6 font-extrabold text-gray-800 text-xl sm:text-2xl lg:text-3xl capitalize">
        {children}
      </h2>
      <div className="flex-grow h-px bg-gray-200"></div>
        </div>
  );
}

function ProductCard({ item, onAddToCart }) {
  const [customGms, setCustomGms] = useState('');

  const handleAddClick = () => {
    const addedWeight = parseInt(customGms, 10) || 500;
    const finalPrice = Math.round((item.price * (addedWeight / 1000)));
    onAddToCart(item, addedWeight, finalPrice);
    setCustomGms('');
  };

  const displayPrice = useMemo(() => Math.round((item.price || 0) / 2), [item.price]);

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full p-3 md:p-4 lg:p-5 xl:p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="w-full h-32 sm:h-36 lg:h-60 xl:h-72 bg-gray-100 rounded-md mb-3 overflow-hidden">
      <img
            src={item.imageUrl || 'https://via.placeholder.com/300x200'} 
        alt={item.name}
            className="w-full h-full object-contain"
        />
            </div>
      <div className="flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm md:text-base lg:text-xl xl:text-2xl leading-tight">{item.name}</h3>
        <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1">{item.description || '500 gms | 10-12 Pieces'}</p>
        <p className="font-extrabold text-base md:text-lg lg:text-2xl xl:text-3xl text-gray-900 my-2 lg:my-3 xl:my-4">₹{displayPrice}/-</p>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <input type="text" pattern="[0-9]*" inputMode="numeric" value={customGms} onChange={(e) => setCustomGms(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter gms" className="w-full text-xs md:text-sm lg:text-base xl:text-lg p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"/>
          <button onClick={handleAddClick} className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 flex-shrink-0 font-bold text-xs md:text-sm lg:text-base xl:text-lg hover:bg-red-100 transition-colors">Add</button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({ items, onAddToCart }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
      {items.map(item => (
        <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('taazaCart')) || []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const windowWidth = useWindowWidth();
  const DESKTOP_BREAKPOINT = 1024;

  const mindCategories = [
    { key: 'chicken', label: 'Chicken', imageUrl: 'https://assets.tendercuts.in/product/R/M/ae6849a6-0699-4617-a963-382e93cf8940.webp' },
    { key: 'mutton', label: 'Mutton', imageUrl: 'https://assets.tendercuts.in/product/R/M/2fa6b2bd-884e-4ecb-ac32-09bd7134a854.webp' },
    { key: 'eggs', label: 'Eggs', imageUrl: 'https://assets.tendercuts.in/product/c/h/chk_egg.jpg' },
    { key: 'masala', label: 'Masala', imageUrl: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg' },
  ];

  const heroCarouselData = [
    { id: 1, imageUrl: goatMeat, alt: "Fresh cuts of premium meat" },
    { id: 2, imageUrl: wholeChicken, alt: "Weekly special offers on chicken" },
    { id: 3, imageUrl: bgImg, alt: "Spices and marinades for the perfect dish" },
  ];

  const heroCarouselSettings = {
    dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 3000, fade: true, cssEase: 'linear', arrows: false,
  };

  useEffect(() => { if (!user || user.type !== 'customer') { navigate('/login'); } }, [user, navigate]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => { setError('Failed to load products.'); setLoading(false); });
    return () => unsubscribe();
  }, []);
  
  const handleAddToCart = (item, weight, price) => {
    const existingItem = cart.find(ci => ci.id === item.id && ci.weight === weight);
    const updatedCart = existingItem
      ? cart.map(ci => ci.id === item.id && ci.weight === weight ? { ...ci, quantity: ci.quantity + 1 } : ci)
      : [...cart, { ...item, weight, price, quantity: 1 }];
      setCart(updatedCart);
      localStorage.setItem('taazaCart', JSON.stringify(updatedCart));
    setSuccessMessage(`${item.name} (${weight}g) added!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  const groupedProducts = useMemo(() => products.reduce((acc, product) => {
      const category = product.category || 'other';
    (acc[category] = acc[category] || []).push(product);
      return acc;
  }, {}), [products]);
  
  const scrollToCategory = (key) => document.getElementById(`${key}-heading`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  const productSliderSettings = {
    dots: true, infinite: false, speed: 500, slidesToShow: 4, slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3.5 } },
      { breakpoint: 768,  settings: { slidesToShow: 2.5 } },
      { breakpoint: 640,  settings: { slidesToShow: 2 } },
    ]
  };

  if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading Fresh Products...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="bg-white">
      <div className={`fixed bottom-5 right-5 bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform duration-300 ease-in-out z-50 ${showSuccess ? 'translate-y-0' : 'translate-y-24'}`}>
        ✅ {successMessage}
      </div>

      <div className="w-full bg-slate-100 pt-8 md:pt-10 pb-4 md:pb-6">
        <div className="w-11/12 lg:w-4/5 mx-auto">
          <Slider {...heroCarouselSettings}>
            {heroCarouselData.map((slide) => (
              <div key={slide.id}>
                <div className="relative h-40 md:h-64 lg:h-96 xl:h-[500px] w-full rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={slide.imageUrl}
                    alt={slide.alt}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ))}
          </Slider>
        </div>
          </div>

      <div className="w-full bg-slate-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>Bestsellers</SectionHeading>
          {windowWidth >= DESKTOP_BREAKPOINT ? (
            <ProductGrid items={products.slice(0, 10)} onAddToCart={handleAddToCart} />
          ) : (
            <Slider {...productSliderSettings}>
              {products.slice(0, 8).map(item => (
                <div key={`bestseller-${item.id}`} className="px-2 md:px-3">
                  <ProductCard item={item} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>
      
      <div className="w-full bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>Explore by Category</SectionHeading>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-4 lg:gap-x-6 gap-y-6 text-center">
            {mindCategories.map((cat) => (
              <div key={cat.key} onClick={() => scrollToCategory(cat.key)} className="flex flex-col items-center space-y-2 cursor-pointer group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-red-200 transition-all duration-300 shadow-md group-hover:shadow-lg">
                  <img src={cat.imageUrl} alt={cat.label} className="w-full h-full object-contain bg-white" />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-red-600 text-xs sm:text-sm lg:text-base capitalize text-center">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {Object.entries(groupedProducts).map(([category, items], index) => (
        <div key={category} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
          <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading id={`${category}-heading`}>{category}</SectionHeading>
            {windowWidth >= DESKTOP_BREAKPOINT ? (
              <ProductGrid items={items} onAddToCart={handleAddToCart} />
            ) : (
              <Slider {...productSliderSettings}>
                {items.map(item => (
                  <div key={item.id} className="px-2 md:px-3">
                    <ProductCard item={item} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </Slider>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;