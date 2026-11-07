# AGENT.md: extract a book into a warband source file

You are helping someone turn a PDF of a Song of Blades and Heroes book they own
into a source file for the warband builder. Read this whole file before you start.

## Ground rules

- **Personal use only.** The book is copyrighted by its publisher. The file you
  make is for the owner of the book. Never publish, upload or share it, and do
  not include book text anywhere other than the file itself.
- **Never guess.** Every cost, Quality, Combat score and points value comes from
  the book. If you cannot read a value with certainty, leave the optional field
  out, or leave the entry out, and list it in your report.
- **Follow the schema.** The JSON Schema at the end of this file is the contract.
  Use no fields that it does not list.

## What to make

One JSON file per book, named after the source id, such as `giant-ants.json`:

```json
{ "format": "warband-source", "version": 1, "source": { ... } }
```

### The source

- `id`: kebab case from the title, such as `giant-ants`.
- `kind`: `core` for a game's main rulebook, `supplement` for anything else.
- `game`: `asobh` for Advanced Song of Blades and Heroes, `sbh` for Song of
  Blades and Heroes Revised and its supplements.
- `usableIn`: for an SBH supplement that also works in Advanced SBH, `["asobh"]`.
- Copy the title, author and publisher. Write `description` in your own words.

### Special rules

Include only the rules this book defines. When a profile uses a rule from
another book, such as Leader from the core rulebook, reference that book's rule
id in the profile and do not repeat the rule here. Rule ids are shared by every
book, so a new rule must not reuse an id another book has.

- `id`: kebab case from the name, such as `acid-spray`.
- `name`, `cost`, `page`, `category` exactly as printed.
- `tags`: the book's markers, such as `P` for personality only. See the schema.
- `summary`: one or two sentences in your own words, or `""`.
- `text`: the full rule text as printed. This is the part that must never leave
  the owner's hands.
- `rare` and `excludes` only where the book says so.

If the builder already has a cost table for the book (Sources, Add included
sources, then download it), start from that file. Keep its ids, names and costs,
and add `text`, `summary` and the profiles.

### Rosters and profiles

- A roster is each warband list in the book. Give it an id that starts with a
  short code for the book, such as `ga-giant-ants`.
- A profile is each ready-made model in a roster. Its id starts with its roster
  id, such as `ga-giant-ants-giant-ant-worker`.
- `quality` is a number: `3+` is `3`. `combat` is the printed Combat score.
- `ruleIds` lists every special rule the profile has, by id.
- `bookPoints` is the points cost printed for the profile.
- Use `personality`, `unique`, `rare` and `choices` only where the book says so.
  For a choice such as "Huge Weapon or Bludgeon", put the first option in
  `ruleIds` and the wording in `choices`.

## Check before you finish

1. The file is valid JSON and matches the schema.
2. Every id is unique, and every `ruleIds`, `roster` and `excludes` entry names
   a rule or roster that exists in this file or in the core rulebook.
3. Each profile's Quality, Combat, rules and points match the page it came from.
4. No value was guessed.

Then report how many rules, rosters and profiles you extracted, and list
everything you left out or were unsure about, with page numbers.

## Importing it

In the builder, open Sources and use Import source file, or Import folder for
several files at once. The builder checks each entry and tells you about any it
skips. Your file stays in your browser and is never uploaded.

## Schema
