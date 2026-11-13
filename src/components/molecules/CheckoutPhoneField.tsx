import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useSaveAddress } from "../../hooks/useAddresses";
import { isIndianMobile } from "../../lib/phone";
import { describeError } from "../../services/errorMapper";
import { useTheme } from "../../theme";
import type { DeliveryAddress } from "../../types/models";
import { Button } from "../atoms/Button";
import { TextField } from "./TextField";

export function CheckoutPhoneField({ address }: { address: DeliveryAddress }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [attempted, setAttempted] = useState(false);
  const save = useSaveAddress();
  const valid = isIndianMobile(phone);
  const error = attempted && !valid
    ? t(phone ? "addresses.invalidPhone" : "addresses.phoneRequired")
    : save.error ? describeError(save.error) : undefined;

  const savePhone = () => {
    setAttempted(true);
    if (valid && !save.isPending) save.mutate({ id: address.id, draft: { ...address, phone } });
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <TextField
        label={t("addresses.mobile")}
        helper={t("checkout.phoneHelp")}
        error={error}
        value={phone}
        editable={!save.isPending}
        keyboardType="phone-pad"
        autoComplete="tel-national"
        maxLength={18}
        returnKeyType="done"
        onSubmitEditing={savePhone}
        onChangeText={(value) => {
          const digits = value.replace(/[૦-૯]/g, (digit) => String(digit.charCodeAt(0) - "૦".charCodeAt(0))).replace(/\D/g, "");
          setPhone(digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits);
          if (save.isError) save.reset();
        }}
      />
      <Button compact variant="secondary" style={{ alignSelf: "flex-start" }} loading={save.isPending} onPress={savePhone}>{t("checkout.savePhone")}</Button>
    </View>
  );
}
