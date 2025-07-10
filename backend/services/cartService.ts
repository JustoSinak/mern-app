import { Cart, Product } from '@/models';
import { AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { Types } from 'mongoose';
import { IAddToCartRequest } from '@/types/order';

export class CartService {
  /**
   * Get user cart
   */
  static async getCart(userId?: string, sessionId?: string) {
    try {
      if (!userId && !sessionId) {
        throw new AppError('User ID or session ID required', 400);
      }

      const filter = userId ? { userId } : { sessionId };
      
      let cart = await Cart.findOne(filter)
        .populate({
          path: 'items.productId',
          select: 'name price images inventory trackInventory allowBackorder status isVisible'
        })
        .populate({
          path: 'items.variantId'
        });

      if (!cart) {
        // Create new cart if it doesn't exist
        cart = new Cart(filter);
        await cart.save();
      }

      // Filter out items with deleted/inactive products
      const validItems = cart.items.filter((item: any) => {
        const product = item.productId;
        return product && product.status === 'active' && product.isVisible;
      });

      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.calculateTotals();
        await cart.save();
      }

      return cart;
    } catch (error) {
      logger.error('Error getting cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  static async addItem(
    productId: string,
    quantity: number,
    variantId?: string,
    userId?: string,
    sessionId?: string
  ) {
    try {
      if (!userId && !sessionId) {
        throw new AppError('User ID or session ID required', 400);
      }

      // Verify product exists and is available
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (product.status !== 'active' || !product.isVisible) {
        throw new AppError('Product is not available', 400);
      }

      // Check inventory
      if (product.trackInventory && !product.allowBackorder) {
        if (product.inventory < quantity) {
          throw new AppError(`Only ${product.inventory} items available in stock`, 400);
        }
      }

      // Get or create cart
      const cart = await this.getCart(userId, sessionId);

      // Add item to cart
      await cart.addItem(
        new Types.ObjectId(productId),
        quantity,
        variantId ? new Types.ObjectId(variantId) : undefined
      );

      await cart.save();

      // Return updated cart with populated items
      return await this.getCart(userId, sessionId);
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateItem(
    itemId: string,
    quantity: number,
    userId?: string,
    sessionId?: string
  ) {
    try {
      const cart = await this.getCart(userId, sessionId);

      await cart.updateItem(new Types.ObjectId(itemId), quantity);
      await cart.save();

      return await this.getCart(userId, sessionId);
    } catch (error) {
      logger.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItem(
    itemId: string,
    userId?: string,
    sessionId?: string
  ) {
    try {
      const cart = await this.getCart(userId, sessionId);

      await cart.removeItem(new Types.ObjectId(itemId));
      await cart.save();

      return await this.getCart(userId, sessionId);
    } catch (error) {
      logger.error('Error removing cart item:', error);
      throw error;
    }
  }

  /**
   * Clear cart
   */
  static async clearCart(userId?: string, sessionId?: string) {
    try {
      const cart = await this.getCart(userId, sessionId);

      await cart.clear();
      await cart.save();

      return cart;
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Merge guest cart with user cart
   */
  static async mergeCart(userId: string, guestSessionId: string) {
    try {
      // Get user cart and guest cart
      const [userCart, guestCart] = await Promise.all([
        this.getCart(userId),
        this.getCart(undefined, guestSessionId)
      ]);

      if (!guestCart || guestCart.items.length === 0) {
        return userCart;
      }

      // Merge guest cart items into user cart
      await userCart.mergeCarts(guestCart);
      await userCart.save();

      // Delete guest cart
      await Cart.findByIdAndDelete(guestCart._id);

      return userCart;
    } catch (error) {
      logger.error('Error merging carts:', error);
      throw error;
    }
  }

  /**
   * Get cart summary
   */
  static async getCartSummary(userId?: string, sessionId?: string) {
    try {
      const cart = await this.getCart(userId, sessionId);

      return {
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        itemCount: cart.items.length
      };
    } catch (error) {
      logger.error('Error getting cart summary:', error);
      throw error;
    }
  }

  /**
   * Validate cart items before checkout
   */
  static async validateCartForCheckout(userId?: string, sessionId?: string) {
    try {
      const cart = await this.getCart(userId, sessionId);

      if (cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      const validationErrors: string[] = [];

      // Check each item
      for (const item of cart.items) {
        const product = item.productId as any;

        // Check if product is still available
        if (!product || product.status !== 'active' || !product.isVisible) {
          validationErrors.push(`Product "${product?.name || 'Unknown'}" is no longer available`);
          continue;
        }

        // Check inventory
        if (product.trackInventory && !product.allowBackorder) {
          if (product.inventory < (item as any).quantity) {
            validationErrors.push(
              `Only ${product.inventory} items of "${product.name}" available in stock`
            );
          }
        }
      }

      if (validationErrors.length > 0) {
        throw new AppError(`Cart validation failed: ${validationErrors.join(', ')}`, 400);
      }

      return {
        valid: true,
        cart,
        summary: {
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
          itemCount: cart.items.length
        }
      };
    } catch (error) {
      logger.error('Error validating cart:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory for cart items
   */
  static async reserveInventory(cartId: string) {
    try {
      const cart = await Cart.findById(cartId).populate('items.productId');
      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const reservations: any[] = [];

      for (const item of cart.items) {
        const product = item.productId as any;
        const quantity = (item as any).quantity;

        if (product.trackInventory && !product.allowBackorder) {
          // Check and reserve inventory
          const updatedProduct = await Product.findByIdAndUpdate(
            product._id,
            { $inc: { inventory: -quantity } },
            { new: true }
          );

          if (!updatedProduct || updatedProduct.inventory < 0) {
            // Rollback previous reservations
            for (const reservation of reservations) {
              await Product.findByIdAndUpdate(
                reservation.productId,
                { $inc: { inventory: reservation.quantity } }
              );
            }
            throw new AppError(`Insufficient inventory for ${product.name}`, 400);
          }

          reservations.push({
            productId: product._id,
            quantity
          });
        }
      }

      return reservations;
    } catch (error) {
      logger.error('Error reserving inventory:', error);
      throw error;
    }
  }

  /**
   * Release reserved inventory
   */
  static async releaseInventory(reservations: any[]) {
    try {
      for (const reservation of reservations) {
        await Product.findByIdAndUpdate(
          reservation.productId,
          { $inc: { inventory: reservation.quantity } }
        );
      }
    } catch (error) {
      logger.error('Error releasing inventory:', error);
      // Don't throw error as this is cleanup
    }
  }
}
