import { escapeRegExp } from '../common';

describe('CommonUtils', () => {
  describe('escapeRegExp', () => {
    it('escapes regex metacharacters', () => {
      expect(escapeRegExp('a+b(c)?^$')).toBe('a\\+b\\(c\\)\\?\\^\\$');
    });

    it('returns plain text unchanged', () => {
      expect(escapeRegExp('buttonConfig')).toBe('buttonConfig');
    });
  });
});
