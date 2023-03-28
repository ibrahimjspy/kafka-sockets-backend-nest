import { Injectable, Logger } from '@nestjs/common';
import { ProductMappingsDto } from './Product.mapping.types';
import axios from 'axios';
import {
  MAPPING_MAPPING_TOKEN,
  MAPPING_SERVICE_URL,
} from '../../../../constants';

@Injectable()
export class ProductMappingService {
  private readonly logger = new Logger(ProductMappingService.name);

  public async storeBulkMappings(mappingsList: ProductMappingsDto[]) {
    try {
      const addProductMapping = await axios.post(
        MAPPING_SERVICE_URL,
        JSON.stringify(mappingsList),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer private-${MAPPING_MAPPING_TOKEN}`,
          },
        },
      );
      return addProductMapping.data;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
