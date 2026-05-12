# Security Specification: Tontine System

## 1. Data Invariants
- A Tontine Member MUST have a valid `userId` matching `request.auth.uid` or be an Admin to manage.
- A Member MUST belong to an existing `TontineGroup`.
- Rank must be between 1 and `totalMembers`.
- `totalPaid` + `remainingAmount` should equal the product price (or contribution * cycles).
- `tontine_payments` MUST link to a valid `tontine_members` document.
- Only Admins can modify `tontine_groups` details like `currentCycle`.
- Users can ONLY join a group if its status is 'waiting' and it's not full.

## 2. The "Dirty Dozen" Payloads
1. **The Poison ID**: Create a `tontine_group` with a 1MB string as ID.
2. **The Rank Jump**: A member updating their own `rank` to 1.
3. **The Ghost Payment**: Creating a `tontine_payment` for another user's `memberId`.
4. **The Jackpot Hack**: A member updating `hasReceivedProduct` to `true` by themselves.
5. **The Free Rider**: Setting `totalPaid` to a high value without a corresponding payment.
6. **The Group Hijack**: Updating `currentCycle` as a regular member.
7. **The Multi-Join**: Joining the same group twice (schema check via ID poisoning).
8. **The Negative Payment**: A payment with a negative `amount`.
9. **The Identity Spoof**: Creating a member with `userId` of an admin to gain privileges.
10. **The Cycle Shortcut**: Updating group status to `completed` prematurely.
11. **The Shadow Field**: Adding `isAdmin: true` to a user profile update.
12. **The PII Leach**: Reading `tontine_members` of other users to collect emails.

## 3. Conflict Report & Evaluation

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|--------------------|--------------------|
| `tontine_groups` | Blocked (Admin only) | Blocked (Admin only) | `isValidId` and size checks |
| `tontine_members` | Blocked (`userId` match) | Blocked (Admin only) | Size checks on strings |
| `tontine_payments` | Blocked (`userId` match) | N/A | Amount must be positive |
