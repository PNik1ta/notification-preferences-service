import { Module } from '@nestjs/common';
import { PreferencesModule } from '../preferences/preferences.module';
import { PoliciesModule } from '../policies/policies.module';
import { EvaluationController } from './api/evaluation.controller';
import { EvaluationService } from './application/evaluation.service';
import { NotificationDecisionService } from './domain/notification-decision.service';

@Module({
  imports: [PreferencesModule, PoliciesModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, NotificationDecisionService],
})
export class EvaluationModule {}
