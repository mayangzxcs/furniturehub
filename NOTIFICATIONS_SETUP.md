# FurnitureHub - Notification System Setup Guide

## ✅ What's Been Implemented

### 1. **Automatic Admin Notifications on New Signups**
When someone creates a new account, ALL admins automatically receive a notification with:
- 🆕 User's name and email
- Direct link to admin panel for approval
- Timestamp of signup

### 2. **Admin Notifications Dashboard**
- Full notifications page at `/notifications` (admin-only)
- View all notifications with read/unread status
- Filter by: All or Unread
- Mark single or all notifications as read
- Delete individual or all read notifications
- Real-time updates (instant when new notification arrives)

### 3. **Navbar Notifications**
- Bell icon in navbar shows unread count
- Click to preview latest 20 notifications
- Quick access to full Notifications page
- Real-time badge updates

---

## 🚀 Setup Instructions

### Step 1: Fix RLS Policy (Required)
1. Go to: https://supabase.com → Your Project → **SQL Editor**
2. Create a new query
3. Paste the SQL from `NOTIFICATIONS_RLS_FIX.sql`:

```sql
-- Fix notifications RLS policy: Only users can read their own
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
```

4. Click **"Run"**
5. You should see: "Query successful"

### Step 2: Test the Notification System

**Scenario: Creating a new account**

1. Open your app in a NEW browser tab/window (incognito/private mode)
2. Go to Sign Up page
3. Create a new account with:
   - Display Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "test123456"

4. After signup, you'll see the "Account Created!" screen
5. Go back to your original browser tab where you're logged in as ADMIN
6. Refresh the page
7. Look at the navbar:
   - You should see a **bell icon with "1"** badge
   - Click the bell to see the notification preview
   - Or click **"Notifications"** link in navbar

8. In the Notifications page, you should see:
   ```
   🆕 New Account Created
   Test User (testuser@example.com) just signed up and is waiting for approval.
   [just now]
   ```

---

## 📋 Key Features

### Notification Types
- **new_account** - User signup (for admins)
- **like** - Someone liked your post
- **comment** - Someone commented on your post
- **share** - Someone shared your post

### Notification States
- **Unread** - Shows with blue "New" badge
- **Read** - Marked as read, no badge

### Quick Actions
- **Mark as read** - Click checkmark button
- **Mark all as read** - Use "Mark all as read" button
- **Delete** - Click trash icon
- **Clear read** - Delete all read notifications at once

---

## 🔐 Security Notes

- ✅ Only authenticated users can see notifications
- ✅ Users can only see their own notifications
- ✅ Notifications are personal and private
- ✅ Admins see account creation notifications
- ✅ Other users' notifications hidden from view

---

## 📡 Real-Time Updates

The system uses Supabase real-time subscriptions:
- Notifications appear instantly without refreshing
- Badge count updates automatically
- Works across multiple browser tabs

To test: Open the app in two tabs, sign up in one, see notification appear in the other!

---

## 📧 Future Enhancement Ideas

You can easily extend this for:
- ✏️ Post likes
- 💬 Comment notifications
- ↔️ Follow/follow-back
- 🔔 Custom admin alerts
- 📨 Email notifications
- 🔊 Browser push notifications

Just call:
```typescript
await supabase.from('notifications').insert({
  user_id: targetAdminId,
  type: 'new_type',
  title: 'Title',
  body: 'Description',
  link: '/path',
  is_read: false,
})
```

---

## ❓ Troubleshooting

### No notifications appearing?
1. Check that the RLS policy was updated
2. Make sure you're logged in as an admin
3. Try creating a new account in incognito mode
4. Check browser console for errors (F12)

### Notifications not real-time?
1. Make sure Supabase real-time is enabled (it is by default)
2. Try refreshing the page
3. Check internet connection

### Can't access Notifications page?
1. Make sure you're logged in as an admin
2. Type directly: `/notifications`
3. Non-admins will be redirected to home page

---

## 📞 Need Help?

Check:
- `src/pages/Notifications.tsx` - Notifications page code
- `src/lib/auth.tsx` - Signup notification logic
- `src/components/Navbar.tsx` - Navbar notifications dropdown
- Database: `notifications` table in Supabase

Enjoy! 🎉
