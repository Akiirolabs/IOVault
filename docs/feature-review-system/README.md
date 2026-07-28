# Feature Review System

Feature reviews capture manual page-level findings, their implemented corrections, and verification evidence. Each review owns its detailed findings in a dedicated record and links to the implementation it evaluates.

## Review register

| Review | Affected IMP work | Scope | Status |
|---|---|---|---|
| [FTR-1001 — Write manual review](reviews/FTR-1001-write-manual-review.md) | [IMP-1001.1.2, 1001.1.3, 1001.2.1–1001.2.3](../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) | Page hierarchy, editing, tables, organization, rename, and archive recovery | 8/8 verified |
| [FTR-1002 — Write actions review](reviews/FTR-1002-write-actions-review.md) | [IMP-1001.1.4, 1001.2.2, and 1001.2.4](../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) | Context menu behavior, icons, imports, positioning, page selection, and templates | 6/6 verified |
| [FTR-1003 — Write table column menu review](reviews/FTR-1003-write-table-column-menu-review.md) | [IMP-1001.1.3](../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) | Column menu, subrow, rename, plus, row highlighting, hover visibility, and delete placement | 7/7 verified |
| [FTR-1004 — Write table follow-up review](reviews/FTR-1004-write-table-follow-up-review.md) | [IMP-1001.1.3, 1001.2.2, and 1001.2.4](../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) | Linked-page overlays, consolidated foreground row actions, persisted column sizing, expanded icons/imports, individual status options, and compact filters | 11/11 verified |
| [FTR-1005 — Write plus menu review](reviews/FTR-1005-write-plus-menu-review.md) | [IMP-1001.1.2.1](../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) | Note insertion menu, contextual toolbar, linked-page availability, and menu placement | Partial — 3/4 verified |

## Record ownership

- Each `FTR-XXXX` file owns its source metadata, findings, corrections, dates, status, and verification evidence.
- Corrections remain under the finding that produced them; no separate correction series is created.
- The Deployment Ledger and implementation records summarize and link each review without duplicating its detailed evidence.
- FTR records describe observed behavior and completed corrections; future product work remains in IMP and DPL records.
