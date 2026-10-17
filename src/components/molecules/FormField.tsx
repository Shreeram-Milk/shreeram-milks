import type { IconSvgElement } from '../atoms/AppIcon';
import type { TextInputProps } from 'react-native';
import { TextField } from './TextField';

interface FormFieldProps extends Omit<TextInputProps, 'style'> { error?: string; helper?: string; icon?: IconSvgElement; label: string; valid?: boolean; }

/** The app's form field: a floating-label field with an optional icon, helper text, error and tick. See TextField. */
export function FormField(props: FormFieldProps) { return <TextField {...props} />; }
