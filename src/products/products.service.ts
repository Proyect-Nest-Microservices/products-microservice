import { Injectable, Logger, NotFoundException, OnModuleInit, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { extend } from 'joi';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService')

  onModuleInit() {
    this.$connect()
    this.logger.log('DataBase connected')
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    })
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto
    
    const totalProducts = await this.product.count({where:{available:true}});
    const lastPage = Math.ceil(totalProducts / limit);

    return {
      data: await this.product.findMany({
        where:{available:true},
        skip:(page-1)*limit,
        take: limit
      }),
      meta: {
        total: totalProducts,
        page: page,
        lastPage:lastPage
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available:true }
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`)
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    try {
      const { id: __, ...data } = updateProductDto;
      
      return await this.product.update({
        where: { id },
        data: updateProductDto
      })
    } catch (error) {
      throw new NotFoundException(`Product with id ${id} not found`)
    }

  }

  async remove(id: number) {
    try {
      
      return await this.product.update({
        where: { id },
        data: {
          available:false
        }
      })
    } catch (error) {
      throw new NotFoundException(`Product with id ${id} not found ${error}`)

    }
  }
}
