# Systems Under Load

System design interview-prep quiz. Static HTML/JS, scenario-based questions loaded from JSON sets.

## Run it

`fetch()` is used to load the question sets, so opening `quiz.html` directly (`file://`) will fail on CORS. Serve it locally instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/quiz.html
```

## Structure

- `quiz.html` — the app (self-contained, no build step)
- `sets/set0.json` … `sets/set6.json` — question sets loaded by the quiz (see `SETS` array in `quiz.html`)
- `questions.json` — question bank draft/staging, not directly loaded by the quiz
- `topics-set*.md` — raw interview-question notes used as source material when drafting new sets

## Adding a new question set

1. Draft questions (scenario, question, options, `correctIndex`, explanation) — follow the shape of an existing file in `sets/`.
2. Save as `sets/setN.json`.
3. Register it in the `SETS` array near the top of the `<script>` in `quiz.html`.

## TODO

- [ ] Decide fate of `questions.json` (merge into `sets/` or drop)
- [ ] Add more sets from `topics-set*.md` backlog
