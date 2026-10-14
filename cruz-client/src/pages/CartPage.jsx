import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import { checkout, getMyCart } from '../api/cart.js';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { getMyCart().then(setCart).catch(() => setMessage('Could not load your cart.')); }, []);
  const total = cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0;
  const placeOrder = async () => { try { await checkout(); setCart({ ...cart, items: [] }); setMessage('Order placed. Status: processing.'); } catch (error) { setMessage(error.response?.data?.message || 'Could not place order.'); } };
  return <div className="mx-auto max-w-4xl p-6"><h1 className="text-3xl font-bold">Your Cart</h1>{message && <p className="mt-4 text-sm">{message}</p>}{cart?.items.length ? <><div className="mt-6 space-y-3">{cart.items.map((item) => <div key={item.product._id} className="flex justify-between border-b py-3"><span>{item.product.title} x {item.quantity}</span><strong>PHP {(item.product.price * item.quantity).toLocaleString()}</strong></div>)}</div><p className="mt-6 text-xl font-bold">Total: PHP {total.toLocaleString()}</p><Button onClick={placeOrder} variant="primary" className="mt-5">Proceed with Order</Button></> : <p className="mt-6">Your cart is empty.</p>}<div className="mt-5"><Button to="/orders">View Orders</Button></div></div>;
};
export default CartPage;