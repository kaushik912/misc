# 03: Tags: derive, sidebar, filter

**What to build:** Write #tag inline in a Note. Tags are re-derived on every save, shown as chips on the list, listed in a sidebar with counts, and clicking a Tag filters the list. A Tag disappears when no Note uses it.

**Blocked by:** 02

**Status:** resolved

- [x] Tag rule per GLOSSARY: # then a letter then letters, digits or -, preceded by whitespace or line start; case-insensitive, stored lowercase
- [x] #123 and page#section are not Tags
- [x] Sidebar lists Tags with counts; clicking filters the list
- [x] A Tag with no remaining Notes is no longer listed
- [x] Core tests cover derivation edge cases and listTags/notesByTag
