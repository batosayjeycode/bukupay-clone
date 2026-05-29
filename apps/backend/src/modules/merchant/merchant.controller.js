const prisma = require('../../config/database');
const Joi = require('joi');
const logger = require('../../utils/logger');

const createStoreSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nama toko minimal 2 karakter',
    'string.max': 'Nama toko maksimal 100 karakter',
    'any.required': 'Nama toko wajib diisi',
  }),
  address: Joi.string().min(5).max(500).required(),
  city: Joi.string().required(),
  province: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  category: Joi.string()
    .valid('kuliner', 'retail', 'jasa', 'fashion', 'elektronik', 'lainnya')
    .optional(),
});

const updateStoreSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  address: Joi.string().min(5).max(500).optional(),
  city: Joi.string().optional(),
  province: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  category: Joi.string().optional(),
});

/**
 * GET /merchant/profile
 */
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        kycStatus: true,
        role: true,
        createdAt: true,
        _count: { select: { stores: true } },
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /merchant/stores
 */
async function createStore(req, res, next) {
  try {
    const { error, value } = createStoreSchema.validate(req.body);
    if (error) return next(error);

    const store = await prisma.store.create({
      data: {
        ...value,
        ownerId: req.user.id,
        isActive: false,
      },
    });

    logger.info(`Store created: ${store.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Toko berhasil dibuat',
      data: store,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /merchant/stores
 */
async function getStores(req, res, next) {
  try {
    const stores = await prisma.store.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: stores });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /merchant/stores/:id
 */
async function updateStore(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = updateStoreSchema.validate(req.body);
    if (error) return next(error);

    // Verifikasi ownership
    const store = await prisma.store.findFirst({
      where: { id, ownerId: req.user.id },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'STORE_NOT_FOUND',
        message: 'Toko tidak ditemukan',
      });
    }

    const updated = await prisma.store.update({
      where: { id },
      data: value,
    });

    res.json({
      success: true,
      message: 'Data toko berhasil diperbarui',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, createStore, getStores, updateStore };
