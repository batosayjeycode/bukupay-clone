import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }) {
  const { phone, channel } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const { verifyOtp, requestOtp, isLoading } = useAuthStore();
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    // Handle paste (paste all 6 digits)
    if (value.length === OTP_LENGTH) {
      const digits = value.split('').slice(0, OTP_LENGTH);
      setOtp(digits);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // ambil karakter terakhir
    setOtp(newOtp);
    setError('');

    // Auto-focus next
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit jika sudah lengkap
    const filled = newOtp.join('');
    if (filled.length === OTP_LENGTH) {
      handleVerify(filled);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode) => {
    const code = otpCode || otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Masukkan 6 digit kode OTP');
      return;
    }

    try {
      setError('');
      await verifyOtp(phone, code);
      // Navigation akan otomatis berubah via RootNavigator
    } catch (err) {
      if (err.message === 'OTP_INVALID') {
        setError('Kode OTP salah. Periksa kembali.');
      } else if (err.message === 'OTP_EXPIRED') {
        setError('Kode OTP sudah kedaluwarsa. Minta kode baru.');
      } else if (err.message === 'TOO_MANY_ATTEMPTS') {
        Alert.alert(
          'Batas Percobaan',
          'Terlalu banyak percobaan salah. Coba lagi dalam 15 menit.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
      // Reset OTP input
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await requestOtp(phone);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      Alert.alert('Gagal', 'Tidak dapat mengirim ulang OTP. Coba lagi.');
    }
  };

  const maskedPhone = phone.slice(0, 4) + '****' + phone.slice(-4);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Kembali</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>Masukkan Kode OTP</Text>
        <Text style={styles.subtitle}>
          Kode dikirim via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ke{'\n'}
          <Text style={styles.phoneText}>{maskedPhone}</Text>
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.otpInput,
              digit ? styles.otpInputFilled : null,
              error ? styles.otpInputError : null,
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={OTP_LENGTH}
            selectTextOnFocus
            caretHidden
          />
        ))}
      </View>

      {error ? (
        <Text style={styles.errorText}>⚠️ {error}</Text>
      ) : null}

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.button, (otp.join('').length < OTP_LENGTH || isLoading) && styles.buttonDisabled]}
        onPress={() => handleVerify()}
        disabled={otp.join('').length < OTP_LENGTH || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verifikasi ✓</Text>
        )}
      </TouchableOpacity>

      {/* Resend */}
      <View style={styles.resendContainer}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Kirim ulang kode OTP</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.resendTimer}>
            Kirim ulang dalam{' '}
            <Text style={styles.timerText}>{countdown}s</Text>
          </Text>
        )}
      </View>

      {/* SMS Fallback hint */}
      {channel === 'whatsapp' && (
        <TouchableOpacity style={styles.smsHint} onPress={handleResend}>
          <Text style={styles.smsHintText}>
            Tidak menerima via WhatsApp?{' '}
            <Text style={styles.smsLink}>Coba via SMS</Text>
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 60,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E1E3F',
    backgroundColor: '#12122A',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#6C63FF',
    backgroundColor: '#1A1A35',
  },
  otpInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
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
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendTimer: {
    color: '#6B7280',
    fontSize: 14,
  },
  timerText: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  resendLink: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  smsHint: {
    alignItems: 'center',
    marginTop: 16,
  },
  smsHintText: {
    color: '#6B7280',
    fontSize: 13,
  },
  smsLink: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});
