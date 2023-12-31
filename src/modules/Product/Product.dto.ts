import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator';

export class ProductIdDto {
  @ApiProperty({ required: true })
  @IsString()
  productId: string;
}
export class ImportBulkCategoriesDto {
  @ApiProperty({
    required: true,
    description: 'list of categories you want to sync ',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  categoryIds: string[];

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

export class DeActivateAutoSyncDto {
  @ApiProperty({
    required: false,
    description: 'email against which you have created storefront',
  })
  @IsOptional()
  email: string;

  @ApiProperty({ required: false, description: 'b2b shop id of retailer' })
  @IsOptional()
  shopId: string;

  @ApiProperty({
    required: false,
    description: 'b2c store id for which products should be added against',
  })
  @IsOptional()
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
      channelListings: {
        isAvailableForPurchase: boolean;
      }[];
      category: {
        id: string;
        ancestors: {
          edges: {
            node: {
              id: string;
              level: number;
              name: string;
            };
          }[];
        };
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
          warehouse: {
            id: string;
          };
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

export interface PaginationDto {
  hasNextPage: boolean;
  endCursor: string;
  first: number;
  totalCount: number;
  batchNumber: number;
}
