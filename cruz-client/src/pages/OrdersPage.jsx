import { useEffect, useState } from 'react';
import { getMyOrders } from '../api/cart.js';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  useEffect(() => { getMyOrders().then(setOrders); }, []);
  return <div className="mx-auto max-w-4xl p-6"><h1 className="text-3xl font-bold">My Orders</h1><div className="mt-6 space-y-4">{orders.map((order) => <article key={order._id} className="rounded-xl border-2 border-zinc-900 bg-zinc-50 p-4"><div className="flex justify-between"><strong>Order {order._id.slice(-6)}</strong><span className="capitalize">{order.status}</span></div><p className="mt-2">Total: PHP {order.total.toLocaleString()}</p></article>)}</div>{orders.length === 0 && <p className="mt-6">No orders yet.</p>}</div>;
};
export default OrdersPage;