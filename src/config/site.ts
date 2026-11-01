// TODO(owner): Replace all placeholder values with your real information before going live.

export const site = {
  /** Business display name shown throughout the app */
  name: 'ScrapFinds',

  /** One-line tagline shown on the hero and PWA description */
  tagline: 'Good condition recovered items. Call to collect',

  /** Short name for PWA home screen (≤12 chars) */
  shortName: 'ScrapFinds',

  /** Owner primary phone — display format (shown in UI) */
  phoneDisplay: '+91 91139 66625',

  /** Owner primary phone — E.164 format (used in tel: link), digits only with + */
  phoneE164: '+919113966625',

  /** Owner alternative phone — display format */
  altPhoneDisplay: '+91 96329 43726',

  /** Owner alternative phone — E.164 format (used in tel: link) */
  altPhoneE164: '+919632943726',

  /** WhatsApp number in E.164 format (digits only, no +) */
  whatsappE164: '919113966625',

  /** Categories of scrap we buy from the public */
  weCollect: [
    'Old newspapers & books',
    'Cardboard & packaging',
    'Iron & steel',
    'Copper & brass',
    'Aluminium',
    'Plastic',
    'E-waste (phones, laptops)',
  ], // TODO(owner)
} as const;

export type Site = typeof site;
