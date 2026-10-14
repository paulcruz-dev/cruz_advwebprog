import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import ProductList from '../../components/ProductList.jsx';
import { getCategories, getProducts } from '../../api/products.js';

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts({ search, category })
      .then(setProducts)
      .catch(() => setError('Products could not be loaded right now.'));
  }, [search, category]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const updateFilters = (nextSearch, nextCategory) => {
    const params = {};
    if (nextSearch) params.search = nextSearch;
    if (nextCategory) params.category = nextCategory;
    setSearchParams(params);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-zinc-900 bg-blue-900 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">
          Products
        </p>
        <h1 className="max-w-xl text-3xl font-bold leading-tight text-amber-300 sm:text-4xl">
          Shop campus essentials in a simple product grid
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-100 sm:text-base">
          Browse practical items for class, study, commute, and everyday campus routines.
        </p>
        <div className="mt-6">
          <Button to="/">Back Home</Button>
        </div>
      </section>

      <section className="border-y-2 border-zinc-900 bg-blue-900 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">
            Featured Products
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-amber-300">Products Available</h2>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              updateFilters(event.target.value, category);
            }}
            placeholder="Search products"
            aria-label="Search products"
            className="rounded-xl border-2 border-zinc-900 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none"
          />
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              updateFilters(search, event.target.value);
            }}
            aria-label="Filter products by category"
            className="rounded-xl border-2 border-zinc-900 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item._id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="text-zinc-100">{error}</p>
        ) : products.length === 0 && (search || category) ? (
          <p className="text-zinc-100">No products match your search.</p>
        ) : products.length === 0 ? (
          <p className="text-zinc-100">Loading products...</p>
        ) : (
          <ProductList products={products} />
        )}
      </section>
    </div>
  );
}

export default ProductListPage
