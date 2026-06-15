import { Controller, Get, Param } from '@nestjs/common';
import { PreferencesService } from '../application/preferences.service';
import type { UserPreferencesResponse } from '../domain/preferences.types';

@Controller('users/:userId/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async getUserPreferences(
    @Param('userId') userId: string,
  ): Promise<UserPreferencesResponse> {
    return this.preferencesService.getUserPreferences(userId);
  }
}
