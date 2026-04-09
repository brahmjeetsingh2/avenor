const Notification = require('../models/Notification.model');
const Announcement = require('../models/Announcement.model');
const { getNotificationQueue } = require('./notification.queue');
const { getIO } = require('../config/socket');

const startNotificationWorker = () => {
  const queue = getNotificationQueue();
  if (!queue) return;

  queue.process('send', 10, async (job) => {
    const { recipients, type, title, message, data } = job.data;

    if (!recipients?.length) return { sent: 0 };

    const docs = recipients.map((recipientId) => ({
      recipient: recipientId,
      type, title, message,
      data: data || {},
      isRead: false,
    }));

    const created = await Notification.insertMany(docs, { ordered: false });

    if (type === 'announcement' && data?.announcementId) {
      try {
        await Announcement.findByIdAndUpdate(data.announcementId, {
          $inc: { sentCount: created.length },
          $set: {
            status: 'sent',
            deliveryStatus: 'delivered',
            sentAt: new Date(),
            lastError: '',
          },
        });
      } catch {
        // non-fatal
      }
    }

    try {
      const io = getIO();
      created.forEach((notif) => {
        io.to(`user:${notif.recipient.toString()}`).emit('notification:new', {
          _id:       notif._id,
          type:      notif.type,
          title:     notif.title,
          message:   notif.message,
          data:      notif.data,
          isRead:    false,
          createdAt: notif.createdAt,
        });
      });
    } catch {
      // Socket.io might not be ready — non-fatal
    }

    return { sent: created.length };
  });

  console.log('✅ Notification worker started');
};

module.exports = { startNotificationWorker };