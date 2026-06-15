import { Module } from '@nestjs/common';
import { PreferencesController } from './api/preferences.controller';
import { PreferencesService } from './application/preferences.service';
import { PreferencesRepository } from './infrastructure/preferences.repository';

@Module({
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository],
  exports: [PreferencesService, PreferencesRepository],
})
export class PreferencesModule {}
