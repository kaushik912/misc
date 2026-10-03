# 06: Export bundle

**What to build:** An Export button downloads a zip containing one <id>.txt per live Note (raw text only). The zip entry modified time carries updatedAt. Trashed Notes are not exported.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Zip has one <id>.txt per live Note with raw text
- [ ] Entry mtime equals the Note's updatedAt
- [ ] Trashed Notes excluded
- [ ] Core tests cover exportBundle()
