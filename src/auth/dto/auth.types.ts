import { Field, ObjectType } from '@nestjs/graphql';
import { Country } from '../../common/enums/country.enum';
import { Role } from '../../common/enums/role.enum';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Role)
  role: Role;

  @Field(() => Country, { nullable: true })
  country?: Country;
}
