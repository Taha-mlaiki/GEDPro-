import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T = any> implements PipeTransform<any, T> {
  constructor(private zodSchema: ZodType<T>) {}

  transform(value: any): T {
    const result = this.zodSchema.safeParse(value);
    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({ errors: formattedErrors });
    }
    return result.data;
  }
}
