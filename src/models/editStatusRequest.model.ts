import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class EditDriverStatusModel {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
