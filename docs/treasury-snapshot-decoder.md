# Treasury Snapshot Event Decoder

Decodes the raw `treasury_snapshot` contract event into a stable, privacy-safe SDK object.

## Usage

```typescript
import { decodeTreasurySnapshotEvent, decodeTreasurySnapshotEvents } from "@zk-payroll/core";

const snapshot = decodeTreasurySnapshotEvent(rawEvent);
console.log(snapshot.employer, snapshot.availableAmount);

const snapshots = decodeTreasurySnapshotEvents(allEvents);
```

## Decoded shape

| Field             | Type                   | Description                                    |
| ----------------- | --------------------- | ----------------------------------------- |
| `type`            | `"treasury_snapshot"`  | Discriminator                                 |
| `employer`        | `string`                | Employer Stellar address                          |
| `asset`           | `string`               | Asset identifier (``native`` or contract address)  |
| `balance`         | `bigint`               | Total balance, stroops                            |
| `reservedAmount`  | `bigint`               | Reserved amount, stroops                           |
| `availableAmount` | `bigint`                | Available amount, stroops                          |
| `ledger`          | `number?`              | Ledger sequence the snapshot was taken at         |
| `timestamp`       | `string?`              | ISO timestamp of the ledger close                 |
| `contractId`      | `string?`              | Emitting contract ID                              |

## Privacy guarantees

The decoded shape never includes employee identities, salaries, individual allocations, or
memos. Unknown map keys are ignored rather than propagated.

## Error handling

- Non-`treasury_snapshot` events throw `EventDecodingError`.
- Snapshots missing `employer` or `asset` throw `EventDecodingError`.
