import { registerEnumType } from '@nestjs/graphql';
import { Field, Float, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

// ─── Enum ─────────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'PENDING',
  PLACED = 'PLACED',
  CANCELLED = 'CANCELLED',
  DELIVERED = 'DELIVERED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

// ─── Input Types ──────────────────────────────────────────────────────────────

@InputType()
export class OrderItemInput {
  @Field(() => ID)
  @IsUUID()
  menuItemId: string;

  @Field()
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsUUID()
  restaurantId: string;

  @Field(() => [OrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

@InputType()
export class AddCartItemInput {
  @Field(() => ID)
  @IsUUID()
  menuItemId: string;

  @Field()
  @IsInt()
  @Min(1)
  quantity: number;
}

// ─── Object Types ─────────────────────────────────────────────────────────────

@ObjectType()
export class OrderItemType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  menuItemId: string;

  @Field()
  quantity: number;

  @Field(() => Float)
  unitPrice: number;
}

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  restaurantId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => ID, { nullable: true })
  paymentMethodId?: string;

  @Field(() => [OrderItemType])
  items: OrderItemType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CartItemType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  menuItemId: string;

  @Field()
  quantity: number;
}

@ObjectType()
export class CartType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [CartItemType])
  items: CartItemType[];
}
