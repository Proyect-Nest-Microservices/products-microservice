import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma, PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { CreateProductDto, UpdateProductDto } from './dto';

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
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST
      })
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
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status:HttpStatus.NOT_FOUND
      })
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Producto no encontrado
        throw new RpcException({
          message: `Product with id ${id} not found`,
          status: HttpStatus.NOT_FOUND
        });
      } else {
        // Otros errores
        throw new RpcException({
          message: `An error occurred while trying to update the product: ${error.message}`,
          status: HttpStatus.INTERNAL_SERVER_ERROR
        });
      }
    }
  }

  async validateProduct(ids: number[]) {
    const idsSet = Array.from(new Set(ids));
    const products = await this.product.findMany({
      where: {
        id: { in: idsSet }
      }
    });

    if (products.length != idsSet.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST
      })
    }

    return products;
  }
}
