# Notes

A local-first personal notes app: plain-text notes organised by tags and found by full-text search.

## Language

**Note**:
A single plain-text document, with no formatting syntax. The unit of creation, search, tagging and deletion.
_Avoid_: Memo, document, entry, page

**Title**:
The first non-blank line of a Note, trimmed, derived at read time. It is not a separate field. An empty Note is shown as "Untitled".
_Avoid_: Name, heading, subject

**Tag**:
A flat, case-insensitive label written inline as `#tag` in a Note's body: `#`, then a letter, then letters, digits or `-`, preceded by whitespace or line start. `#123` and `page#section` are not Tags. A Tag exists only while some Note uses it.
_Avoid_: Label, category, folder, hashtag

**Trash**:
The holding area for deleted Notes. A trashed Note can be restored until the Trash is emptied manually.
_Avoid_: Recycle bin, archive, soft delete

**Export bundle**:
A zip of one `.txt` file per Note, used to move Notes between devices.
_Avoid_: Backup, dump, sync
