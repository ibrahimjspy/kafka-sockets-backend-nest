import { Injectable } from '@nestjs/common';
import { AttributeAttributeValue } from 'src/database/destination/attributes';
import { AttributeAssignedProductAttribute } from 'src/database/destination/product/attributes/assignment';
import { ProductProductMedia } from 'src/database/destination/product/media';
import { ProductProduct } from 'src/database/destination/product/product';
import { AttributeAssignedVariantAttribute } from 'src/database/destination/productVariant/attributes/assignment';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';

@Injectable()
export class ProductCopyTransformerService {
  /**
   * Generates a slug for the product using a random unique string appended to the valid product name.
   * @param product The product to generate the slug for.
   * @returns The generated product slug.
   */
  public getProductSlug(product: ProductProduct): string {
    const uniqueString = (Math.random() + 1).toString(36).substring(7); // e.g., jce4r
    const validProductName = product.slug.replace(/\s+/g, '').toLowerCase();
    return `${validProductName}${uniqueString}`;
  }

  /**
   * Retrieves an array of master product IDs from the copied products.
   * @param copiedProducts The copied products.
   * @returns An array of master product IDs.
   */
  public getMasterProducts(copiedProducts: ProductProduct[]): number[] {
    return copiedProducts.map(
      (copiedProduct) => copiedProduct.metadata.parentId,
    );
  }

  /**
   * Retrieves an array of master product variant IDs from the copied product variants.
   * @param copiedProductVariants The copied product variants.
   * @returns An array of master product variant IDs.
   */
  public getMasterProductVariants(
    copiedProductVariants: ProductProductVariant[],
  ): number[] {
    return copiedProductVariants.map(
      (copiedProductVariant) => copiedProductVariant.metadata.parentId,
    );
  }

  /**
   * Retrieves an array of master product media IDs from the copied media.
   * @param copiedMedia The copied media.
   * @returns An array of master product media IDs.
   */
  public getMasterProductMedia(copiedMedia: ProductProductMedia[]): number[] {
    return copiedMedia.map((media) => media.oembed_data.parentId);
  }

  /**
   * Generates a mapping between original and copied product IDs.
   * @param copiedProducts The copied products.
   * @param key The key used to determine the type of mapping. Default is 'parent'.
   * @returns A mapping between original and copied product IDs.
   */
  public getProductMapping(
    copiedProducts: ProductProduct[],
    key = 'parent',
  ): Map<number, number> {
    const mapping: Map<number, number> = new Map();
    copiedProducts.map((copiedProduct) => {
      if (key === 'parent') {
        mapping.set(copiedProduct.metadata.parentId, copiedProduct.id);
      }
      mapping.set(copiedProduct.id, copiedProduct.metadata.parentId);
    });
    return mapping;
  }

  /**
   * Generates a mapping between original and copied product media IDs.
   * @param copiedMedia The copied media.
   * @returns A mapping between original and copied product media IDs.
   */
  public getProductMediaMapping(
    copiedMedia: ProductProductMedia[],
  ): Map<number, number> {
    const mapping: Map<number, number> = new Map();
    copiedMedia.map((media) => {
      mapping.set(media.oembed_data.parentId, media.id);
    });
    return mapping;
  }

  /**
   * Generates a mapping between original and copied product variant IDs.
   * @param copiedProductVariants The copied product variants.
   * @param key The key used to determine the type of mapping. Default is 'parent'.
   * @returns A mapping between original and copied product variant IDs.
   */
  public getProductVariantMapping(
    copiedProductVariants: ProductProductVariant[],
    key = 'parent',
  ): Map<number, number> {
    const mapping: Map<number, number> = new Map();
    copiedProductVariants.map((copiedProductVariant) => {
      if (key === 'parent') {
        mapping.set(
          copiedProductVariant.metadata.parentId,
          copiedProductVariant.id,
        );
      }
      mapping.set(
        copiedProductVariant.id,
        copiedProductVariant.metadata.parentId,
      );
    });
    return mapping;
  }

  /**
   * Generates a mapping between copied product variant IDs and their corresponding product IDs.
   * @param copiedProductVariants The copied product variants.
   * @returns A mapping between copied product variant IDs and their corresponding product IDs.
   */
  public getProductByVariantMapping(
    copiedProductVariants: ProductProductVariant[],
  ): Map<number, number> {
    const mapping: Map<number, number> = new Map();
    copiedProductVariants.map((copiedProductVariant) => {
      mapping.set(copiedProductVariant.id, copiedProductVariant.product_id);
    });
    return mapping;
  }

  /**
   * Generates a mapping between original and copied assignment IDs.
   * @param copiedProducts The copied products.
   * @param originalAssignments The original attribute assignments.
   * @param copiedAssignments The copied attribute assignments.
   * @returns A mapping between original and copied assignment IDs.
   */
  public getAssignmentIdsMapping(
    copiedProducts: ProductProduct[],
    originalAssignments: AttributeAssignedProductAttribute[],
    copiedAssignments: AttributeAssignedProductAttribute[],
  ): Map<number, number> {
    const productMapping = this.getProductMapping(copiedProducts, 'child');
    const masterAssignmentIdMapping: Map<string, number> = new Map();
    const assignmentIdsMapping: Map<number, number> = new Map();
    originalAssignments.map((assignment) => {
      masterAssignmentIdMapping.set(
        JSON.stringify([assignment.productId, assignment.assignmentId]),
        assignment.id,
      );
    });
    copiedAssignments.map((copiedAssignment) => {
      const masterProductId = productMapping.get(copiedAssignment.productId);
      const masterAssignmentId = masterAssignmentIdMapping.get(
        JSON.stringify([masterProductId, copiedAssignment.assignmentId]),
      );
      assignmentIdsMapping.set(masterAssignmentId, copiedAssignment.id);
    });
    return assignmentIdsMapping;
  }

  /**
   * Generates a mapping between original and copied variant assignment IDs.
   * @param copiedVariants The copied product variants.
   * @param originalAssignments The original attribute assignments.
   * @param copiedAssignments The copied attribute assignments.
   * @returns A mapping between original and copied variant assignment IDs.
   */
  public getVariantAssignmentIdsMapping(
    copiedVariants: ProductProductVariant[],
    originalAssignments: AttributeAssignedVariantAttribute[],
    copiedAssignments: AttributeAssignedVariantAttribute[],
  ): Map<number, number> {
    const productVariantMapping = this.getProductVariantMapping(
      copiedVariants,
      'child',
    );
    const masterAssignmentIdMapping: Map<string, number> = new Map();
    const assignmentIdsMapping: Map<number, number> = new Map();
    originalAssignments.map((assignment) => {
      masterAssignmentIdMapping.set(
        JSON.stringify([assignment.variantId, assignment.assignmentId]),
        assignment.id,
      );
    });
    copiedAssignments.map((copiedAssignment) => {
      const masterVariantId = productVariantMapping.get(
        copiedAssignment.variantId,
      );
      const masterAssignmentId = masterAssignmentIdMapping.get(
        JSON.stringify([masterVariantId, copiedAssignment.assignmentId]),
      );
      assignmentIdsMapping.set(masterAssignmentId, copiedAssignment.id);
    });
    return assignmentIdsMapping;
  }

  /**
   * Generates a mapping between slugs and copied attribute value IDs.
   * @param slugsMappings The mapping between original and copied slugs.
   * @param copiedValues The copied attribute values.
   * @returns A mapping between slugs and copied attribute value IDs.
   */
  public getValuesMapping(
    slugsMappings: Map<string, number>,
    copiedValues: AttributeAttributeValue[],
  ): Map<number, number> {
    const mapping: Map<number, number> = new Map();
    copiedValues.map((value) => {
      mapping.set(slugsMappings.get(value.slug), value.id);
    });
    return mapping;
  }
}
