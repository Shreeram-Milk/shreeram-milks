import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconButton } from '../atoms/IconButton';
import { ThemedText } from '../atoms/ThemedText';
import { BackIcon } from '../../icons/appIcons';
import { useTheme } from '../../theme';

interface DeliverySetupHeaderProps {
  step: 1 | 2 | 3;
  title: string;
  skipLabel: string;
  onBack?: () => void;
}

export function DeliverySetupHeader({ step, title, skipLabel, onBack }: DeliverySetupHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return <View style={{ gap: theme.spacing.sm }}>
    <View style={{ minHeight: theme.sizes.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
      <IconButton icon={BackIcon} label={t('deliverySetup.back')} onPress={onBack ?? (() => router.back())} />
      <ThemedText variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>{title}</ThemedText>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/home')} hitSlop={theme.spacing.sm} style={{ minWidth: theme.layout.touchTargetMin, minHeight: theme.layout.touchTargetMin, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{skipLabel}</ThemedText>
      </Pressable>
    </View>
    <View style={{ gap: theme.spacing.xs }}>
      <ThemedText variant="caption" weight="bold" style={{ textAlign: 'center', color: theme.colors.colorTextSecondary }}>{t('deliverySetup.step', { step })}</ThemedText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {([1, 2, 3] as const).map(item => <View key={item} style={{ flex: 1, height: theme.spacing.xs, borderRadius: theme.radii.pill, backgroundColor: step >= item ? theme.colors.colorPrimary : theme.colors.colorBorder }} />)}
      </View>
    </View>
  </View>;
}
