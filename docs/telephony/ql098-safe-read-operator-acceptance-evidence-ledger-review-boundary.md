# QL-098 Telephony and Runtime Boundary

QL-098 does not change the telephony boundary.

Still blocked:

- Phone calls;
- SMS and MMS sending;
- provider callbacks;
- recordings;
- call transcripts;
- delivery receipts;
- consent writes;
- archive writes;
- audit writes;
- retention writes;
- live pilot runtime;
- AI message generation or sending.

The evidence-ledger review is display-only and uses synthetic safe-read proof boundaries. No phone, SMS, callback, provider, or AI path is enabled in this build.
