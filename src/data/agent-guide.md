# AGENT.md: filling warband source files from rulebook PDFs

This file tells an agent how to take a rulebook PDF and fill in the matching
`warband-source` JSON file: rule summaries first, then rosters and profiles.
Follow it in order. Do not skip the verification steps.

## 0. Ground rules

- **Personal use only.** The book is copyrighted by its publisher. The file you make is
  for the owner of the book. Never publish, upload or share it, and do not put book text
  anywhere except the file itself. That includes your replies: do not paste long rule
  text into a report.
- **Never guess.** Every cost, Quality, Combat score and points value comes from the
  book. If you cannot read a value with certainty, leave the optional field out, or
  leave the entry out, and list it in your report.
- **Follow the schema.** Use only the fields the schema lists (section 11). Do not
  invent fields.

## 1. What you are producing

One JSON file per book (`axe-and-brimstone.json`, `sbh.json`, `sdg.json` and so on).
Each file has this shape:

```json
{
 "format": "warband-source",
 "version": 1,
 "source": {
  "id": "axe-and-brimstone",
  "name": "Axe & Brimstone",
  "game": "asobh",
  "rules":    [ { "id", "name", "cost", "summary", "category", "tags"?, "rare"?, "excludes"? } ],
  "rosters":  [ { "id", "label" } ],
  "profiles": [ { "id", "roster", "name", "quality", "combat", "ruleIds", "bookPoints",
                  "personality"?, "unique"?, "rare"?, "choices"? } ]
 }
}
```

Your job touches only three things: `rules[].summary`, `rosters` and `profiles`.
Never change a rule's `id`, `name`, `cost`, `category`, `tags`, `rare` or `excludes`.
Those come from the user's calculator export and are authoritative.

Files with an older format (`my-rules.json`, `asobh-rules.json`, `rules-template.json`)
are legacy. Ignore them for output. They are still useful as a lookup of earlier work.

### Creating a source file from scratch

If no file exists for the book yet, make one named after the source id, such as
`giant-ants.json`, wrapped as `{ "format": "warband-source", "version": 1, "source": { ... } }`.

- `id`: kebab case from the title, such as `giant-ants`.
- `kind`: `core` for a game's main rulebook, `supplement` for anything else.
- `game`: `asobh` for Advanced Song of Blades and Heroes, `sbh` for Song of Blades and
  Heroes Revised and its supplements.
- `usableIn`: for an SBH supplement that also works in Advanced SBH, `["asobh"]`.
- Copy the title, author and publisher as printed. Write `description` in your own words.

### Which rules belong in the file

Include only rules this book defines. When a profile uses a rule from another book, such
as Leader from the core rulebook, reference that book's rule id in the profile and do not
repeat the rule here. Rule ids are shared by every book, so a new rule must not reuse an
id another book already has.

### Starting from the builder's cost table

If the builder already has a cost table for the book (Sources, Add included sources, then
download it), start from that file. Keep its ids, names and costs, and add the summaries,
rosters and profiles.

### Optional `page` and `text` fields

Where the schema lists them, `page` is the printed page number and `text` is the full
rule text as printed. `text` exists so the owner can read the rule inside the builder. It
stays in the owner's file only. Never copy it into `summary`, a report or any other
output, and never add it unless the user asks. `summary` is always your own paraphrase.

## 2. Before touching any PDF

1. Read the `file-reading` skill (`/mnt/skills/public/file-reading/SKILL.md`). The tool
   output demands it before any command runs against an upload. Do it each session.
2. Inventory the PDF: `pdfinfo` and `pdffonts`. If `pdffonts` lists fonts there is a text
   layer. If it lists none, rasterise and read the pages as images (see the `pdf-reading` skill).
3. Extract text twice and keep both:
   ```bash
   pdftotext file.pdf raw.txt            # reading order, best for prose
   pdftotext -layout file.pdf layout.txt # keeps columns side by side, best for tables
   ```
4. Work out the page offset. PDF page N is usually printed page N-1 (a cover shifts it).
   Rule JSON `page` numbers, if any, are printed pages. State which you use.
5. Find the table of contents and note where traits, spells, items, rosters and
   scenarios sit. Only traits, spells, items and rosters feed these files.
6. List what is blank in the target file so you know the scope:
   ```python
   [r['name'] for r in src['rules'] if not r.get('summary')]
   ```

## 3. Writing rule summaries

### Source of truth

Write each summary from the book that the file represents. Open the actual rule text.
Do not write from memory, even for rules you think you know. Editions differ in small
but important ways (for example, Hero gets a once-per-game re-roll in SBH and
Fightin' Fungi but not in ASOBH, and Reckless is -1 C in ASOBH but halves Combat in
Deeds and Glory).

### Reading two-column pages

`pdftotext` raw mode interleaves columns badly on some books. If a rule seems to run
into an unrelated sentence, crop and read each column separately:

```bash
pdftotext -layout -f P -l P -x 0   -y 0 -W 314 -H 809 book.pdf -   # left
pdftotext -layout -f P -l P -x 314 -y 0 -W 315 -H 809 book.pdf -   # right
```

Page size varies. Check with `pdfinfo -f P -l P`. When text is genuinely ambiguous
(for example a sentence that could belong to two adjacent rules), pick the reading that
the surrounding text supports and say so in your report.

### Style

- 1 to 3 sentences. Longer only for rules that genuinely need it (spells with
  several outcomes, Magic-User, Mutant).
- Lead with what the rule does, then limits and exceptions.
- Spells: effect first, then range or area, then `Backfire: ...` as the last sentence.
- Keep the tag-relevant facts the app can't show elsewhere (once per game, Personality
  only, campaign only, who is immune).
- Use British English: armour, centred, practise (verb), paralyse. Keep official game
  terms as the book spells them (Heavy Armor, Heavily Armored, Paralysed is fine in prose).
- No em dashes or en dashes. Use commas, colons or full stops.
- No filler openings ("This trait allows..."), no inflated adjectives, no padding.
- Use the book's abbreviations the app already uses: Q, C, LoS, OOA is NOT used,
  write "Out-of-Action".
- Name things as the book does: Recoil, Knocked Prone, Gruesome Kill, Free Hack,
  Power Blow, Aimed Shot, Task, Staggering.

### Paraphrase, never copy

Summaries must be your own wording. Do not reproduce rulebook sentences. Do not quote.
Compress and restate the mechanic. This is both a copyright rule and a quality rule.

### Do not overwrite the user's notes

If `summary` is already non-empty, leave it alone unless the task says to replace it.
Some existing summaries are deliberate builder notes, for example
"Name what it applies to in the model's notes." (Lethal, Protect, Hatred) and
"Summoned figures come from a separate points pool..." (Summoner, Elementalist).
Only overwrite a summary that carries your own provenance tag (section 3.4).

### Provenance tags

Append a short parenthetical when the summary is not from the book the file represents:

- `(Based on ASOBH, not checked against this book.)` for a sibling-edition rule you
  borrowed because the book was not available.
- `(Wording from <Book>.)` when a rule is defined in a different book than the file it
  lives in (for example Gargantuan in `sbh.json` taken from Deeds and Glory).
- Casting procedure, range tables and so on borrowed from a reference sheet:
  `(Range rules from the <Book> summary sheet.)`
  Remove the tag as soon as you verify the rule against the book itself.

### Borrowing across books

Allowed only when the same-named rule has the same `cost` in both files. Matching cost
is good evidence of the same effect. A different cost means a different rule: leave it
blank. Blast in Deeds and Glory (15) is not the runestone Blast in Hammer & Forge (4)
and is not the spell Blast (5).

### When the book does not define it

Leave `summary` empty and report it. Common causes:

- the rule is only named in a profile (Runesword, Demonslayer, Gift of the Panther);
- it is defined in a book you do not have (Running Blow, Sharpshooter, Shieldwall);
- it is unpublished ("Future supplements").
  Never invent a rule. A blank is better than a plausible guess.

### Translated books

Translate to English, keep game terms in the English edition's vocabulary where you
can identify it, and flag any term you could not confirm. Spanish to English that has
proved reliable: Calidad = Quality, Combate = Combat, Cobarde = Coward, Firme =
Steadfast, Sin Miedo = Fearless, Terrorífico = Terror, Resistente = Tough, Líder = Leader,
Cerrajero = Traps, Cambiaformas = Were, Agarrarse = Clinging, Montado = Mounted,
Volador = Flying, Escurridizo = Free Disengage (flag this one), Caído = Fallen/Prone,
Paralizado = Transfixed/Paralysed (check the book's own term), Letal = Lethal,
Practicante de Magia = Magic-User, Hechicero = Sorcerer, Invocador = Summoner.
Add a note in your report that translated profile names are yours.

## 4. Rosters and profiles

### Where the data is

Profiles are usually at the back: Name, Points, Quality, Combat, Special rules. Some
books lay them out in two columns, some in tables. Use the layout extraction and the
column crop from section 3.

### Parsing approach that worked

1. Crop each page into columns and parse each column top to bottom.
2. A block ends at a `Points N Quality Q+ Combat C` line plus its `Special rules` line
   (rules can wrap onto the next line). Everything since the previous block is the name.
3. Section headers (UNDEAD, ORCS, ELVES...) arrive glued to the next name. Keep a list
   of known headers, strip them, and switch the current roster when one appears.
4. Fix wrapped words (`SHORT- BOW`), stray punctuation and missing commas
   (`Shooter (Medium) Good Shot`). Tokenise special rules against the known trait names
   instead of splitting on commas alone.
5. Title-case the name. Put equipment in lower-case parentheses: `Halfling Archer (bow)`.
6. Keep the book's own name even when odd ("Human, Archer (long or composite bow)").
   Add a prefix only where the book relies on its header for context (Mermen:
   "Merman Warrior").

### Mapping traits to rule ids

Build a name to id map from every source file, then check for collisions. Preference:

1. A rule defined in the same file.
2. The SBH-family `sbh-*` id when the file is `game: "sbh"`; the ASOBH id when it is `game: "asobh"`.
3. A sibling source's id when the file does not define it (for example `squishy`
   from Fightin' Fungi, `gang` and `inspiring-presence` from Hammer & Forge).

Trait aliases seen in the books: Stealthy = Stealth, Legendary Shot = Legendary Archer,
Resistente / Resist = Tough, Inmenso = Huge, Mov Largo = Long Move.
Spells go in `ruleIds` as `spell-...`, after `spell-caster`.

### Fields

- `id`: `<source-prefix>-<roster>-<slug of name>`, unique within the file.
- `roster`: `<source-prefix>-<roster slug>`. Create a roster entry for each group.
- `quality`, `combat`: integers from `Q3+` and `C4`.
- `ruleIds`: sorted. Non-spell ids alphabetically (including `spell-caster`), then spell ids
  alphabetically. De-duplicate.
- `bookPoints`: the book's printed points, even when it looks wrong.
- `personality: true`: only if the book marks it ("(Personality)") OR the book defines
  Personalities by trait and the profile has one of those traits. In practice: any rule in
  the profile whose own `tags` contains `P`. Apply the same rule to books that do not
  mark Personalities. Leave a book's explicit labels alone.
- `unique: true`: when the profile has the Unique trait. Also keep `unique` in `ruleIds`.
- `rare`: an integer. Take it from the profile's `Rare N`, and do NOT put Rare in `ruleIds`.
- `choices`: free text for anything with no id: `Lethal vs Mages`, an unresolved trait
  name, "Feral Trait: Gift of the Bearwolf", "Huge Weapon or Bludgeon". Put the Lethal
  target here, since profiles have no field for it. For an either/or choice such as
  "Huge Weapon or Bludgeon", put the first option in `ruleIds` and the wording in `choices`.

### Things that are not profiles

Summoned-only creatures (Minor Demon, Imp) are still profiles. The schema has no field
for "summoned only", so say so in the report. Models costing 5 points or less are
non-combatants; include them as printed.

### Validate the parse

Run every profile through the book's own cost formula:
`((C * 5 + sum(trait costs)) * (7 - Q)) / 2`
Use trait costs from the source file's `rules[].cost`. A parse error shows up as a large
mismatch. A small mismatch (about 2 points, or a swarm priced per base) is usually the
book. Check each mismatch against the page itself. If the page agrees with your parse,
keep the book's value and list it in the report as a book discrepancy. Do not "fix" it.

Also check:

- no duplicate profile ids (a book may print one profile twice; keep one and report it);
- every `ruleIds` entry exists in some source file;
- profile counts per roster look plausible against the page count.

## 5. Writing the files

- Read the current file from the outputs folder if you already produced one this session,
  otherwise from `/mnt/user-data/uploads` (read-only; never edit in place).
- Write to `/mnt/user-data/outputs/sources/<same filename>`.
- Dump with `json.dump(d, f, indent=1, ensure_ascii=False)` to match the user's files.
- Preserve key order. When adding `personality` to an existing profile, insert it right
  after `bookPoints`.
- Scan every new string for `\u2014` and `\u2013` before writing.
- Call `present_files` on every changed file. The user cannot see files otherwise.

## 6. Verification checklist (run before you report)

```python
d = json.load(open(path))
s = d['source']
print([r['name'] for r in s['rules'] if not r.get('summary')])        # remaining blanks
print(len(s['profiles']), len(s['rosters']))
ids = [p['id'] for p in s['profiles']]; assert len(ids) == len(set(ids))
```

- JSON loads cleanly and matches the schema (section 11).
- Every `ruleIds`, `roster` and `excludes` entry names a rule or roster that exists in this
  file or in the core rulebook, and every id is unique.
- Each profile's Quality, Combat, rules and points match the page it came from.
- No value was guessed.
- Only intended summaries changed (diff the old and new rule lists by id).
- User notes untouched.
- No provenance tag left on a summary you have since verified.
- Every profile `roster` exists in `rosters`.

## 7. What to tell the user

Keep the report short and concrete:

1. How many rules, rosters and profiles you extracted or filled, and from which pages.
2. What is still blank, left out or uncertain, with page numbers, and why (undefined in the
   book, other book needed, unpublished, unreadable).
3. Borrowed or unverified summaries, named, and which tag they carry.
4. Judgement calls: ambiguous column order, translated terms, mapped aliases.
5. Book discrepancies you preserved (points mismatches, duplicated profiles).
6. Entries in the book that have no rule row in the file (for example Holy Water),
   so the user can add them.
7. Which other files still lack profiles or summaries, and which book would fix it.

Do not claim a section is verified when you did not read the page. Do not pad the report
with a list of every entry you wrote.

## 8. Known pitfalls

- **Edition drift.** SBH, ASOBH, Fightin' Fungi, Hammer & Forge and Deeds and Glory
  share names but not always effects. Verify against the right book.
- **Same name, different rule.** Blast, Squishy, Gargantuan, Reckless and Traps each
  mean something different in at least two books.
- **IDs collide across files.** `asobh.json` and `asobh_1.json` both use id `asobh`.
  `dogged`, `bard` and `unique` exist as plain ids in one file and `sbh-*` in another.
  Resolve by the file's `game` and its prefix, and mention duplicates to the user.
- **Cost list is not a definition.** The big "Ability (cost)" tables in SBH list names
  that have no rules text in the same book.
- **Profile-only traits.** A trait that appears in a profile but nowhere in the rules
  text (Scout, Dismount, Demonslayer) belongs in `choices`, not a guessed id.
- **Hidden text.** A PDF may carry buyer watermarks ("Sold to ...") in the text layer.
  Ignore them and never copy them into any output.
- **Do not trust a page's reading order.** Always confirm a surprising result against the
  layout extraction or the rendered page.
- **Scope creep.** Scenarios, campaign rules, tables and fiction are out of scope unless
  the user asks. Mention them in one line if they are large (Gold and Darkness has full
  dungeon-generation tables and treasure lists, for example).

## 9. Minimal end-to-end recipe

1. Read the file-reading skill. Inventory the PDF. Extract raw and layout text.
2. List blank rules in the target JSON.
3. Locate each blank rule's text in the PDF. Read it. Write a paraphrased summary.
4. Borrow only where costs match, with a provenance tag.
5. Locate profiles. Crop columns. Parse. Map traits to ids. Validate against the formula.
6. Write the JSON. Run the checklist. Present the files.
7. Report what is filled, what is blank, and why.

## 10. Importing it

In the builder, open Sources and use Import source file, or Import folder for several
files at once. The builder checks each entry and tells the user about any it skips. The
file stays in the user's browser and is never uploaded.

## 11. Schema

Derived from the existing source files. If the builder ships its own schema file, that
file wins. Fields marked optional are used only where the book says so.

```json
{
  "format": "warband-source",
  "version": 1,
  "source": {
    "id": "string, kebab case",
    "name": "string",
    "shortName": "string, optional",
    "kind": "core | supplement",
    "game": "asobh | sbh",
    "usableIn": ["asobh"],
    "description": "string, your own words, optional",
    "author": "string",
    "publisher": "string",
    "url": "string, optional",
    "rules": [
      {
        "id": "string, unique across every book",
        "name": "string, as printed",
        "cost": "number",
        "summary": "string, your own paraphrase, or empty",
        "category": "Trait | Spell | ...",
        "tags": ["P", "L", "W", "MI", "A", "R", "..."],
        "rare": "number, optional",
        "excludes": ["rule ids, optional"],
        "page": "number, optional",
        "text": "string, optional, owner's file only"
      }
    ],
    "rosters": [{ "id": "string", "label": "string" }],
    "profiles": [
      {
        "id": "string, starts with the roster id",
        "roster": "roster id",
        "name": "string",
        "quality": "number, 3+ is 3",
        "combat": "number",
        "ruleIds": ["rule ids"],
        "bookPoints": "number, as printed",
        "personality": "true, optional",
        "unique": "true, optional",
        "rare": "number, optional",
        "choices": ["string, optional"]
      }
    ]
  }
}
```
