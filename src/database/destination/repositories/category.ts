import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from '../category';
import { ProductProduct } from '../product/product';

@Injectable()
export class ProductCategoryRepository {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly repository: Repository<ProductCategory>,
    @InjectRepository(ProductProduct)
    private readonly productRepository: Repository<ProductProduct>,
  ) {}

  /**
   * Fetches all categories in the same tree as the given categoryId.
   * @param categoryId The ID of the category.
   * @returns A Promise that resolves to an array of ProductCategory entities.
   * @throws Error if the category with the given ID is not found.
   */
  async fetchCategoriesInSameTree(
    categoryId: number,
  ): Promise<ProductCategory[]> {
    const category = await this.repository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    const query = this.repository
      .createQueryBuilder('category')
      .where('category.treeId = :treeId', { treeId: category.treeId })
      .getMany();

    return query;
  }

  /**
   * Fetches the total count of products for each category.
   * @param categoryIds An array of category IDs.
   * @returns A Promise that resolves to the total count of products.
   */
  async getProductCountForCategories(categoryIds: number[]): Promise<number> {
    let totalCount = 0;

    await Promise.all(
      categoryIds.map(async (categoryId) => {
        const count = await this.productRepository
          .createQueryBuilder('product')
          .where('product.category_id = :categoryId', { categoryId })
          .andWhere('product.metadata ->> :isMasterKey = :isMasterValue', {
            isMasterKey: 'isMaster',
            isMasterValue: 'true',
          })
          .getCount();

        totalCount += count;
      }),
    );

    return totalCount;
  }
}
