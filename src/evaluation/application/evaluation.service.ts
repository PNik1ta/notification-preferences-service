import { Injectable, Logger } from '@nestjs/common';
import { PreferencesRepository } from '../../preferences/infrastructure/preferences.repository';
import { GlobalPoliciesRepository } from '../../policies/infrastructure/global-policies.repository';
import { NotificationDecisionService } from '../domain/notification-decision.service';
import type {
  EvaluateNotificationInput,
  EvaluateNotificationResponse,
} from '../domain/evaluation.types';
import type { EvaluateNotificationRequest } from '../api/evaluation.schemas';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly preferencesRepository: PreferencesRepository,
    private readonly globalPoliciesRepository: GlobalPoliciesRepository,
    private readonly notificationDecisionService: NotificationDecisionService,
  ) {}

  async evaluate(
    request: EvaluateNotificationRequest,
  ): Promise<EvaluateNotificationResponse> {
    const input = this.mapRequest(request);

    const [globalPolicy, userPreference, defaultPreference, quietHours] =
      await Promise.all([
        this.globalPoliciesRepository.findBlockingPolicy(
          input.notificationType,
          input.channel,
          input.region,
        ),
        this.preferencesRepository.findUserPreference(
          input.userId,
          input.notificationType,
          input.channel,
        ),
        this.preferencesRepository.findDefaultPreference(
          input.notificationType,
          input.channel,
        ),
        this.preferencesRepository.findUserQuietHours(input.userId),
      ]);

    const result = this.notificationDecisionService.decide({
      request: input,
      globalPolicy,
      userPreference,
      defaultPreference,
      quietHours,
    });

    this.logger.log(
      JSON.stringify({
        event: `notification.evaluate.${result.decision}`,
        userId: input.userId,
        notificationType: input.notificationType,
        channel: input.channel,
        region: input.region,
        decision: result.decision,
        reason: result.reason,
      }),
    );

    return result;
  }

  private mapRequest(
    request: EvaluateNotificationRequest,
  ): EvaluateNotificationInput {
    return {
      userId: request.userId,
      notificationType: request.notificationType,
      channel: request.channel,
      region: request.region,
      datetime: request.datetime,
    };
  }
}
