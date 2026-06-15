import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe';
import { PreferencesService } from '../application/preferences.service';
import type { UserPreferencesResponse } from '../domain/preferences.types';
import {
  type UpdateUserPreferencesRequest,
  updateUserPreferencesSchema,
} from './preferences.schemas';

@Controller('users/:userId/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async getUserPreferences(
    @Param('userId') userId: string,
  ): Promise<UserPreferencesResponse> {
    return this.preferencesService.getUserPreferences(userId);
  }

  @Post()
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserPreferencesSchema))
    body: UpdateUserPreferencesRequest,
  ): Promise<UserPreferencesResponse> {
    return this.preferencesService.updateUserPreferences(userId, body);
  }
}
