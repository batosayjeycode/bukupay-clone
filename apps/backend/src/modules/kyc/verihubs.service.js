const axios = require('axios');
const logger = require('../../utils/logger');

const BASE_URL = process.env.VERIHUBS_BASE_URL || 'https://api.verihubs.com';
const CLIENT_ID = process.env.VERIHUBS_CLIENT_ID;
const API_KEY = process.env.VERIHUBS_API_KEY;

function getHeaders() {
  return {
    'client-id': CLIENT_ID,
    'api-key': API_KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * OCR KTP — ekstrak data dari foto KTP
 * @param {string} imageBase64 - base64 encoded image
 * @returns {{ nik, name, dob, address, gender }}
 */
async function ocrKtp(imageBase64) {
  if (!CLIENT_ID || !API_KEY) {
    logger.warn('Verihubs credentials not configured — using mock OCR');
    return {
      nik: '3175012345678901',
      name: 'NAMA DARI OCR',
      dob: '01-01-1990',
      address: 'Alamat dari KTP',
      gender: 'LAKI-LAKI',
    };
  }

  const response = await axios.post(
    `${BASE_URL}/v1/ocr/ktp`,
    { image: imageBase64 },
    { headers: getHeaders(), timeout: 30000 }
  );

  const data = response.data;
  return {
    nik: data.nik,
    name: data.name,
    dob: data.date_of_birth,
    address: data.address,
    gender: data.gender,
  };
}

/**
 * Face Match — bandingkan KTP foto dengan selfie
 * @param {string} ktpImageBase64
 * @param {string} selfieBase64
 * @returns {{ passed: boolean, similarity: number, status: string }}
 */
async function matchFace(ktpImageBase64, selfieBase64) {
  if (!CLIENT_ID || !API_KEY) {
    logger.warn('Verihubs credentials not configured — using mock face match');
    return { passed: true, similarity: 0.95, status: 'MATCH' };
  }

  const response = await axios.post(
    `${BASE_URL}/v1/face-match`,
    { image1: ktpImageBase64, image2: selfieBase64 },
    { headers: getHeaders(), timeout: 30000 }
  );

  const { similarity, status } = response.data;
  return {
    passed: similarity >= 0.8,
    similarity,
    status,
  };
}

/**
 * Verifikasi NIK (opsional — Phase 2)
 */
async function verifyNik(nik, name, dob) {
  if (!CLIENT_ID || !API_KEY) {
    return { valid: true };
  }

  const response = await axios.post(
    `${BASE_URL}/v1/nik/verify`,
    { nik, name, date_of_birth: dob },
    { headers: getHeaders(), timeout: 30000 }
  );

  return { valid: response.data.status === 'VALID' };
}

module.exports = { ocrKtp, matchFace, verifyNik };
