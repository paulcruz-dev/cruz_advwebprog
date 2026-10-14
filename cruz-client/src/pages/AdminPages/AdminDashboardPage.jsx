import { useEffect, useEffectEvent, useRef, useState } from 'react';
import api from '../../api/axiosInstance';
import Button from '../../components/Button.jsx';

const panel = 'rounded-2xl border-2 border-zinc-900 bg-zinc-50 p-5';
const input = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';
const emptyProduct = { name: '', title: '', category: '', supplier: '', price: '', stock: '', image: '', content: '' };

const AdminDashboardPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const previewUrl = useRef('');
  const [reviewEdits, setReviewEdits] = useState({});
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const responses = await Promise.all([
      api.get('/product?limit=100'), api.get('/category'), api.get('/supplier'),
      api.get('/order'), api.get('/review'), api.get('/user'),
    ]);
    setProducts(responses[0].data.products);
    setCategories(responses[1].data);
    setSuppliers(responses[2].data);
    setOrders(responses[3].data);
    setReviews(responses[4].data);
    setUsers(responses[5].data);
  };

  const loadDataOnMount = useEffectEvent(async () => {
    try {
      await loadData();
    } catch {
      setMessage('Could not load admin data.');
    }
  });

  useEffect(() => { loadDataOnMount(); }, []);
  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  const updateProductField = (event) => setProductForm({ ...productForm, [event.target.name]: event.target.value });

  const setProductImagePreview = (file, fallback = '') => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = file ? URL.createObjectURL(file) : '';
    setImagePreview(previewUrl.current || fallback);
  };

  const chooseProductImage = (event) => {
    const file = event.target.files?.[0] || null;
    setImageError('');
    if (file && file.size > 5 * 1024 * 1024) {
      setSelectedImage(null);
      setProductImagePreview(null, editingProduct?.image || '');
      setImageError('Image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSelectedImage(null);
      setProductImagePreview(null, editingProduct?.image || '');
      setImageError('Choose a JPEG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    setProductImagePreview(file, editingProduct?.image || '');
    setSelectedImage(file);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setImageError('');
    const payload = new FormData();
    Object.entries(productForm).forEach(([field, value]) => {
      if (field !== 'image') payload.append(field, value);
    });
    payload.set('content', JSON.stringify(productForm.content.split('\n').filter(Boolean)));
    if (selectedImage) payload.append('image', selectedImage);
    try {
      if (editingProduct) await api.put(`/product/${editingProduct._id}`, payload);
      else await api.post('/product', payload);
      setProductForm(emptyProduct);
      setEditingProduct(null);
      setSelectedImage(null);
      setProductImagePreview(null);
      setImageError('');
      setMessage('Product saved successfully.');
      await loadData();
    } catch (error) {
      const uploadError = error.response?.data?.message || 'Could not save product.';
      setImageError(uploadError);
      setMessage('Product could not be saved.');
    }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setSelectedImage(null);
    setProductImagePreview(null, product.image || '');
    setImageError('');
    setProductForm({ name: product.name, title: product.title, category: product.category?._id || '', supplier: product.supplier?._id || suppliers[0]?._id || '', price: product.price, stock: product.stock, image: '', content: product.content.join('\n') });
  };

  const changeOrderStatus = async (orderId, status) => { await api.patch(`/order/${orderId}/status`, { status }); await loadData(); };
  const saveReview = async (review) => { const edit = reviewEdits[review._id] || {}; await api.put(`/review/${review._id}`, { rating: Number(edit.rating ?? review.rating), comment: edit.comment ?? review.comment }); setMessage('Review updated successfully.'); await loadData(); };
  const updateUser = async (user) => { const name = window.prompt('Edit user name', user.name); if (name) { await api.put(`/user/${user._id}`, { name, email: user.email, role: user.role }); await loadData(); } };
  const toggleUser = async (user) => { await api.patch(`/user/${user._id}/active`, { isActive: !user.isActive }); await loadData(); };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
      <div><h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1><p className="mt-2 text-sm text-zinc-600">Manage products, orders, reviews, and customer accounts.</p></div>
      {message && <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <section className={panel}><h2 className="text-xl font-semibold">Product Management</h2><form onSubmit={saveProduct} className="mt-4 grid gap-3 md:grid-cols-3">
        {['name', 'title', 'price', 'stock'].map((field) => <input key={field} name={field} value={productForm[field]} onChange={updateProductField} placeholder={field} type={['price', 'stock'].includes(field) ? 'number' : 'text'} className={input} required />)}
        <label className={`${input} flex cursor-pointer flex-col justify-center gap-1`}>
          <span>{editingProduct ? 'Replace product image' : 'Product image'}</span>
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={chooseProductImage} className="text-xs" />
          <span className="text-xs text-zinc-500">JPEG, PNG, or WebP · up to 5 MB</span>
        </label>
        {imagePreview && <img src={imagePreview} alt="Product image preview" className="h-32 w-full rounded-lg border border-zinc-300 bg-white object-contain p-2" />}
        {imageError && <p role="alert" className="text-sm text-red-700 md:col-span-3">{imageError}</p>}
        <select name="category" value={productForm.category} onChange={updateProductField} className={input} required><option value="">Category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
        <select name="supplier" value={productForm.supplier} onChange={updateProductField} className={input} required><option value="">Supplier</option>{suppliers.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
        <textarea name="content" value={productForm.content} onChange={updateProductField} placeholder="Description paragraphs, one per line" className={`${input} md:col-span-2`} required />
        <Button type="submit" variant="primary">{editingProduct ? 'Save Product' : 'Create Product'}</Button>
      </form><div className="mt-6 space-y-2">{products.map((product) => <div key={product._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 py-3"><span>{product.title} · PHP {product.price} · stock {product.stock}</span><Button onClick={() => startEditProduct(product)}>Edit</Button></div>)}</div></section>

      <section className={panel}><h2 className="text-xl font-semibold">Order Management</h2><div className="mt-4 space-y-3">{orders.length === 0 && <p>No orders yet.</p>}{orders.map((order) => <div key={order._id} className="border-t border-zinc-200 py-3"><div className="flex flex-wrap justify-between gap-2"><span>Order {order._id.slice(-6)} · {order.user?.name || 'Customer'} · PHP {order.total.toLocaleString()}</span><strong className="capitalize">{order.status.replaceAll('_', ' ')}</strong></div><div className="mt-2 flex gap-2"><Button onClick={() => changeOrderStatus(order._id, 'confirmed')}>Confirm Order</Button><Button onClick={() => changeOrderStatus(order._id, 'ready_for_claiming')}>Ready for Claiming</Button></div></div>)}</div></section>

      <section className={panel}><h2 className="text-xl font-semibold">Review Management</h2><div className="mt-4 space-y-3">{reviews.length === 0 && <p>No reviews yet.</p>}{reviews.map((review) => <div key={review._id} className="border-t border-zinc-200 py-3"><p className="font-semibold">{review.product?.title} · {review.user?.name || 'Customer'}</p><div className="mt-2 grid gap-2 md:grid-cols-[6rem_1fr_auto]"><input className={input} type="number" min="1" max="5" value={reviewEdits[review._id]?.rating ?? review.rating} onChange={(event) => setReviewEdits({ ...reviewEdits, [review._id]: { ...reviewEdits[review._id], rating: event.target.value } })} /><input className={input} value={reviewEdits[review._id]?.comment ?? review.comment} onChange={(event) => setReviewEdits({ ...reviewEdits, [review._id]: { ...reviewEdits[review._id], comment: event.target.value } })} /><Button onClick={() => saveReview(review)}>Save Review</Button></div></div>)}</div></section>

      <section className={panel}><h2 className="text-xl font-semibold">User Management</h2><div className="mt-4 space-y-2">{users.map((user) => <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 py-3"><span>{user.name} · {user.email} · <strong>{user.isActive ? 'Active' : 'Inactive'}</strong></span><div className="flex gap-2"><Button onClick={() => updateUser(user)}>Edit User</Button><Button onClick={() => toggleUser(user)}>{user.isActive ? 'Set Inactive' : 'Set Active'}</Button></div></div>)}</div></section>
    </div>
  );
};

export default AdminDashboardPage;
