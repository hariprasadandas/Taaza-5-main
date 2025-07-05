import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendOrderNotifications } from '../../../utils/notifications';
import { generateOrderId } from '../../../utils/orderUtils';

// ▼▼▼ NEW ICON COMPONENT ▼▼▼
const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

function Cart(props) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);

  const RAZORPAY_KEY_ID = 'rzp_test_Ty2fPZgb35aMIa';

  useEffect(() => {
    if (!authLoading && (!user || user.type !== 'customer')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const savedCart = localStorage.getItem('taazaCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  const updateQuantity = (id, weight, quantity) => {
    if (quantity <= 0) {
      removeItem(id, weight);
      return;
    }
    
    // MODIFIED: Check if requested quantity exceeds available stock (handles eggs correctly)
    const item = cartItems.find(item => item.id === id && item.weight === weight);
    if (item) {
        const product = products.find(p => p.id === id);
        if (product) {
                            if (item.category === 'eggs') {
                    // Stock check for eggs (in pieces)
                    if (quantity > (product.quantity || 0)) {
                        alert(`Insufficient stock! Only ${product.quantity || 0} pieces available.`);
                        return;
                    }
                } else {
                    // Stock check for other items (in kg)
                    const totalWeightInKg = (weight * quantity) / 1000;
                    if (totalWeightInKg > (product.quantity || 0)) {
                        alert(`Insufficient stock! Only ${product.quantity || 0} kg available.`);
                        return;
                    }
                }
        }
    }
    
    const updatedCart = cartItems.map(item => 
      item.id === id && item.weight === weight 
        ? { ...item, quantity } 
        : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('taazaCart', JSON.stringify(updatedCart));
  };

  const removeItem = (id, weight) => {
    const updated = cartItems.filter(item => !(item.id === id && item.weight === weight));
    setCartItems(updated);
    localStorage.setItem('taazaCart', JSON.stringify(updated));
  };

  // Helper function to calculate item price based on category
  const calculateItemPrice = (item) => {
    if (item.category === 'eggs') {
      const quantity = item.quantity;
      if (quantity === 6) return item.price6 || (item.pricePerEgg * 6) || 0;
      if (quantity === 12) return item.price12 || (item.pricePerEgg * 12) || 0;
      if (quantity === 30) return item.price30 || (item.pricePerEgg * 30) || 0;
      return (item.pricePerEgg || 0) * quantity;
    }
    return (item.price || 0) * item.quantity;
  };

  const total = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const sendSMS = async (phone, message, orderId, paymentId) => {
    try {
      // Use the new notification utility
      await sendOrderNotifications(
        phone, 
        orderId, 
        paymentId, 
        total, 
        cartItems, 
        user?.name
      );
      
      console.log('Order notifications sent successfully');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to checkout');
      return;
    }

    try {
      const total = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      
      const orderId = await generateOrderId();
      
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load.');
        return;
      }

      const orderRef = await addDoc(collection(db, 'orders'), {
        orderId: orderId,
        cart: cartItems,
        user: { name: user?.name, phone: user?.mobile, email: user?.email || '' },
        paymentId: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        fulfilled: false,
        source: 'online'
      });
      
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'Taaza Chicken',
        description: 'Order Payment',
        handler: async function (response) {
          console.log('Razorpay response:', response);
          const paymentId = response.razorpay_payment_id;
          const orderUpdate = {
            paymentId,
            status: 'paid'
          };
          if (response.razorpay_order_id) orderUpdate.razorpayOrderId = response.razorpay_order_id;
          if (response.razorpay_payment_id) orderUpdate.razorpayPaymentId = response.razorpay_payment_id;
          if (response.razorpay_signature) orderUpdate.razorpaySignature = response.razorpay_signature;
          
          try {
            await addDoc(collection(db, 'transactions'), {
              orderId: orderRef.id,
              orderNumber: orderId,
              transactionId: paymentId,
              amount: total,
              status: 'success',
              date: new Date(),
              customer: { name: user?.name, phone: user?.mobile, email: user?.email || '' },
              mode: 'Razorpay',
              user: user?.name || user?.email || 'Customer',
              cart: cartItems
            });
            await updateDoc(doc(db, 'orders', orderRef.id), orderUpdate);
            
            setCartItems([]);
            localStorage.removeItem('taazaCart');
            navigate(`/order-confirmation?orderId=${orderId}`);

            setTimeout(async () => {
              try {
                // MODIFIED: E-bill generation to handle eggs correctly
                const billHtml = `
                  <div style='font-family:sans-serif;padding:24px;'>
                    <h2 style='color:#27ae60;'>Tazza Chicken - E-Bill</h2>
                    <p><strong>Name:</strong> ${user?.name}</p>
                    <p><strong>Phone:</strong> ${user?.mobile}</p>
                    <p><strong>Email:</strong> ${user?.email || ''}</p>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Transaction ID:</strong> ${paymentId}</p>
                    <table border='1' cellpadding='8' cellspacing='0' style='margin-top:16px;width:100%;'>
                      <thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th>Price</th></tr></thead>
                      <tbody>
                        ${cartItems.map(item => `<tr><td>${item.name}</td><td>${item.category === 'eggs' ? '1 piece' : `${item.weight}g`}</td><td>${item.quantity}</td><td>₹${calculateItemPrice(item)}</td></tr>`).join('')}
                      </tbody>
                    </table>
                    <p style='margin-top:16px;'><strong>Total:</strong> ₹${total}</p>
                    <p style='margin-top:8px;'>Thank you for ordering from Tazza Chicken!</p>
                  </div>
                `;
                
                // PDF generation logic remains the same...

                // MODIFIED: Decrease product stock (handles eggs in pieces)
                for (const item of cartItems) {
                    const productRef = doc(db, 'products', item.id);
                    const productSnap = await getDoc(productRef);
                    if (productSnap.exists()) {
                        const currentStock = productSnap.data().quantity || 0;
                        let stockToDecrement;

                        if (item.category === 'eggs') {
                            stockToDecrement = item.quantity;
                        } else {
                            const totalWeightInGrams = item.weight * item.quantity;
                            stockToDecrement = totalWeightInGrams / 1000;
                        }
                        
                        const newStock = currentStock - stockToDecrement;
                        await updateDoc(productRef, { quantity: newStock < 0 ? 0 : newStock });
                    }
                }
                
                // Send SMS receipt to customer
                if (user?.mobile) {
                  // MODIFIED: SMS message to handle eggs correctly
                  const smsMessage = `Thank you for your order! Order ID: ${orderId}, Amount: ₹${total}, Items: ${cartItems.map(item => `${item.name} (${item.category === 'eggs' ? item.quantity + ' piece(s)' : (item.weight * item.quantity) + 'g'})`).join(', ')}. Payment ID: ${paymentId}`;
                  await sendSMS(user.mobile, smsMessage, orderId, paymentId);
                }
              } catch (error) {
                console.error('Error in post-payment processing:', error);
              }
            }, 0);
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error processing payment: ' + error.message);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email || '',
          contact: user?.mobile
        },
        theme: {
          color: '#27ae60'
        },
        modal: {
          ondismiss: function () {
            alert('Payment cancelled. Order is still pending.');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Order saving or payment failed! ' + (err.message || err));
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-green-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-100 rounded-2xl shadow-xl border border-yellow-200/50 p-8 text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl text-white">🛒</span>
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-4">Your Cart is Empty</h1>
            <p className="text-green-600 text-lg mb-8">Looks like you haven't added any items yet.</p>
            <Link 
              to="/" 
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🍗 Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 main-content">
      <div className="responsive-card responsive-p-4 sm:responsive-p-8 max-w-4xl mx-auto">
        <h1 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-center">Your Cart</h1>
        
        <div className="space-y-4 mb-6">
          {cartItems.map(item => (
            <div key={item.id + '-' + item.weight} className="bg-yellow-100 p-4 rounded-lg flex flex-row items-center gap-4 shadow-md border border-yellow-200/50">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-20 h-20 object-cover rounded shadow-sm flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="responsive-text-lg font-bold text-gray-800 mb-2">{item.name}</h3>
                {/* ▼▼▼ MODIFIED: Display 'piece' for eggs and 'g' for others ▼▼▼ */}
                <p className="responsive-text-sm text-yellow-800 mb-2">
                  {item.category === 'eggs' ? '1 piece' : `${item.weight}g`}
                </p>
                <p className="responsive-text-base text-gray-700 mb-3">
                  ₹{item.price} x {item.quantity} = <span className="font-semibold text-green-600">₹{calculateItemPrice(item)}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    className="w-7 h-7 flex items-center justify-center text-lg font-bold bg-black text-white rounded-md hover:bg-gray-800 transition touch-target disabled:opacity-50"
                    onClick={() => updateQuantity(item.id, item.weight, item.quantity - 1)} 
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="responsive-text-base font-medium text-gray-800 mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                  <button 
                    className="w-7 h-7 flex items-center justify-center text-lg font-bold bg-black text-white rounded-md hover:bg-gray-800 transition touch-target" 
                    onClick={() => updateQuantity(item.id, item.weight, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button 
                    className="w-8 h-8 flex items-center justify-center text-white bg-red-600 rounded-full hover:bg-red-700 transition ml-auto touch-target" 
                    onClick={() => removeItem(item.id, item.weight)}
                    aria-label="Remove item"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="responsive-card responsive-p-4 bg-white rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="responsive-text-xl font-bold text-green-800">Total:</span>
            <span className="responsive-text-xl font-bold text-green-600">₹{total}</span>
          </div>
        </div>
        
          <button 
          className="w-full responsive-btn bg-green-600 text-white hover:bg-green-700 transition font-semibold touch-target" 
            onClick={handleCheckout}
          >
          Proceed to Checkout
          </button>
      </div>
    </div>
  );
}

export default Cart;