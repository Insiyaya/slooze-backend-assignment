import { registerEnumType } from '@nestjs/graphql';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PaymentType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  UPI = 'UPI',
  NET_BANKING = 'NET_BANKING',
}

registerEnumType(PaymentType, { name: 'PaymentType' });

@InputType()
export class AddPaymentMethodInput {
  @Field(() => PaymentType)
  @IsEnum(PaymentType)
  type: PaymentType;

  @Field()
  @IsString()
  provider: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  last4?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@InputType()
export class UpdatePaymentMethodInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => PaymentType, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  provider?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@ObjectType()
export class PaymentMethodType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => PaymentType)
  type: PaymentType;

  @Field()
  provider: string;

  @Field({ nullable: true })
  last4?: string;

  @Field()
  isDefault: boolean;

  @Field()
  createdAt: Date;
}
