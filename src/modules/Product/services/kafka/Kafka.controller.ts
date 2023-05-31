/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Inject, forwardRef } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ProductService } from '../../Product.service';
import { ProducerService } from './Kafka.producer.service';
import { ProducerRecord } from 'kafkajs';
import {
  KAFKA_BULK_PRODUCT_CREATE_TOPIC,
  KAFKA_CREATE_PRODUCT_BATCHES_TOPIC,
  KAFKA_CREATE_PRODUCT_COPIES_TOPIC,
  KAFKA_INVENTORY_SYNC_TOPIC,
  KAFKA_NEW_PRODUCT_SYNC_TOPIC,
  KAFKA_SAVE_PRODUCT_ES_MAPPINGS_TOPIC,
} from 'src/constants';
import { ProductMappingService } from '../productMapping/Product.mapping.service';
import { InventoryService } from '../Inventory/Inventory.service';

@Controller()
export class KafkaController {
  constructor(
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    private readonly kafkaProductService: ProducerService,
    private readonly productMappingService: ProductMappingService,
    private readonly inventoryService: InventoryService,
  ) {}
  private readonly logger = new Logger(KafkaController.name);

  @MessagePattern(KAFKA_CREATE_PRODUCT_BATCHES_TOPIC)
  autoSyncCreateBatches(@Payload() message) {
    try {
      return this.productService.createProductBatches(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @MessagePattern(KAFKA_BULK_PRODUCT_CREATE_TOPIC)
  autoSyncBulkCreate(@Payload() message) {
    try {
      return this.productService.createBulkProducts(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  @MessagePattern(KAFKA_CREATE_PRODUCT_COPIES_TOPIC)
  async autoSyncAddCopyProductsToShop(@Payload() message) {
    try {
      this.logger.log('Pushing product copies to shop');

      const addCopiesToShop =
        this.productService.autoSyncV2ProductsCreate(message);
      this.logger.log('Pushing product copies to shop called');

      return;
    } catch (error) {
      this.logger.error(error);
    }
  }

  @MessagePattern(KAFKA_INVENTORY_SYNC_TOPIC)
  async autoSyncInventorySync(@Payload() message) {
    try {
      this.logger.log('sync inventory kafka resolver called');

      const syncInventory = this.inventoryService.inventorySync(message);

      return;
    } catch (error) {
      this.logger.error(error);
    }
  }

  @MessagePattern(KAFKA_NEW_PRODUCT_SYNC_TOPIC)
  async autoSyncNewProductSync(@Payload() message) {
    try {
      this.logger.log('sync new product kafka resolver called');

      const syncProduct = this.productService.handleNewProductCDC(message);

      return;
    } catch (error) {
      this.logger.error(error);
    }
  }

  pushProductBatch(@Payload() message: ProducerRecord) {
    try {
      this.logger.log('Pushing product batch to create');
      return this.kafkaProductService.produce(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  createProductBatches(@Payload() message: ProducerRecord) {
    try {
      return this.kafkaProductService.produce(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  pushProductCopiesToShop(@Payload() message: ProducerRecord) {
    try {
      return this.kafkaProductService.produce(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  pushElasticSearchMappings(@Payload() message: ProducerRecord) {
    try {
      return this.kafkaProductService.produce(message);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
