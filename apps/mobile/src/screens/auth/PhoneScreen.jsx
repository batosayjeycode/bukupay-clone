import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';

const PHONE_REGEX = /^(\+62|62|0)[0-9]{9,13}$/;

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { requestOtp, isLoading } = useAuthStore();

  const handleSubmit = async () => {
    const trimmed = phone.trim();

    if (!PHONE_REGEX.test(trimmed)) {
      setError('Nomor telepon tidak valid. Contoh: 081234567890');
      return;
    }

    setError('');

    try {
      const result = await requestOtp(trimmed);
      navigation.navigate('Otp', { phone: trimmed, channel: result.channel });
    } catch (err) {
      const msg = err.message || 'Gagal mengirim OTP. Coba lagi.';
      if (msg === 'TOO_MANY_ATTEMPTS') {
        Alert.alert('Batas Percobaan', 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>💳</Text>
        </View>
        <Text style={styles.appName}>BukuPay</Text>
        <Text style={styles.tagline}>Platform QRIS untuk UMKM Indonesia</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Masuk atau Daftar</Text>
        <Text style={styles.subtitle}>
          Masukkan nomor HP Anda untuk menerima kode OTP
        </Text>

        <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
          <Text style={styles.prefix}>🇮🇩 +62</Text>
          <TextInput
            style={styles.input}
            placeholder="81234567890"
            placeholderTextColor="#4B5563"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (error) setError('');
            }}
            keyboardType="phone-pad"
            maxLength={15}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!phone || isLoading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!phone || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kirim Kode OTP →</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Dengan melanjutkan, Anda menyetujui{' '}
          <Text style={styles.link}>Syarat & Ketentuan</Text> dan{' '}
          <Text style={styles.link}>Kebijakan Privasi</Text> kami.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E1E3F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6C63FF40',
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1.2,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 28,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E3F',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  prefix: {
    fontSize: 15,
    color: '#9CA3AF',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});
