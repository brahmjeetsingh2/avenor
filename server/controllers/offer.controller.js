const Offer      = require('../models/Offer.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse  = require('../utils/apiResponse');

// ─── CREATE OFFER ─────────────────────────────────────────────────────────────
const createOffer = asyncHandler(async (req, res) => {
  const { company, role, ctc, base, bonus, joiningBonus, location, workMode, joiningDate, bond, perks, notes, isAnonymous } = req.body;

  if (!company || !role || !ctc) {
    return apiResponse.error(res, 'company, role and ctc are required', 400);
  }

  const offer = await Offer.create({
    student: req.user.id,
    company, role, ctc,
    base:        base        || 0,
    bonus:       bonus       || 0,
    joiningBonus: joiningBonus || 0,
    location:    location    || '',
    workMode:    workMode || 'onsite',
    joiningDate: joiningDate || null,
    bond:        bond        || { hasBond: false },
    perks:       perks       || [],
    notes:       notes       || '',
    isAnonymous: !!isAnonymous,
  });

  await offer.populate('company', 'name logo sector');
  return apiResponse.success(res, { offer }, 'Offer added', 201);
});

// ─── GET MY OFFERS ────────────────────────────────────────────────────────────
const getMyOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find({ student: req.user.id })
    .populate('company', 'name logo sector type ctc location')
    .sort({ ctc: -1 })
    .lean();

  return apiResponse.success(res, { offers });
});

// ─── UPDATE OFFER ─────────────────────────────────────────────────────────────
const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, student: req.user.id });
  if (!offer) return apiResponse.error(res, 'Offer not found', 404);

  const allowed = ['role', 'ctc', 'base', 'bonus', 'joiningBonus', 'location', 'workMode', 'joiningDate', 'bond', 'perks', 'status', 'notes', 'isAnonymous'];
  allowed.forEach(f => { if (req.body[f] !== undefined) offer[f] = req.body[f]; });

  await offer.save();
  await offer.populate('company', 'name logo sector');
  return apiResponse.success(res, { offer }, 'Offer updated');
});

// ─── DELETE OFFER ─────────────────────────────────────────────────────────────
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOneAndDelete({ _id: req.params.id, student: req.user.id });
  if (!offer) return apiResponse.error(res, 'Offer not found', 404);
  return apiResponse.success(res, {}, 'Offer removed');
});

module.exports = { createOffer, getMyOffers, updateOffer, deleteOffer };
