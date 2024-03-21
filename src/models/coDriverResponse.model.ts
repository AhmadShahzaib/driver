import DriverDocument from '../mongoDb/document/document';
import { ApiProperty } from '@nestjs/swagger';

export class CoDriverResponse {
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
  isActive: boolean;
  constructor(driverDocument: DriverDocument | any) {
    this.id = driverDocument.id;
    this.driverId = driverDocument.driverId;
    this.userName = driverDocument.userName;
    this.email = driverDocument.email;
    this.firstName = driverDocument.firstName;
    this.lastName = driverDocument.lastName;
    this.isActive = driverDocument.isActive;
  }
}
