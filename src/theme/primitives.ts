/** Raw colour values. No component may import this module directly. */
export const primitives = {
  warm900: '#302820',
  orange950: '#4A1F0A',
  orange900: '#B84A10',
  orange800: '#96380A',
  orange700: '#C9550D',
  orange600: '#E66B1A',
  orange100: '#FCEFE3',
  red600: '#C0392B',
  red100: '#FBEDEA',
  green800: '#2D7A4D',
  green100: '#E6F3EA',
  amber600: '#8A5A00', // TODO: confirm against Figma/brand guide.
  amber100: '#FBF3E1', // TODO: confirm against Figma/brand guide.
  blue600: '#2B6CB0', // TODO: confirm against Figma/brand guide.
  blue100: '#E9F1FA', // TODO: confirm against Figma/brand guide.
  neutral900: '#1F2421',
  neutral600: '#6B7268',
  neutral400: '#A5ACA4', // TODO: confirm against Figma/brand guide.
  neutral200: '#EDE8DE',
  neutral150: '#F2F0EB',
  neutral100: '#F7F2E9',
  neutral50: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;
