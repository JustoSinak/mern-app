import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetProductsQuery, useGetCategoriesQuery } from '../store/api/productsApi';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Filter, Grid, List } from 'lucide-react';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Get query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery({
    q,
    category,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page,
    limit: 20,
  });

  const { data: categoriesData } = useGetCategoriesQuery();

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          {q && (
            <p className="text-gray-600 mt-1">
              Search results for "{q}"
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-64 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={!category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="mr-2"
                  />
                  All Categories
                </label>
                {categoriesData?.data?.map((cat) => (
                  <label key={cat._id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={cat._id}
                      checked={category === cat._id}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="mr-2"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', newSortBy);
                  handleFilterChange('sortOrder', newSortOrder);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="sales-desc">Best Selling</option>
              </select>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {isLoadingProducts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {productsData?.pagination.total || 0} products found
                </p>
              </div>

              {/* Products */}
              {productsData?.data && productsData.data.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {productsData.data.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
              )}

              {/* Pagination */}
              {productsData?.pagination && productsData.pagination.pages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex space-x-2">
                    {Array.from({ length: productsData.pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
