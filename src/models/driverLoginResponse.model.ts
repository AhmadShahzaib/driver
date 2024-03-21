import DriverDocument from '../mongoDb/document/document';
import { Schema } from 'mongoose';
import { TimeZone } from './timeZone.model';
import { BaseResponseType } from '@shafiqrathore/logeld-tenantbackend-common-future';

export class DriverLoginResponse extends BaseResponseType {
  id: string;
  driverId: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  homeTerminalAddress?: Schema.Types.ObjectId;
  state?: String;
  homeTerminalTimeZone?: TimeZone;
  vehicleId: Schema.Types.ObjectId;
  coDriver: Schema.Types.ObjectId;
  enableEld: boolean;
  enableElog: boolean;
  yardMove: boolean;
  personalConveyance: boolean;
  assignTo: Schema.Types.ObjectId;
  tenantId: Schema.Types.ObjectId;
  deviceSerialNo?: string;
  cycleRule: string;
  licenseNumber: string;
  trailerNumber: string;
  eldUsernameDriver: string;
  driverProfile: any;
  assignedVehicles: [];

  constructor(driverDocument: DriverDocument | any) {
    super();
    this.id = driverDocument.id;
    this.driverId = driverDocument.driverId;
    this.userName = driverDocument.userName;
    this.email = driverDocument.email;
    this.firstName = driverDocument.firstName;
    this.lastName = driverDocument.lastName;
    this.homeTerminalAddress = driverDocument.homeTerminalAddress;
    this.state = driverDocument.state;
    this.homeTerminalTimeZone = driverDocument.homeTerminalTimeZone;
    this.vehicleId = driverDocument.vehicleId;
    this.coDriver = driverDocument.coDriverId;
    this.enableEld = driverDocument.enableEld;
    this.enableElog = driverDocument.enableElog;
    this.yardMove = driverDocument.yardMove;
    this.personalConveyance = driverDocument.personalConveyance;
    this.assignTo = driverDocument.assignTo;
    this.tenantId = driverDocument.tenantId;
    this.deviceSerialNo = driverDocument.deviceSerialNo;
    this.cycleRule = driverDocument.cycleRule;
    this.trailerNumber = driverDocument.trailerNumber
      ? driverDocument.trailerNumber
      : '';
    this.eldUsernameDriver = driverDocument.userName;
    this.licenseNumber = driverDocument.licenseNumber;
    this.driverProfile = driverDocument?.driverProfile;
    this.assignedVehicles = driverDocument?.assignedVehicles;
  }
}
