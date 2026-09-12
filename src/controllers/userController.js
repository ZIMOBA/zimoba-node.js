const User = require('../models/User');
const { getCachedOrFetch, invalidate } = require('../services/cacheService');
const { enqueueNotification } = require('../services/queueService');
const { asyncHandler } = require('../middleware/errorHandler');

// Example of the cache-aside pattern on a real DB read.
const getProfile = asyncHandler(async (req, res) => {
  const profile = await getCachedOrFetch(
    `user:${req.userId}`,
    () => User.findById(req.userId).lean(),
    120
  );

  if (!profile) return res.status(404).json({ error: 'User not found' });
  res.json(profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.userId,
    { name },
    { new: true }
  ).lean();

  await invalidate(`user:${req.userId}`); // stale cache would serve the old name otherwise

  // Push a background job instead of blocking this request on a
  // third-party notification API.
  await enqueueNotification(req.userId, { type: 'profile-updated' });

  res.json(updated);
});

module.exports = { getProfile, updateProfile };
