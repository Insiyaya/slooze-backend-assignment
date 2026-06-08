import { registerEnumType } from '@nestjs/graphql';

export enum Country {
  INDIA = 'INDIA',
  AMERICA = 'AMERICA',
}

registerEnumType(Country, { name: 'Country' });
