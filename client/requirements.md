## Packages
(none needed)

## Notes
- Amounts from forms should be multiplied by 100 to send cents to the API.
- Amounts received from API should be divided by 100 for display.
- Assumes `useAuth` is available at `@/hooks/use-auth`.
- Expects `balances: { userId: string, netBalance: number }[]` in `/api/groups/:id` response.
