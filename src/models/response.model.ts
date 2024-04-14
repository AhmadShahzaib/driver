import DriverDocument, { Documents } from '../mongoDb/document/document';
import { Schema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TimeZone } from './timeZone.model';
import { BaseResponseType } from '@shafiqrathore/logeld-tenantbackend-common-future';

class Doc {
  @ApiProperty()
  id?: string;
  @ApiProperty()
  name?: string;
  @ApiProperty()
  imagePath?: string;
  @ApiProperty()
  key?: string;
  @ApiProperty()
  date?: number;
  constructor(doc: any) {
    this.name = doc.name;
    this.key = doc.key;
    this.date = doc.date;
    this.id = doc.id;
  }
}
class Profile {
  @ApiProperty()
  name?: string;
  @ApiProperty()
  key?: string;
  @ApiProperty()
  imagePath?: string;
  @ApiProperty()
  date?: number;
  constructor(doc: any) {
    this.name = doc.name;
    this.key = doc.key;
    this.date = doc.date;
    this.imagePath = doc.imagePath;
  }
}
export class DriverResponse extends BaseResponseType {
  @ApiProperty()
  id: string;
  @ApiProperty()
  driverId: string;
  @ApiProperty()
  userName: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  homeTerminalAddress?: Schema.Types.ObjectId;
  @ApiProperty()
  state?: String;
  @ApiProperty()
  driverProfile: Profile;
  @ApiProperty({ isArray: true, type: Doc })
  documents: Doc[];
  @ApiProperty()
  phoneNumber?: string;
  @ApiProperty()
  homeTerminalTimeZone?: TimeZone;
  @ApiProperty()
  licenseNumber: string;
  @ApiProperty()
  vehicleId: Schema.Types.ObjectId;
  @ApiProperty()
  coDriver: Schema.Types.ObjectId;
  @ApiProperty()
  notes: string;
  @ApiProperty()
  trailerNumber: string;
  @ApiProperty()
  enableEld: boolean;
  @ApiProperty()
  enableElog: boolean;
  @ApiProperty()
  yardMove: boolean;
  @ApiProperty()
  personalConveyance: boolean;
  @ApiProperty()
  isActive: boolean;
  @ApiProperty()
  assignTo: Schema.Types.ObjectId;
  @ApiProperty()
  tenantId: Schema.Types.ObjectId;
  @ApiProperty()
  cycleRule: string;
  @ApiProperty()
  deviceVersion: string;
  @ApiProperty()
  eldType: string;
  @ApiProperty()
  deviceModel: string;
  @ApiProperty()
  lastActivityDate: number;  
  @ApiProperty()
  createdAt: string;

  constructor(driverDocument: DriverDocument | any) {
    super();
    this.id = driverDocument.id;
    this.driverId = driverDocument.driverId;
    this.userName = driverDocument.userName;
    this.email = driverDocument.email;
    this.firstName = driverDocument.firstName;
    this.lastName = driverDocument.lastName;
    this.fullName = driverDocument.fullName;
    this.homeTerminalAddress = driverDocument.homeTerminalAddress;
    this.state = driverDocument.state;
    this.phoneNumber = driverDocument.phoneNumber;
    this.homeTerminalTimeZone = driverDocument.homeTerminalTimeZone;
    this.licenseNumber = driverDocument.licenseNumber;
    this.vehicleId = driverDocument.vehicleId;
    this.coDriver = driverDocument.coDriverId;
    this.driverProfile = driverDocument?.driverProfile;
    this.documents = driverDocument?.documents?.map((keys) => new Doc(keys));
    this.notes = driverDocument.notes;
    this.trailerNumber = driverDocument.trailerNumber;
    this.enableEld = driverDocument.enableEld;
    this.enableElog = driverDocument.enableElog;
    this.yardMove = driverDocument.yardMove;
    this.personalConveyance = driverDocument.personalConveyance;
    this.isActive = driverDocument.isActive;
    this.assignTo = driverDocument.assignTo;
    this.tenantId = driverDocument.tenantId;
    this.cycleRule = driverDocument.cycleRule;
    this.lastActivityDate = driverDocument.lastActivityDate;
    this.eldType = driverDocument.eldType;
    this.deviceVersion = driverDocument.deviceVersion;
    this.deviceModel = driverDocument.deviceModel;
    this.createdAt = driverDocument.createdAt;
  }
}
