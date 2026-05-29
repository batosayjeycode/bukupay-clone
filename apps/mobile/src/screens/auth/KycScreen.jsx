import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { kycApi } from '../../api/services';
import { useAuthStore } from '../../stores/authStore';

const STEPS = ['KTP', 'Selfie', 'Selesai'];

export default function KycScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [ktpImage, setKtpImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const { updateUser } = useAuthStore();

  const pickImage = async (type, setter) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
    };

    Alert.alert(
      `Upload ${type}`,
      'Pilih sumber foto',
      [
        {
          text: 'Kamera',
          onPress: async () => {
            const result = await launchCamera(options);
            if (!result.didCancel && result.assets?.[0]) {
              setter(result.assets[0]);
            }
          },
        },
        {
          text: 'Galeri',
          onPress: async () => {
            const result = await launchImageLibrary(options);
            if (!result.didCancel && result.assets?.[0]) {
              setter(result.assets[0]);
            }
          },
        },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const uploadKtp = async () => {
    if (!ktpImage) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('ktp', {
        uri: ktpImage.uri,
        type: ktpImage.type || 'image/jpeg',
        name: 'ktp.jpg',
      });

      const result = await kycApi.uploadKtp(formData);
      setOcrResult(result.data?.ocrData);
      setCurrentStep(1);
    } catch (err) {
      Alert.alert('Gagal', 'Upload KTP gagal. Pastikan foto jelas dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadSelfie = async () => {
    if (!selfieImage) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('selfie', {
        uri: selfieImage.uri,
        type: selfieImage.type || 'image/jpeg',
        name: 'selfie.jpg',
      });

      const result = await kycApi.uploadSelfie(formData);

      if (result.data?.status === 'VERIFIED') {
        setCurrentStep(2);
        updateUser({ kycStatus: 'VERIFIED' });
      } else {
        Alert.alert(
          'Verifikasi Gagal',
          'Foto selfie tidak cocok dengan KTP. Pastikan wajah Anda terlihat jelas.',
          [{ text: 'Coba Lagi', onPress: () => setSelfieImage(null) }]
        );
      }
    } catch (err) {
      Alert.alert('Gagal', 'Upload selfie gagal. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index <= currentStep && styles.stepCircleActive,
                index < currentStep && styles.stepCircleDone,
              ]}
            >
              <Text style={styles.stepNumber}>
                {index < currentStep ? '✓' : index + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>
              {step}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View style={[styles.stepLine, index < currentStep && styles.stepLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Foto KTP</Text>
      <Text style={styles.stepDesc}>
        Pastikan foto KTP Anda jelas, tidak blur, dan semua tulisan bisa terbaca.
      </Text>

      <TouchableOpacity
        style={[styles.uploadBox, ktpImage && styles.uploadBoxFilled]}
        onPress={() => pickImage('KTP', setKtpImage)}
      >
        {ktpImage ? (
          <Image source={{ uri: ktpImage.uri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <>
            <Text style={styles.uploadIcon}>🪪</Text>
            <Text style={styles.uploadText}>Tap untuk upload KTP</Text>
            <Text style={styles.uploadHint}>JPG / PNG, max 5MB</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📋 Tips foto KTP yang baik:</Text>
        <Text style={styles.tip}>✅ Letakkan KTP di permukaan datar</Text>
        <Text style={styles.tip}>✅ Pastikan cahaya cukup dan merata</Text>
        <Text style={styles.tip}>✅ Jangan sampai ada pantulan cahaya</Text>
        <Text style={styles.tip}>❌ Jangan foto dengan sudut miring</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!ktpImage || isLoading) && styles.buttonDisabled]}
        onPress={uploadKtp}
        disabled={!ktpImage || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Lanjut → Upload Selfie</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Selfie</Text>
      {ocrResult?.name && (
        <View style={styles.ocrResult}>
          <Text style={styles.ocrLabel}>Data dari KTP berhasil dibaca:</Text>
          <Text style={styles.ocrName}>👤 {ocrResult.name}</Text>
          {ocrResult.nik && <Text style={styles.ocrNik}>NIK: {ocrResult.nik}</Text>}
        </View>
      )}

      <Text style={styles.stepDesc}>
        Foto selfie akan dicocokkan dengan foto di KTP Anda.
      </Text>

      <TouchableOpacity
        style={[styles.uploadBox, selfieImage && styles.uploadBoxFilled, styles.selfieBox]}
        onPress={() => pickImage('Selfie', setSelfieImage)}
      >
        {selfieImage ? (
          <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <>
            <Text style={styles.uploadIcon}>🤳</Text>
            <Text style={styles.uploadText}>Tap untuk ambil selfie</Text>
            <Text style={styles.uploadHint}>Hadapkan kamera ke wajah Anda</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, (!selfieImage || isLoading) && styles.buttonDisabled]}
        onPress={uploadSelfie}
        disabled={!selfieImage || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verifikasi Identitas ✓</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={[styles.stepContent, styles.successContainer]}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Verifikasi Berhasil!</Text>
      <Text style={styles.successDesc}>
        Identitas Anda telah terverifikasi. Sekarang Anda bisa mulai menggunakan BukuPay.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => updateUser({ kycStatus: 'VERIFIED' })}
      >
        <Text style={styles.buttonText}>Mulai Gunakan BukuPay 🚀</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />

      <Text style={styles.headerTitle}>Verifikasi Identitas</Text>
      <Text style={styles.headerSubtitle}>
        Diperlukan untuk mengaktifkan akun BukuPay Anda
      </Text>

      {renderStepIndicator()}

      {currentStep === 0 && renderStep0()}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A' },
  content: { padding: 24, paddingBottom: 40 },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 60,
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 32 },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E3F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2D2D5E',
  },
  stepCircleActive: { borderColor: '#6C63FF', backgroundColor: '#1A1A35' },
  stepCircleDone: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  stepNumber: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  stepLabel: { color: '#6B7280', fontSize: 11, marginTop: 4 },
  stepLabelActive: { color: '#6C63FF' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#1E1E3F', marginBottom: 16 },
  stepLineDone: { backgroundColor: '#6C63FF' },
  stepContent: {},
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepDesc: { fontSize: 14, color: '#9CA3AF', marginBottom: 20, lineHeight: 20 },
  uploadBox: {
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E1E3F',
    borderStyle: 'dashed',
    backgroundColor: '#12122A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  uploadBoxFilled: { borderStyle: 'solid', borderColor: '#6C63FF' },
  selfieBox: { height: 220, borderRadius: 110 },
  previewImage: { width: '100%', height: '100%' },
  uploadIcon: { fontSize: 48, marginBottom: 12 },
  uploadText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  uploadHint: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  ocrResult: {
    backgroundColor: '#1E1E3F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  ocrLabel: { color: '#10B981', fontSize: 12, marginBottom: 8 },
  ocrName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  ocrNik: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  tipsContainer: {
    backgroundColor: '#12122A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: { color: '#FFFFFF', fontWeight: '600', marginBottom: 10 },
  tip: { color: '#9CA3AF', fontSize: 13, marginBottom: 6 },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  successContainer: { alignItems: 'center', paddingTop: 40 },
  successIcon: { fontSize: 80, marginBottom: 24 },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});
