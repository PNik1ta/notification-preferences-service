import { Module } from '@nestjs/common';
import { GlobalPoliciesRepository } from './infrastructure/global-policies.repository';

@Module({
  providers: [GlobalPoliciesRepository],
  exports: [GlobalPoliciesRepository],
})
export class PoliciesModule {}
