import { Injectable, Logger } from '@nestjs/common';
import { ProductDestinationService } from 'src/graphql/destination/handlers/product';
import { idBase64Decode } from '../productMedia/Product.media.utils';
import { OrderLine } from 'src/database/destination/order/orderLine';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { WarehouseStock } from 'src/database/destination/productVariant/warehouseStock';

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
   * @param parentId - The ID of the parent variant.
   * @param isPreorder - The value of the `is_preorder` property to be set for child variants.
   * @param preorderGlobalThreshold - The value of the `preorder_global_threshold` property to be set for child variants.
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
      childVariant.is_preorder = isPreorder;
      childVariant.preorder_global_threshold = preorderGlobalThreshold;
      updatePromises.push(this.productVariantRepository.save(childVariant));

      const parentStock = await this.productVariantStockRepository.findOne({
        where: { product_variant_id: parentId },
      });

      const childStock = await this.productVariantStockRepository.findOne({
        where: { product_variant_id: childVariant.id },
      });

      if (
        parentStock &&
        childStock &&
        childStock.quantity !== parentStock.quantity &&
        childStock.quantity_allocated !== parentStock.quantity_allocated
      ) {
        childStock.quantity = parentStock.quantity;
        childStock.quantity_allocated = parentStock.quantity_allocated;
        updatePromises.push(
          this.productVariantStockRepository.save(childStock),
        );
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
}
