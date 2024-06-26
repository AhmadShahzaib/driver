import { Transform, Type } from 'class-transformer';
import { Schema } from 'mongoose';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsMongoId,
  ValidateIf,
  NotContains,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeZone } from './timeZone.model';
import { Optional } from '@nestjs/common';
import { Documents } from 'mongoDb/document/document';

type StringOrTimeZone = string | TimeZone;

export class DriverModel {
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
  @MaxLength(50)
  @IsNotEmpty()
  driverId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(60)
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
  // @NotContains(' ')
  phoneNumber: string;

  @ApiProperty({
    type: String,
  })
  // @IsNotEmpty()
  homeTerminalTimeZone: StringOrTimeZone;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(8)
  @IsString()
  @MaxLength(30)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  licenseNumber: string;

  @ApiProperty({ description: 'vehicleId is proper ObjectId' })
  @ValidateIf((obj) => obj.isCoDriver == 'true')
  @IsOptional()
  @IsNotEmpty()
  // @IsMongoId()
  vehicleId?: string;

  @ApiProperty()
  @Transform(({ value }) => JSON.parse(value))
  @IsNotEmpty()
  // @IsBoolean()
  isCoDriver: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cycleRule: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((obj) => obj.isCoDriver == 'true')
  // @IsMongoId()
  coDriverId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty()
  @Transform(({ value }) => JSON.parse(value))
  @IsNotEmpty()
  // @IsBoolean()
  enableEld: string;

  tenantId?: string;

  @ApiProperty()
  // @Transform(({ value }) => JSON.parse(value))
  // @IsNotEmpty()
  // @IsBoolean()
  enableElog: string;
  driverProfile?: Documents = {};
  documents?: Documents[] = [];

  @ApiProperty()
  @Transform(({ value }) => JSON.parse(value))
  @IsNotEmpty()
  // @IsBoolean()
  yardMove: string;

  @ApiProperty()
  @Transform(({ value }) => JSON.parse(value))
  @IsNotEmpty()
  // @IsBoolean()
  personalConveyance: string;
  vehicles: [{}];
  currentVehicle: any;
  assignTo: string;
}
