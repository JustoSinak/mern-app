import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../../store/api/productsApi';
import { useAddToCartMutation } from '../../store/api/cartApi';
import { useNotification } from '../../contexts/NotificationContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const { showNotification } = useNotification();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart({
        productId: product._id,
        quantity: 1,
      }).unwrap();

      showNotification('success', 'Added to cart', `${product.name} has been added to your cart`);
    } catch (error: any) {
      showNotification('error', 'Error', error?.data?.message || 'Failed to add item to cart');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const isOutOfStock = product.trackInventory && product.inventory <= 0 && !product.allowBackorder;

  return (
    <Link to={`/products/${product._id}`} className="group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1">
            {product.isFeatured && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Featured
              </span>
            )}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                Sale
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {renderStars(product.averageRating)}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                ({product.totalReviews})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            {product.trackInventory && (
              <span className="text-xs text-gray-500">
                {product.inventory} left
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
