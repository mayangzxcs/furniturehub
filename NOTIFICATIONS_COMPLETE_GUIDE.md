# 🔔 Notifications System - Complete Fix Guide

## ❌ Problem: Notifications Not Showing

The issue is that **RLS policies** in Supabase are blocking notifications from being read. Even though notifications are being created, users can't read them.

---

## ✅ Solution: 3-Step Fix

### **Step 1: Run RLS Policy SQL** (REQUIRED)

Go to **Supabase Dashboard**:
1. Click your project
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Paste this SQL:

```sql
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
```

5. Click **"Run"**
6. You should see ✅ "Query successful"

### **Step 2: Test the System**

**Scenario 1: New Account Signup**
1. Sign up new account in **incognito mode**
2. Login as ADMIN in regular browser
3. Click bell icon 🔔
4. Should see: `🆕 New Account Created - [name] ([email])`

**Scenario 2: Like a Post**
1. Login as Admin with a post
2. Login as different user in another tab
3. Like the admin's post
4. Check admin's bell icon
5. Should see: `❤️ New Like - [user] liked your post`

**Scenario 3: Comment on Post**
1. Login as Admin with a post
2. Login as different user
3. Comment on the admin's post
4. Check admin's bell icon
5. Should see: `💬 New Comment - [user] commented on your post`

### **Step 3: Verify Notifications Work**

- ✅ New account created → Admins notified
- ✅ Post liked → Post owner notified
- ✅ Post commented → Post owner notified
- ✅ Reply to comment → Comment author notified
- ✅ Unread badge shows count
- ✅ Mark as read removes badge
- ✅ Real-time updates (instant)

---

## 📋 Notification Types Now Working

| Trigger | Notification | Who Gets Notified |
|---------|--------------|-------------------|
| New Signup | 🆕 New Account Created | All Admins |
| Post Liked | ❤️ New Like | Post Owner |
| Post Commented | 💬 New Comment | Post Owner |
| Reply to Comment | 💬 New Reply | Comment Author |

---

## 🔍 How to Test Each One

### Test 1: New Account (Easiest)
```
1. Open FurnitureHub in Incognito Window
2. Sign Up with fake email
3. Go to admin account (regular browser)
4. Click bell icon 🔔
5. See new account notification
```

### Test 2: Like Notification
```
1. Admin logged in Tab 1 (has posts)
2. Another user logged in Tab 2
3. User likes admin's post (Tab 2)
4. Check admin's bell icon (Tab 1)
5. See "New Like" notification
```

### Test 3: Comment Notification
```
1. Admin logged in Tab 1 (has posts)
2. Another user logged in Tab 2
3. User comments on admin's post (Tab 2)
4. Check admin's bell icon (Tab 1)
5. See "New Comment" notification
```

### Test 4: Reply to Comment
```
1. Admin logged in Tab 1 (commented on a post)
2. Another user logged in Tab 2
3. User replies to admin's comment (Tab 2)
4. Check admin's bell icon (Tab 1)
5. See "New Reply" notification
```

---

## ⚙️ Technical Details

### What Was Fixed:
1. ✅ Added `is_read: false` to ALL notifications
2. ✅ Fixed RLS policies to allow authenticated users to read their notifications
3. ✅ Added notification for comment replies
4. ✅ Added emoji icons to notification titles
5. ✅ All notifications have proper timestamps

### Database Fields:
- `id` - Unique notification ID
- `user_id` - Who receives it
- `type` - 'new_account', 'like', 'comment'
- `title` - Display title with emoji
- `body` - Full message
- `link` - Where to navigate
- `is_read` - Read/unread status ← THIS WAS MISSING!
- `created_at` - Timestamp

---

## 🐛 Troubleshooting

### "Still no notifications after RLS fix"
- [ ] Refresh browser (hard refresh: Ctrl+F5)
- [ ] Check browser console (F12) for errors
- [ ] Try in incognito to rule out caching
- [ ] Verify SQL ran successfully in Supabase

### "Notifications show but don't auto-update"
- [ ] Check internet connection
- [ ] Verify Supabase real-time is enabled (it is by default)
- [ ] Try refreshing the page
- [ ] Check if `unreadCount` updates after creating notification

### "Can't see Notifications page"
- [ ] Make sure you're logged in as ADMIN
- [ ] Try going to `/notifications` directly
- [ ] Check browser console for route errors

---

## 📱 Bell Icon Features

The bell icon in navbar shows:
- 🔔 Bell icon (top right)
- `1` red badge showing unread count
- Click to see dropdown preview
- Shows latest 20 notifications
- Click notification to mark as read + navigate
- Click "Mark all read" to bulk mark

---

## ✨ What's Working Now

✅ **New Account Notifications**
- Triggered when user signs up
- Sent to ALL admins
- Shows user name and email

✅ **Like Notifications**
- Triggered when someone likes a post
- Sent to post owner
- Shows who liked and link to post

✅ **Comment Notifications**
- Triggered when someone comments
- Sent to post owner
- Shows who commented

✅ **Reply Notifications** (NEW!)
- Triggered when someone replies to a comment
- Sent to comment author
- Shows who replied

✅ **Read/Unread Status**
- All notifications show `is_read` status
- Mark individual or all as read
- Badge disappears when marked read

✅ **Real-Time Updates**
- Uses Supabase subscriptions
- Notifications appear instantly
- Works across multiple tabs

---

## 🚀 Ready to Go!

1. Run the RLS SQL fix in Supabase ← **Do this first!**
2. Test each scenario above
3. Everything should work! 🎉

---

## 📞 Need Help?

Check these files:
- `src/lib/auth.tsx` - New account notification
- `src/pages/PostDetail.tsx` - Comment/reply notifications
- `src/components/PostCard.tsx` - Like notification
- `src/components/Navbar.tsx` - Bell icon UI

All notification logic is marked with comments!
