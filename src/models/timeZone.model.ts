import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TimeZone {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tzCode: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  utc: string;
  @ApiProperty()
  @IsString()
  label?: string;
  @ApiProperty()
  @IsString()
  name?: string;
}
