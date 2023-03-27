import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AutoSyncDto {
  @ApiProperty({
    required: true,
    description: 'category you want to add against retailer',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({ required: true, description: 'b2b shop id of retailer' })
  @IsString()
  shopId: string;

  @ApiProperty({
    required: true,
    description: 'b2c store id for which products should be added against',
  })
  @IsString()
  storeId: string;
}
export interface GetProductsDto {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
  totalCount: number;
  edges: {
    node: {
      metadata: {
        key: string;
        value: string;
      }[];
      id: string;
      slug: string;
      category: {
        id: string;
      };
      attributes: {
        attribute: {
          name: string;
        };
        values: {
          name: string;
        }[];
      }[];
      variants: {
        id: string;
        sku: string;
        media: any[];
        stocks: {
          quantity: number;
        }[];
        channelListings: {
          costPrice: {
            amount: number;
          };
          price: {
            amount: number;
          };
        }[];
        attributes: {
          attribute: {
            name: string;
          };
          values: {
            name: string;
          }[];
        }[];
      }[];
      thumbnail: {
        url: string;
      };
      media: {
        url: string;
      }[];
      name: string;
      description: string;
    };
  }[];
}
