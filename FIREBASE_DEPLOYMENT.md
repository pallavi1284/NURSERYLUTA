# Firebase Deployment and Security Rules Guide

## Overview

This document provides instructions for deploying NurseryHub's Firebase configuration, including security rules, indexes, and Cloud Functions.

## Prerequisites

1. **Firebase CLI** installed: `npm install -g firebase-tools`
2. **Firebase Project** created at https://console.firebase.google.com
3. **Authentication** with Firebase: `firebase login`
4. **Project configured**: `firebase init` (already done)

## Deployment Steps

### 1. Deploy Firestore Security Rules

Firestore security rules control who can read and write data. Review the rules in `firestore.rules` before deploying:

```bash
firebase deploy --only firestore:rules
```

**Security Rules Summary:**
- **Settings**: Admin-only writes, public reads
- **Nurseries**: Sellers can create/update their own, customers see approved only, admin can do anything
- **Plants**: Sellers can manage their own, public can view from approved nurseries
- **Inventory**: Sellers can manage their own stock
- **Orders**: Customers can create, sellers and admins can view, limited updates for tracking
- **Complaints**: Customers file them, sellers/admins can respond
- **Reviews**: Public-approved reviews visible, admin moderation

### 2. Deploy Firestore Indexes

Firestore indexes optimize query performance:

```bash
firebase deploy --only firestore:indexes
```

**Key Indexes:**
- Plants filtered by nursery and seller
- Plants filtered by category with sorting
- Orders filtered by customer/nursery/seller with dates
- Complaints filtered by customer/nursery/seller with dates
- Reviews filtered by nursery/customer with status

### 3. Deploy All Firebase Resources

To deploy everything at once:

```bash
firebase deploy
```

This includes:
- Firestore rules
- Firestore indexes
- Hosting (dist folder)
- Cloud Functions (if any)

## Important Security Notes

### UID Consistency

The application uses **seller Firebase UIDs** (`sellerUID`) and **customer Firebase UIDs** (`customerId`) to control data access. Ensure:

1. **Email/Password Users**: The application generates stable UIDs in format `role-sanitizedemail`
   - Example: `seller-johndoe@example.com` → `seller-johndoe`
   - These UIDs remain consistent across sessions

2. **Google OAuth Users**: Use Firebase's generated UIDs directly
   - Example: `FxF123abc456...`

3. **Database Consistency**: All documents must store the correct UID in `sellerUID`, `customerId`, or `sellerUid` fields

### Preventing Unauthorized Access

The security rules prevent:
- Customers from reading others' orders/complaints
- Sellers from viewing other sellers' nurseries/plants
- Non-admins from modifying settings or approving nurseries
- Direct database writes without proper authentication
- Reading unapproved nurseries (except by seller/admin)

### Cloud Functions (Cloudinary Deletion)

A Cloud Function `deleteCloudinaryImage` must be deployed separately for secure image deletion:

```typescript
// This function must be deployed to Firebase Functions
// It handles secure deletion of Cloudinary images using server-side API keys
```

**Important**: The Cloudinary API Secret should NEVER be exposed in client-side code.

## Testing Security Rules

### Using Firebase Emulator

Test rules locally before deploying:

```bash
firebase emulators:start
```

This runs the Firestore emulator on port 8080 and allows testing without affecting production data.

### Manual Testing Checklist

After deployment, verify:

1. **Anonymous users** cannot read any data except:
   - Approved nurseries list
   - Approved plants from approved nurseries
   - Public reviews (status: 'published')

2. **Customer users** can:
   - Create orders
   - Read their own orders
   - Create complaints
   - Read their own complaints
   - Cannot read other customers' data

3. **Seller users** can:
   - Read/update their own nursery
   - Create/read/update plants in their nursery
   - Manage inventory for their plants
   - View orders for their nursery
   - View complaints about their nursery
   - Cannot access other sellers' data

4. **Admin users** can:
   - Read all collections
   - Create/update/delete anything
   - Approve/reject nurseries
   - Moderate reviews
   - Manage platform settings

## Firestore Quotas and Limits

Be aware of Firebase Firestore's quotas:
- **Reads**: 50k/day free tier
- **Writes**: 20k/day free tier
- **Deletes**: 20k/day free tier
- **Document size**: Max 1MB per document
- **Collection size**: Unlimited (but queries over 1000+ docs are slow)

**Optimization Tips:**
- Use indexes for complex queries
- Archive old data periodically
- Implement pagination for large result sets
- Avoid deeply nested subcollections

## Backup and Recovery

### Automatic Backups

Firebase automatically maintains backups. To export data manually:

```bash
firebase firestore:export gs://your-bucket-name/backups/backup-$(date +%s)
```

### Data Import/Export

For data migration or backup:

```bash
# Export
firebase firestore:export gs://bucket-name/path

# Import
firebase firestore:import gs://bucket-name/path
```

## Troubleshooting

### Permission Denied Errors

If users get "Permission Denied" errors:

1. Check the user's UID matches the document's `sellerUID` or `customerId` field
2. Verify security rules are deployed: `firebase deploy --only firestore:rules`
3. Check browser console for the actual error message
4. Use Firestore Emulator locally to test rules

### Indexes Not Found

If queries are slow or fail with "index not found":

```bash
firebase deploy --only firestore:indexes
```

Then check the Firebase Console > Firestore > Indexes to verify deployment.

### Connection Issues

If the app cannot connect to Firestore:

1. Verify `VITE_FIREBASE_PROJECT_ID` in `.env`
2. Check network connectivity
3. Use Firebase Emulator locally for development
4. Check browser console for specific error messages

## Production Checklist

Before going live:

- [ ] Security rules reviewed and tested
- [ ] Firestore indexes deployed
- [ ] Cloudinary API keys configured (server-side only)
- [ ] Firebase project limited to authorized IPs (if applicable)
- [ ] Backup strategy implemented
- [ ] Error logging configured
- [ ] Data retention policies set
- [ ] User authentication method selected (Google OAuth, Email/Password, etc.)
- [ ] CORS properly configured for Cloudinary
- [ ] Rate limiting considered for signup/login

## Documentation References

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
