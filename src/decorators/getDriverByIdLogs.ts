import { Get, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { DriverResponse } from '../models/response.model';

export default function GetByIdDecoratorsLogs() {
  const GetByIdDecoratorsLogs: Array<CombineDecoratorType> = [
    Get('driverForLogs'),
    SetMetadata('permissions', ["d41e39f3a"]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: DriverResponse }),
    ApiQuery({
      name: 'id',
      description: 'The ID of the driver you want to get.',
    }),
  ];
  return CombineDecorators(GetByIdDecoratorsLogs);
}
