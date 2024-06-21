import {
  Controller,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import GetCoDriverDecorators from './decorators/coDrivers';
import {
  CoDriverResponse,
  DriverResponse,
  searchableAtrributes,
  searchableIds,
  sortableAttributes,
} from './models';
import { Request, Response } from 'express';
import DriverDocument from 'mongoDb/document/document';
import { FilterQuery, Types } from 'mongoose';
import {
  ListingParams,
  ListingParamsValidationPipe,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { isActiveinActive } from 'utils/active';
import moment from 'moment';

@Controller('codrivers')
@ApiTags('CoDriver')
export class CodriverController {
  constructor(private readonly appService: AppService) {}

  @GetCoDriverDecorators()
  async getCoDrivers(
    @Query(new ListingParamsValidationPipe()) queryParams: ListingParams,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const { tenantId: id, timeZone } =
        request.user ?? ({ tenantId: undefined } as any);
      const options: FilterQuery<DriverDocument> = {};
      const { search, orderBy, orderType, pageNo, limit } = queryParams;
      let isActive = queryParams?.isActive;
      const arr = [];
      arr.push(isActive);
      if (arr.includes('true')) {
        isActive = true;
      } else {
        isActive = false;
      }
      if (search) {
        options['$or'] = [];
        if (Types.ObjectId.isValid(search)) {
          searchableIds.forEach((attribute) => {
            options['$or'].push({ [attribute]: new RegExp(search, 'i') });
          });
        }
        searchableAtrributes.forEach((attribute) => {
          options['$or'].push({ [attribute]: new RegExp(search, 'i') });
        });
        if (arr[0]) {
          options['$and'] = [];
          options['$and'] = [{ tenantId: id }];
          isActiveinActive.forEach((attribute) => {
            options.$and.push({ [attribute]: isActive });
          });
        }
      } else {
        if (arr[0]) {
          options['$or'] = [];
          isActiveinActive.forEach((attribute) => {
            options.$or.push({ [attribute]: isActive });
          });
        }
      }
      if (options.hasOwnProperty('$and')) {
        options['$and'].push({ tenantId: id });
      } else {
        options['$and'] = [{ tenantId: id }];
      }
      const query = this.appService.find(options);

      if (orderBy && sortableAttributes.includes(orderBy)) {
        query.collation({ locale: 'en' }).sort({ [orderBy]: orderType ?? 1 });
      } else {
        query.sort({ createdAt: 1 });
      }

      const total = await this.appService.count(options);
      let queryResponse;
      if (!limit || !isNaN(limit)) {
        query.skip(((pageNo ?? 1) - 1) * (limit ?? 10)).limit(limit ?? 10);
      }
      queryResponse = await query.exec();
      const driverList: DriverResponse[] = [];
      for (const driver of queryResponse) {
        let vehicle;
        const jsonUser = driver.toJSON();
        if (driver?.vehicleId) {
          vehicle = await this.appService.populateVehicle(
            driver.vehicleId.toString(),
          );
          if (vehicle.status === 200) {
            jsonUser.vehicleId = vehicle.data || null;

            if (
              jsonUser.coDriverId &&
              Object.keys(jsonUser.coDriverId).length > 0
            ) {
              const coDriver = new DriverResponse(jsonUser.coDriverId);
              coDriver.id = driver.coDriverId.id;
              jsonUser.coDriverId = coDriver;
            }
          }
        }
        const office = await this.appService.populateOffices(
          driver.homeTerminalAddress.toString(),
        );

        if (driver.id) {
          const unitInfo = await this.appService.populateUnit(driver.id);
          if (unitInfo.status === 200 && unitInfo.data.lastActivityDate) {
            jsonUser.lastActivityDate = unitInfo.data.lastActivityDate;
            jsonUser.lastActivityDate = moment(
              unitInfo.data.meta.lastActivity.currentDate +
                unitInfo.data.meta.lastActivity.currentTime,
              'MMDDYYHHmmss',
            );
            jsonUser.deviceVersion = unitInfo.data.deviceVersion || '';
            jsonUser.eldType = unitInfo.data.eldType || '';
            jsonUser.deviceModel = unitInfo.data.deviceModel || '';
          }
        }
        if (timeZone?.tzCode) {
          jsonUser.createdAt = moment
            .tz(jsonUser.createdAt, timeZone?.tzCode)
            .format('DD/MM/YYYY h:mm a');
        }
        jsonUser.id = driver.id;
        jsonUser.homeTerminalAddress = office.data;

        driverList.push(new DriverResponse(jsonUser));

        // driverList.push(jsonUser);

        // else {
        //   console.log(`Checking total --------------- `, total);
        //   total = total - 1;
        // }
      }
      return response.status(HttpStatus.OK).send({
        data: driverList,
        total,
        pageNo: pageNo ?? 1,
        last_page: Math.ceil(
          total /
            (limit && limit.toString().toLowerCase() === 'all'
              ? total
              : limit ?? 10),
        ),
      });
    } catch (error) {
      Logger.log('Error Logged in getting the coDrivers of Driver Controller');
      Logger.error(error.message, error.stack);
      throw new InternalServerErrorException('Error while get coDrivers');
    }
  }
}
