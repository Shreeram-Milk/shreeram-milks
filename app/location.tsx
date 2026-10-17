import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, StatusBar, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationIcon, MapPinIcon } from "../src/icons/appIcons";
import { TextField } from "../src/components/molecules/TextField";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { DeliverySetupHeader } from "../src/components/molecules/DeliverySetupHeader";
import { PinAvailabilityCard } from "../src/components/molecules/PinAvailabilityCard";
import { useScrollResponsiveBottomAction } from "../src/components/organisms/ScrollResponsiveBottomAction";
import { usePinAvailability } from "../src/hooks/usePinAvailability";
import { PIN_CODE } from "../src/services/deliveryAvailabilityService";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { pickDefaultAddress, useAddresses, useSaveAddress } from "../src/hooks/useAddresses";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";
import type { AddressType, DeliveryAddress } from "../src/types/models";

/** Delivery location: the customer types a PIN code and the server says whether, and from when, we deliver there. */
function LocationForm({ prefill }: { prefill: DeliveryAddress | undefined }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setDeliveryPin = useAppStore((state) => state.setDeliveryPin);
  const { bottomActionStyle, onScroll } = useScrollResponsiveBottomAction();
  // A returning customer starts from their default address instead of typing it all again.
  const [pin, setPin] = useState(useAppStore.getState().deliveryPin || prefill?.pincode || "");
  const [address, setAddress] = useState(prefill?.line1 ?? "");
  const [landmark, setLandmark] = useState(prefill?.line2 ?? "");
  const [addressType, setAddressType] = useState<string>(prefill?.addressType ?? "home");
  const customer = useSessionStore((state) => state.customer);
  const { data: savedAddresses } = useAddresses();
  const saveAddress = useSaveAddress();
  const complete = PIN_CODE.test(pin);
  const detailsComplete = address.trim() !== "" && landmark.trim() !== "";
  const { data: availability, isError, isLoading, refetch } = usePinAvailability(pin);

  const next = async () => {
    setDeliveryPin(pin);
    const alreadySaved = (savedAddresses ?? []).some((item) => item.pincode === pin && item.line1.trim().toLowerCase() === address.trim().toLowerCase());
    if (!alreadySaved) {
      try {
        await saveAddress.mutateAsync({
          draft: {
            addressType: addressType as AddressType,
            city: availability?.options[0]?.locality ?? "",
            fullName: customer?.name.trim() || t("account.guest"),
            isDefault: true,
            landmark: "",
            line1: address.trim(),
            line2: landmark.trim(),
            phone: (customer?.phone ?? "").replace(/^\+91/, ""),
            pincode: pin,
          },
        });
      } catch {
        return;
      }
    }
    router.push("/delivery-slot");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        <DeliverySetupHeader
          step={1}
          title={t("location.title")}
          skipLabel={t("location.skip")}
        />
        <KeyboardAwareScrollView
          bottomOffset={104}
          mode="layout"
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: 132,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText
            variant="bodySmall"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("location.description")}
          </ThemedText>
          <TextField
            label={`${t("location.pinLabel")} *`}
            icon={LocationIcon}
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t("location.pinPlaceholder")}
            valid={pin.length === 6}
            value={pin}
          />
          <PinAvailabilityCard
            availability={availability}
            complete={complete}
            isError={isError}
            isLoading={isLoading}
            language={language}
            onRetry={() => void refetch()}
          />
          <TextField
            label={`${t("location.addressLine1")} *`}
            icon={MapPinIcon}
            onChangeText={setAddress}
            value={address}
          />
          <TextField
            label={`${t("location.addressLine2")} *`}
            icon={MapPinIcon}
            onChangeText={setLandmark}
            value={landmark}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
            }}
          >
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("location.saveAs")}
            </ThemedText>
            {(["home", "work", "other"] as const).map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected: addressType === item }}
                onPress={() => setAddressType(item)}
                style={{
                  borderRadius: theme.radii.pill,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor:
                    addressType === item
                      ? theme.colors.colorPrimary
                      : theme.colors.colorSurfaceMuted,
                }}
              >
                <ThemedText
                  variant="caption"
                  weight="semibold"
                  style={{
                    color:
                      addressType === item
                        ? theme.colors.colorTextInverse
                        : theme.colors.colorTextPrimary,
                  }}
                >
                  {t(`addresses.${item}`)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </KeyboardAwareScrollView>
        <KeyboardStickyView
          offset={{ closed: 0, opened: theme.spacing.sm }}
          style={{
            position: "absolute",
            right: theme.spacing.lg,
            bottom: theme.spacing.sm,
            left: theme.spacing.lg,
          }}
        >
          <Animated.View
            style={[
              {
                paddingTop: theme.spacing.xs,
                backgroundColor: theme.colors.colorBackground,
              },
              bottomActionStyle,
            ]}
          >
            <View style={{ paddingBottom: theme.spacing.xs }}>
              {saveAddress.error ? (
                <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger, paddingBottom: theme.spacing.xs }}>
                  {describeError(saveAddress.error)}
                </ThemedText>
              ) : null}
              <Button disabled={!complete || !detailsComplete} loading={saveAddress.isPending} onPress={() => void next()}>
                {t("location.continue")}
              </Button>
            </View>
          </Animated.View>
        </KeyboardStickyView>
      </View>
    </SafeAreaView>
  );
}

/** Waits for the saved addresses so a returning customer sees their address already filled in. A failed load just means a blank form. */
export default function LocationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading } = useAddresses();
  // Never trap the customer on a spinner: if the saved address has not arrived quickly (slow or no connection), show the form.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  if (isLoading && !gaveUp) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground, padding: theme.layout.screenHorizontalPadding }}>
        <StateMessage type="loading" title={t("addresses.loading")} />
      </SafeAreaView>
    );
  }
  return <LocationForm prefill={pickDefaultAddress(data)} />;
}
