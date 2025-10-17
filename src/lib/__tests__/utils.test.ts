import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional class names', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should handle falsy values', () => {
      const result = cn('base-class', false, null, undefined, 'other-class');
      expect(result).toContain('base-class');
      expect(result).toContain('other-class');
    });

    it('should override conflicting Tailwind classes', () => {
      const result = cn('p-4', 'p-8');
      // twMerge should keep only the last padding class
      expect(result).toBe('p-8');
    });

    it('should handle arrays of class names', () => {
      const result = cn(['class-1', 'class-2'], 'class-3');
      expect(result).toContain('class-1');
      expect(result).toContain('class-2');
      expect(result).toContain('class-3');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'class-1': true,
        'class-2': false,
        'class-3': true,
      });
      expect(result).toContain('class-1');
      expect(result).not.toContain('class-2');
      expect(result).toContain('class-3');
    });
  });
});
