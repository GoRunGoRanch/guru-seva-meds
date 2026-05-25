export const FALLBACK_TZ =
  process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "America/Chicago";

export const COMMON_TIMEZONES = [
  { value: "America/Chicago", label: "Central US — Dallas, New Orleans, Chicago" },
  { value: "America/New_York", label: "Eastern US — Atlanta, New York, Miami" },
  { value: "America/Denver", label: "Mountain US — Denver, Salt Lake City" },
  { value: "America/Los_Angeles", label: "Pacific US — LA, San Francisco, Seattle" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Sao_Paulo", label: "São Paulo / Brazil" },
  { value: "Europe/London", label: "UK — London" },
  { value: "Europe/Berlin", label: "Central Europe — Berlin, Paris, Rome" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Africa/Johannesburg", label: "South Africa" },
  { value: "Asia/Dubai", label: "UAE — Dubai" },
  { value: "Asia/Kolkata", label: "India — Mayapur, Mumbai, Delhi" },
  { value: "Asia/Bangkok", label: "Thailand / Vietnam" },
  { value: "Asia/Singapore", label: "Singapore / Malaysia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo" },
  { value: "Australia/Sydney", label: "Australia East — Sydney" },
  { value: "Pacific/Auckland", label: "New Zealand" },
];
