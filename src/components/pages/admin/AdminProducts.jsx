import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Toast from '../../Toast';

function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Add unitWeight for masalas, remove previous masala price fields
  const [form, setForm] = useState({ name: '', category: '', price: '', image: null, quantity: '', price6: '', price12: '', price30: '', unitWeight: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProduct, setDuplicateProduct] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError('Failed to load products. ' + (err.message || ''));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getInitialFormState = () => ({
    name: '', category: '', price: '', image: null, quantity: '',
    price6: '', price12: '', price30: '', unitWeight: ''
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, image: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // 1. Validate fields based on category
    let validationError = false;
    if (form.category === 'eggs') {
      if (!form.name || !form.category || !form.price6 || !form.price12 || !form.price30 || !form.quantity || (!form.image && !editingId)) {
        validationError = true;
      }
    } else if (form.category === 'masalas') {
      if (!form.name || !form.category || !form.price || !form.unitWeight || !form.quantity || (!form.image && !editingId)) {
        validationError = true;
      }
    } else {
      if (!form.name || !form.category || !form.price || !form.quantity || (!form.image && !editingId)) {
        validationError = true;
      }
    }
    
    if (validationError) {
      showToast("Please fill out all required product details, including the image.", "error");
      return;
    }

    // 2. Check for duplicate product name
    if (!editingId) {
      const productNameLower = form.name.toLowerCase().trim();
      if (products.some(p => p.name.toLowerCase().trim() === productNameLower)) {
        showToast("A product with this name already exists.", "error");
        return;
      }
    }
    
    try {
      let imageUrl = form.image; 
      
      const productData = {
        name: form.name,
        category: form.category,
        quantity: Number(form.quantity),
        imageUrl: imageUrl,
        ...(form.category === 'eggs' && {
          price6: Number(form.price6),
          price12: Number(form.price12),
          price30: Number(form.price30),
        }),
        ...(form.category === 'masalas' && {
          price: Number(form.price),
          unitWeight: Number(form.unitWeight)
        }),
        ...(!['eggs', 'masalas'].includes(form.category) && {
          price: Number(form.price)
        })
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        showToast("Product updated successfully", "success");
      } else {
        await addDoc(collection(db, 'products'), productData);
        showToast("Product added successfully", "success");
      }

      setForm(getInitialFormState());
      setEditingId(null);
    } catch (err) {
      showToast("Failed to save product. Please try again.", "error");
      console.error('Product save error:', err);
    }
  };

  const handleEdit = p => {
    setForm({
      name: p.name,
      category: p.category,
      price: p.price || '',
      image: p.imageUrl,
      quantity: p.quantity,
      price6: p.price6 || '',
      price12: p.price12 || '',
      price30: p.price30 || '',
      unitWeight: p.unitWeight || '' // Add unitWeight to edit form
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast("Product deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete product.", "error");
    }
  };

  const handlePriceEdit = (id, price) => {
    setEditingPriceId(id);
    setNewPrice(price);
  };

  const handlePriceSave = async (id) => {
    try {
      await updateDoc(doc(db, 'products', id), { price: Number(newPrice) });
      setEditingPriceId(null);
      setNewPrice('');
    } catch (err) {
      showToast("Failed to update price.", 'error');
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-7xl mx-auto">
        {/* ... Page Header ... */}
        
        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">...</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400" required />
            <select name="category" value={form.category} onChange={handleChange} className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400" required>
              <option value="" disabled>Select Category</option>
              <option value="chicken">Chicken</option>
              <option value="mutton">Mutton</option>
              <option value="goat">Goat</option>
              <option value="eggs">Eggs</option>
              <option value="masalas">Masalas</option>
            </select>
            
            {/* === Conditional Inputs for Categories === */}
            {form.category === 'eggs' ? (
              <>
                <input name="price6" value={form.price6} onChange={handleChange} placeholder="Price (₹) for 6 Eggs" type="number" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
                <input name="price12" value={form.price12} onChange={handleChange} placeholder="Price (₹) for 12 Eggs" type="number" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
                <input name="price30" value={form.price30} onChange={handleChange} placeholder="Price (₹) for 30 Eggs" type="number" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
                <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Total Eggs in Stock" type="number" min="0" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
              </>
            ) : form.category === 'masalas' ? (
              <>
                <input name="price" value={form.price} onChange={handleChange} placeholder="Price per piece (₹)" type="number" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
                <input name="unitWeight" value={form.unitWeight} onChange={handleChange} placeholder="Weight per piece (g)" type="number" min="0" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
                <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Stock (in pieces)" type="number" min="0" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
              </>
            ) : form.category ? ( // For chicken, mutton, etc.
              <>
                <input name="price" value={form.price} onChange={handleChange} placeholder="Price (₹/kg)" type="number" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
                <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Stock (kg)" type="number" min="0" className="p-3 border-2 border-slate-200 rounded-xl w-full" required />
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <input name="image" type="file" accept="image/*" onChange={handleChange} className="p-3 border-2 border-slate-200 rounded-xl w-full" />
            {form.image && <img src={form.image} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 shadow-sm" />}
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-slate-700" type="submit">{editingId ? 'Update' : 'Add'} Product</button>
            {editingId && <button type="button" className="px-6 py-3 text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50" onClick={() => { setForm(getInitialFormState()); setEditingId(null); }}>Cancel</button>}
          </div>
        </form>
        
        {/* Products List Section */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">...</h3>
          {loading ? ( <div className="text-center py-8">Loading...</div> ) : 
           products.length === 0 ? ( <div className="text-center py-8">No products available.</div> ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="group relative bg-yellow-100 rounded-2xl shadow-xl hover:shadow-2xl flex flex-col">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{product.name}</h4>
                    <p className="text-slate-600 text-sm">Category: <span className="font-medium text-slate-700">{product.category}</span></p>
                    
                    {/* === Conditional Card Display === */}
                    {product.category === 'eggs' ? (
                      <>
                        <p className="text-slate-600 text-sm">Price: <span className="font-medium text-slate-700">₹{product.price6} (6), ₹{product.price12} (12), ₹{product.price30} (30)</span></p>
                        <p className="text-slate-600 text-sm">Stock: <span className="font-medium text-slate-700">{product.quantity} eggs</span></p>
                      </>
                    ) : product.category === 'masalas' ? (
                       <>
                        <p className="text-slate-600 text-sm">
                          Price: <span className="font-bold text-lg text-slate-700">₹{product.price}</span> / {product.unitWeight}g (1-pcs)
                        </p>
                        <p className="text-slate-600 text-sm">
                          Stock: <span className="font-medium text-slate-700">{product.quantity} pieces</span>
                        </p>
                      </>
                    ) : ( // Default for chicken, mutton, etc.
                      <>
                        <div className="flex justify-between items-center mt-2">
                           <span className="font-bold text-lg text-slate-700">₹{product.price}/kg</span>
                           {editingPriceId !== product.id && <button onClick={() => handlePriceEdit(product.id, product.price)} className="bg-slate-200 text-slate-800 px-3 py-1 rounded-lg text-xs font-semibold">Edit Price</button>}
                        </div>
                        <p className="text-slate-600 text-sm">Stock: <span className="font-medium text-slate-700">{product.quantity} kg</span></p>
                      </>
                    )}

                    <div className="flex-grow" />

                    {editingPriceId === product.id && (
                      <div className="mt-4 space-y-2">
                        <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="New Price"/>
                        <div className="flex gap-2">
                          <button onClick={() => handlePriceSave(product.id)} className="flex-1 bg-slate-600 text-white px-3 py-1 rounded-lg text-sm">Save</button>
                          <button onClick={() => setEditingPriceId(null)} className="flex-1 bg-slate-400 text-white px-3 py-1 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    )}
                    
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                      <button onClick={() => handleEdit(product)} className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">Edit Details</button>
                      <button onClick={() => handleDelete(product.id)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* ... Duplicate Product Warning Modal ... */}
    </div>
  );
}

export default AdminProducts;