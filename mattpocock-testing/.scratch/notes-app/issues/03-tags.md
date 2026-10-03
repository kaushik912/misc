# 03: Tags: derive, sidebar, filter

**What to build:** Write #tag inline in a Note. Tags are re-derived on every save, shown as chips on the list, listed in a sidebar with counts, and clicking a Tag filters the list. A Tag disappears when no Note uses it.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Tag rule per GLOSSARY: # then a letter then letters, digits or -, preceded by whitespace or line start; case-insensitive, stored lowercase
- [ ] #123 and page#section are not Tags
- [ ] Sidebar lists Tags with counts; clicking filters the list
- [ ] A Tag with no remaining Notes is no longer listed
- [ ] Core tests cover derivation edge cases and listTags/notesByTag
