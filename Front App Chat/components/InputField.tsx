import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/globalStyles';

interface InputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  label?: string;
}

export default function InputField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  label,
}: InputFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Ensure we're not rendering any text nodes directly in a View
  const renderLabel = () => {
    if (!label) return null;
    return <Text style={styles.label}>{label}</Text>;
  };

  const renderError = () => {
    if (!error) return null;
    return <Text style={styles.errorText}>{error}</Text>;
  };

  return (
    <View style={styles.container}>
      {renderLabel()}
      <View style={[
        styles.inputContainer,
        shadows.sm,
        isFocused && styles.focusedContainer,
        error && styles.errorContainer
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility} 
            style={styles.eyeIcon}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? 
              <EyeOff size={20} color={colors.textSecondary} /> : 
              <Eye size={20} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        )}
      </View>
      {renderError()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subhead,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  focusedContainer: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  errorContainer: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  eyeIcon: {
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption1,
    color: colors.error,
    marginTop: spacing.xs,
  },
});