# Notes

A local-first personal notes app: plain-text notes organised by tags and found by full-text search.

## Language

**Note**:
A single plain-text document, with no formatting syntax. The unit of creation, search, tagging and deletion.
_Avoid_: Memo, document, entry, page

**Title**:
The first line of a Note, derived at read time. It is not a separate field.
_Avoid_: Name, heading, subject

**Tag**:
A flat label written inline as `#tag` in a Note's body. The set of a Note's Tags is re-derived from its body on every save.
_Avoid_: Label, category, folder, hashtag

**Trash**:
The holding area for deleted Notes. A trashed Note can be restored until the Trash is emptied manually.
_Avoid_: Recycle bin, archive, soft delete

**Export bundle**:
A zip of one `.txt` file per Note, used to move Notes between devices.
_Avoid_: Backup, dump, sync
