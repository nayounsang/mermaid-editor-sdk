import { z } from 'zod';

const SvgNumberSchema = z.string()
  .regex(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i)
  .transform(Number)
  .pipe(z.number().finite());

export const SvgViewBoxSchema = z.string()
  .trim()
  .transform((value) => value.split(/(?:\s*,\s*|\s+)/))
  .pipe(z.tuple([
    SvgNumberSchema,
    SvgNumberSchema,
    SvgNumberSchema.pipe(z.number().positive()),
    SvgNumberSchema.pipe(z.number().positive()),
  ]))
  .transform(([minX, minY, width, height]) => ({ minX, minY, width, height }));

export type SvgViewBox = z.infer<typeof SvgViewBoxSchema>;
