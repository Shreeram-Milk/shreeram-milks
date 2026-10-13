import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { AppInput } from "../atoms/AppInput";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { SubscriptionBottomSheet } from "./SubscriptionBottomSheet";
import { BackIcon, EditIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";

interface DetailRow {
  detail: string;
  icon: IconSvgElement;
  title: string;
}
interface ProfileDetailScreenProps {
  rows: DetailRow[];
  subtitle: string;
  title: string;
}

export function ProfileDetailScreen({
  rows,
  subtitle,
  title,
}: ProfileDetailScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [editableRows, setEditableRows] = useState(rows);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft(editableRows[index].detail);
  };
  const save = () => {
    if (editingIndex === null) return;
    setEditableRows((current) =>
      current.map((row, index) =>
        index === editingIndex ? { ...row, detail: draft } : row,
      ),
    );
    setEditingIndex(null);
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.layout.screenHorizontalPadding,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
      >
        <View
          style={{
            minHeight: theme.sizes.buttonHeight,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("profileDetail.back")}
            onPress={() => router.back()}
            style={{
              width: theme.layout.touchTargetMin,
              height: theme.layout.touchTargetMin,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon icon={BackIcon} accessibilityLabel="" />
          </Pressable>
          <ThemedText variant="h2">{title}</ThemedText>
        </View>
        <ThemedText
          variant="bodySmall"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {subtitle}
        </ThemedText>
        <View
          style={{
            overflow: "hidden",
            borderRadius: theme.radii.lg,
            borderWidth: theme.borderWidths.hairline,
            borderColor: theme.colors.colorBorder,
            backgroundColor: theme.colors.colorSurface,
          }}
        >
          {editableRows.map((row, index) => (
            <View
              key={row.title}
              style={{
                minHeight: theme.layout.touchTargetMin + theme.spacing.md,
                padding: theme.spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                borderBottomWidth:
                  index === editableRows.length - 1
                    ? theme.borderWidths.none
                    : theme.borderWidths.hairline,
                borderColor: theme.colors.colorBorder,
              }}
            >
              <View
                style={{
                  width: theme.sizes.avatarMd,
                  height: theme.sizes.avatarMd,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.colorSurfaceMuted,
                }}
              >
                <AppIcon icon={row.icon} accessibilityLabel="" size="sm" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText variant="bodySmall" weight="semibold">
                  {row.title}
                </ThemedText>
                <ThemedText
                  variant="caption"
                  style={{ color: theme.colors.colorTextSecondary }}
                >
                  {row.detail}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("profileDetail.editRow", { title: row.title })}
                onPress={() => startEdit(index)}
                hitSlop={theme.spacing.xs}
                style={{
                  width: theme.layout.touchTargetMin,
                  height: theme.layout.touchTargetMin,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon
                  icon={EditIcon}
                  accessibilityLabel=""
                  size="sm"
                  tone="secondary"
                />
              </Pressable>
            </View>
          ))}
        </View>
        <Button variant="secondary" onPress={() => router.back()}>
          {t("profileDetail.done")}
        </Button>
      </ScrollView>
      <SubscriptionBottomSheet
        visible={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
      >
        <View style={{ gap: theme.spacing.md }}>
          <ThemedText variant="h2">
            {editingIndex === null
              ? t("profileDetail.edit")
              : t("profileDetail.editRow", { title: editableRows[editingIndex].title })}
          </ThemedText>
          <AppInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            accessibilityLabel={
              editingIndex === null
                ? t("profileDetail.updatedDetails")
                : t("profileDetail.editRow", {
                    title: editableRows[editingIndex].title,
                  })
            }
            placeholder={
              editingIndex === null
                ? t("profileDetail.updatedDetails")
                : editableRows[editingIndex].detail
            }
          />
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => setEditingIndex(null)}
            >
              {t("profileDetail.cancel")}
            </Button>
            <Button style={{ flex: 1 }} onPress={save}>
              {t("profileDetail.save")}
            </Button>
          </View>
        </View>
      </SubscriptionBottomSheet>
    </SafeAreaView>
  );
}
