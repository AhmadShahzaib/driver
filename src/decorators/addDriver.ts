import { HttpStatus, Post, SetMetadata } from '@nestjs/common';

import { ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  GetOperationId,
  ErrorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { DriverResponse } from '../models/response.model';

export default function AddDecorators() {
  const AddDecorators: Array<CombineDecoratorType> = [
    Post('add'),
    SetMetadata('permissions', [DRIVER.ADD]),
    ApiConsumes('multipart/form-data'),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.CREATED, type: DriverResponse }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorType }),
    ApiOperation(GetOperationId('Driver', 'Register')),
  ];
  return CombineDecorators(AddDecorators);
}
