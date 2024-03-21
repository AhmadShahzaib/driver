import { Get, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { CoDriverResponse } from '../models';

export default function GetCoDriverDecorators() {
  const GetCoDriverDecorators: Array<CombineDecoratorType> = [
    Get(),
    SetMetadata('permissions', [DRIVER.CODRIVER]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK, type: CoDriverResponse }),
  ];
  return CombineDecorators(GetCoDriverDecorators);
}
