# Implementation Map

```mermaid
flowchart LR
  Engineering["Engineering dependencies: DBG system"] -. unblocks .-> UI["DBG-1016 UI + navigation"]
  Engineering -. unblocks .-> Notes["IMP-1001 Notes / Write"]
  Engineering -. unblocks .-> Projects["IMP-1003 Projects"]
  Engineering -. unblocks .-> Code["IMP-1002 Code Vault"]
  UI --> Notes
  UI --> Projects
  UI --> Code
  Notes --> Learning["IMP-1004 Mentor Agent"]
  Notes --> Career["IMP-1005 Career Agent"]
  Projects --> Learning
  Projects --> Career
```

Dashed edges are links to engineering work owned by the [debug system](../../debug-system/README.md), not duplicate IMP workstreams.
