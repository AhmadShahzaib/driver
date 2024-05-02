import { Delete, HttpStatus, SetMetadata } from '@nestjs/common';

import { ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

import {
  CombineDecorators,
  CombineDecoratorType,
  DRIVER,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function DeleteDecorators() {
  const DeleteDecorators: Array<CombineDecoratorType> = [
    Delete(':id'),
    SetMetadata('permissions', [DRIVER.DEACTIVATE]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK }),
    ApiParam({
      name: 'id',
      description: 'The ID of the driver you want to delete.',
    }),
  ];
  return CombineDecorators(DeleteDecorators);
}
