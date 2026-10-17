import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Badge } from "../src/components/atoms/Badge";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { SubscriptionBottomSheet } from "../src/components/organisms/SubscriptionBottomSheet";
import { CheckIcon, CloseIcon, EditIcon, LocationIcon } from "../src/icons/appIcons";
import type { IconSvgElement } from "../src/components/atoms/AppIcon";
import { useAddresses, useRemoveAddress, useSaveAddress } from "../src/hooks/useAddresses";
import { describeError } from "../src/services/errorMapper";
import { useTheme } from "../src/theme";
import type { DeliveryAddress } from "../src/types/models";

export default function DeliveryAddressesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: addresses = [], isLoading, isError, refetch } = useAddresses();
  const removeAddress = useRemoveAddress();
  const saveAddress = useSaveAddress();
  const makeDefault = (address: DeliveryAddress) => {
    const { id, ...draft } = address;
    saveAddress.mutate({ id, draft: { ...draft, isDefault: true } });
  };
  const [pendingDelete, setPendingDelete] = useState<DeliveryAddress | null>(null);

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}><StatusBar barStyle="dark-content" /><View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}><ScreenHeader backLabel={t("commonActions.back")} title={t("addresses.title")} /><ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}><ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("addresses.subtitle")}</ThemedText>{isLoading ? <StateMessage type="loading" title={t("addresses.loading")} /> : isError ? <StateMessage type="error" title={t("addresses.errorTitle")} description={t("addresses.errorDetail")} actionLabel={t("addresses.retry")} onAction={() => void refetch()} /> : addresses.length === 0 ? <StateMessage type="empty" icon={LocationIcon} title={t("addresses.emptyTitle")} description={t("addresses.emptyDescription")} /> : addresses.map((address) => <AddressCard key={address.id} address={address} busy={saveAddress.isPending} onMakeDefault={() => makeDefault(address)} onEdit={() => router.push({ pathname: "/delivery-address-form", params: { addressId: address.id } })} onDelete={() => setPendingDelete(address)} />)}{removeAddress.error || saveAddress.error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(removeAddress.error ?? saveAddress.error)}</ThemedText> : null}<Button onPress={() => router.push("/delivery-address-form")}>{t("addresses.add")}</Button></ScrollView></View><SubscriptionBottomSheet visible={pendingDelete !== null} onClose={() => setPendingDelete(null)}><View style={{ gap: theme.spacing.md }}><ThemedText variant="h2">{t("addresses.deleteTitle")}</ThemedText>{pendingDelete ? <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}><ThemedText variant="bodySmall" weight="semibold">{t(`addresses.${pendingDelete.addressType}`)}</ThemedText><ThemedText variant="bodySmall">{[pendingDelete.line1, pendingDelete.line2].filter(Boolean).join(", ")}</ThemedText><ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{[pendingDelete.city, pendingDelete.pincode].filter(Boolean).join(" · ")}</ThemedText></View> : null}<ThemedText style={{ color: theme.colors.colorTextSecondary }}>{t("addresses.deleteDescription")}</ThemedText><View style={{ flexDirection: "row", gap: theme.spacing.sm }}><Button style={{ flex: 1 }} variant="secondary" onPress={() => setPendingDelete(null)}>{t("addresses.cancel")}</Button><Button style={{ flex: 1 }} variant="danger" onPress={() => { if (pendingDelete) removeAddress.mutate(pendingDelete.id); setPendingDelete(null); }}>{t("addresses.confirmDelete")}</Button></View></View></SubscriptionBottomSheet></SafeAreaView>;
}

function AddressCard({ address, busy, onDelete, onEdit, onMakeDefault }: { address: DeliveryAddress; busy: boolean; onDelete: () => void; onEdit: () => void; onMakeDefault: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const lines = [address.line1, address.line2].filter(Boolean).join(", ");
  return (
    <View style={{ borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, overflow: "hidden" }}>
      <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View style={{ width: theme.sizes.avatarMd, height: theme.sizes.avatarMd, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorAccentTint }}>
            <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" />
          </View>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <ThemedText variant="body" weight="semibold">{t(`addresses.${address.addressType}`)}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{address.fullName} · {address.phone}</ThemedText>
          </View>
          {address.isDefault ? <Badge variant="success">{t("addresses.default")}</Badge> : null}
        </View>
        <View style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="bodySmall">{lines}</ThemedText>
          {address.landmark ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{address.landmark}</ThemedText> : null}
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{[address.city, address.pincode].filter(Boolean).join(" · ")}</ThemedText>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, padding: theme.spacing.md, borderTopWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurfaceMuted }}>
        <ActionButton icon={EditIcon} label={t("addresses.editShort")} accessibilityLabel={t("addresses.edit")} onPress={onEdit} />
        {address.isDefault ? null : <ActionButton icon={CheckIcon} label={t("addresses.makeDefault")} disabled={busy} onPress={onMakeDefault} />}
        <ActionButton icon={CloseIcon} label={t("addresses.removeShort")} accessibilityLabel={t("addresses.delete")} danger onPress={onDelete} />
      </View>
    </View>
  );
}

/** A labelled action, so the customer never has to guess what an icon does. */
function ActionButton({ accessibilityLabel, danger = false, disabled = false, icon, label, onPress }: { accessibilityLabel?: string; danger?: boolean; disabled?: boolean; icon: IconSvgElement; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={theme.spacing.xs}
      onPress={onPress}
      style={{ minHeight: theme.layout.touchTargetMin, flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.pill, borderWidth: theme.borderWidths.hairline, borderColor: danger ? theme.colors.colorDanger : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, opacity: disabled ? 0.5 : 1 }}
    >
      <AppIcon icon={icon} accessibilityLabel="" size="sm" tone={danger ? "danger" : "secondary"} />
      <ThemedText variant="bodySmall" weight="semibold" style={{ color: danger ? theme.colors.colorDanger : theme.colors.colorTextPrimary }}>{label}</ThemedText>
    </Pressable>
  );
}
