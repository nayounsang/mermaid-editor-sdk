import { describe, expect, it } from 'vitest';
import { SvgViewBoxSchema } from './svg-view-box';

describe('SvgViewBoxSchema', () => {
  it('parses the four positional values from comma or whitespace separated viewBox values', () => {
    expect(SvgViewBoxSchema.parse(' -10, 20  400, 200 ')).toEqual({
      minX: -10,
      minY: 20,
      width: 400,
      height: 200,
    });
  });

  it.each([
    null,
    '',
    '0 0 10',
    '0 0 10 20 30',
    '0 0 nope 20',
    '0 0 0 20',
    '0 0 10 -20',
  ])('throws for an invalid viewBox value: %s', (value) => {
    expect(() => SvgViewBoxSchema.parse(value)).toThrow();
  });
});
