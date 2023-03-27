import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';
const DEFAULT_PAGE_SIZE = 10;
export class PaginationDto {
  @ApiProperty({ required: false, default: DEFAULT_PAGE_SIZE })
  @IsNumberString()
  @IsOptional()
  first?: number;

  @ApiProperty({
    required: false,
    description: 'If first is provided, last will be ignored.',
  })
  @IsNumberString()
  @IsOptional()
  last?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  after?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  before?: string;
}
