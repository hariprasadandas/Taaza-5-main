import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import Toast from '../../Toast';
import { sendOrderNotifications } from '../../../utils/notifications';
import { generateOrderId, printOrderReceipt } from '../../../utils/orderUtils';

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // State for different types of quantity input
  const [itemWeight, setItemWeight] = useState(500); // For meat (in grams)
  const [itemPieceQuantity, setItemPieceQuantity] = useState(1); // For masalas (in pieces)
  const [eggsQuantity, setEggsQuantity] = useState(6); // For eggs (in pieces)
  
  // Manual input states
  const [manualWeight, setManualWeight] = useState(500); // Manual weight input
  const [manualPieces, setManualPieces] = useState(1); // Manual pieces input
  const [manualEggs, setManualEggs] = useState(6); // Manual eggs input
  const [useManualInput, setUseManualInput] = useState(false); // Toggle for manual input

  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setToast({ show: true, message: 'Error loading orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setToast({ show: true, message: 'Error loading products', type: 'error' });
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Product filtering logic
  const getFilteredItems = () => {
    if (activeFilter === 'all') return products;
    return products.filter(item => item.category === activeFilter);
  };
  
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };
  
  // This function is now only for weight-based items (meat)
  const calculatePriceByWeight = (item, weight) => {
    if (!item || !item.price || !weight) return 0;
    return Math.round((item.price * (weight / 1000)));
  };

  // Eggs-specific price calculation
  const calculateEggsPrice = (item, quantity) => {
    if (quantity === 6) return item.price6 || (item.pricePerEgg * 6) || 0;
    if (quantity === 12) return item.price12 || (item.pricePerEgg * 12) || 0;
    if (quantity === 30) return item.price30 || (item.pricePerEgg * 30) || 0;
    return (item.pricePerEgg || 0) * quantity;
  };

  const handleAddToCartClick = (item) => {
    setSelectedItem(item);
    // Reset inputs to defaults when opening modal
    setItemWeight(500);
    setItemPieceQuantity(1);
    setEggsQuantity(6);
    setManualWeight(500);
    setManualPieces(1);
    setManualEggs(6);
    setUseManualInput(false);
    setShowCustomerForm(true);
  };

  const handleConfirmAddToCart = async (item) => {
    try {
      let cartItem;
      let totalPrice;
      let stockUpdatePromise;

      const productRef = doc(db, 'products', item.id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error("Product not found in database.");
      }
      const currentQty = productSnap.data().quantity || 0;

      // --- LOGIC FOR EGGS (BY PIECE) ---
      if (item.category === 'eggs') {
        const finalEggsQuantity = useManualInput ? manualEggs : eggsQuantity;
        if (currentQty < finalEggsQuantity) {
          setToast({ show: true, message: 'Not enough eggs available.', type: 'error' });
          return;
        }
        totalPrice = calculateEggsPrice(item, finalEggsQuantity);
        cartItem = {
          ...item,
          price: totalPrice, // Total price for all eggs
          quantity: finalEggsQuantity, // Number of eggs
          weight: finalEggsQuantity, // For compatibility
          unitDescription: `${finalEggsQuantity} eggs`,
        };
        const newQty = currentQty - finalEggsQuantity;
        stockUpdatePromise = updateDoc(productRef, { quantity: newQty < 0 ? 0 : newQty });

      // --- LOGIC FOR MASALAS (BY PIECE) ---
      } else if (item.category === 'masalas') {
        const finalPieceQuantity = useManualInput ? manualPieces : itemPieceQuantity;
        if (currentQty < finalPieceQuantity) {
          setToast({ show: true, message: 'Not enough stock available.', type: 'error' });
          return;
        }
        totalPrice = item.price * finalPieceQuantity;
        cartItem = {
          ...item,
          price: totalPrice, // Total price for all pieces
          quantity: finalPieceQuantity, // Number of pieces
          unitDescription: `${item.unitWeight}g piece`,
        };
        const newQty = currentQty - finalPieceQuantity;
        stockUpdatePromise = updateDoc(productRef, { quantity: newQty < 0 ? 0 : newQty });

      // --- LOGIC FOR MEAT (BY WEIGHT) ---
      } else {
        const finalWeight = useManualInput ? manualWeight : itemWeight;
        const boughtKg = (finalWeight || 0) / 1000;
        if (currentQty < boughtKg) {
            setToast({ show: true, message: 'Not enough stock available for the requested weight.', type: 'error' });
            return;
        }
        totalPrice = calculatePriceByWeight(item, finalWeight);
        cartItem = {
          ...item,
          price: totalPrice, // Total price for the weight
          weight: finalWeight, // Weight in grams
          quantity: 1, // Always 1 for weight-based items in this system
          unitDescription: `${finalWeight}g`,
        };
        let newQty = currentQty - boughtKg;
        stockUpdatePromise = updateDoc(productRef, { quantity: newQty < 0 ? 0 : newQty });
      }

      // Generate sequential order ID
      const orderId = await generateOrderId();
      
      // Create order
      const orderRef = await addDoc(collection(db, 'orders'), {
        orderId: orderId,
        cart: [cartItem], // Cart contains the single processed item
        status: 'confirmed',
        paymentMethod: 'cash',
        createdAt: serverTimestamp(),
        total: totalPrice,
        customerName: 'Walk-in Customer',
        customerPhone: 'N/A',
        source: 'admin'
      });

      // Decrease product stock
      await stockUpdatePromise;

      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        orderId: orderRef.id,
        orderNumber: orderId,
        amount: totalPrice,
        items: [cartItem],
        status: 'completed',
        paymentMethod: 'cash',
        createdAt: serverTimestamp(),
        customer: { name: 'Walk-in Customer', phone: 'N/A' }
      });

      // Print receipt
      printOrderReceipt({ orderId, id: orderRef.id }, [cartItem], 'Walk-in Customer', 'N/A');

      setToast({ show: true, message: `Order #${orderId} created! Receipt printed.`, type: 'success' });

      // Reset form and refresh data
      setShowCustomerForm(false);
      setSelectedItem(null);
      await fetchOrders();
      await fetchProducts();

    } catch (error) {
      console.error('Error creating order:', error);
      setToast({ show: true, message: 'Error creating order: ' + error.message, type: 'error' });
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <div className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        <div className="mb-8 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📊
                    </div>
                    Dashboard Overview
                  </h2>
                  <p className="text-slate-600 text-base sm:text-lg font-medium">Manage orders, products, and view analytics with real-time insights</p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-white shadow-md">
                    🛒
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Create Orders (Cash Payment)</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleFilterClick('all')} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === 'all' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>All</button>
                <button onClick={() => handleFilterClick('chicken')} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === 'chicken' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Chicken</button>
                <button onClick={() => handleFilterClick('mutton')} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === 'mutton' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Mutton</button>
                <button onClick={() => handleFilterClick('goat')} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === 'goat' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Goat</button>
                <button onClick={() => handleFilterClick('masalas')} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === 'masalas' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Masalas</button>
                <button onClick={() => handleFilterClick('eggs')} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${activeFilter === 'eggs' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Eggs</button>
              </div>
            </div>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length === 0 ? (
                <div className="col-span-full text-center py-12">
                   {loading ? <p>Loading products...</p> : <p>No products found.</p>}
                </div>
            ) : (
                getFilteredItems().map(item => (
                <div key={item.id} className="group relative bg-yellow-100 backdrop-blur-md border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    
                    <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 p-4">
                        <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-110" 
                        />
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </div>
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                            (item.quantity || 0) > 10 ? 'bg-green-100 text-green-800' : 
                            (item.quantity || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                        }`}>
                            {item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="font-bold mb-3 text-lg text-slate-800 leading-tight group-hover:text-slate-900 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.name}
                        </h3>
                        
                        {item.category === 'eggs' ? (
                            <div className="space-y-3 mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-base font-semibold text-slate-700">6 eggs: <span className="text-red-600 font-bold">₹{item.price6}</span></span>
                                    <span className="text-base font-semibold text-slate-700">12 eggs: <span className="text-red-600 font-bold">₹{item.price12}</span></span>
                                    <span className="text-base font-semibold text-slate-700">30 eggs: <span className="text-red-600 font-bold">₹{item.price30}</span></span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>🥚 Available:</span>
                                    <span className={`text-sm font-bold ${(item.quantity || 0) > 10 ? 'text-green-600' : (item.quantity || 0) > 0 ? 'text-yellow-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{item.quantity || 0} eggs</span>
                                </div>
                            </div>
                        ) : item.category === 'masalas' ? (
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>₹{item.price}</span>
                                <span className="text-sm text-slate-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/ {item.unitWeight}g piece</span>
                                </div>
                                <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>📦 Available:</span>
                                <span className={`text-sm font-bold ${(item.quantity || 0) > 10 ? 'text-green-600' : (item.quantity || 0) > 0 ? 'text-yellow-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{item.quantity || 0} pieces</span>
                                </div>
                            </div>
                        ) : ( 
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>₹{item.price}</span>
                                <span className="text-sm text-slate-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    / kg
                                </span>
                                </div>
                                <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>📦 Available:</span>
                                <span className={`text-sm font-bold ${(item.quantity || 0) > 10 ? 'text-green-600' : (item.quantity || 0) > 0 ? 'text-yellow-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {item.quantity || 0} kg
                                </span>
                                </div>
                            </div>
                        )}
                        
                        <button onClick={() => handleAddToCartClick(item)} disabled={(item.quantity || 0) <= 0} className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${(item.quantity || 0) > 0 ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {(item.quantity || 0) > 0 ? '🛒 Add to Cart' : '❌ Out of Stock'}
                        </button>
                    </div>
                </div>
                ))
            )}
        </div>
      </div>

      {showCustomerForm && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Create Order - {selectedItem.name}</h3>
            
            {/* Manual Input Toggle */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualInput}
                  onChange={(e) => setUseManualInput(e.target.checked)}
                  className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-sm font-medium text-slate-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Use Manual Input
                </span>
              </label>
            </div>
            
            {selectedItem.category === 'eggs' ? (
              <div className="space-y-4">
                {!useManualInput ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Number of Eggs</label>
                    <select
                      value={eggsQuantity}
                      onChange={(e) => setEggsQuantity(Number(e.target.value))}
                      className="w-full p-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    >
                      <option value={6}>6 eggs - ₹{selectedItem.price6}</option>
                      <option value={12}>12 eggs - ₹{selectedItem.price12}</option>
                      <option value={30}>30 eggs - ₹{selectedItem.price30}</option>
                    </select>
                    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total Price: ₹{calculateEggsPrice(selectedItem, eggsQuantity)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Manual Number of Eggs</label>
                    <input
                      type="number"
                      value={manualEggs}
                      onChange={(e) => setManualEggs(Number(e.target.value))}
                      className="w-full p-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      min="1"
                      step="1"
                      placeholder="Enter number of eggs"
                    />
                    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total Price: ₹{calculateEggsPrice(selectedItem, manualEggs)}
                    </p>
                  </div>
                )}
              </div>
            ) : selectedItem.category === 'masalas' ? (
              <div className="space-y-4">
                {!useManualInput ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Number of Pieces</label>
                    <input
                      type="number"
                      value={itemPieceQuantity}
                      onChange={(e) => setItemPieceQuantity(Number(e.target.value))}
                      className="w-full p-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      min="1"
                      step="1"
                    />
                    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total Price: ₹{selectedItem.price * itemPieceQuantity}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Manual Number of Pieces</label>
                    <input
                      type="number"
                      value={manualPieces}
                      onChange={(e) => setManualPieces(Number(e.target.value))}
                      className="w-full p-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      min="1"
                      step="1"
                      placeholder="Enter number of pieces"
                    />
                    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total Price: ₹{selectedItem.price * manualPieces}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!useManualInput ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Weight (g)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={itemWeight}
                        onChange={(e) => setItemWeight(parseInt(e.target.value) || 0)}
                        className="flex-1 p-2 border-2 border-slate-200 rounded-l-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        min="100"
                        step="100"
                      />
                      <span className="bg-slate-100 px-3 py-2 border-2 border-l-0 border-slate-200 rounded-r-xl text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>g</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Price: ₹{calculatePriceByWeight(selectedItem, itemWeight)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Manual Weight (g)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={manualWeight}
                        onChange={(e) => setManualWeight(parseInt(e.target.value) || 0)}
                        className="flex-1 p-2 border-2 border-slate-200 rounded-l-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        min="1"
                        step="1"
                        placeholder="Enter weight in grams"
                      />
                      <span className="bg-slate-100 px-3 py-2 border-2 border-l-0 border-slate-200 rounded-r-xl text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>g</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Price: ₹{calculatePriceByWeight(selectedItem, manualWeight)}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCustomerForm(false)} className="flex-1 py-2 px-4 bg-slate-500 text-white hover:bg-slate-600 transition rounded-xl" style={{ fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => handleConfirmAddToCart(selectedItem)} className="flex-1 py-2 px-4 bg-green-600 text-white hover:bg-green-700 transition rounded-xl" style={{ fontFamily: 'Inter, sans-serif' }}>🖨 Create Order & Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;