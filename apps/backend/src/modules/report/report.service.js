const prisma = require('../../config/database');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, format } = require('date-fns');
const { id: localeId } = require('date-fns/locale');
const logger = require('../../utils/logger');

/**
 * Validasi akses user ke storeId
 */
async function validateStoreAccess(userId, storeId) {
  if (!storeId) return null; // null = semua toko milik user

  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: userId },
  });
  if (!store) throw new Error('STORE_NOT_FOUND');
  return store;
}

/**
 * Build where clause untuk transaksi berdasarkan user + storeId opsional
 */
async function buildTxWhere(userId, storeId, startDate, endDate) {
  if (storeId) {
    await validateStoreAccess(userId, storeId);
    return {
      storeId,
      status: 'PAID',
      paidAt: { gte: startDate, lte: endDate },
    };
  }

  // Semua toko milik user
  const stores = await prisma.store.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  return {
    storeId: { in: stores.map((s) => s.id) },
    status: 'PAID',
    paidAt: { gte: startDate, lte: endDate },
  };
}

/**
 * Laporan Harian
 * @param {string} userId
 * @param {string|null} storeId
 * @param {string} date - ISO date string "2026-05-30"
 */
async function getDailyReport(userId, storeId, date) {
  const parsedDate = date ? parseISO(date) : new Date();
  const start = startOfDay(parsedDate);
  const end = endOfDay(parsedDate);

  const where = await buildTxWhere(userId, storeId, start, end);

  const [aggregate, hourlyRaw] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    }),
    prisma.$queryRaw`
      SELECT
        date_trunc('hour', "paidAt" AT TIME ZONE 'Asia/Jakarta') AS hour,
        SUM(amount)::int AS revenue,
        COUNT(*)::int AS tx_count
      FROM "Transaction"
      WHERE ${storeId ? prisma.$raw`"storeId" = ${storeId}` : prisma.$raw`"storeId" IN (SELECT id FROM "Store" WHERE "ownerId" = ${userId})`}
        AND status = 'PAID'
        AND "paidAt" BETWEEN ${start} AND ${end}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const hourly = (hourlyRaw || []).map((h) => ({
    hour: format(new Date(h.hour), 'HH:mm'),
    revenue: Number(h.revenue || 0),
    txCount: Number(h.tx_count || 0),
  }));

  return {
    date: format(parsedDate, 'yyyy-MM-dd'),
    totalRevenue: aggregate._sum.amount || 0,
    totalFee: aggregate._sum.fee || 0,
    netRevenue: aggregate._sum.netAmount || 0,
    txCount: aggregate._count.id || 0,
    avgTransaction: aggregate._count.id
      ? Math.round((aggregate._sum.amount || 0) / aggregate._count.id)
      : 0,
    hourly,
  };
}

/**
 * Laporan Mingguan
 */
async function getWeeklyReport(userId, storeId, weekStart) {
  const parsedDate = weekStart ? parseISO(weekStart) : new Date();
  const start = startOfWeek(parsedDate, { weekStartsOn: 1 }); // Senin
  const end = endOfWeek(parsedDate, { weekStartsOn: 1 });

  const where = await buildTxWhere(userId, storeId, start, end);

  const [aggregate, dailyRaw] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    }),
    prisma.$queryRaw`
      SELECT
        date_trunc('day', "paidAt" AT TIME ZONE 'Asia/Jakarta') AS day,
        SUM(amount)::int AS revenue,
        COUNT(*)::int AS tx_count
      FROM "Transaction"
      WHERE ${storeId ? prisma.$raw`"storeId" = ${storeId}` : prisma.$raw`"storeId" IN (SELECT id FROM "Store" WHERE "ownerId" = ${userId})`}
        AND status = 'PAID'
        AND "paidAt" BETWEEN ${start} AND ${end}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const daily = (dailyRaw || []).map((d) => ({
    date: format(new Date(d.day), 'yyyy-MM-dd'),
    dayName: format(new Date(d.day), 'EEEE', { locale: localeId }),
    revenue: Number(d.revenue || 0),
    txCount: Number(d.tx_count || 0),
  }));

  return {
    weekStart: format(start, 'yyyy-MM-dd'),
    weekEnd: format(end, 'yyyy-MM-dd'),
    totalRevenue: aggregate._sum.amount || 0,
    netRevenue: aggregate._sum.netAmount || 0,
    txCount: aggregate._count.id || 0,
    daily,
  };
}

/**
 * Laporan Bulanan
 */
async function getMonthlyReport(userId, storeId, month) {
  // month format: "2026-05"
  const parsedDate = month ? parseISO(`${month}-01`) : new Date();
  const start = startOfMonth(parsedDate);
  const end = endOfMonth(parsedDate);

  const where = await buildTxWhere(userId, storeId, start, end);

  const [aggregate, weeklyRaw, topDaysRaw] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    }),
    // Breakdown per minggu
    prisma.$queryRaw`
      SELECT
        date_trunc('week', "paidAt" AT TIME ZONE 'Asia/Jakarta') AS week,
        SUM(amount)::int AS revenue,
        COUNT(*)::int AS tx_count
      FROM "Transaction"
      WHERE ${storeId ? prisma.$raw`"storeId" = ${storeId}` : prisma.$raw`"storeId" IN (SELECT id FROM "Store" WHERE "ownerId" = ${userId})`}
        AND status = 'PAID'
        AND "paidAt" BETWEEN ${start} AND ${end}
      GROUP BY 1 ORDER BY 1
    `,
    // Top 5 hari terbaik
    prisma.$queryRaw`
      SELECT
        date_trunc('day', "paidAt" AT TIME ZONE 'Asia/Jakarta') AS day,
        SUM(amount)::int AS revenue,
        COUNT(*)::int AS tx_count
      FROM "Transaction"
      WHERE ${storeId ? prisma.$raw`"storeId" = ${storeId}` : prisma.$raw`"storeId" IN (SELECT id FROM "Store" WHERE "ownerId" = ${userId})`}
        AND status = 'PAID'
        AND "paidAt" BETWEEN ${start} AND ${end}
      GROUP BY 1 ORDER BY revenue DESC LIMIT 5
    `,
  ]);

  return {
    month: format(parsedDate, 'yyyy-MM'),
    monthName: format(parsedDate, 'MMMM yyyy', { locale: localeId }),
    totalRevenue: aggregate._sum.amount || 0,
    netRevenue: aggregate._sum.netAmount || 0,
    totalFee: aggregate._sum.fee || 0,
    txCount: aggregate._count.id || 0,
    avgDaily: aggregate._count.id
      ? Math.round((aggregate._sum.amount || 0) / 30)
      : 0,
    weekly: (weeklyRaw || []).map((w) => ({
      weekStart: format(new Date(w.week), 'yyyy-MM-dd'),
      revenue: Number(w.revenue || 0),
      txCount: Number(w.tx_count || 0),
    })),
    topDays: (topDaysRaw || []).map((d) => ({
      date: format(new Date(d.day), 'yyyy-MM-dd'),
      revenue: Number(d.revenue || 0),
      txCount: Number(d.tx_count || 0),
    })),
  };
}

/**
 * Jam tersibuk dalam sehari (7 hari terakhir)
 */
async function getTopHours(userId, storeId) {
  const end = new Date();
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const raw = await prisma.$queryRaw`
    SELECT
      EXTRACT(HOUR FROM "paidAt" AT TIME ZONE 'Asia/Jakarta')::int AS hour,
      SUM(amount)::int AS revenue,
      COUNT(*)::int AS tx_count
    FROM "Transaction"
    WHERE ${storeId ? prisma.$raw`"storeId" = ${storeId}` : prisma.$raw`"storeId" IN (SELECT id FROM "Store" WHERE "ownerId" = ${userId})`}
      AND status = 'PAID'
      AND "paidAt" BETWEEN ${start} AND ${end}
    GROUP BY 1 ORDER BY tx_count DESC
  `;

  return (raw || []).map((h) => ({
    hour: `${String(h.hour).padStart(2, '0')}:00`,
    revenue: Number(h.revenue || 0),
    txCount: Number(h.tx_count || 0),
  }));
}

/**
 * Export CSV — streaming response
 * @param {Object} res - Express response
 * @param {string} userId
 * @param {string|null} storeId
 * @param {string} startDate - "2026-05-01"
 * @param {string} endDate - "2026-05-31"
 */
async function exportCsv(res, userId, storeId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const where = await buildTxWhere(userId, storeId, start, end);

  const filename = `transaksi-bukupay-${startDate}-${endDate}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // BOM untuk Excel compatibility
  res.write('\uFEFF');
  res.write('Tanggal,Jam,Toko,Jumlah,Fee MDR,Diterima Bersih,Status,No. Referensi\n');

  // Stream: batch 100 record sekaligus
  const PAGE_SIZE = 100;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const transactions = await prisma.transaction.findMany({
      where,
      include: { store: { select: { name: true } } },
      orderBy: { paidAt: 'asc' },
      take: PAGE_SIZE,
      skip,
    });

    if (transactions.length < PAGE_SIZE) hasMore = false;
    skip += PAGE_SIZE;

    for (const tx of transactions) {
      const paidAt = tx.paidAt ? new Date(tx.paidAt) : new Date(tx.createdAt);
      const row = [
        format(paidAt, 'yyyy-MM-dd'),
        format(paidAt, 'HH:mm:ss'),
        `"${tx.store?.name || '-'}"`,
        tx.amount,
        tx.fee,
        tx.netAmount,
        tx.status,
        tx.referenceNo || '-',
      ].join(',');
      res.write(row + '\n');
    }
  }

  res.end();
  logger.info('[Report] CSV export done:', filename, 'rows:', skip);
}

module.exports = {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getTopHours,
  exportCsv,
};
