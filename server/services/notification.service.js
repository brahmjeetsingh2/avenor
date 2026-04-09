const { getNotificationQueue } = require('../queues/notification.queue');
const User = require('../models/User.model');

const notify = async ({ recipients, type, title, message, data = {}, options = {} }) => {
  try {
    const queue = getNotificationQueue();
    if (!queue) return;

    const ids = Array.isArray(recipients) ? recipients : [recipients];

    const BATCH = 50;
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH).map(String);
      await queue.add('send', { recipients: chunk, type, title, message, data }, {
        priority: type === 'announcement' ? 1 : 5,
        delay: options.delayMs || 0,
      });
    }
  } catch (err) {
    console.warn('⚠️  Failed to enqueue notification (non-fatal):', err.message);
  }
};

const announceToStudents = async ({ title, message, data = {}, filter = {}, delayMs = 0 }) => {
  try {
    const query = { role: 'student', ...filter };
    const students = await User.find(query).select('_id').lean();
    const ids = students.map((s) => s._id);
    if (!ids.length) return 0;
    await notify({ recipients: ids, type: 'announcement', title, message, data, options: { delayMs } });
    return ids.length;
  } catch (err) {
    console.warn('⚠️  Announce failed:', err.message);
    return 0;
  }
};

const countStudents = async (filter = {}) => {
  const query = { role: 'student', ...filter };
  return User.countDocuments(query);
};

module.exports = { notify, announceToStudents, countStudents };