import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { Animated, Easing, StatusBar, Switch, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { Chip } from "../src/components/atoms/Chip";
import { LocationIcon, MapPinIcon, PhoneIcon, ProfileIcon } from "../src/icons/appIcons";
import { FormField } from "../src/components/molecules/FormField";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useAddresses, useSaveAddress } from "../src/hooks/useAddresses";
import { describeError } from "../src/services/errorMapper";
import { useToast } from "../src/providers/ToastProvider";
import { useTheme } from "../src/theme";
import type { AddressType, DeliveryAddress } from "../src/types/models";

type AddressFormValues = Omit<DeliveryAddress, "id">;

function AddressForm({ existing, addresses }: { existing: DeliveryAddress | undefined; addresses: DeliveryAddress[] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const save = useSaveAddress();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState("");
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
    trigger,
  } = useForm<AddressFormValues>({
    defaultValues: existing ?? {
      addressType: "home",
      city: "",
      fullName: "",
      isDefault: addresses.length === 0,
      landmark: "",
      line1: "",
      line2: "",
      phone: "",
      pincode: "",
    },
  });
  const [step, setStep] = useState(1);
  const [stepX] = useState(() => new Animated.Value(0));
  const [stepOpacity] = useState(() => new Animated.Value(1));
  const addressType = useWatch({ control, name: "addressType" });
  const isDefault = useWatch({ control, name: "isDefault" });

  const transitionToStep = (nextStep: number, direction: 1 | -1) => {
    Animated.parallel([
      Animated.timing(stepX, {
        toValue: -direction * theme.motion.entranceOffset,
        duration: theme.motion.duration.fast,
        easing: Easing.bezier(...theme.motion.easing.accelerate),
        useNativeDriver: true,
      }),
      Animated.timing(stepOpacity, {
        toValue: 0,
        duration: theme.motion.duration.fast,
        easing: Easing.bezier(...theme.motion.easing.accelerate),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setStep(nextStep);
      stepX.setValue(direction * theme.motion.entranceOffset);
      Animated.parallel([
        Animated.timing(stepX, {
          toValue: 0,
          duration: theme.motion.duration.normal,
          easing: Easing.bezier(...theme.motion.easing.decelerate),
          useNativeDriver: true,
        }),
        Animated.timing(stepOpacity, {
          toValue: 1,
          duration: theme.motion.duration.normal,
          easing: Easing.bezier(...theme.motion.easing.decelerate),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const nextStep = async () => {
    if (!(await trigger(["fullName", "phone"]))) return;
    transitionToStep(2, 1);
  };

  const submit = async (values: AddressFormValues) => {
    setServerError("");
    try {
      await save.mutateAsync({
        id: existing?.id,
        draft: {
          ...values,
          fullName: values.fullName.trim(),
          line1: values.line1.trim(),
          line2: values.line2.trim(),
          city: values.city.trim(),
          phone: values.phone.replace(/\D/g, ""),
        },
      });
      showToast(t("toast.addressSaved"));
      router.back();
    } catch (failure) {
      setServerError(describeError(failure));
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.layout.screenHorizontalPadding,
        }}
      >
        <ScreenHeader
          backLabel={t("commonActions.back")}
          title={t(
            existing ? "addresses.formTitleEdit" : "addresses.formTitleAdd",
          )}
        />
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.xs,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              height: theme.spacing.xs,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.colorPrimary,
            }}
          />
          <View
            style={{
              flex: 1,
              height: theme.spacing.xs,
              borderRadius: theme.radii.pill,
              backgroundColor:
                step === 2
                  ? theme.colors.colorPrimary
                  : theme.colors.colorBorder,
            }}
          />
        </View>
        <Animated.View
          style={{
            flex: 1,
            opacity: stepOpacity,
            transform: [{ translateX: stepX }],
          }}
        >
          <KeyboardAwareScrollView
            mode="layout"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              gap: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              paddingBottom: theme.spacing.xxl,
            }}
          >
            {step === 1 ? (
              <>
                <Controller
                  control={control}
                  name="fullName"
                  rules={{
                    validate: (value) =>
                      Boolean(value.trim()) || t("addresses.required"),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.fullName")}
                      icon={ProfileIcon}
                      value={value}
                      onChangeText={onChange}
                      error={errors.fullName?.message}
                      autoComplete="name"
                      returnKeyType="next"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="phone"
                  rules={{
                    required: t("addresses.required"),
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: t("addresses.invalidPhone"),
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.mobile")}
                      icon={PhoneIcon}
                      value={value}
                      onChangeText={onChange}
                      error={errors.phone?.message}
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoComplete="tel"
                    />
                  )}
                />
                <Button onPress={nextStep}>
                  {t("commonActions.continue")}
                </Button>
              </>
            ) : (
              <>
                <Controller
                  control={control}
                  name="line1"
                  rules={{
                    validate: (value) =>
                      Boolean(value.trim()) || t("addresses.required"),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.line1")}
                      icon={MapPinIcon}
                      value={value}
                      onChangeText={onChange}
                      error={errors.line1?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="line2"
                  rules={{
                    validate: (value) =>
                      Boolean(value.trim()) || t("addresses.required"),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.line2")}
                      icon={MapPinIcon}
                      value={value}
                      onChangeText={onChange}
                      error={errors.line2?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="landmark"
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.landmark")}
                      icon={LocationIcon}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="pincode"
                  rules={{
                    required: t("addresses.required"),
                    pattern: {
                      value: /^\d{6}$/,
                      message: t("addresses.invalidPincode"),
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.pincode")}
                      icon={LocationIcon}
                      value={value}
                      onChangeText={onChange}
                      error={errors.pincode?.message}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="city"
                  rules={{
                    validate: (value) =>
                      Boolean(value.trim()) || t("addresses.required"),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      label={t("addresses.city")}
                      icon={MapPinIcon}
                      value={value}
                      onChangeText={onChange}
                      error={errors.city?.message}
                    />
                  )}
                />
                <View style={{ gap: theme.spacing.sm }}>
                  <ThemedText variant="bodySmall">
                    {t("addresses.type")}
                  </ThemedText>
                  <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                    {(["home", "work", "other"] as AddressType[]).map(
                      (type) => (
                        <Chip
                          key={type}
                          selected={addressType === type}
                          onPress={() => setValue("addressType", type)}
                        >
                          {t(`addresses.${type}`)}
                        </Chip>
                      ),
                    )}
                  </View>
                </View>
                <View
                  style={{
                    minHeight: theme.layout.touchTargetMin,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: theme.spacing.md,
                  }}
                >
                  <ThemedText variant="bodySmall" style={{ flex: 1 }}>
                    {t("addresses.setDefault")}
                  </ThemedText>
                  <Switch
                    accessibilityLabel={t("addresses.setDefault")}
                    value={isDefault}
                    onValueChange={(value) => setValue("isDefault", value)}
                    trackColor={{
                      false: theme.colors.colorSurfaceDisabled,
                      true: theme.colors.colorPrimaryTint,
                    }}
                    thumbColor={
                      isDefault
                        ? theme.colors.colorPrimary
                        : theme.colors.colorTextDisabled
                    }
                  />
                </View>
                {serverError ? (
                  <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>
                    {serverError}
                  </ThemedText>
                ) : null}
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1 }}
                    onPress={() => transitionToStep(1, -1)}
                  >
                    {t("commonActions.back")}
                  </Button>
                  <Button
                    style={{ flex: 1 }}
                    loading={isSubmitting}
                    onPress={handleSubmit(submit)}
                  >
                    {t(isSubmitting ? "addresses.saving" : "addresses.save")}
                  </Button>
                </View>
              </>
            )}
          </KeyboardAwareScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

/** Loads the saved addresses first, so an edit always starts from the saved record. */
export default function DeliveryAddressFormScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { addressId } = useLocalSearchParams<{ addressId?: string }>();
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  if (isLoading || isError || !addresses) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground, padding: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("addresses.title")} />
        {isError ? <StateMessage type="error" title={t("addresses.errorTitle")} description={t("addresses.errorDetail")} actionLabel={t("addresses.retry")} onAction={() => void refetch()} /> : <StateMessage type="loading" title={t("addresses.loading")} />}
      </SafeAreaView>
    );
  }
  return <AddressForm key={addressId ?? "new"} existing={addresses.find((address) => address.id === addressId)} addresses={addresses} />;
}
