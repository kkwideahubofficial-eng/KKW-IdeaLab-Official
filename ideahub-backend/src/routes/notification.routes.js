import express from 'express';
import webpush from '../config/webPush.js';
import PushSubscription from '../models/PushSubscription.js';
import EventNotification from '../models/EventNotification.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─── In-App Notifications (Coordinator / Head / Admin) ─────────────────────

// GET latest 20 notifications for the logged-in user
router.get('/in-app', requireAuth, async (req, res) => {
  try {
    const notifications = await EventNotification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    const unreadCount = await EventNotification.countDocuments({
      user: req.user._id,
      isRead: false,
    });
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Error fetching in-app notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PATCH mark all notifications as read — must come BEFORE /:id/read to avoid route conflict
router.patch('/in-app/mark-all-read', requireAuth, async (req, res) => {
  try {
    await EventNotification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// PATCH mark single notification as read
router.patch('/in-app/:id/read', requireAuth, async (req, res) => {
  try {
    await EventNotification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// ─── Push Notifications (Web Push) ─────────────────────────────────────────

// Subscribe route - Saves subscription to MongoDB
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const subscription = req.body;
    const userId = req.user._id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      { user: userId, subscription: subscription },
      { upsert: true, new: true }
    );

    console.log(`Subscription saved for user ${userId}`);
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

// Test route - Sends to ALL subscriptions for the logged-in user
router.post('/send-test', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const subscriptions = await PushSubscription.find({ user: userId });

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found for this user.' });
    }

    const notificationPayload = JSON.stringify({
      title: 'AICTE IDEA Lab Test',
      body: `Hello ${req.user.name || 'User'}, this is a test notification!`,
      icon: '/icons/icon-192.png',
    });

    const promises = subscriptions.map((subDoc) =>
      webpush.sendNotification(subDoc.subscription, notificationPayload).catch(async (err) => {
        console.error('Error sending notification, removing subscription', err.statusCode);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: subDoc._id });
        }
      })
    );

    await Promise.all(promises);
    res.status(200).json({ message: `Sent to ${subscriptions.length} devices.` });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

export default router;
