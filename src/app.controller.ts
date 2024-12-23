import { Login } from './models/driverLogin.model';
import {
  Controller,
  Body,
  Res,
  HttpStatus,
  Req,
  Param,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  Query,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import {
  ListingParams,
  MongoIdValidationPipe,
  MessagePatternResponseInterceptor,
  BaseController,
  ListingParamsValidationPipe,
  AwsService,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
// import { AWSService } from './shared/aws.service';

import { ApiTags } from '@nestjs/swagger';
import { isActiveinActive } from 'utils/active';
import { Response, Request, response } from 'express';
import {
  searchableAtrributes,
  sortableAttributes,
  searchableIds,
  DriverModel,
  EditDriverModel,
  EditDriverStatusModel,
  DriverResponse,
} from './models';
import { AppService } from './app.service';
import AddDecorators from './decorators/addDriver';
import DeleteDecorators from './decorators/deleteDriver';
import GetDecorators from './decorators/getDrivers';
import GetDefaultDecorators from './decorators/getDriversDefault';

import GetByIdDecorators from './decorators/getDriverById';
import GetByIdDecoratorsLogs from './decorators/getDriverByIdLogs';

import IsActiveDecorators from './decorators/isActive';
import UpdateByIdDecorators from './decorators/updateById';
import {
  addAndUpdateCodriver,
  addOrUpdate,
  addOrUpdateCoDriver,
} from './shared/addAndUpdate.validator';
import { addValidations } from './shared/add.validator';
import DeviceCheckDecorators from './decorators/deviceCheck';
import { MessagePattern } from '@nestjs/microservices';
import { DriverLoginResponse } from './models/driverLoginResponse.model';
import { ResetPasswordRequest } from './models/resetPasswordRequest.model';
import DriverDocument from 'mongoDb/document/document';
import { UnitData } from 'models/unitData';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { uploadDocument } from 'shared/documentUpload';
import { getDocuments } from 'shared/getDocuments';
import moment from 'moment-timezone';
import { DriverVehicleToUnitRequest } from 'models/driverVehicleRequest';
import { CoDriverUnitUpdateRequest } from 'models/coDriverUnitRequest';
@Controller('driver')
@ApiTags('Driver')
export class AppController extends BaseController {
  constructor(
    private readonly appService: AppService,
    private readonly awsService: AwsService, // private readonly awseService: AWSService,
  ) {
    super();
  }

  @UseInterceptors(MessagePatternResponseInterceptor)
  @MessagePattern({ cmd: 'get_driver_for_login' })
  async tcp_getLoginDriver(
    userLogin: Login,
  ): Promise<DriverLoginResponse | Error> {
    try {
      const {
        userName,
        password,
        tenantId,
        deviceToken,
        deviceType,
        deviceModel,
        allowLogin,
        deviceVersion,
      }: Login = userLogin;
      const driverLogin = await this.appService.login(
        userName,
        password,
        tenantId,
        deviceToken,
        deviceType,
        deviceModel,
        deviceVersion,
        allowLogin,
      );
      if (driverLogin.driverProfile) {
        const driverProfile = await getDocuments(driverLogin, this.appService);
        // driverLogin.driverProfile['imagePath'] = '';
      }
      if (driverLogin && Object.keys(driverLogin).length > 0) {
        Logger.log(`driver data get successfully`);
        return driverLogin;
      } else {
        Logger.log(`not find login Driver`);
        throw new NotFoundException(`driver not found`);
      }
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }

  @MessagePattern({ cmd: 'update_driver_device_token' })
  async tcp_updateDriver(data) {
    try {
      const updateDriver = await this.appService.updateDeviceToken(data);
      // driverLogin.driverProfile['imagePath'] = '';
      Logger.log(`driver data get successfully`);
      return updateDriver;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  @UseInterceptors(MessagePatternResponseInterceptor)
  @MessagePattern({ cmd: 'update_Unit' })
  async tcp_updateDriveUnitr(unit: UnitData): Promise<any | Error> {
    try {
      const { driverId, homeTerminalAddressId }: UnitData = unit;
      const unitsUpdate = await this.appService.updateUnitdata(
        driverId,
        homeTerminalAddressId,
      );
      if (unitsUpdate && Object.keys(unitsUpdate).length > 0) {
        Logger.log(`Unit data get successfully`);
        return unitsUpdate;
      } else {
        throw new NotFoundException(`Unit not update`);
      }
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }

  // // @AddDecorators()
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'driverDocument', maxCount: 10 },
  //     { name: 'profile', maxCount: 1 },
  //   ]),
  // )
  // async addDriver(
  //   @Body() driverModel: DriverModel,
  //   @UploadedFiles()
  //   files: {
  //     driverDocument: Express.Multer.File[];
  //     profile: Express.Multer.File;
  //   },
  //   @Res() response: Response,
  //   @Req() request: Request,
  // ) {
  //   console.log(files);
  //   const { email, vehicleId } = driverModel;
  //   const { tenantId } = (request.user as any) ?? { tenantId: undefined };
  //   driverModel.tenantId = tenantId;
  //   try {
  //     const option: FilterQuery<DriverDocument> = {
  //       $and: [{ isDeleted: false }],
  //       $or: [
  //         { email: { $regex: new RegExp(`^${driverModel.email}`, 'i') } },
  //         { phoneNumber: driverModel.phoneNumber },
  //         {
  //           licenseNumber: {
  //             $regex: new RegExp(`^${driverModel.licenseNumber}`, 'i'),
  //           },
  //         },
  //         { userName: { $regex: new RegExp(`^${driverModel.userName}`, 'i') } },
  //       ],
  //     };
  //     let vehicleDetails;
  //     if (driverModel.vehicleId) {
  //       option.$or.push({ vehicleId: driverModel.vehicleId });
  //       vehicleDetails = await this.appService.populateVehicle(
  //         driverModel.vehicleId,
  //       );
  //     }
  //     Logger.log(`validation when add Driver through addAndUpdate method`);
  //     const { requestedCoDriver } = await addAndUpdate(
  //       this.appService,
  //       driverModel,
  //       option,tenantId,
  //       vehicleDetails.data
  //     );
  //     let driverRequest = await uploadDocument(
  //       files?.driverDocument,
  //       files?.profile,
  //       this.appService,
  //       driverModel,
  //       tenantId,
  //     );
  //     if (!driverRequest) {
  //     }
  //     driverRequest.vehicles = [
  //       {
  //         id: vehicleDetails?.data?.id,
  //         vehicleId: vehicleDetails?.data?.vehicleId,
  //       },
  //     ];
  //     driverRequest.currentVehicle = vehicleDetails?.data?.vehicleId;

  //     if (!driverRequest.enableElog) {
  //       driverRequest['enableElog'] = request.body.enableElog;
  //     } else {
  //       driverRequest['enableElog'] = 'true';
  //     }

  //     const driverDoc = await this.appService.register(driverRequest);
  //     console.log('outside if\n\n');
  //     if (driverDoc && Object.keys(driverDoc).length > 0) {
  //       const office = await this.appService.populateOffices(
  //         driverDoc.homeTerminalAddress.toString(),
  //       );
  //       const resp = await this.appService.updateVehicleAssigned(
  //         vehicleId,
  //         driverDoc?.id,
  //         driverDoc?.coDriverId,
  //         driverDoc?.firstName,
  //         driverDoc?.lastName,
  //         driverDoc?.driverId,
  //         driverDoc?.licenseNumber,
  //         driverDoc?.trailerNumber,
  //         driverDoc?.userName,
  //         driverDoc?.state,
  //         office.data?.address,
  //         office.data?.headOffice,
  //         driverDoc.homeTerminalTimeZone,
  //         office.data.headOfficeId,
  //         office.data.id,
  //         driverDoc.cycleRule,
  //       );

  //       let model: DriverDocument = await getDocuments(
  //         driverDoc,
  //         this.appService,
  //       );
  //       const result: DriverResponse = new DriverResponse(model);
  //       if (requestedCoDriver && Object.keys(requestedCoDriver).length > 0) {
  //         Logger.log(
  //           `Want update CoDriver assignTo with driver id:${driverDoc.id}`,
  //         );
  //         const updateDriver = await requestedCoDriver.updateOne({
  //           assignTo: driverDoc.id,
  //           vehicleId: driverDoc.vehicleId,
  //         });
  //       }
  //       // add data of driver.
  //       //await addNewDriverLogs()
  //       Logger.log(`Driver created successfully`);
  //       return response.status(HttpStatus.CREATED).send({
  //         message: 'Driver has been created successfully',
  //         data: result,
  //       });
  //     } else {
  //       Logger.log(`Not Driver create`);
  //       throw new InternalServerErrorException(
  //         `unknown error while creating Driver`,
  //       );
  //     }

  //     // }
  //   } catch (error) {
  //     Logger.error({ message: error.message, stack: error.stack });
  //     throw error;
  //   }
  // }
  @GetByIdDecoratorsLogs()
  async getDriverByIdLogs(
    @Query('id', MongoIdValidationPipe) id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      Logger.log(`getDriverById was called with params: ${id}`);
      Logger.log(
        `${req.method} request received from ${req.ip} for ${
          req.originalUrl
        } by: ${!res.locals.user ? 'Unauthorized User' : res.locals.user.id}`,
      );
      let driver,
        offices,
        vehicle = null;

      if (id) {
        Logger.log(`find DriverById`);
        driver = await this.appService.findDriverById(id, true);
        Logger.log(`Driver with id: ${id} was found`);
      } else {
        Logger.debug(`Driver against id: ${id} not found`);
      }
      const unitData = await this.appService.getUnitById(id)
      if (driver && Object.keys(driver).length > 0) {
        if (driver.homeTerminalAddress) {
          Logger.log(`want to populate the Office`);
          offices = await this.appService.populateOffices(
            driver.homeTerminalAddress.toString(),
          );
          Logger.log(`populated office`);
          // log info/debug for office object, if it was found or not
        }
        if (driver.vehicleId) {
          Logger.log(`want to populate the vehicle from vehicle service`);
          vehicle = await this.appService.populateVehicle(
            driver.vehicleId.toString(),
          );
          Logger.log(`populated driver vehicle form vehicle address`);
          // log info/debug for office vehicle, if it was found or not
        }

        const driverJson = driver.toJSON();

        driverJson.vehicleId = vehicle?.data || null;
        driverJson.homeTerminalAddress = offices?.data || null;
        driverJson.id = driver?.id;
        if (
          driverJson.coDriverId &&
          Object.keys(driverJson.coDriverId).length > 0
        ) {
          const coDriver = new DriverResponse(driverJson.coDriverId);
          coDriver.id = driver.coDriverId.id;
          driverJson.coDriverId = coDriver;
        }
        const driverResponse: DriverResponse = new DriverResponse(driverJson);

        if (driverResponse) {
          driverResponse["meta"]= unitData?.data?.meta;
          Logger.log(`Driver found`);
          //log about the response that response is being sent
          return res.status(HttpStatus.OK).send({
            message: 'Driver found',
            data: driverResponse,
          });
        }
      } else {
        Logger.log(`Driver Not found with id:${id}`);
        throw new NotFoundException('Driver not found');
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  /**
   * Dynamic driver creation
   * farzan-driverbook
   */
  @AddDecorators()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'driverDocument', maxCount: 10 },
      { name: 'profile', maxCount: 1 },
    ]),
  )
  async addDriverDynamically(
    @Body() driverModel: DriverModel,
    @UploadedFiles()
    files: {
      driverDocument: Express.Multer.File[];
      profile: Express.Multer.File;
    },
    @Res() response: Response,
    @Req() request: Request,
  ) {
    const { tenantId } = (request.user as any) ?? { tenantId: undefined };
    driverModel.tenantId = tenantId;
    try {
      // QQuery object
      let option: FilterQuery<DriverDocument> = {
        $and: [{ tenantId: tenantId }],
        $or: [
          { email: { $regex: new RegExp(`^${driverModel.email}`, 'i') } },
          {
            licenseNumber: {
              $regex: new RegExp(`^${driverModel.licenseNumber}`, 'i'),
            },
          },
          { userName: { $regex: new RegExp(`^${driverModel.userName}`, 'i') } },
        ],
      };
      Logger.log(`Calling request data validator from addUsers`);
      let driver = await this.appService.findOne(option);
      await addValidations(driver, driverModel);

      // QQuery object for multi tenant wise check driverId
      option.$and = [
        { userName: { $regex: new RegExp(`^${driverModel.userName}`, 'i') } },
      ];
      option.$or = [{}];
      driver = await this.appService.findOne(option);
      if (driver) {
        throw new ConflictException(`Driver ID already exists`);
      }
      let vehicleDetails;
      if (driverModel.vehicleId === '') {
        delete driverModel.vehicleId;
      }
      if (driverModel.vehicleId) {
        option.$or.push({ vehicleId: driverModel.vehicleId });
        vehicleDetails = await this.appService.populateVehicle(
          driverModel.vehicleId,
        );
        vehicleDetails.data['assignedDrivers'] = JSON.parse(
          JSON.stringify(vehicleDetails?.data?.assignedDrivers),
        );
      }
      Logger.log(`validation when add Driver through addAndUpdate method`);
      const { requestedCoDriver } = await addOrUpdate(
        this.appService,
        driverModel,
        option,
      );
      const driverRequest = await uploadDocument(
        files?.driverDocument,
        files?.profile,
        this.appService,
        driverModel,
        tenantId,
      );
      driverRequest.vehicleId = driverModel.vehicleId
        ? driverModel.vehicleId
        : null;
      driverRequest.vehicles = [
        {
          id: vehicleDetails?.data?.id,
          vehicleId: vehicleDetails?.data?.vehicleId,
        },
      ];
      driverRequest.vehicles.forEach((vehicle, index) => {
        if (vehicle.id == null) {
          driverRequest.vehicles.splice(index, 1);
        }
      });
      driverRequest.currentVehicle = vehicleDetails?.data?.vehicleId || null;
      if (driver) {
        driverRequest['assignedVehicles'] = JSON.parse(
          JSON.stringify(driver['_doc'].assignedVehicles),
        );
      } else {
        driverRequest['assignedVehicles'] = [];
      }

      // storing vehicle assigned from day one
      if (driverModel.vehicleId) {
        let flag = false;
        if (driverRequest?.assignedVehicles?.length > 0)
          for (let i = 0; i < driverRequest.assignedVehicles.length; i++) {
            if (
              driverRequest.assignedVehicles[i].id === driverModel.vehicleId
            ) {
              flag = true;
            }
          }

        if (!flag) {
          driverRequest.assignedVehicles.push({
            id: vehicleDetails?.data?.id,
            vehicleId: vehicleDetails?.data?.vehicleId,
            vinNo: vehicleDetails?.data?.vinNo,
            date: (() => {
              const date = moment().format('YYYY-MM-DD');
              return date;
            })(),
          });
        }
      }

      if (!driverRequest.enableElog) {
        driverRequest['enableElog'] = request.body.enableElog;
      } else {
        driverRequest['enableElog'] = 'true';
      }
      const office = await this.appService.populateOffices(
        driverRequest.homeTerminalAddress.toString(),
      );
      driverRequest.homeTerminalAddress = office?.data?.id;
      // driverRequest.homeTerminalTimeZone = office?.data?.timeZone;

      if (requestedCoDriver) {
        driverRequest.assignTo =
          requestedCoDriver.firstName + ' ' + requestedCoDriver.lastName;
        driverRequest.coDriverId = requestedCoDriver.id;
      } else {
        driverRequest.assignTo = null;
      }
      const driverDoc = await this.appService.register(driverRequest);

      // For the main driver if vehicle exist then assigned driver to vechile
      if (vehicleDetails?.data) {
        await this.appService.assignDriverInAssignedVehicles(
          vehicleDetails?.data,
          {
            _id: driverDoc._id,
            email: driverDoc.email,
            userName: driverDoc.userName,
            phoneNumber: driverDoc.phoneNumber,
          },
        );
      }

      // For co driver vehicle assigment
      if (
        driverModel.coDriverId &&
        JSON.stringify(driverModel.isCoDriver) == 'true' &&
        driverModel.vehicleId
      ) {
        let flag = false;
        if (requestedCoDriver['_doc'].assignedVehicles.length > 0)
          for (
            let i = 0;
            i < requestedCoDriver['_doc'].assignedVehicles.length;
            i++
          ) {
            if (
              requestedCoDriver['_doc'].assignedVehicles[i].id ==
              vehicleDetails?.data.id
            ) {
              flag = true;
            }
          }

        if (!flag) {
          if (vehicleDetails?.data) {
            requestedCoDriver['_doc'].assignedVehicles.push({
              id: vehicleDetails?.data.id,
              vehicleId: vehicleDetails?.data.vehicleId,
              vinNo: vehicleDetails?.data.vinNo,
              date: (() => {
                const date = moment().format('YYYY-MM-DD');
                return date;
              })(),
            });
            await requestedCoDriver.save();

            // For the co driver if vehicle exist then assigned driver to vechile
            await this.appService.assignDriverInAssignedVehicles(
              vehicleDetails?.data,
              {
                _id: requestedCoDriver['_doc']._id,
                email: requestedCoDriver['_doc'].email,
                userName: requestedCoDriver['_doc'].userName,
                phoneNumber: requestedCoDriver['_doc'].phoneNumber,
              },
            );
          }
        }
      }

      console.log('outside if\n\n');
      if (driverDoc && Object.keys(driverDoc).length > 0) {
        console.log('inside if\n\n');
        let eldDetails;
        if (vehicleDetails?.data?.eldId) {
          eldDetails = await this.appService.populateEld(
            vehicleDetails?.data?.eldId,
          );
        }
        const unitData: DriverVehicleToUnitRequest = {
          driverId: driverDoc?._id || null,
          coDriverId: driverDoc?.coDriverId || null,
          cycleRule: driverDoc?.cycleRule || null,
          deviceSerialNo: eldDetails?.serialNo || '',
          deviceVendor: eldDetails?.vendor,
          driverFirstName: driverDoc?.firstName || '',
          driverLastName: driverDoc?.lastName || '',
          driverFullName: `${driverDoc?.firstName} ${driverDoc?.lastName}`,
          driverLicenseState: driverDoc?.state || '',
          driverUserName: driverDoc?.userName || '',
          driverLicense: driverDoc?.licenseNumber || '',
          manualDriverId: driverDoc?.driverId,
          driverEmail: driverDoc?.email || '',
          phoneNumber: driverDoc?.phoneNumber || '',
          vehicles: driverDoc?.vehicles,
          enableEld: driverDoc?.enableEld,
          enableElog: driverDoc?.enableElog,
          yardMove: driverDoc?.yardMove,
          personalConveyance: driverDoc?.personalConveyance,
          driverProfile: driverDoc?.driverProfile,
          deviceId: eldDetails?.id,
          eldNo: eldDetails?.eldNo,
          eldType: eldDetails?.deviceType,
          deviceVersion: eldDetails?.deviceVersion || '',
          deviceModel: eldDetails?.deviceName,
          headOffice: office?.data?.headOffice,
          headOfficeId: office.data.headOfficeId,
          homeTerminalAddress: driverDoc?.homeTerminalAddress,
          homeTerminalAddressId: office?.data?.id,
          homeTerminalTimeZone: driverDoc?.homeTerminalTimeZone,
          manualVehicleId: vehicleDetails?.data?.vehicleId,
          trailerNumber: driverDoc?.trailerNumber,
          vehicleId: vehicleDetails?.data?.id,
          vehicleLicensePlateNo: vehicleDetails?.data?.licensePlateNo,
          vehicleMake: vehicleDetails?.data?.make,
          vehicleVinNo: vehicleDetails?.data?.vinNo,
          tenantId: driverDoc?.tenantId || tenantId,
        };
        await this.appService.updateDriverUnit(unitData);

        const model: DriverDocument = await getDocuments(
          driverDoc,
          this.appService,
        );
        const result: DriverResponse = new DriverResponse(model);
        if (requestedCoDriver && Object.keys(requestedCoDriver).length > 0) {
          Logger.log(
            `Want update CoDriver assignTo with driver id:${driverDoc.id}`,
          );

          // Update Co driver with main driver
          await requestedCoDriver.updateOne({
            assignTo: driverDoc.firstName + ' ' + driverDoc.lastName,
            coDriverId: driverDoc.id,
            vehicleId: driverDoc.vehicleId,
            currentVehicle: driverDoc.currentVehicle,
          });

          const coDriverData: CoDriverUnitUpdateRequest = {
            driverId: requestedCoDriver.id,
            coDriverId: driverDoc._id,
            deviceId: eldDetails?.id || null,
            eldNo: eldDetails?.eldNo || null,
            deviceVersion: eldDetails?.deviceVersion || '',
            deviceModel: eldDetails?.deviceName || '',
            deviceSerialNo: eldDetails?.serialNo || '',
            deviceVendor: eldDetails?.vendor || null,
            manualVehicleId: vehicleDetails?.data?.vehicleId || null,
            vehicleId: vehicleDetails?.data?.id || null,
            vehicleLicensePlateNo: vehicleDetails?.data?.licensePlateNo || null,
            vehicleMake: vehicleDetails?.data?.make || null,
            vehicleVinNo: vehicleDetails?.data?.vinNo || null,
          };
          // Co Driver Unit update
          await this.appService.updateCoDriverUnit(coDriverData);
        }
        // add data of driver.
        // await addNewDriverLogs()
        Logger.log(`Driver created successfully`);
        return response.status(HttpStatus.CREATED).send({
          message: 'Driver has been created successfully',
          data: result,
        });
      } else {
        Logger.log(`Not Driver create`);
        throw new InternalServerErrorException(
          `unknown error while creating Driver`,
        );
      }

      // }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  @UpdateByIdDecorators()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'driverDocument', maxCount: 10 },
      { name: 'profile', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @UploadedFiles()
    files: {
      driverDocument: Express.Multer.File[];
      profile: Express.Multer.File;
    },
    @Body() editRequestData: EditDriverModel,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      Logger.log(`driver update was called with params: ${id}`);
      Logger.log(
        `${req.method} request received from ${req.ip} for ${
          req.originalUrl
        } by: ${
          !response.locals.user ? 'Unauthorized User' : response.locals.user.id
        }`,
      );
      const { tenantId } = (req.user as any) ?? { tenantId: undefined };
      //this check is if password is in editRequest payload but user have not requested to

      if (req.body.shouldUpdatePassword == 'false') {
        delete editRequestData.password;
      }

      const option: FilterQuery<DriverDocument> = {
        $or: [
          { email: { $regex: new RegExp(`^${editRequestData.email}`, 'i') } },
          {
            licenseNumber: {
              $regex: new RegExp(`^${editRequestData.licenseNumber}`, 'i'),
            },
          },
          {
            userName: {
              $regex: new RegExp(`^${editRequestData.userName}`, 'i'),
            },
          },
        ],
        $and: [{ _id: { $ne: id } }, { tenantId: tenantId }],
      };

      const driver = await this.appService.findOne({ _id: { $eq: id } });

      let vehicleDetails;
      if (editRequestData.vehicleId === '') {
        delete editRequestData.vehicleId;
      }

      if (editRequestData.vehicleId) {
        option.$or.push({ vehicleId: editRequestData.vehicleId });
        vehicleDetails = await this.appService.populateVehicle(
          editRequestData.vehicleId,
        );
        if (vehicleDetails.data && vehicleDetails.data?.assignedDrivers) {
          vehicleDetails.data['assignedDrivers'] = JSON.parse(
            JSON.stringify(vehicleDetails?.data.assignedDrivers),
          );
        }
      }
      const { requestedCoDriver } = await addAndUpdateCodriver(
        this.appService,
        editRequestData,
        option,
        id,
        vehicleDetails?.data,
        driver,
      );
      const driverRequest = await uploadDocument(
        files?.driverDocument,
        files?.profile,
        this.appService,
        editRequestData,
        tenantId,
      );

      driverRequest.vehicleId = editRequestData.vehicleId
        ? editRequestData.vehicleId
        : null;
      driverRequest.vehicles = [
        {
          id: vehicleDetails?.data?.id,
          vehicleId: vehicleDetails?.data?.vehicleId,
        },
      ];
      driverRequest.vehicles.forEach((vehicle, index) => {
        if (vehicle.id == null) {
          driverRequest.vehicles.splice(index, 1);
        }
      });
      driverRequest.currentVehicle =
        vehicleDetails?.data?.vehicleId || driverRequest.currentVehicle || null;
      if (driver) {
        driverRequest['assignedVehicles'] = JSON.parse(
          JSON.stringify(driver['_doc'].assignedVehicles),
        );
        // driverRequest['currentVehicle'] = vehicleDetails?.data
      } else {
        driverRequest['assignedVehicles'] = [];
      }

      // storing vehicle assigned from day one
      if (driverRequest.vehicleId) {
        let flag = false;
        if (driverRequest?.assignedVehicles?.length > 0)
          for (let i = 0; i < driverRequest.assignedVehicles.length; i++) {
            if (
              driverRequest.assignedVehicles[i].id === driverRequest.vehicleId
            ) {
              flag = true;
            }
          }

        if (!flag) {
          driverRequest.assignedVehicles.push({
            id: vehicleDetails?.data?.id,
            vehicleId: vehicleDetails?.data?.vehicleId,
            vinNo: vehicleDetails?.data?.vinNo,
            date: (() => {
              const date = moment().format('YYYY-MM-DD');
              return date;
            })(),
          });
        }
      }

      if (!driverRequest.enableElog) {
        driverRequest['enableElog'] = req.body.enableElog;
      } else {
        driverRequest['enableElog'] = 'true';
      }
      const office = await this.appService.populateOffices(
        driverRequest.homeTerminalAddress.toString(),
      );
      // driverRequest.homeTerminalAddress = office?.data;
      // driverRequest.homeTerminalTimeZone = office?.data?.timeZone;
      const driverDoc = await this.appService.updateDriver(id, driverRequest);
      // if (isCodriverUpdated) {
      //   const oldCoDriver = await (
      //     await this.appService.findOne({ assignTo: driverDoc.id })
      //   )?.updateOne({ assignTo: null });
      //   await requestedCoDriver.updateOne({ assignTo: driverDoc.id });
      //   // editRequestData.coDriverId = driverDoc.id;
      // }

      // For co driver vehcile assignment
      if (
        editRequestData.coDriverId &&
        editRequestData.isCoDriver == 'true' &&
        editRequestData.vehicleId
      ) {
        let flag = false;
        if (requestedCoDriver) {
          if (requestedCoDriver['_doc'].assignedVehicles.length > 0)
            for (
              let i = 0;
              i < requestedCoDriver['_doc'].assignedVehicles.length;
              i++
            ) {
              if (
                requestedCoDriver['_doc'].assignedVehicles[i].id ==
                vehicleDetails?.data.id
              ) {
                flag = true;
              }
            }

          if (!flag) {
            if (vehicleDetails?.data) {
              requestedCoDriver['_doc'].assignedVehicles.push({
                id: vehicleDetails?.data.id,
                vehicleId: vehicleDetails?.data.vehicleId,
                vinNo: vehicleDetails?.data.vinNo,
                date: (() => {
                  const date = moment().format('YYYY-MM-DD');
                  return date;
                })(),
              });
              await requestedCoDriver.save();
            }
            await this.appService.assignDriverInAssignedVehicles(
              vehicleDetails?.data,
              {
                _id: requestedCoDriver['_doc']._id,
                email: requestedCoDriver['_doc'].email,
                userName: requestedCoDriver['_doc'].userName,
                phoneNumber: requestedCoDriver['_doc'].phoneNumber,
              },
            );
          }
        }
      }
      if (driverDoc && Object.keys(driverDoc).length > 0) {
        let eldDetails;

        if (vehicleDetails?.data?.eldId) {
          eldDetails = await this.appService.populateEld(
            vehicleDetails?.data?.eldId,
          );
        }
        // For the main driver
        if (vehicleDetails?.data) {
          await this.appService.assignDriverInAssignedVehicles(
            vehicleDetails?.data,
            {
              _id: driverDoc._id,
              email: driverDoc.email,
              userName: driverDoc.userName,
              phoneNumber: driverDoc.phoneNumber,
            },
          );
        }

        const unitData: DriverVehicleToUnitRequest = {
          driverId: driverDoc?._id || null,
          coDriverId: driverDoc?.coDriverId || null,
          cycleRule: driverDoc?.cycleRule || null,
          deviceSerialNo: eldDetails?.serialNo || '',
          deviceVendor: eldDetails?.vendor || null,
          driverFirstName: driverDoc?.firstName || '',
          driverLastName: driverDoc?.lastName || '',
          driverFullName: `${driverDoc?.firstName} ${driverDoc?.lastName}`,
          driverLicenseState: driverDoc?.state || '',
          driverUserName: driverDoc?.userName || '',
          driverLicense: driverDoc?.licenseNumber || '',
          manualDriverId: driverDoc?.driverId,
          driverEmail: driverDoc?.email || '',
          phoneNumber: driverDoc?.phoneNumber || '',
          vehicles: driverDoc?.vehicles,
          enableEld: driverDoc?.enableEld,
          enableElog: driverDoc?.enableElog,
          yardMove: driverDoc?.yardMove,
          personalConveyance: driverDoc?.personalConveyance,
          driverProfile: driverDoc?.driverProfile,
          deviceId: eldDetails?.id || null,
          eldNo: eldDetails?.eldNo || null,
          eldType: eldDetails?.deviceType || '',
          deviceVersion: eldDetails?.deviceVersion || '',
          deviceModel: eldDetails?.deviceName || '',
          headOffice: office?.data?.headOffice,
          headOfficeId: office.data.headOfficeId,
          homeTerminalAddress: driverDoc?.homeTerminalAddress,
          homeTerminalAddressId: office?.data?.id,
          homeTerminalTimeZone: driverDoc?.homeTerminalTimeZone,
          manualVehicleId: vehicleDetails?.data?.vehicleId || null,
          trailerNumber: driverDoc?.trailerNumber,
          vehicleId: vehicleDetails?.data?.id || null,
          vehicleLicensePlateNo: vehicleDetails?.data?.licensePlateNo || null,
          vehicleMake: vehicleDetails?.data?.make || null,
          vehicleVinNo: vehicleDetails?.data?.vinNo || null,
          tenantId: driverDoc?.tenantId || tenantId,
        };

        const resp = await this.appService.updateDriverUnit(unitData);

        const model: DriverDocument = await getDocuments(
          driverDoc,
          this.appService,
        );
        const result: DriverResponse = new DriverResponse(model);
        if (requestedCoDriver && Object.keys(requestedCoDriver).length > 0) {
          Logger.log(
            `Want update CoDriver assignTo with driver id:${driverDoc.id}`,
          );
          let coDriverData: CoDriverUnitUpdateRequest;
          if (editRequestData?.coDriverId) {
            const updateDriver = await requestedCoDriver.updateOne({
              assignTo: driverDoc.firstName + ' ' + driverDoc.lastName,
              coDriverId: driverDoc.id,
              vehicleId: driverDoc.vehicleId,
              currentVehicle: driverDoc.currentVehicle,
            });
            coDriverData = {
              driverId: requestedCoDriver.id,
              coDriverId: driverDoc._id || null,
              deviceId: eldDetails?.id || null,
              eldNo: eldDetails?.eldNo || null,
              deviceVersion: eldDetails?.deviceVersion || '',
              deviceModel: eldDetails?.deviceName || '',
              deviceSerialNo: eldDetails?.serialNo || '',
              deviceVendor: eldDetails?.vendor || null,
              manualVehicleId: vehicleDetails?.data?.vehicleId || null,
              vehicleId: vehicleDetails?.data?.id || null,
              vehicleLicensePlateNo:
                vehicleDetails?.data?.licensePlateNo || null,
              vehicleMake: vehicleDetails?.data?.make || null,
              vehicleVinNo: vehicleDetails?.data?.vinNo || null,
            };
            // Co Driver Unit update
            await this.appService.updateCoDriverUnit(coDriverData);
          } else {
            coDriverData = {
              driverId: requestedCoDriver.id,
              coDriverId: driverDoc._id || null,
              // deviceId: eldDetails?.id || null,
              // eldNo: eldDetails?.eldNo || null,
              // deviceVersion: eldDetails?.deviceVersion || '',
              // deviceModel: eldDetails?.deviceName || '',
              // deviceSerialNo: eldDetails?.serialNo || null,
              // deviceVendor: eldDetails?.vendor || null,
              // manualVehicleId: vehicleDetails?.data?.vehicleId || null,
              // vehicleId: vehicleDetails?.data?.id || null,
              // vehicleLicensePlateNo:
              //   vehicleDetails?.data?.licensePlateNo || null,
              // vehicleMake: vehicleDetails?.data?.make || null,
              // vehicleVinNo: vehicleDetails?.data?.vinNo || null,
              deviceId: null,
              eldNo: null,
              deviceVersion: '',
              deviceModel: '',
              deviceSerialNo: '',
              deviceVendor: null,
              manualVehicleId: null,
              vehicleId: null,
              vehicleLicensePlateNo: null,
              vehicleMake: null,
              vehicleVinNo: null,
            };
            // Co Driver Unit update
            await this.appService.updateCoDriverUnit(coDriverData);
          }
        }
        Logger.log(`Driver updated with response :${result}`);
        return response.status(HttpStatus.OK).send({
          message: 'Driver has been updated successfully',
          data: result,
        });
      } else {
        Logger.log(`Driver not updated with id:${id}`);
        throw new NotFoundException(`${id} does not exist`);
      }
      // }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  @IsActiveDecorators()
  async driversStatus(
    @Body() statusRequestData: EditDriverStatusModel,
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    Logger.log(`driverStatus was called with params: ${id}`);
    Logger.log(
      `${request.method} request received from ${request.ip} for ${
        request.originalUrl
      } by: ${
        !response.locals.user ? 'Unauthorized User' : response.locals.user.id
      }`,
    );
    const { isActive } = statusRequestData;
    // const { role } = (request.user as any) ?? { role: undefined };
    // const { permissions } = (role as any) ?? { permissions: undefined };
    // if (permissions && permissions.length > 0) {
    //   const permission = permissions.find((permission) => {
    //     return permission.page === 'vehicle';
    //   });
    //   if (isActive && !permission.canActivate) {
    //     throw new ForbiddenException('You do not have permissions to activate');
    //   }
    //   if (!isActive && !permission.canDeactivate) {
    //     throw new ForbiddenException(
    //       'You do not have permissions to deactivate',
    //     );
    //   }
    // } else {
    //   throw new ForbiddenException(
    //     'You do not have perform permissions to perform this operation.',
    //   );
    // }
    try {
      const driver = await this.appService.findOne({ _id: { $eq: id } });
      if (driver && driver?.coDriverId) {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him.',
        );
      }
      let driverStatus;
      if (driver?.vehicleId && !isActive) {
        driverStatus =
          await this.appService.driverStatusUpdateAndVehicleUnassign(
            id,
            isActive,
          );
      } else {
        driverStatus = await this.appService.driverStatus(id, isActive);
      }

      if (driverStatus && Object.keys(driverStatus).length > 0) {
        const dataUpdate = {
          isActive,
          vehicleId: null,
          manualVehicleId: null,
          vehicleLicensePlateNo: null,
          vehicleMake: null,
          vehicleVinNo: null,
          deviceId: null,
          eldNo: null,
          deviceVersion: '',
          deviceModel: '',
          deviceSerialNo: '',
          deviceVendor: null,
        };
        await this.appService.updateStatusInUnitService(id, dataUpdate);
        const result: DriverResponse = new DriverResponse(driverStatus);
        Logger.log(
          `Driver status changed with id :${id} and response ${result}`,
        );
        return response.status(HttpStatus.OK).send({
          message: `Driver is ${
            isActive ? 'activated' : 'deactivated'
          } successfully`,
          data: result,
        });
      } else {
        Logger.log(`Driver status not changed with id:${id}`);
        throw new NotFoundException(`${id} does not exist`);
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  @GetDefaultDecorators()
  async getDefaultDrivers(
    @Query(new ListingParamsValidationPipe()) queryParams: ListingParams,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const options: FilterQuery<DriverDocument> = {};
      // const options = {};
      const { search, orderBy, orderType, pageNo, limit } = queryParams;
      const { tenantId: id, timeZone } =
        request.user ?? ({ tenantId: undefined } as any);

      let isActive = queryParams?.isActive;
      const arr = [];
      arr.push(isActive);
      if (arr.includes('true')) {
        isActive = true;
      } else {
        isActive = false;
      }
      // options['$and']=[{tenantId:id}]
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
            // jsonUser.deviceVersion = unitInfo.data.deviceVersion || '';
            jsonUser.eldType = unitInfo.data.eldType || '';
            // jsonUser.deviceModel = unitInfo.data.deviceModel || '';
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
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  @GetDecorators()
  async getDrivers(
    @Query(new ListingParamsValidationPipe()) queryParams: ListingParams,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const options: FilterQuery<DriverDocument> = {};
      // const options = {};
      const { search, orderBy, orderType, pageNo, limit } = queryParams;
      const { tenantId: id, timeZone } =
        request.user ?? ({ tenantId: undefined } as any);

      let isActive = queryParams?.isActive;
      const arr = [];
      arr.push(isActive);
      if (arr.includes('true')) {
        isActive = true;
      } else {
        isActive = false;
      }
      // options['$and']=[{tenantId:id}]
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
            // jsonUser.deviceVersion = unitInfo.data.deviceVersion || '';
            jsonUser.eldType = unitInfo.data.eldType || '';
            // jsonUser.deviceModel = unitInfo.data.deviceModel || '';
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
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  // check if driver is loggedin with any different device
  @DeviceCheckDecorators()
  async loggedDevice(
    @Query('id', MongoIdValidationPipe) id: string,
    @Query('deviceToken') deviceToken: string,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      const driver = await this.appService.findOne({ _id: { $eq: id } });

      let previousToken = driver.get('deviceToken', String);
      if (previousToken) {
        //if its not first time login
        if (previousToken != deviceToken) {
          //device changed
          if (previousToken !== '') {
            // other device is still logged in
            return response.status(HttpStatus.OK).send({
              message: 'Driver found',
              alreadyLoggedIn: true,
            });
          }
        }
      }
      return response.status(HttpStatus.OK).send({
        message: 'Driver found',
        alreadyLoggedIn: false,
      });
      // if (result && Object.keys(result).length > 0) {
      //   const deletedDriver = new DriverResponse(result);
      //   Logger.log(`Driver deleted with id:${id}`);
      //   return response.status(HttpStatus.OK).send({
      //     message: 'Driver has been deleted successfully',
      //   });
      // } else {
      //   Logger.log(`Driver not deleted with id:${id}`);
      //   throw new NotFoundException(`${id} not exist`);
      // }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  async deleteDriver(
    @Param('id', MongoIdValidationPipe) id: string,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      Logger.log(`delete DriverById was called with params: ${id}`);
      Logger.log(
        `${req.method} request received from ${req.ip} for ${
          req.originalUrl
        } by: ${
          !response.locals.user ? 'Unauthorized User' : response.locals.user.id
        }`,
      );
      const result = await this.appService.deleteOne(id);
      if (result && Object.keys(result).length > 0) {
        const deletedDriver = new DriverResponse(result);
        Logger.log(`Driver deleted with id:${id}`);
        return response.status(HttpStatus.OK).send({
          message: 'Driver has been deleted successfully',
        });
      } else {
        Logger.log(`Driver not deleted with id:${id}`);
        throw new NotFoundException(`${id} not exist`);
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  @GetByIdDecorators()
  async getDriverById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      Logger.log(`getDriverById was called with params: ${id}`);
      Logger.log(
        `${req.method} request received from ${req.ip} for ${
          req.originalUrl
        } by: ${!res.locals.user ? 'Unauthorized User' : res.locals.user.id}`,
      );
      let driver,
        offices,
        vehicle = null;

      if (id) {
        Logger.log(`find DriverById`);
        driver = await this.appService.findDriverById(id, true);
        Logger.log(`Driver with id: ${id} was found`);
      } else {
        Logger.debug(`Driver against id: ${id} not found`);
      }

      if (driver && Object.keys(driver).length > 0) {
        if (driver.homeTerminalAddress) {
          Logger.log(`want to populate the Office`);
          offices = await this.appService.populateOffices(
            driver.homeTerminalAddress.toString(),
          );
          Logger.log(`populated office`);
          // log info/debug for office object, if it was found or not
        }
        if (driver.vehicleId) {
          Logger.log(`want to populate the vehicle from vehicle service`);
          vehicle = await this.appService.populateVehicle(
            driver.vehicleId.toString(),
          );
          Logger.log(`populated driver vehicle form vehicle address`);
          // log info/debug for office vehicle, if it was found or not
        }

        const driverJson = driver.toJSON();
        const driverProfile = await getDocuments(driverJson, this.appService);

        driverJson.vehicleId = vehicle?.data || null;
        driverJson.homeTerminalAddress = offices?.data || null;
        driverJson.id = driver?.id;
        if (
          driverJson.coDriverId &&
          Object.keys(driverJson.coDriverId).length > 0
        ) {
          const coDriver = new DriverResponse(driverJson.coDriverId);
          coDriver.id = driver.coDriverId.id;
          driverJson.coDriverId = coDriver;
        }
        const driverResponse: DriverResponse = new DriverResponse(driverJson);

        if (driverResponse) {
          Logger.log(`Driver found`);
          //log about the response that response is being sent
          return res.status(HttpStatus.OK).send({
            message: 'Driver found',
            data: driverResponse,
          });
        }
      } else {
        Logger.log(`Driver Not found with id:${id}`);
        throw new NotFoundException('Driver not found');
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_driver_by_email' })
  async tcp_geDriverByIdentity(email: string): Promise<DriverResponse | Error> {
    try {
      const option = {
        isActive: true,
        email: email,
      };
      const driver = await this.appService.findOne(option);
      if (driver && Object.keys(driver).length > 0) {
        Logger.log(`driver data get successfully`);
        const driverProfile = await getDocuments(driver, this.appService);
        return new DriverResponse(driver);
      } else {
        Logger.log(`not find login Driver`);
        throw new NotFoundException(`driver not found`);
      }
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'update_driver_password' })
  async tcp_updatePassword(
    identify: ResetPasswordRequest,
  ): Promise<DriverResponse | Error> {
    try {
      const driver = await this.appService.findOneAndUpdate(identify);
      if (driver && Object.keys(driver).length > 0) {
        Logger.log(`driver password update successfully`);
        return new DriverResponse(driver);
      } else {
        Logger.log(`not find  Driver`);
        throw new NotFoundException(`driver not found`);
      }
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'update_driver_client' })
  async tcp_updateClient(data): Promise<DriverResponse | Error> {
    try {
      const id = data.id;
      const client = data.client;

      const driver = await this.appService.driverClient(id, client);
      if (driver && Object.keys(driver).length > 0) {
        Logger.log(`driver client updated`);
        return new DriverResponse(driver);
      } else {
        Logger.log(`not find  Driver`);
        throw new NotFoundException(`driver not found`);
      }
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_driver_by_id' })
  async tcp_getDriverById(id: string): Promise<any> {
    let driver;
    let exception;

    try {
      driver = await this.appService.findDriverById(id);

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
    } catch (error) {
      exception = error;
    }

    return driver ?? exception;
  }

  /**
   * V2
   * Author Farzan
   */
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_drivers_by_ids' })
  async tcp_getDriversByIds(id: []): Promise<any> {
    try {
      const deviceTokens = await this.appService.findDriversByIds(id);
      console.log(`driver service ---- `, deviceTokens);
      if (deviceTokens.length < 1) {
        throw new NotFoundException('Driver tokens not found');
      }

      return deviceTokens;
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message,
        data: [],
      };
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_assigned_driver_by_vehicleId' })
  async tcp_getAssignedDriverByVehicleId(id: string): Promise<any> {
    let driver;
    let exception;
    try {
      const option: FilterQuery<DriverDocument> = {
        $and: [{ vehicleId: id }, { isActive: true }],
      };
      driver = await this.appService.findOne(option);

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
    } catch (error) {
      exception = error;
    }

    return driver ?? exception;
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_drivers_by_vehicleIds' })
  async tcp_getDriversByVehicleIds(vehicleIds: []): Promise<any> {
    try {
      const response = await this.appService.findDriversByVehicleIds(
        vehicleIds,
      );

      return response;
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message,
        data: [],
      };
    }
  }
}
