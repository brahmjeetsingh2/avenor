const express = require('express');
const router  = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  getMyNotifications, getUnreadCount, markAsRead,
  markAllRead, bulkAnnounce, deleteNotification,
  previewAnnouncementAudience, getAnnouncementTemplates,
  getAnnouncementHistory, cloneAnnouncementAsDraft,
} = require('../controllers/notification.controller');

router.get('/',            verifyJWT, getMyNotifications);
router.get('/unread-count',verifyJWT, getUnreadCount);
router.patch('/read-all',  verifyJWT, markAllRead);
router.patch('/:id/read',  verifyJWT, markAsRead);
router.delete('/:id',      verifyJWT, deleteNotification);
router.get('/announce/templates', verifyJWT, authorizeRoles('coordinator'), getAnnouncementTemplates);
router.post('/announce/preview-audience', verifyJWT, authorizeRoles('coordinator'), previewAnnouncementAudience);
router.get('/announce/history', verifyJWT, authorizeRoles('coordinator'), getAnnouncementHistory);
router.post('/announce/:id/clone', verifyJWT, authorizeRoles('coordinator'), cloneAnnouncementAsDraft);
router.post('/announce',   verifyJWT, authorizeRoles('coordinator'), bulkAnnounce);

module.exports = router;
