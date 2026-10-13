import { useQuery } from "@tanstack/react-query";

import { getPinAvailability, PIN_CODE } from "../services/deliveryAvailabilityService";
import { queryKeys } from "../services/queryKeys";

/** Asks the server which delivery options serve a PIN code. Waits until the PIN has all six digits. */
export function usePinAvailability(pin: string) {
  return useQuery({
    queryKey: queryKeys.pinAvailability(pin),
    queryFn: () => getPinAvailability(pin),
    enabled: PIN_CODE.test(pin),
    // The earliest date depends on the time of day, so an old answer is not reused for long.
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
