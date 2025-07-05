import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import wholeChicken from "../../../assets/wholeChicken.png";
import goatMeat from "../../../assets/goatMeat.png";
import bgImg from '../../../assets/bg.jpg';
import taazaBanner from '../../../assets/taaza-banner.jpg';
import banner2 from '../../../assets/banner2.jpg';
import banner3 from '../../../assets/banner3.jpg';

import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

// --- SVG Icon for the "Add" button ---
function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);
}

// --- SVG Icon for the cart button in the nav bar ---
function BasketIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);
}

// --- The Bottom Navigation Bar Component ---
function BottomNavBar({ categories, onCategoryClick, onCartClick }) {
  const leftCategories = categories.slice(0, 2);
  const rightCategories = categories.slice(2, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-gray-50 border-t border-gray-200 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)] z-40 lg:hidden">
      <div className="flex justify-between items-center h-full max-w-lg mx-auto px-2">
        {/* Left container */}
        <div className="flex justify-around w-2/5">
          {leftCategories.map((cat) => (
            <button key={cat.key} onClick={() => onCategoryClick(cat.key)} className="flex flex-col items-center justify-center space-y-1 text-center group">
              <div className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center group-hover:border-red-400 transition-colors">
                <img src={cat.imageUrl} alt={cat.label} className="w-9 h-9 object-contain p-1" />
              </div>
            </button>
          ))}
        </div>
        
        {/* Center Cart Button */}
        <div className="relative -top-5">
          <button onClick={onCartClick} className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <BasketIcon />
          </button>
        </div>
        
        {/* Right container */}
        <div className="flex justify-around w-2/5">
          {rightCategories.map((cat) => (
            <button key={cat.key} onClick={() => onCategoryClick(cat.key)} className="flex flex-col items-center justify-center space-y-1 text-center group">
              <div className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center group-hover:border-red-400 transition-colors">
                <img src={cat.imageUrl} alt={cat.label} className="w-9 h-9 object-contain p-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

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
  const [customGms, setCustomGms] = useState(500);
  const [customEggs, setCustomEggs] = useState(6);
  const [customPieces, setCustomPieces] = useState(1);
  const [useManualEggs, setUseManualEggs] = useState(false);
  const [useManualWeight, setUseManualWeight] = useState(false);
  const [useManualPieces, setUseManualPieces] = useState(false);

  // Helper function to calculate eggs price
  const calculateEggsPrice = (item, quantity) => {
    if (quantity === 6) return item.price6 || (item.pricePerEgg * 6) || 0;
    if (quantity === 12) return item.price12 || (item.pricePerEgg * 12) || 0;
    if (quantity === 30) return item.price30 || (item.pricePerEgg * 30) || 0;
    return (item.pricePerEgg || 0) * quantity;
  };

  // Helper function to calculate weight price
  const calculateWeightPrice = (item, weight) => {
    return Math.round((item.price * (weight / 1000)));
  };

  // Helper function to calculate pieces price
  const calculatePiecesPrice = (item, pieces) => {
    return item.price * pieces;
  };

  const handleAddClick = () => {
    if (item.category === 'eggs') {
      const finalEggsQuantity = useManualEggs ? customEggs : (customEggs || 6);
      const finalPrice = calculateEggsPrice(item, finalEggsQuantity);
      onAddToCart(item, finalEggsQuantity, finalPrice);
      setCustomEggs(6);
      setUseManualEggs(false);
    } else if (item.category === 'masalas') {
      const finalPieces = useManualPieces ? customPieces : (customPieces || 1);
      const finalPrice = calculatePiecesPrice(item, finalPieces);
      onAddToCart(item, finalPieces, finalPrice);
      setCustomPieces(1);
      setUseManualPieces(false);
    } else {
      const finalWeight = customGms || 500;
      const finalPrice = calculateWeightPrice(item, finalWeight);
      onAddToCart(item, finalWeight, finalPrice);
      setCustomGms(500);
    }
  };

  const displayPrice = useMemo(() => {
    if (item.category === 'eggs') {
      // For eggs, show price for 6 eggs as default
      return Math.round((item.price6 || (item.pricePerEgg * 6) || 0) / 2);
    }
    return Math.round((item.price || 0) / 2);
  }, [item.price, item.price6, item.pricePerEgg, item.category]);

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full p-3 md:p-4 hover:shadow-lg transition-shadow duration-300">
      <div className="w-full h-32 sm:h-36 bg-gray-100 rounded-md mb-3 overflow-hidden">
      <img
            src={item.imageUrl || 'https://via.placeholder.com/300x200'} 
        alt={item.name}
            className="w-full h-full object-contain"
        />
            </div>
      <div className="flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight mb-2">{item.name}</h3>
        <p className="font-extrabold text-base md:text-lg text-gray-900 mb-3">₹{displayPrice}/-</p>
        
        {item.category === 'eggs' ? (
          <div className="space-y-3">
            {/* Manual Input Toggle for Eggs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useManualEggs}
                  onChange={(e) => setUseManualEggs(e.target.checked)}
                  className="rounded border-gray-300 text-red-500 focus:ring-red-500 w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Custom quantity</span>
              </div>
              {/* Price Display for Eggs */}
              <p className="text-xs sm:text-sm text-green-600 font-semibold">
                ₹{calculateEggsPrice(item, useManualEggs ? customEggs : customEggs)}
              </p>
            </div>
            
            {!useManualEggs ? (
              <div className="space-y-2">
                <select
                  value={customEggs}
                  onChange={(e) => setCustomEggs(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value={6}>6 eggs - ₹{item.price6}</option>
                  <option value={12}>12 eggs - ₹{item.price12}</option>
                  <option value={30}>30 eggs - ₹{item.price30}</option>
                </select>
                <button 
                  onClick={handleAddClick} 
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg px-3 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  <span>Add to Cart</span>
                  <div className="bg-white text-red-500 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                      <PlusIcon />
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={customEggs} 
                    onChange={(e) => setCustomEggs(Number(e.target.value))} 
                    placeholder="Enter eggs" 
                    min="1"
                    className="flex-1 text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                  />
                  <button 
                    onClick={handleAddClick} 
                    className="flex-shrink-0 flex items-center justify-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <span className="hidden sm:inline">Add</span>
                    <div className="bg-white text-red-500 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                        <PlusIcon />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : item.category === 'masalas' ? (
          <div className="space-y-3">
            {/* Manual Input Toggle for Masalas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useManualPieces}
                  onChange={(e) => setUseManualPieces(e.target.checked)}
                  className="rounded border-gray-300 text-red-500 focus:ring-red-500 w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Custom pieces</span>
              </div>
              {/* Price Display for Masalas */}
              <p className="text-xs sm:text-sm text-green-600 font-semibold">
                ₹{calculatePiecesPrice(item, useManualPieces ? customPieces : customPieces)}
              </p>
            </div>
            
            {!useManualPieces ? (
              <div className="space-y-2">
                <select
                  value={customPieces}
                  onChange={(e) => setCustomPieces(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value={1}>1 piece - ₹{item.price}</option>
                  <option value={2}>2 pieces - ₹{item.price * 2}</option>
                  <option value={3}>3 pieces - ₹{item.price * 3}</option>
                  <option value={5}>5 pieces - ₹{item.price * 5}</option>
                </select>
                <button 
                  onClick={handleAddClick} 
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg px-3 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  <span>Add to Cart</span>
                  <div className="bg-white text-red-500 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                      <PlusIcon />
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={customPieces} 
                    onChange={(e) => setCustomPieces(Number(e.target.value))} 
                    placeholder="Enter pieces" 
                    min="1"
                    className="flex-1 text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                  />
                  <button 
                    onClick={handleAddClick} 
                    className="flex-shrink-0 flex items-center justify-center gap-1 sm:gap-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <span className="hidden sm:inline">Add</span>
                    <div className="bg-white text-red-500 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                        <PlusIcon />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-green-600 font-semibold">
                ₹{calculateWeightPrice(item, customGms)}
              </span>
            </div>
            
            <select
              value={customGms}
              onChange={(e) => setCustomGms(Number(e.target.value))}
              className="w-full text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 bg-white"
            >
              <option value={250}>250g - ₹{calculateWeightPrice(item, 250)}</option>
              <option value={500}>500g - ₹{calculateWeightPrice(item, 500)}</option>
              <option value={1000}>1kg - ₹{calculateWeightPrice(item, 1000)}</option>
              <option value={1500}>1.5kg - ₹{calculateWeightPrice(item, 1500)}</option>
            </select>
            <button 
              onClick={handleAddClick} 
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg px-3 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              <span>Add to Cart</span>
              <div className="bg-white text-red-500 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                  <PlusIcon />
              </div>
            </button>
        </div>
        )}
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
  const successTimeoutRef = useRef(null);

  const windowWidth = useWindowWidth();
  const DESKTOP_BREAKPOINT = 1024;

  // --- UPDATED: Using new icon URLs that better match the Figma design ---
  const mindCategories = [
    { key: 'chicken', label: 'Chicken', imageUrl: 'https://www.svgrepo.com/show/506306/chicken.svg' },
    { key: 'mutton', label: 'Mutton', imageUrl: 'https://www.svgrepo.com/show/493774/goat.svg' },
    { key: 'eggs', label: 'Eggs', imageUrl: 'https://www.svgrepo.com/show/532309/eggs.svg' },
    { key: 'masala', label: 'Masala', imageUrl: 'https://www.svgrepo.com/show/423337/spice-bowl-cook.svg' },
  ];

  const heroCarouselData = [
    { id: 1, imageUrl: taazaBanner, alt: "Taaza Fresh Delivery" },
    { id: 2, imageUrl: banner2, alt: "Fresh Chicken, Eggs, and Meat" },
    { id: 3, imageUrl: banner3, alt: "Chicken and Spices" },
  ];

  const heroCarouselSettings = {
    dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 3000, fade: true, cssEase: 'linear', arrows: false,
  };

  useEffect(() => {
    return () => clearTimeout(successTimeoutRef.current);
  }, []);

  useEffect(() => { if (!user || user.type !== 'customer') { navigate('/login'); } }, [user, navigate]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => { setError('Failed to load products.'); setLoading(false); });
    return () => unsubscribe();
  }, []);
  
  const handleAddToCart = (item, weight, price) => {
    clearTimeout(successTimeoutRef.current);

    // For eggs, use quantity as weight for compatibility
    const isEggs = item.category === 'eggs';
    const displayWeight = isEggs ? weight : weight;
    const displayUnit = isEggs ? 'eggs' : 'g';

    const existingItem = cart.find(ci => ci.id === item.id && ci.weight === weight);
    const updatedCart = existingItem
      ? cart.map(ci => ci.id === item.id && ci.weight === weight ? { ...ci, quantity: ci.quantity + 1 } : ci)
      : [...cart, { ...item, weight, price, quantity: 1 }];
      setCart(updatedCart);
      localStorage.setItem('taazaCart', JSON.stringify(updatedCart));

    setSuccessMessage(`${item.name} (${displayWeight}${displayUnit}) added!`);
      setShowSuccess(true);
    
    successTimeoutRef.current = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
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
    <div className="bg-white relative pb-24 lg:pb-0">
      <div className={`fixed bottom-24 lg:bottom-5 right-5 bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out z-50 ${showSuccess ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        ✅ {successMessage}
      </div>

      {/* Professional Hero Banner Section */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 pt-16 lg:pt-20 pb-8 sm:pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Professional Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight">
              Premium Meat Market
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-4">
              Experience the finest quality meat, carefully sourced and delivered fresh to your doorstep
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm sm:text-base font-semibold">100% Fresh</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm sm:text-base font-semibold">Premium Quality</span>
              </div>
            </div>
          </div>
          
          {/* Professional Carousel */}
          <div className="relative">
          <Slider {...heroCarouselSettings}>
            {heroCarouselData.map((slide) => (
              <div key={slide.id}>
                  <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[500px] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl">
                    {/* Professional gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-10"></div>
                    
                  <img
                    src={slide.imageUrl}
                    alt={slide.alt}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Professional content overlay */}
                    <div className="absolute inset-0 flex items-center justify-center sm:justify-start z-20 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16">
                      <div className="w-full sm:max-w-lg">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl border border-white/20">
                          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">
                            {slide.alt}
                          </h2>
                          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                            Discover our carefully curated selection of premium cuts
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                              Shop Now
                            </button>
                            <button className="border-2 border-gray-300 hover:border-green-600 text-gray-700 hover:text-green-600 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300">
                              Learn More
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </Slider>
          </div>
          
          {/* Professional Stats Section */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            <div className="text-center p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">100%</div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">Fresh Quality</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">50+</div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">Premium Products</div>
            </div>
          </div>
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
          <div className="hidden lg:grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-4 lg:gap-x-6 gap-y-6 text-center">
            {mindCategories.map((cat) => (
              <div key={cat.key} onClick={() => scrollToCategory(cat.key)} className="flex flex-col items-center space-y-2 cursor-pointer group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-red-200 transition-all duration-300 shadow-md group-hover:shadow-lg">
                  <img src={cat.imageUrl} alt={cat.label} className="w-full h-full object-contain bg-white p-2" />
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

      {windowWidth < DESKTOP_BREAKPOINT && (
        <BottomNavBar
            categories={mindCategories}
            onCategoryClick={scrollToCategory}
            onCartClick={() => navigate('/cart')} 
        />
      )}
    </div>
  );
}

export default Home;