import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe';
import { EvaluationService } from '../application/evaluation.service';
import type { EvaluateNotificationResponse } from '../domain/evaluation.types';
import {
  evaluateNotificationSchema,
  type EvaluateNotificationRequest,
} from './evaluation.schemas';

@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async evaluate(
    @Body(new ZodValidationPipe(evaluateNotificationSchema))
    body: EvaluateNotificationRequest,
  ): Promise<EvaluateNotificationResponse> {
    return this.evaluationService.evaluate(body);
  }
}
