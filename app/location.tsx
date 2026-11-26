import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, Pressable, StatusBar, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationIcon, MapPinIcon } from "../src/icons/appIcons";
import { TextField } from "../src/components/molecules/TextField";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { DeliverySetupHeader } from "../src/components/molecules/DeliverySetupHeader";
import { ACTION_BAR_SPACE, KeyboardActionBar } from "../src/components/organisms/KeyboardActionBar";
import { AddressKindPicker } from "../src/components/molecules/AddressKindPicker";
import { DeliveryDetailsFields } from "../src/components/organisms/DeliveryDetailsFields";
import { parseDeliveryDetails } from "../src/lib/deliveryDetails";
import { DeliveryPlacePicker } from "../src/components/organisms/DeliveryPlacePicker";
import { useDeliveryPlaces } from "../src/hooks/useDeliveryPlaces";
import { usePinAvailability } from "../src/hooks/usePinAvailability";
import { PIN_CODE } from "../src/services/deliveryAvailabilityService";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { pickDefaultAddress, useAddresses, useSaveAddress } from "../src/hooks/useAddresses";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";
import type { AddressKind, AddressType, DeliveryAddress } from "../src/types/models";

/** Onboarding keeps the PIN/home choice separate from address entry; the existing preferences screen is step three. */
function LocationForm({ prefill }: { prefill: DeliveryAddress | undefined }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const setDeliveryPin = useAppStore((state) => state.setDeliveryPin);
  // A returning customer starts from their default address instead of typing it all again.
  const [pin, setPin] = useState(useAppStore.getState().deliveryPin || prefill?.pincode || "");
  const [address, setAddress] = useState(prefill?.line1 ?? "");
  const [landmark, setLandmark] = useState(prefill?.line2 ?? "");
  const [addressType, setAddressType] = useState<string>(prefill?.addressType ?? "home");
  const customer = useSessionStore((state) => state.customer);
  const { data: savedAddresses } = useAddresses();
  const saveAddress = useSaveAddress();
  const complete = PIN_CODE.test(pin);
  const [addressKind, setAddressKind] = useState<AddressKind>(prefill?.addressKind ?? (prefill ? "unspecified" : "society"));
  const [deliveryPlaceId, setDeliveryPlaceId] = useState(prefill?.deliveryPlaceId ?? null);
  const [deliveryPlaceName, setDeliveryPlaceName] = useState(prefill?.deliveryPlaceName ?? "");
  const [locality, setLocality] = useState(prefill?.locality ?? "");
  const [deliveryDetails, setDeliveryDetails] = useState(parseDeliveryDetails(prefill?.deliveryDetails));
  const [deliveryDetailsConfirmed, setDeliveryDetailsConfirmed] = useState(prefill?.deliveryDetailsConfirmed === true);
  const [placeConfirmed, setPlaceConfirmed] = useState(Boolean(prefill?.deliveryPlaceId || prefill?.deliveryPlaceName));
  const places = useDeliveryPlaces(pin, addressKind === "society" ? "society" : "locality", deliveryPlaceName, step === 2 && addressKind !== "unspecified" && !placeConfirmed);
  const clearPlace = () => { setDeliveryDetailsConfirmed(false); setDeliveryPlaceId(null); setDeliveryPlaceName(""); setPlaceConfirmed(false); };
  const detailsComplete = address.trim() !== "" && (addressKind === "unspecified" || (addressKind === "independent" && !deliveryPlaceName.trim()) || (placeConfirmed && Boolean(deliveryPlaceName.trim())));
  const addPlace = () => Alert.alert(t("addresses.confirmPlaceTitle"), t("addresses.confirmPlaceBody", { name: deliveryPlaceName.trim(), pin }), [
    { text: t("addresses.cancel"), style: "cancel" },
    { text: t("addresses.confirmPlace"), onPress: () => { setDeliveryPlaceName(deliveryPlaceName.trim()); setPlaceConfirmed(true); } },
  ]);
  const { data: availability, isError, isLoading, refetch } = usePinAvailability(pin);

  useFocusEffect(useCallback(() => {
    if (step !== 2) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setStep(1);
      return true;
    });
    return () => subscription.remove();
  }, [step]));

  const next = async () => {
    if (!complete || addressKind === "unspecified" || saveAddress.isPending) return;
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!detailsComplete || !deliveryDetailsConfirmed) return;
    setDeliveryPin(pin);
    const alreadySaved = (savedAddresses ?? []).some((item) => item.pincode === pin && item.line1.trim().toLowerCase() === address.trim().toLowerCase() && item.line2.trim() === landmark.trim() && (item.addressKind ?? "unspecified") === addressKind && (item.deliveryPlaceId ?? null) === deliveryPlaceId && (item.deliveryPlaceName ?? "") === deliveryPlaceName && (item.locality ?? "") === locality && JSON.stringify(parseDeliveryDetails(item.deliveryDetails)) === JSON.stringify(deliveryDetails) && item.deliveryDetailsConfirmed === true);
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
            addressKind, deliveryPlaceId, deliveryPlaceName, locality, deliveryDetails, deliveryDetailsConfirmed,
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
          step={step}
          title={t(step === 1 ? "location.title" : "location.addressTitle")}
          skipLabel={t("location.skip")}
          onBack={step === 2 ? () => setStep(1) : undefined}
        />
        <KeyboardAwareScrollView
          key={step}
          bottomOffset={ACTION_BAR_SPACE}
          mode="layout"
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText
            variant="bodySmall"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t(step === 1 ? "location.description" : "location.addressDescription")}
          </ThemedText>
          {step === 1 ? <>
          <TextField
            label={`${t("location.pinLabel")} *`}
            icon={LocationIcon}
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => { setPin(value.replace(/\D/g, "").slice(0, 6)); clearPlace(); setLocality(""); }}
            placeholder={t("location.pinPlaceholder")}
            valid={pin.length === 6}
            value={pin}
          />
          {complete && (isLoading || isError || availability?.options.length === 0) ? <View accessibilityLiveRegion="polite" style={{ gap: theme.spacing.xs }}>
            <ThemedText variant="caption" style={{ color: isError ? theme.colors.colorDanger : theme.colors.colorTextSecondary }}>
              {t(isLoading ? "location.checking" : isError ? "location.errorTitle" : "location.unservedCompact")}
            </ThemedText>
            {isError ? <Pressable accessibilityRole="button" onPress={() => void refetch()} style={{ minHeight: theme.layout.touchTargetMin, justifyContent: "center", alignSelf: "flex-start" }}>
              <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t("common.retry")}</ThemedText>
            </Pressable> : null}
          </View> : null}
          <AddressKindPicker value={addressKind} showLegacy={false} onChange={kind => { if (kind === addressKind) return; setAddressKind(kind); setDeliveryDetails(current => kind === "society" ? { ...current, lane: "" } : { ...current, building: "", towerWing: "" }); clearPlace(); }} />
          </> : <>
          {addressKind !== "unspecified" ? <DeliveryPlacePicker
            kind={addressKind === "society" ? "society" : "locality"} name={deliveryPlaceName} selected={placeConfirmed} pinValid={complete}
            places={places.data ?? []} loading={places.isFetching || places.isDebouncing} failed={places.isError}
            onChange={name => { setDeliveryDetailsConfirmed(false); setDeliveryPlaceName(name); setDeliveryPlaceId(null); setPlaceConfirmed(false); }}
            onPick={place => { setDeliveryDetailsConfirmed(false); setDeliveryPlaceId(place.id); setDeliveryPlaceName(place.name); setLocality(place.locality); setPlaceConfirmed(true); }}
            onAdd={addPlace} onClear={clearPlace} onRetry={() => void places.refetch()}
          /> : null}
          <TextField label={t("addresses.locality")} value={locality} onChangeText={value => { setLocality(value); setDeliveryDetailsConfirmed(false); }} maxLength={150} editable={!deliveryPlaceId} helper={deliveryPlaceId ? t("addresses.placeLocalityLocked") : undefined} />
          <TextField
            label={`${t(addressKind === "independent" ? "addresses.houseDirections" : "location.addressLine1")} *`}
            helper={addressKind === "independent" ? t("addresses.houseDirectionsHelp") : undefined}
            maxLength={150}
            icon={MapPinIcon}
            onChangeText={value => { setAddress(value); setDeliveryDetailsConfirmed(false); }}
            value={address}
          />
          <TextField
            label={t("addresses.streetOptional")}
            maxLength={150}
            icon={MapPinIcon}
            onChangeText={value => { setLandmark(value); setDeliveryDetailsConfirmed(false); }}
            value={landmark}
          />
          <DeliveryDetailsFields kind={addressKind} value={deliveryDetails} confirmed={deliveryDetailsConfirmed} onChange={value => { setDeliveryDetails(value); setDeliveryDetailsConfirmed(false); }} onConfirm={setDeliveryDetailsConfirmed} />
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
          </>}
        </KeyboardAwareScrollView>
        <KeyboardActionBar>
          {step === 2 && saveAddress.error ? (
            <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>
              {describeError(saveAddress.error)}
            </ThemedText>
          ) : null}
          <Button disabled={!complete || addressKind === "unspecified" || (step === 2 && (!detailsComplete || !deliveryDetailsConfirmed))} loading={saveAddress.isPending} onPress={() => void next()}>
            {t(step === 1 ? "location.continueAddress" : "location.continue")}
          </Button>
        </KeyboardActionBar>
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
