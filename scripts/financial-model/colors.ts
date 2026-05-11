/**
 * RAV brand colors — ARGB hex strings for exceljs (FF = full opacity).
 * Sourced from BRAND-STYLE-GUIDE.md + BRAND-LOCK.md.
 */
export const ARGB = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase();

export const C = {
  DEEP_TEAL:    ARGB('#1C7268'),
  CORAL:        ARGB('#E8703A'),
  CREAM:        ARGB('#F8F6F3'),
  NAVY:         ARGB('#1D2E38'),
  SAND:         ARGB('#F0EBE3'),
  WARM_GRAY:    ARGB('#EAE8E4'),
  SLATE:        ARGB('#6B7B85'),
  EMERALD:      ARGB('#1FA66E'),
  AMBER:        ARGB('#F59E0B'),
  RED:          ARGB('#E53E3E'),
  WHITE:        ARGB('#FFFFFF'),
  TEAL_LIGHT:   ARGB('#E8F4F2'),
  TEAL_MID:     ARGB('#C5DDD9'),
  CORAL_LIGHT:  ARGB('#FDF0EA'),
  EMERALD_LITE: ARGB('#E6F6EE'),
  AMBER_LIGHT:  ARGB('#FEF3C7'),
  RED_LIGHT:    ARGB('#FDECEA'),
  NAVY_MID:     ARGB('#243848'),
  NAVY_LIGHT:   ARGB('#2D4455'),
} as const;

export type RavColor = (typeof C)[keyof typeof C];
