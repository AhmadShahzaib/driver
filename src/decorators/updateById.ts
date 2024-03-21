import { Put, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiConsumes, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  ErrorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { DriverResponse } from '../models/response.model';

export default function UpdateByIdDecorators() {
  const UpdateByIdDecorators: Array<CombineDecoratorType> = [
    Put(':id'),
    SetMetadata('permissions', [DRIVER.EDIT]),
    ApiConsumes('multipart/form-data'),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: DriverResponse }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorType }),
    ApiParam({
      name: 'id',
      description: 'The ID of the driver you want to update.',
    }),
  ];
  return CombineDecorators(UpdateByIdDecorators);
}
