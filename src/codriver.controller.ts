import {
  Controller,
  InternalServerErrorException,
  Logger,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import GetCoDriverDecorators from './decorators/coDrivers';
import { CoDriverResponse } from './models';
import { Response } from 'express';

@Controller('codrivers')
@ApiTags('CoDriver')
export class CodriverController {
  constructor(private readonly appService: AppService) {}

  @GetCoDriverDecorators()
  async getCoDrivers(@Res() res: Response) {
    try {
      const coDriver = await this.appService.findCoDriver();
      const resultData: CoDriverResponse[] = coDriver.map(
        (cod) => new CoDriverResponse(cod),
      );
      if (resultData) {
        return res.status(200).send({
          message: 'CoDrivers retrieved successfully',
          data: resultData,
        });
      }
    } catch (error) {
      Logger.log('Error Logged in getting the coDrivers of Driver Controller');
      Logger.error(error.message, error.stack);
      throw new InternalServerErrorException('Error while get coDrivers');
    }
  }
}
