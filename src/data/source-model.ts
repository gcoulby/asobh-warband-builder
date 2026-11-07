import { COMBAT_VALUES, QUALITY_VALUES, RULE_TAGS, SOURCE_FILE_FORMAT, SOURCE_KINDS } from '@/lib/schema'

/**
 * The source file format, described for people and AI agents: each class and
 * field with its type and meaning. The JSON Schema, the .ecore model, the
 * template and the data model viewer are all made from this. A test keeps it
 * in step with the zod schemas in lib/schema.
 */

export type FieldType =
  | { kind: 'string' }
  | { kind: 'integer'; values?: readonly number[] }
  | { kind: 'boolean' }
  | { kind: 'literal'; value: string | number }
  | { kind: 'enum'; values: readonly string[] }
  /** Holds instances of another class. */
  | { kind: 'contains'; className: string }
  /** Names instances of another class by id. */
  | { kind: 'ref'; className: string }

export interface ModelField {
  name: string
  type: FieldType
  required: boolean
  many?: boolean
  description: string
}

export interface ModelClass {
  name: string
  description: string
  fields: readonly ModelField[]
}

const text = { kind: 'string' } as const
const req = (name: string, type: FieldType, description: string, many = false): ModelField => ({ name, type, required: true, many, description })
const opt = (name: string, type: FieldType, description: string, many = false): ModelField => ({ name, type, required: false, many, description })

export const sourceModel: readonly ModelClass[] = [
  {
    name: 'SourceFile',
    description: 'The file itself. One source per file.',
    fields: [
      req('format', { kind: 'literal', value: SOURCE_FILE_FORMAT }, 'Always "warband-source".'),
      req('version', { kind: 'literal', value: 1 }, 'Always 1.'),
      req('source', { kind: 'contains', className: 'Source' }, 'The source.'),
    ],
  },
  {
    name: 'Source',
    description: 'A rulebook, supplement or your own collection, with its rules, rosters and profiles.',
    fields: [
      req('id', text, 'Unique id in kebab case, such as "giant-ants".'),
      req('name', text, 'Full title, such as "Giant Ants".'),
      opt('shortName', text, 'Short label for lists, such as "ASOBH".'),
      req('kind', { kind: 'enum', values: SOURCE_KINDS }, 'core for a game\'s rulebook, supplement for an add-on book, custom for your own.'),
      req('game', text, 'Game the source is written for: "asobh" (Advanced Song of Blades and Heroes) or "sbh" (Song of Blades and Heroes Revised).'),
      opt('usableIn', text, 'Other games that may use this source, such as ["asobh"] for an SBH supplement.', true),
      opt('author', text, 'Author or authors.'),
      opt('publisher', text, 'Publisher, such as "Ganesha Games".'),
      opt('url', text, 'Where to buy or read about the book.'),
      opt('version', text, 'Edition or printing, such as "1.1".'),
      opt('description', text, 'One or two sentences of your own about the book.'),
      req('rules', { kind: 'contains', className: 'SpecialRule' }, 'Special rules the book adds. Rules from another book are referenced, not repeated.', true),
      req('rosters', { kind: 'contains', className: 'Roster' }, 'Warband lists in the book. May be empty.', true),
      req('profiles', { kind: 'contains', className: 'Profile' }, 'Ready-made models from the rosters. May be empty.', true),
    ],
  },
  {
    name: 'SpecialRule',
    description: 'A special rule a model can have, with its points cost.',
    fields: [
      req('id', text, 'Unique id across every source, in kebab case from the name, such as "acid-spray".'),
      req('name', text, 'Name as printed, such as "Acid Spray".'),
      req('cost', { kind: 'integer' }, 'Points cost as printed. Can be negative. Never guessed.'),
      req('summary', text, 'A short reminder in your own words. Use "" when there is none.'),
      opt('text', text, 'Full rule text, for your personal copy only.'),
      opt('page', text, 'Page number, such as "42".'),
      opt('category', text, 'Grouping, such as "Trait", "Spell" or "Weapon".'),
      opt('tags', { kind: 'enum', values: RULE_TAGS }, 'Book markers: P Personality only, L Leadership, W Weapon, MA Martial art, MI Magic item, A Alchemical item.', true),
      opt('rare', { kind: 'integer' }, 'Most figures in a warband that may have the rule.'),
      opt('excludes', { kind: 'ref', className: 'SpecialRule' }, 'Rules a model cannot have alongside this one.', true),
    ],
  },
  {
    name: 'Roster',
    description: 'A warband list from the book, such as Lizardmen.',
    fields: [
      req('id', text, 'Unique id across every source, starting with a short code for the book, such as "ga-giant-ants".'),
      req('label', text, 'Name as printed.'),
    ],
  },
  {
    name: 'Profile',
    description: 'A ready-made model from a roster.',
    fields: [
      req('id', text, 'Unique id, starting with the roster id, such as "ga-giant-ants-giant-ant-worker".'),
      req('roster', { kind: 'ref', className: 'Roster' }, 'The roster it belongs to.'),
      req('name', text, 'Name as printed.'),
      req('quality', { kind: 'integer', values: QUALITY_VALUES }, 'Quality as a number: 3+ is 3.'),
      req('combat', { kind: 'integer', values: COMBAT_VALUES }, 'Combat score.'),
      req('ruleIds', { kind: 'ref', className: 'SpecialRule' }, 'Its special rules, by id. Rules from the core book use that book\'s ids.', true),
      opt('bookPoints', { kind: 'integer' }, 'Points printed for the profile. The builder trusts it over its formula.'),
      opt('personality', { kind: 'boolean' }, 'True for a personality.'),
      opt('rare', { kind: 'integer' }, 'Most models from this profile a warband may field.'),
      opt('unique', { kind: 'boolean' }, 'True when only one is allowed per warband.'),
      opt('choices', text, 'Options the book offers, such as "Huge Weapon or Bludgeon". The first is used.', true),
    ],
  },
]

const classByName = (name: string) => sourceModel.find((c) => c.name === name)

/** How a field's type reads in the viewer, such as "SpecialRule id[]". */
export function typeLabel(field: ModelField): string {
  const t = field.type
  const base =
    t.kind === 'contains'
      ? t.className
      : t.kind === 'ref'
        ? `${t.className} id`
        : t.kind === 'literal'
          ? JSON.stringify(t.value)
          : t.kind === 'enum'
            ? t.values.join(' | ')
            : t.kind === 'integer' && t.values
              ? `${t.values[0]}–${t.values[t.values.length - 1]}`
              : t.kind
  return field.many ? `${t.kind === 'enum' ? `(${base})` : base}[]` : base
}

type JsonSchema = Record<string, unknown>

const fieldSchema = (field: ModelField): JsonSchema => {
  const t = field.type
  const one: JsonSchema =
    t.kind === 'contains'
      ? { $ref: `#/$defs/${t.className}` }
      : t.kind === 'ref'
        ? { type: 'string', description: `Id of a ${t.className}.` }
        : t.kind === 'literal'
          ? { const: t.value }
          : t.kind === 'enum'
            ? { type: 'string', enum: [...t.values] }
            : t.kind === 'integer'
              ? t.values
                ? { type: 'integer', enum: [...t.values] }
                : { type: 'integer' }
              : { type: t.kind }
  return field.many ? { type: 'array', items: one, description: field.description } : { ...one, description: field.description }
}

const classSchema = (c: ModelClass): JsonSchema => ({
  type: 'object',
  description: c.description,
  properties: Object.fromEntries(c.fields.map((f) => [f.name, fieldSchema(f)])),
  required: c.fields.filter((f) => f.required).map((f) => f.name),
  additionalProperties: false,
})

/** JSON Schema (2020-12) for a source file. */
export function sourceJsonSchema(): JsonSchema {
  const root = classByName('SourceFile')
  if (!root) throw new Error('The model has no SourceFile class.')
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'warband-source.schema.json',
    title: 'Warband source file',
    ...classSchema(root),
    $defs: Object.fromEntries(sourceModel.filter((c) => c !== root).map((c) => [c.name, classSchema(c)])),
  }
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const eType = (t: FieldType) =>
  t.kind === 'integer' ? 'EInt' : t.kind === 'boolean' ? 'EBoolean' : t.kind === 'literal' && typeof t.value === 'number' ? 'EInt' : 'EString'

const enumName = (c: ModelClass, f: ModelField) => `${c.name}${f.name[0].toUpperCase()}${f.name.slice(1)}`

/** The same model as an Eclipse EMF .ecore file, for modelling tools. */
export function sourceEcore(): string {
  const doc = (d: string) =>
    `      <eAnnotations source="http://www.eclipse.org/emf/2002/GenModel">\n        <details key="documentation" value="${xml(d)}"/>\n      </eAnnotations>\n`
  const feature = (c: ModelClass, f: ModelField) => {
    const bounds = `${f.required ? ' lowerBound="1"' : ''}${f.many ? ' upperBound="-1"' : ''}`
    const t = f.type
    const head =
      t.kind === 'contains' || t.kind === 'ref'
        ? `<eStructuralFeatures xsi:type="ecore:EReference" name="${f.name}"${bounds} eType="#//${t.className}"${t.kind === 'contains' ? ' containment="true"' : ''}>`
        : t.kind === 'enum'
          ? `<eStructuralFeatures xsi:type="ecore:EAttribute" name="${f.name}"${bounds} eType="#//${enumName(c, f)}">`
          : `<eStructuralFeatures xsi:type="ecore:EAttribute" name="${f.name}"${bounds} eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//${eType(t)}"${t.kind === 'literal' ? ` defaultValueLiteral="${xml(String(t.value))}"` : ''}>`
    return `    ${head}\n${doc(f.description)}    </eStructuralFeatures>\n`
  }
  const enums = sourceModel.flatMap((c) =>
    c.fields.flatMap((f) =>
      f.type.kind === 'enum'
        ? [
            `  <eClassifiers xsi:type="ecore:EEnum" name="${enumName(c, f)}">\n${f.type.values
              .map((v, i) => `    <eLiterals name="${xml(v)}" value="${i}"/>\n`)
              .join('')}  </eClassifiers>\n`,
          ]
        : [],
    ),
  )
  const classes = sourceModel.map(
    (c) =>
      `  <eClassifiers xsi:type="ecore:EClass" name="${c.name}">\n${doc(c.description).replace(/^ {2}/gm, '')}${c.fields
        .map((f) => feature(c, f))
        .join('')}  </eClassifiers>\n`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="warbandsource" nsURI="urn:warband-source:1" nsPrefix="warbandsource">
${classes.join('')}${enums.join('')}</ecore:EPackage>
`
}

/** A small, made-up source file showing every part of the format. */
export const sourceTemplate = {
  format: SOURCE_FILE_FORMAT,
  version: 1,
  source: {
    id: 'my-supplement',
    name: 'My Supplement',
    shortName: 'MS',
    kind: 'supplement',
    game: 'asobh',
    author: 'Your name',
    description: 'What the book is about, in your own words.',
    rules: [
      {
        id: 'example-rule',
        name: 'Example Rule',
        cost: 10,
        summary: 'A short reminder in your own words.',
        page: '12',
        category: 'Trait',
      },
    ],
    rosters: [{ id: 'ms-raiders', label: 'Raiders' }],
    profiles: [
      {
        id: 'ms-raiders-raider-captain',
        roster: 'ms-raiders',
        name: 'Raider Captain',
        quality: 3,
        combat: 3,
        ruleIds: ['leader', 'example-rule'],
        bookPoints: 60,
        personality: true,
        unique: true,
      },
    ],
  },
}
