/**
 * Format angka ke format Rupiah (Indonesia)
 * @param {number} amount
 * @returns {string} e.g. "Rp 50.000"
 */
export function formatRupiah(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} date
 * @returns {string} e.g. "27 Mei 2026, 10:30"
 */
export function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

/**
 * Format tanggal pendek
 * @param {string|Date} date
 * @returns {string} e.g. "27 Mei"
 */
export function formatShortDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

/**
 * Singkat nama panjang
 * @param {string} name
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateName(name, maxLength = 20) {
  if (!name) return '';
  return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
}

/**
 * Status label dalam Bahasa Indonesia
 */
export const statusLabels = {
  PENDING: 'Menunggu',
  PAID: 'Berhasil',
  FAILED: 'Gagal',
  REFUNDED: 'Dikembalikan',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
  SUBMITTED: 'Diajukan',
};

export const statusColors = {
  PENDING: '#F59E0B',
  PAID: '#10B981',
  FAILED: '#EF4444',
  REFUNDED: '#6366F1',
  PROCESSING: '#3B82F6',
  COMPLETED: '#10B981',
  VERIFIED: '#10B981',
  REJECTED: '#EF4444',
  SUBMITTED: '#F59E0B',
};
