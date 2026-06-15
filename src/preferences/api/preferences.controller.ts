import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe';
import { PreferencesService } from '../application/preferences.service';
import type { UserPreferencesResponse } from '../domain/preferences.types';
import {
  type UpdateUserPreferencesRequest,
  updateUserPreferencesSchema,
} from './preferences.schemas';

@ApiTags('preferences')
@Controller('users/:userId/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get effective user notification preferences' })
  @ApiParam({ name: 'userId', example: 'user-1' })
  @ApiResponse({
    status: 200,
    description:
      'Effective preferences resolved from defaults and user overrides.',
    schema: {
      example: {
        userId: 'user-1',
        preferences: [
          {
            notificationType: 'transactional',
            channel: 'email',
            enabled: true,
            source: 'default',
          },
          {
            notificationType: 'marketing',
            channel: 'email',
            enabled: false,
            source: 'default',
          },
        ],
        quietHours: null,
      },
    },
  })
  async getUserPreferences(
    @Param('userId') userId: string,
  ): Promise<UserPreferencesResponse> {
    return this.preferencesService.getUserPreferences(userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiParam({ name: 'userId', example: 'user-1' })
  @ApiBody({
    schema: {
      example: {
        preferences: [
          {
            notificationType: 'marketing',
            channel: 'email',
            enabled: true,
          },
        ],
        quietHours: {
          enabled: true,
          startTimeLocal: '22:00',
          endTimeLocal: '08:00',
          timezone: 'Asia/Tbilisi',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Updated effective user preferences.',
  })
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserPreferencesSchema))
    body: UpdateUserPreferencesRequest,
  ): Promise<UserPreferencesResponse> {
    return this.preferencesService.updateUserPreferences(userId, body);
  }
}
