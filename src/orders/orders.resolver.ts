import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  AddCartItemInput,
  CartItemType,
  CartType,
  CreateOrderInput,
  OrderType,
} from './dto/order.types';
import { OrdersService } from './orders.service';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  // ─── Cart ────────────────────────────────────────────────────────────────

  // All roles can manage their own cart
  @Query(() => CartType, { description: 'Get the current user cart' })
  async myCart(@CurrentUser() user: any): Promise<CartType> {
    return this.ordersService.getCart(user) as any;
  }

  @Mutation(() => CartItemType, { description: 'Add an item to the cart' })
  async addToCart(
    @CurrentUser() user: any,
    @Args('input') input: AddCartItemInput,
  ): Promise<CartItemType> {
    return this.ordersService.addToCart(user, input) as any;
  }

  @Mutation(() => CartItemType, { description: 'Remove an item from the cart' })
  async removeFromCart(
    @CurrentUser() user: any,
    @Args('cartItemId', { type: () => ID }) cartItemId: string,
  ): Promise<CartItemType> {
    return this.ordersService.removeFromCart(user, cartItemId) as any;
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  // All roles can create an order (add food items)
  @Mutation(() => OrderType, { description: 'Create a new order with food items' })
  async createOrder(
    @CurrentUser() user: any,
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderType> {
    return this.ordersService.createOrder(user, input) as any;
  }

  // Only Admin and Manager can place (checkout & pay) an order
  @Roles(Role.ADMIN, Role.MANAGER)
  @Mutation(() => OrderType, { description: 'Place (checkout) an order using a payment method — Admin & Manager only' })
  async placeOrder(
    @CurrentUser() user: any,
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('paymentMethodId', { type: () => ID }) paymentMethodId: string,
  ): Promise<OrderType> {
    return this.ordersService.placeOrder(user, orderId, paymentMethodId) as any;
  }

  // Only Admin and Manager can cancel an order
  @Roles(Role.ADMIN, Role.MANAGER)
  @Mutation(() => OrderType, { description: 'Cancel a pending/placed order — Admin & Manager only' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<OrderType> {
    return this.ordersService.cancelOrder(user, orderId) as any;
  }

  @Query(() => [OrderType], { description: 'List all orders for the current user' })
  async myOrders(@CurrentUser() user: any): Promise<OrderType[]> {
    return this.ordersService.getMyOrders(user) as any;
  }

  @Query(() => OrderType, { nullable: true, description: 'Get a specific order by ID' })
  async order(
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrderType | null> {
    return this.ordersService.getOrder(user, id) as any;
  }
}
