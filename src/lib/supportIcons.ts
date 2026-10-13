import type { IconSvgElement } from "../components/atoms/AppIcon";
import { AlertCircleIcon, ClockIcon, CreditCardIcon, HelpIcon, MapPinIcon, PackageIcon, RepeatIcon } from "../icons/appIcons";

// The admin names an icon for each support topic; this maps those names to the app's own icon set.
const ICONS: Record<string, IconSvgElement> = {
  "package-x": PackageIcon,
  clock: ClockIcon,
  shuffle: RepeatIcon,
  "badge-alert": AlertCircleIcon,
  "credit-card": CreditCardIcon,
  repeat: RepeatIcon,
  "map-pin": MapPinIcon,
  "help-circle": HelpIcon,
};

/** The icon for a support topic. An icon name the app does not know falls back to the help icon. */
export function supportTopicIcon(iconKey: string): IconSvgElement {
  return ICONS[iconKey] ?? HelpIcon;
}
