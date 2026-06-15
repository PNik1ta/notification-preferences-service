import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe';
import { EvaluationService } from '../application/evaluation.service';
import type { EvaluateNotificationResponse } from '../domain/evaluation.types';
import {
  evaluateNotificationSchema,
  type EvaluateNotificationRequest,
} from './evaluation.schemas';

@ApiTags('evaluation')
@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate whether a notification can be sent' })
  @ApiBody({
    schema: {
      example: {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'sms',
        region: 'EU',
        datetime: '2026-05-21T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification delivery decision.',
    schema: {
      example: {
        decision: 'deny',
        reason: 'blocked_by_global_policy',
      },
    },
  })
  async evaluate(
    @Body(new ZodValidationPipe(evaluateNotificationSchema))
    body: EvaluateNotificationRequest,
  ): Promise<EvaluateNotificationResponse> {
    return this.evaluationService.evaluate(body);
  }
}
