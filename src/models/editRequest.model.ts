import { Schema } from 'mongoose';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsMongoId,
  ValidateIf,
  NotContains,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeZone } from './timeZone.model';
import { Documents } from 'mongoDb/document/document';

type StringOrTimeZone = string | TimeZone;

export class EditDriverModel {
  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  driverDocument?: Express.Multer.File[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  profile?: Express.Multer.File;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @NotContains(' ')
  userName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @NotContains(' ')
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  // @IsMongoId()
  // @IsString()
  homeTerminalAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(15)
  @NotContains(' ')
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  homeTerminalTimeZone: StringOrTimeZone;

  @IsOptional()
  @ApiProperty()
  @MinLength(8)
  @IsString()
  @MaxLength(20)
  password: string;

  @ApiProperty()
  // @IsBoolean()
  shouldUpdatePassword?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  licenseNumber: string;

  @ApiProperty({ description: 'vehicleId is proper ObjectId' })
  // @ValidateIf((obj) => obj.isCoDriver == 'false')
  // @IsNotEmpty()
  @IsOptional()
  // @IsMongoId()
  // @IsString()
  vehicleId?: string;

  @ApiProperty()
  @IsOptional()
  @MaxLength(50)
  @IsString()
  trailerNumber: string;

  @ApiProperty()
  @IsOptional()
  @MaxLength(50)
  @IsString()
  deviceVersion: string;

  @ApiProperty()
  @IsOptional()
  @MaxLength(50)
  @IsString()
  deviceModel: string;

  @ApiProperty()
  @ValidateIf((obj) => obj.isCoDriver == 'true')
  @IsOptional()
  @IsMongoId()
  coDriverId?: string;

  @ApiProperty()
  @IsNotEmpty()
  // @IsBoolean()
  isCoDriver: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cycleRule: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty()
  @IsNotEmpty()
  // @IsBoolean()
  enableEld: string;
  driverProfile?: Documents;
  documents?: Documents[];

  @ApiProperty()
  // @IsNotEmpty()
  // @IsBoolean()
  enableElog: string;

  @ApiProperty()
  @IsNotEmpty()
  // @IsBoolean()
  yardMove: string;

  @ApiProperty()
  @IsNotEmpty()
  // @IsBoolean()
  personalConveyance: string;
  vehicles: [{}];
  currentVehicle: any;
}
