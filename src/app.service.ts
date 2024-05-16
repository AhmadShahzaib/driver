import { response } from 'express';
import { ResetPasswordRequest } from './models/resetPasswordRequest.model';
import { DriverResponse } from './models/response.model';
import {
  Injectable,
  Logger,
  Inject,
  UnauthorizedException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import {
  BaseService,
  MessagePatternResponseType,
  mapMessagePatternResponseToException,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { genSalt, hash, compare } from 'bcryptjs';
import { Model, QueryOptions, FilterQuery } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Base64 } from 'aws-sdk/clients/ecr';
import AwsClient from './shared/config';
import { InjectModel } from '@nestjs/mongoose';
import { async, firstValueFrom } from 'rxjs';
import DriverDocument from './mongoDb/document/document';
import { DriverModel } from './models/request.model';
import { EditDriverModel } from './models/editRequest.model';
import { DriverLoginResponse } from './models/driverLoginResponse.model';
import { TimeZone } from 'models';
import { DriverVehicleToUnitRequest } from 'models/driverVehicleRequest';

@Injectable()
export class AppService extends BaseService<DriverDocument> {
  private readonly logger = new Logger('Driver Service');
  bucket = 'eld-uploads';
  constructor(
    @InjectModel('Driver') private readonly driverModel: Model<DriverDocument>,
    @Inject('VEHICLE_SERVICE') private readonly client: ClientProxy,
    @Inject('ELD_SERVICE') private readonly deviceClient: ClientProxy,
    @Inject('OFFICE_SERVICE') private readonly officeClient: ClientProxy,
    @Inject('HOS_SERVICE') private readonly hosClient: ClientProxy,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
    private readonly awsClient: AwsClient,
  ) {
    super();
  }
  //

  async uploadFile(fileBuffer: Base64, fileName: string, contentType: string) {
    try {
      // if (!await this.checkBucketExists(this.bucket)) {
      //   Logger.error('Bucket does not exists!');
      //   throw new BadRequestException('Bucket does not exists!');
      // }
      return await this.awsClient.s3Client
        .upload({
          Bucket: this.bucket,
          Body: fileBuffer,
          Key: fileName,
          ...(contentType && { ContentType: contentType }),
        })
        .promise();
    } catch (err) {
      Logger.error('Error while uploading file', err);
      throw err;
    }
  }

  async getObject(objectKey: string) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: objectKey,
      };
      const data = await this.awsClient.s3Client.getObject(params).promise();
      console.log(`Data =========================== `, data);
      console.log(`Data Body =========================== `, data.Body);

      return Buffer.from(data.Body).toString('base64');
    } catch (err) {
      Logger.error('Error while uploading file', err);
      throw err;
    }
  }

  //
  //
  //
  //
  //
  login = async (
    userName: string,
    password: string,
    tenantId: string,
    deviceToken: string,
    deviceType: string,
    deviceVersion: string,
    deviceModel: string,
  ): Promise<any | Error> => {
    try {
      let option: FilterQuery<DriverDocument>;
      option = {
        $and: [
          { isDeleted: false, isActive: true },
          {
            $or: [
              { email: { $regex: new RegExp(`^${userName}$`, 'i') } },
              { userName: { $regex: new RegExp(`^${userName}$`, 'i') } },
              { phoneNumber: { $regex: new RegExp(`^${userName}$`, 'i') } },
            ],
          },
        ],
      };
      this.logger.log(`check Driver exist or not`);
      const driver = await this.driverModel.findOne(option).exec();
      if (!driver) {
        this.logger.log(`The login userName you entered is incorrect. `);
        return Promise.resolve(
          new NotFoundException('The login email you entered is incorrect'),
        );
      }
      if (deviceToken) {
        await this.driverModel.findByIdAndUpdate(
          driver.id,
          { $set: { deviceToken: deviceToken } },
          {
            new: true,
          },
        );
      }
      if (deviceType != '') {
        await this.driverModel.findByIdAndUpdate(
          driver.id,
          { $set: { deviceType: deviceType } },
          {
            new: true,
          },
        );
      }
      if (deviceVersion != '') {
        const res = await this.driverModel.findByIdAndUpdate(
          driver.id,
          { $set: { deviceVersion: deviceVersion } },
          {
            new: true,
          },
        );
        Logger.log(
          '=================================================================>>>>>>>>' +
            res,
        );
      }
      if (deviceModel) {
        await this.driverModel.findByIdAndUpdate(
          driver.id,
          { $set: { deviceModel: deviceModel } },
          {
            new: true,
          },
        );
      }
      this.logger.log(`driver found`);
      const jsonDriver = driver.toJSON();
      jsonDriver.id = driver.id;
      const passwordMatch = await compare(password, jsonDriver.password);
      if (!passwordMatch) {
        this.logger.log(`password not match`);
        return Promise.resolve(
          new UnauthorizedException('The password you entered is incorrect.'),
        );
      }

      try {
        const res = await firstValueFrom(
          this.unitClient.send(
            { cmd: 'get_assigned_driver_eld_SerialNo' },
            driver.id,
          ),
        );
        if (res.isError) {
          Logger.log('Error in getting Device Serial No from Unit Service');
          mapMessagePatternResponseToException(res);
        }
        jsonDriver['deviceSerialNo'] = res.data.deviceSerialNo;
      } catch (err) {}

      return new DriverLoginResponse(jsonDriver);
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  register = async (driver: DriverModel): Promise<DriverDocument> => {
    try {
      if (driver.isCoDriver.toString() == 'false') {
        driver.coDriverId = null;
      }
      if (!driver.enableElog) {
        driver['enableElog'] = 'true';
      }
      // driver.enableElog = "true"
      driver.password = await this.hashPassword(driver.password);
      const result = await this.driverModel.findOneAndUpdate(
        { email: driver.email },
        driver,
        { upsert: true, new: true },
      );
      console.log('New Id' + result['_doc']['_id']);
      const driverId = result['_doc']['_id'];
      let recordMade = {
        driverId: driverId,
        date: '',
        driverName: result['_doc']['firstName'] + result['_doc']['lastName'],
        vehicleName: driver.vehicleId
          ? result['_doc']['vehicles'][0]['vehicleId']
          : null,
        shippingId: '',
        signature: '',
        hoursWorked: 0,
        distance: '0',
        violations: [],
        status: {},
        lastKnownActivity: {},
        homeTerminalTimeZone: result['_doc']['homeTerminalTimeZone'],
        tenantId: '',
      };
      // this.hosClient.connect();
      try {
        const res = await firstValueFrom<MessagePatternResponseType>(
          this.hosClient.send({ cmd: 'add_update_recordTable' }, recordMade),
        );
      } catch (error) {
        this.logger.error({ message: error.message, stack: error.stack });
      }
      // if (res && res.constructor) {
      //   // Your code here that uses res
      // } else {
      //   // Handle the case where res is null or undefined
      //   console.error('Response is null or undefined');
      // }
      // this.hosClient.close();

      console.log(`doc >>>>>> `, result);
      return result;
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  getDriverStatus = async (
    driverId: string,
    isActive: boolean = true,
  ): Promise<boolean> => {
    const driversCount = await this.driverModel
      .count({ _id: driverId, isActive, isDeleted: false })
      .exec();
    return driversCount > 0;
  };
  findOne = async (options): Promise<DriverDocument> => {
    try {
      options.isDeleted = false;
      return await this.driverModel.findOne(options);
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  updateDriver = async (
    id: string,
    driver: EditDriverModel,
  ): Promise<DriverDocument> => {
    try {
      if (!driver.enableElog) {
        driver['enableElog'] = 'true';
      }
      if (driver?.isCoDriver?.toString() == 'false') {
        driver.coDriverId = null;
      }
      if (driver.password) {
        console.log('somehow this worked');
        driver.password = await this.hashPassword(driver.password);
      }
      const result = await this.driverModel
        .findByIdAndUpdate(id, driver, {
          new: true,
        })
        .and([{ isDeleted: false }]);
      // const driverId = result['_doc']['_id'];
      // let recordMade = {
      //   driverId: driverId,
      //   date: '',
      //   driverName:
      //     result['_doc']['firstName'] + ' ' + result['_doc']['lastName'],
      //   vehicleName: driver.vehicleId ? result['_doc']['currentVehicle'] : null,
      //   shippingId: '',
      //   signature: '',
      //   hoursWorked: 0,
      //   distance: '0',
      //   violations: [],
      //   status: {},
      //   lastKnownActivity: {},
      //   homeTerminalTimeZone: result['_doc']['homeTerminalTimeZone'],
      //   tenantId: '',
      // };
      // this.hosClient.connect();
      // try {
      //   // const res =  firstValueFrom<MessagePatternResponseType>(
      //   //   this.hosClient.send({ cmd: 'add_update_recordTable' }, recordMade),
      //   // );
      // } catch (error) {
      //   this.logger.error({ error });
      // }
      // const resss = await firstValueFrom<MessagePatternResponseType>(
      //   this.hosClient.send({ cmd: 'get_recordTable' }, {driverID:driverId,date:''}),
      // );
      // if (res && res.constructor) {
      //   // Your code here that uses res
      // } else {
      //   // Handle the case where res is null or undefined
      //   console.error('Response is null or undefined');
      // }
      // this.hosClient.close();

      return result;
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  deleteOne = async (id: string): Promise<DriverDocument> => {
    try {
      return await this.driverModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        {
          new: true,
        },
      );
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  driverStatus = async (
    id: string,
    status: boolean,
  ): Promise<DriverDocument> => {
    try {
      return await this.driverModel
        .findByIdAndUpdate(
          id,
          { isActive: status },
          {
            new: true,
          },
        )
        .and([{ isDeleted: false }]);
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  driverClient = async (
    id: string,
    client: any,
  ): Promise<DriverDocument> => {
    try {
      return await this.driverModel
        .findByIdAndUpdate(
          id,
          { client: client },
          {
            new: true,
          },
        )
       
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };
  findOneAndUpdate = async (
    data: ResetPasswordRequest,
  ): Promise<DriverDocument> => {
    try {
      if (data.password) {
        data.password = await this.hashPassword(data.password);
      }
      return await this.driverModel
        .findOneAndUpdate(
          { email: data.email },
          { password: data.password },
          {
            new: true,
          },
        )
        .and([{ isDeleted: false }]);
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };
  updateUnitdata = async (
    driverId: string,
    homeTerminalAddressId: string,
  ): Promise<any> => {
    return await this.driverModel.findOneAndUpdate(
      { _id: driverId },
      {
        homeTerminalAddress: homeTerminalAddressId,
      },
      {
        new: true,
        rawResult: true,
      },
    );
  };

  getVehicleId = (id: string): Promise<any> => {
    try {
      return firstValueFrom(this.client.send({ cmd: 'get_vehicle_id' }, id));
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  populateVehicle = async (id: string): Promise<any> => {
    try {
      const responseVehicle = await firstValueFrom(
        this.client.send({ cmd: 'get_vehicle_by_id' }, id),
      );
      if (responseVehicle.isError) {
        mapMessagePatternResponseToException(responseVehicle);
      } else {
        return responseVehicle;
      }
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  };

  assignDriverInAssignedVehicles = async (vehicle, driver): Promise<any> => {
    try {
      const responseVehicle = await firstValueFrom(
        this.client.send(
          { cmd: 'assign_driverId_to_vehicle' },
          { vehicle, driver },
        ),
      );
      if (responseVehicle.isError) {
        mapMessagePatternResponseToException(responseVehicle);
      } else {
        return responseVehicle;
      }
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  };

  // getVehicleById = async (id: string): Promise<any> => {
  //   try {
  //     const responseVehicle = await firstValueFrom(
  //       this.client.send({ cmd: 'fetch_vehicle_by_id' }, id),
  //     );
  //     if (responseVehicle.isError) {
  //       mapMessagePatternResponseToException(responseVehicle);
  //     } else {
  //       return responseVehicle;
  //     }
  //   } catch (err) {
  //     this.logger.error({ message: err.message, stack: err.stack });
  //     return err;
  //   }
  // };

  populateOffices = async (id: string): Promise<any | HttpException> => {
    try {
      const responseOffice = await firstValueFrom(
        this.officeClient.send({ cmd: 'get_office_by_id' }, id),
      );
      if (responseOffice.isError) {
        mapMessagePatternResponseToException(responseOffice);
      } else {
        return responseOffice;
      }
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  };

  populateUnit = async (id: string): Promise<any | HttpException> => {
    try {
      const responseUnit = await firstValueFrom(
        this.unitClient.send({ cmd: 'get_assigned_driver_eld_SerialNo' }, id),
      );
      if (responseUnit.isError) {
        mapMessagePatternResponseToException(responseUnit);
      } else {
        return responseUnit;
      }
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  };

  getHeadOffices = async (): Promise<any> => {
    try {
      const headOffice = await firstValueFrom(
        this.officeClient.send({ cmd: 'get_head_office' }, {}),
      );
      if (headOffice.isError) {
        mapMessagePatternResponseToException(headOffice);
      } else {
        return headOffice.data;
      }
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  findDriverById = async (
    id: string,
    doPopulateCodriver: boolean = false,
  ): Promise<DriverDocument> => {
    try {
      const driverQuery = this.driverModel
        .findById(id)
        .and([{ isDeleted: false }]);
      if (doPopulateCodriver) {
        driverQuery.populate('coDriverId', {
          password: 0,
          createdAt: 0,
          updatedAt: 0,
        });
      }
      return await driverQuery.exec();
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  /**
   * V2
   * Author : Farzan
   */
  findDriversByIds = async (id: []): Promise<any> => {
    try {
      console.log(`IM in driver service`);

      let deviceTokens = [];
      const driverQuery = await this.driverModel.find({
        _id: {
          $in: id,
        },
      });
      if (driverQuery.length < 1) {
        return [];
      }

      for (let i = 0; i < driverQuery.length; i++) {
        deviceTokens.push(driverQuery[i].deviceToken);
      }

      return deviceTokens;
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  find = (options: QueryOptions) => {
    try {
      console.log(`Options check ---------------------- `, options);

      const query = this.driverModel
        .find(options)
        .populate('coDriverId', { password: 0, createdAt: 0, updatedAt: 0 });
      query.and([{ isDeleted: false }]);
      return query;
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  findCoDriver = async (): Promise<DriverDocument[]> => {
    try {
      return await this.driverModel
        .find({
          coDriverId: null,
          assignTo: null,
          isDeleted: false,
          vehicleId: null,
        })
        .select('_id userName email firstName lastName isActive driverId uuid');
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  count = (options: QueryOptions) => {
    return this.driverModel
      .count(options)
      .and([{ isDeleted: false }])
      .exec();
  };

  protected hashPassword = async (password: string): Promise<string> => {
    try {
      const salt = await genSalt(12);
      return await hash(password, salt);
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  isVehicleAssigned = async (vehicleId: String, driverId?: String) => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.send(
          { cmd: 'is_vehicle_assigned' },
          { vehicleId, driverId },
        ),
      );
      if (resp.isError) {
        mapMessagePatternResponseToException(resp);
      }
      return resp.data;
    } catch (error) {
      this.logger.error({ error });
      throw error;
    }
  };

  updateVehicleAssigned = async (
    vehicleId: String,
    driverId: String,
    coDriverId: String,
    firstName: String,
    lastName: String,
    manualDriverId: String,
    driverLicense: string,
    trailerNumber: string,
    driverUserName: string,
    driverLicenseState: string,
    homeTerminalAddress: string,
    headOffice: string,
    timeZone: string | TimeZone,
    headOfficeId: string,
    homeTerminalAddressId: string,
    cycleRule: string,
  ) => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'assign_vehicle_to_driver' },
          {
            vehicleId,
            driverId,
            coDriverId,
            firstName,
            lastName,
            manualDriverId,
            driverLicense,
            trailerNumber,
            driverUserName,
            driverLicenseState,
            homeTerminalAddress,
            headOffice,
            timeZone,
            headOfficeId,
            homeTerminalAddressId,
            cycleRule,
          },
        ),
      );
      return resp;
    } catch (error) {
      this.logger.error({ error });
      throw error;
    }
  };

  // writing a message pattern to add dummy data for previous 14 days of driver creation
  //addNewDriverLogs= async(driverId)=>{
  // try {
  // const resp = await firstValueFrom(
  //   this.hosClient.emit(
  //     { cmd: 'add_logs_of_new_driver' },
  //     {  );
  // return resp;
  // } catch (error) {
  //   this.logger.error({ error });
  //   throw error;
  // }
  // }

  updateStatusInUnitService = async (id, status) => {
    try {
      return await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'change_driver_status' },
          { driverId: id, isActive: status },
        ),
      );
    } catch (error) {
      this.logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  };

  updateDriverUnit = async (driverVehicleData: DriverVehicleToUnitRequest) => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'assign_driver_to_unit' },
          driverVehicleData,
        ),
      );
      return resp;
    } catch (error) {
      this.logger.error({ error });
      throw error;
    }
  };

  populateEld = async (id: string): Promise<any> => {
    try {
      const resp = await firstValueFrom(
        this.deviceClient.send({ cmd: 'get_device_by_id' }, id),
      );
      if (resp.isError) {
        mapMessagePatternResponseToException(resp);
      }
      return resp.data;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };
}
