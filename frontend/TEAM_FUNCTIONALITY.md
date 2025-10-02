# Team Invitation System - Implementation Guide

## Overview

The team invitation system allows workspace owners to invite people to collaborate on their Moving Home Planner workspace. The system supports both existing users (immediate membership) and new users (email invitation workflow).

## Features Implemented

### 1. Backend Services (`src/lib/shopping.ts`)

- **getWorkspaceMembers()**: Fetch all members of a workspace with user details
- **inviteMember()**: Invite a user by email (adds existing users immediately, creates invitation for new users)
- **getPendingInvitations()**: Get all pending invitations for a workspace
- **cancelInvitation()**: Cancel a pending invitation
- **removeMember()**: Remove a member from the workspace

### 2. React Query Hooks (`src/lib/hooks/useShoppingQueries.ts`)

- **useWorkspaceMembers()**: Query hook for fetching workspace members
- **usePendingInvitations()**: Query hook for fetching pending invitations
- **useInviteMember()**: Mutation hook for sending invitations
- **useCancelInvitation()**: Mutation hook for canceling invitations
- **useRemoveMember()**: Mutation hook for removing members

### 3. UI Components (`src/components/settings/space-settings.tsx`)

- **Team Tab**: New tab in space settings for team management
- **Invitation Form**: Email input with send invitation functionality
- **Member List**: Display current workspace members with remove functionality
- **Pending Invitations**: Show and manage pending invitations

## Database Schema

### Tables Added

1. **profiles**: User profile information linked to auth.users
2. **workspace_members**: Links users to workspaces with roles
3. **workspace_invitations**: Stores pending email invitations

### Key Relationships

- `workspace_members.workspace_id` → `workspaces.id`
- `workspace_members.user_id` → `profiles.id`
- `workspace_invitations.workspace_id` → `workspaces.id`

## Setup Instructions

### 1. Database Setup

Run the SQL script `add-team-tables.sql` in your Supabase dashboard:

```bash
# Copy the contents of add-team-tables.sql and run in Supabase SQL editor
```

### 2. Row Level Security (RLS)

The SQL script includes RLS policies that ensure:

- Users can only see members of workspaces they belong to
- Only workspace owners can manage members and invitations
- Users can read/update their own profiles

### 3. Profile Creation

The system includes an automatic profile creation trigger that:

- Creates a profile record when a user signs up
- Links the profile to the auth.users table
- Populates email and full_name from auth metadata

## User Flow

### Inviting Existing Users

1. User enters email in invitation form
2. System checks if user exists in profiles table
3. If user exists, adds them directly to workspace_members
4. Returns success message "User added to workspace successfully"

### Inviting New Users

1. User enters email in invitation form
2. System checks if user exists (not found)
3. Creates record in workspace_invitations table
4. Returns success message "Invitation sent successfully"
5. **TODO**: Send actual email invitation (currently logs to console)

### Managing Members

- **View Members**: All current members shown with avatar, email, and role
- **Remove Members**: Workspace owners can remove other members (not themselves)
- **Role Display**: Shows member role (owner/member) with visual indicators

### Managing Invitations

- **View Pending**: Shows all pending invitations with email and sent date
- **Cancel Invitations**: Workspace owners can cancel pending invitations
- **Expiration**: Invitations expire after 7 days (configurable)

## API Response Structure

### inviteMember() Response

```typescript
{
  success: boolean;
  message: string;
}
```

### Error Handling

- Duplicate member detection
- Email validation
- Network error handling
- User feedback via success/error messages

## Security Features

### Row Level Security

- Members can only see workspaces they belong to
- Only owners can manage team members
- Invitation management restricted to workspace owners

### Data Validation

- Email format validation
- Unique member constraints
- Workspace ownership verification

## Future Enhancements

### Email Integration

Currently, the system logs email invitations to console. To implement actual email sending:

1. Integrate with email service (SendGrid, AWS SES, etc.)
2. Create email templates for invitations
3. Add email verification for new users
4. Implement invitation acceptance flow

### Role Management

The current system supports basic roles. Future enhancements could include:

- Admin role with limited permissions
- Read-only member access
- Custom permission sets

### Invitation Acceptance

For new users who receive email invitations:

1. Email contains signup link with invitation token
2. User signs up through special invitation flow
3. Profile created and automatically added to workspace
4. Invitation marked as accepted

## Testing the Implementation

### Manual Testing Steps

1. Navigate to Space Settings → Team tab
2. Enter an email address in the invitation form
3. Click "Send Invite"
4. Verify success message appears
5. Check that invitation appears in pending list
6. Test canceling invitation
7. Test removing members (with different user account)

### Database Verification

```sql
-- Check members
SELECT * FROM workspace_members WHERE workspace_id = 'your-workspace-id';

-- Check pending invitations
SELECT * FROM workspace_invitations WHERE workspace_id = 'your-workspace-id';

-- Check profiles
SELECT * FROM profiles;
```

## Troubleshooting

### Common Issues

1. **RLS Permission Denied**: Ensure user is workspace owner
2. **User Not Found**: Check if profile exists in profiles table
3. **Duplicate Member**: User already belongs to workspace
4. **Email Validation**: Ensure valid email format

### Debug Logging

The system includes console logging for debugging:

- Invitation attempts
- Database query results
- Error conditions
- Success/failure states

## Component Integration

The team functionality is fully integrated into the existing space settings component:

- Consistent design with other tabs
- Shared state management
- Real-time updates via React Query
- Optimistic UI updates
- Error handling and user feedback

The implementation provides a complete foundation for team collaboration in the Moving Home Planner application.
