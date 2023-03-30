import { Injectable, Logger } from '@nestjs/common';
import { ProductMappingsDto } from './Product.mapping.types';
import axios from 'axios';
import {
  MAPPING_MAPPING_TOKEN,
  MAPPING_SERVICE_URL,
} from '../../../../constants';
import axiosRetry from 'axios-retry';
@Injectable()
export class ProductMappingService {
  private readonly logger = new Logger(ProductMappingService.name);

  /**
   * @description -- this method stores mapping in bulk in destination mapping service which we are currently using Elastic search
   * @warn -- this can crete mappings using falsy vales as well , because of how ES stores its documents
   */
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
      axiosRetry(axios, { retries: 3 });
      return addProductMapping.data;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
