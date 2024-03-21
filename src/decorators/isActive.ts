import { HttpStatus, Patch, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { DriverResponse } from '../models/response.model';

export default function IsActiveDecorators() {
  const IsActiveDecorators: Array<CombineDecoratorType> = [
    Patch('/status/:id'),
    SetMetadata('permissions', [DRIVER.ACTIVATE]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: DriverResponse }),
  ];
  return CombineDecorators(IsActiveDecorators);
}
