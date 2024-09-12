import { Get, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { sortableAttributes } from '../models';
import { DriverResponse } from '../models/response.model';
export default function GetDefaultDecorators() {
  const GetDefaultDecorators: Array<CombineDecoratorType> = [
    Get("/default"),
    SetMetadata('permissions', ["d41e39f3a"]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: DriverResponse }),
    ApiQuery({
      name: 'search',
      example: 'search by email,firstName,lastName etc',
      required: false,
    }),
    ApiQuery({
      name: 'orderBy',
      example: 'Field by which record will be ordered',
      required: false,
      enum: sortableAttributes,
    }),
    ApiQuery({
      name: 'orderType',
      example: 'Ascending(1),Descending(-1)',
      enum: [1, -1],
      required: false,
    }),
    ApiQuery({
      name: 'pageNo',
      example: '1',
      description: 'The pageNo you want to get e.g 1,2,3 etc',
      required: false,
    }),
  ];
  return CombineDecorators(GetDefaultDecorators);
}
