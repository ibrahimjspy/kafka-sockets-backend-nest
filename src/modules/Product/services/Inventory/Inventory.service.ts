import { Injectable, Logger } from '@nestjs/common';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';
import { idBase64Decode } from '../productMedia/Product.media.utils';
import { OrderLine } from 'src/database/destination/order/orderLine';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { WarehouseStock } from 'src/database/destination/productVariant/warehouseStock';
import { ProductDetailInterface } from 'src/graphql/destination/types/product';
import {
  CheckInColorType,
  CheckInInputType,
  VariantListType,
} from './Inventory.types';
import { Warehouse } from 'src/database/destination/warehouse';

@Injectable()
export class InventoryService {
  constructor(
    private readonly productDestinationApi: ProductDestinationService,
    @InjectRepository(OrderLine)
    private orderRepository: Repository<OrderLine>,
    @InjectRepository(ProductProductVariant)
    private productVariantRepository: Repository<ProductProductVariant>,
    @InjectRepository(WarehouseStock)
    private productVariantStockRepository: Repository<WarehouseStock>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  private readonly logger = new Logger(InventoryService.name);

  /**
   * Syncs the variant stock information of an order's child variants with their parent and neighbors.
   * If any of the promises is not successful, it rolls back the created products and returns the error that caused the failure.
   * @param orderId - The ID of the order.
   */
  public async inventorySync({ orderId }: { orderId: string }): Promise<void> {
    try {
      this.logger.log('Syncing inventory for orderId', orderId);
      const order_id = idBase64Decode(orderId);

      // Fetch order details
      const orderDetails = await this.orderRepository.find({
        where: {
          orderId: order_id,
        },
      });

      // Extract variant IDs from order details
      const variantIds = this.extractVariantIds(orderDetails);

      // Fetch child variants based on variant IDs
      const childVariants = await this.productVariantRepository.find({
        where: { id: In(variantIds) },
      });

      // Fetch parent variants based on parent IDs of child variants
      const parentVariantIds = childVariants.map(
        (child) => child.metadata.parentId,
      );
      const parentVariants = await this.productVariantRepository.find({
        where: {
          id: In(parentVariantIds),
        },
      });

      // Create a map of parent variant IDs to parent variants for easy access
      const parentVariantMap = new Map<number, ProductProductVariant>();
      parentVariants.forEach((parent) =>
        parentVariantMap.set(parent.id, parent),
      );

      const promises: Promise<any>[] = [];

      for (const childVariant of childVariants) {
        const parentVariant = parentVariantMap.get(
          childVariant.metadata.parentId,
        );

        if (!parentVariant) {
          continue;
        }

        const updatePromises: Promise<any>[] = [];

        // Update parent variant if necessary
        if (
          parentVariant.preorder_global_threshold !==
            childVariant.preorder_global_threshold ||
          parentVariant.is_preorder !== childVariant.is_preorder
        ) {
          parentVariant.preorder_global_threshold =
            childVariant.preorder_global_threshold;
          parentVariant.is_preorder = childVariant.is_preorder;
          updatePromises.push(
            this.productVariantRepository.save(parentVariant),
          );
        }

        // Fetch parent and child variant stocks
        const parentStockPromise = this.productVariantStockRepository.findOne({
          where: {
            product_variant_id: parentVariant.id,
          },
        });

        const childStockPromise = this.productVariantStockRepository.findOne({
          where: {
            product_variant_id: childVariant.id,
          },
        });

        const [parentStock, childStock] = await Promise.all([
          parentStockPromise,
          childStockPromise,
        ]);

        // Update parent variant stock if necessary
        if (
          parentStock &&
          childStock &&
          parentStock.quantity !== childStock.quantity &&
          parentStock.quantity_allocated !== childStock.quantity_allocated
        ) {
          parentStock.quantity = childStock.quantity;
          parentStock.quantity_allocated = childStock.quantity_allocated;
          updatePromises.push(
            this.productVariantStockRepository.save(parentStock),
          );
        }

        promises.push(...updatePromises);

        // Sync child variants with parent
        await this.syncChildVariantsWithParent(
          parentVariant.id,
          childVariant.is_preorder,
          childVariant.preorder_global_threshold,
        );
      }

      await Promise.all(promises);
      this.logger.log('Inventory syncing complete');
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Syncs the child variants with their parent variant based on the provided properties.
   * @param {number} parentId - The ID of the parent variant.
   * @param {boolean} isPreorder - The value of the `is_preorder` property to be set for child variants.
   * @param {number} preorderGlobalThreshold - The value of the `preorder_global_threshold` property to be set for child variants.
   * @returns {Promise<void>} A promise that resolves once the sync is complete.
   */
  async syncChildVariantsWithParent(
    parentId: number,
    isPreorder: boolean,
    preorderGlobalThreshold: number,
  ): Promise<void> {
    this.logger.log('Syncing child variants for parentId', parentId);

    const childVariants = await this.productVariantRepository.find({
      where: { metadata: { parentId } },
    });

    const updatePromises: Promise<any>[] = [];

    for (const childVariant of childVariants) {
      this.logger.log('Processing child variant', childVariant.id);

      childVariant.is_preorder = isPreorder;
      childVariant.preorder_global_threshold = preorderGlobalThreshold;
      updatePromises.push(this.productVariantRepository.save(childVariant));
      this.logger.log('Updated child variant', childVariant.id);

      const parentStock = await this.productVariantStockRepository.findOne({
        where: { product_variant_id: parentId },
      });

      const childStock = await this.productVariantStockRepository.findOne({
        where: { product_variant_id: childVariant.id },
      });

      if (!childStock) {
        const newStock: WarehouseStock = {
          warehouse_id: await this.getDefaultWarehouseId(),
          product_variant_id: childVariant.id,
          quantity: parentStock.quantity,
          id: undefined,
          quantity_allocated: 0,
        };

        await this.productVariantStockRepository.save(newStock);
        this.logger.log('Created new stock for child variant', childVariant.id);
        return;
      }

      if (
        parentStock &&
        childStock &&
        (childStock.quantity !== parentStock.quantity ||
          childStock.quantity_allocated !== parentStock.quantity_allocated)
      ) {
        childStock.quantity = parentStock.quantity;
        childStock.quantity_allocated = parentStock.quantity_allocated;
        updatePromises.push(
          this.productVariantStockRepository.save(childStock),
        );
        this.logger.log('Updated stock for child variant', childVariant.id);
      }
    }

    await Promise.all(updatePromises);
  }

  /**
   * Extracts variant IDs from an array of order lines.
   * @param {OrderLine[]} orderLines - The array of order lines.
   * @returns {number[]} - The array of variant IDs.
   */
  extractVariantIds(orderLines: OrderLine[]): number[] {
    const variantIds: number[] = [];

    for (const orderLine of orderLines) {
      if (orderLine.variantId) {
        variantIds.push(orderLine.variantId);
      }
    }

    return variantIds;
  }

  /**
   * Extracts a map with child and parentId from the given array of product variants.
   * @param {ProductProductVariant[]} productVariants - The array of product variants.
   * @returns {Map<number, number>} - The map with child and parentId.
   */
  extractChildParentMap(productVariants): Map<number, number> {
    const childParentMap = new Map();

    for (const productVariant of productVariants) {
      const child = productVariant.id;
      const parent = productVariant.metadata.parentId;

      if (parent !== undefined) {
        childParentMap.set(child, parent);
      }
    }

    return childParentMap;
  }

  /**
   * Checks in inventory synchronously for the specified products.
   * @param {CheckInInputType} checkInProducts - The products to check in.
   * @returns {Promise<void[]>} A promise that resolves to an array of child variant synchronization results.
   */
  async checkInInventorySync(
    checkInProducts: CheckInInputType,
  ): Promise<void[]> {
    const productDetail = await this.productDestinationApi.getProductDetails(
      checkInProducts.id,
    );
    const productVariantList = this.convertVariantsToList(productDetail);
    const updatedVariants = this.updatedVariantList(
      productVariantList,
      checkInProducts.variants,
    );
    await this.updateMasterVariants(updatedVariants);

    // Use `map` with `Promise.all` to execute child variant synchronization in parallel
    return Promise.all(
      productVariantList.map(async (parentVariant) => {
        await this.syncChildVariantsWithParent(
          parentVariant.id as number,
          false,
          0,
        );
      }),
    );
  }

  /**
   * Updates the master variants with the specified variant information.
   * @param {VariantListType[]} variants - The variants to update.
   * @returns {Promise<void>} A promise that resolves once the update is complete.
   */
  async updateMasterVariants(variants: VariantListType[]): Promise<void> {
    const updatePromises = variants.map(async (variant) => {
      const variantId = variant.id as number;

      // Update the variant information
      const updatedVariant: Partial<ProductProductVariant> = {
        id: variantId,
        is_preorder: false,
      };
      await this.productVariantRepository.update(variantId, updatedVariant);
      this.logger.log(`Updated variant ${variantId} information`);

      // Update the variant stock listing
      const variantStockListing =
        await this.productVariantStockRepository.findOne({
          where: {
            product_variant_id: variantId,
          },
        });
      if (!variantStockListing) {
        const newStock: WarehouseStock = {
          warehouse_id: await this.getDefaultWarehouseId(),
          product_variant_id: variantId,
          quantity: variant.quantity,
          id: undefined,
          quantity_allocated: 0,
        };
        await this.productVariantStockRepository.save(newStock);
        this.logger.log(`Created new stock for variant ${variantId}`);
        return;
      }
      const updatedStock: Partial<WarehouseStock> = {
        id: variantStockListing.id,
        product_variant_id: variantId,
        quantity: variant.quantity,
      };
      await this.productVariantStockRepository.update(
        variantStockListing.id,
        updatedStock,
      );
    });

    await Promise.all(updatePromises);
  }

  /**
   * Converts the variant data to a list of objects with specified keys.
   * @param {ProductDetailInterface} productDetail - The variant data to be converted.
   * @returns {VariantListType[]} The list of objects with the specified keys.
   */
  convertVariantsToList(
    productDetail: ProductDetailInterface,
  ): VariantListType[] {
    return productDetail.variants.map((variant) => {
      const { id, attributes, stocks } = variant;
      const getColorAttributeValue = (attrName: string) => {
        const attribute = attributes.find(
          (attr) => attr.attribute.name === attrName,
        );
        return attribute ? attribute.values[0].name : '';
      };
      const color = getColorAttributeValue('Color');
      const size = getColorAttributeValue('Size');
      const sku = getColorAttributeValue('sku');
      const quantity = stocks[0]?.quantity || 0;
      const quantityAllocated = stocks[0]?.quantityAllocated || 0;

      return {
        id,
        color,
        size,
        sku,
        quantity,
        quantityAllocated,
      };
    });
  }

  /**
   * Updates the quantity of existing variants based on new variants to be checked in.
   * @param oldVariants The existing list of variants.
   * @param newVariants The list of new variants to be checked in.
   * @returns The updated list of variants with quantities adjusted.
   */
  updatedVariantList(
    oldVariants: VariantListType[],
    newVariants: CheckInColorType[],
  ) {
    const variantMap = new Map<string, VariantListType>();

    // Create a map of existing variants based on color and size
    for (const variant of oldVariants) {
      const key = `${variant.color}_${variant.size}`;
      variantMap.set(key, variant);
    }

    // Update quantities of existing variants based on new variants
    for (const newVariant of newVariants) {
      const key = `${newVariant.color}_${newVariant.size}`;
      const existingVariant = variantMap.get(key);

      if (existingVariant) {
        existingVariant.id = Number(
          idBase64Decode(existingVariant.id as string),
        ) as number;
        existingVariant.quantity += newVariant.quantity;
      }
    }

    return oldVariants;
  }

  /**
   * Retrieves the ID of the default warehouse.
   * @returns {Promise<string>} The ID of the default warehouse.
   */
  async getDefaultWarehouseId(): Promise<string> {
    const { id } = await this.warehouseRepository.findOne({
      where: {
        name: 'Default Warehouse',
      },
    });

    return id;
  }
}
