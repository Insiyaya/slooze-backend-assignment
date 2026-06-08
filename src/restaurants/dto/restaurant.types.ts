import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Country } from '../../common/enums/country.enum';

@ObjectType()
export class MenuItemType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field()
  category: string;

  @Field()
  available: boolean;

  @Field(() => ID)
  restaurantId: string;
}

@ObjectType()
export class RestaurantType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  cuisine: string;

  @Field()
  address: string;

  @Field(() => Country)
  country: Country;

  @Field(() => Float)
  rating: number;

  @Field(() => [MenuItemType])
  menuItems: MenuItemType[];
}
