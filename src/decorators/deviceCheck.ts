import { Get, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { DriverResponse } from '../models/response.model';

export default function DeviceCheckDecorators() {
  const DeviceCheckDecorators: Array<CombineDecoratorType> = [
    Get('/loggedDevice'),
    SetMetadata('permissions', [DRIVER.LIST]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: DriverResponse }),
    ApiParam({
      name: 'id',
      description: 'The ID of the driver you want to get.',
    }),
  ];
  return CombineDecorators(DeviceCheckDecorators);
}