import { sourceModel, typeLabel, type ModelClass, type ModelField } from '@/data/source-model'

interface DataModelDiagramProps {
  /** Called with a class name when its box is clicked. */
  onSelect: (className: string) => void
}

/** Classes by row, top to bottom. Containment runs down the rows; references run along a row. */
const ROWS = [['SourceFile'], ['Source'], ['SpecialRule', 'Profile', 'Roster']]

const CHAR = 7
const LINE = 17
const HEAD = 26
const PAD = 8
const GAP_X = 104
const GAP_Y = 72
const MARGIN = 24
const BOTTOM = 56

interface Box {
  cls: ModelClass
  lines: string[]
  x: number
  y: number
  w: number
  h: number
}

const isLink = (f: ModelField) => f.type.kind === 'contains' || f.type.kind === 'ref'
const multiplicity = (f: ModelField) => (f.many ? '0..*' : f.required ? '1' : '0..1')

function layout() {
  const sized = ROWS.map((row) =>
    row.flatMap((name) => {
      const cls = sourceModel.find((c) => c.name === name)
      if (!cls) return []
      const lines = cls.fields.filter((f) => !isLink(f)).map((f) => `${f.name}${f.required ? '' : '?'}: ${typeLabel(f)}`)
      const w = Math.max(cls.name.length, ...lines.map((l) => l.length)) * CHAR + PAD * 2
      return [{ cls, lines, w, h: HEAD + lines.length * LINE + PAD, x: 0, y: 0 }]
    }),
  )
  const rowWidth = (row: Box[]) => row.reduce((sum, b) => sum + b.w, 0) + GAP_X * (row.length - 1)
  const width = Math.max(...sized.map(rowWidth)) + MARGIN * 2
  let y = MARGIN
  for (const row of sized) {
    let x = (width - rowWidth(row)) / 2
    for (const box of row) {
      box.x = x
      box.y = y
      x += box.w + GAP_X
    }
    y += Math.max(...row.map((b) => b.h)) + GAP_Y
  }
  return { boxes: sized.flat(), width, height: y - GAP_Y + BOTTOM }
}

const { boxes, width, height } = layout()
const boxOf = (name: string) => boxes.find((b) => b.cls.name === name)

/** Open arrowhead pointing in direction (dx, dy) with its tip at (x, y). */
const arrow = (x: number, y: number, dx: number, dy: number) =>
  `M${x - dx * 8 - dy * 4},${y - dy * 8 - dx * 4} L${x},${y} L${x - dx * 8 + dy * 4},${y - dy * 8 + dx * 4}`

interface Edge {
  key: string
  path: string
  head: string
  diamond?: string
  label: { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }
}

function edges(): Edge[] {
  const out: Edge[] = []
  for (const from of boxes) {
    let rowRefs = 0
    for (const f of from.cls.fields) {
      if (f.type.kind !== 'contains' && f.type.kind !== 'ref') continue
      const to = boxOf(f.type.className)
      if (!to) continue
      const text = `${f.name} ${multiplicity(f)}`
      const key = `${from.cls.name}.${f.name}`
      if (f.type.kind === 'contains') {
        const cx = to.x + to.w / 2
        const sx = Math.min(Math.max(cx, from.x + 20), from.x + from.w - 20)
        const sy = from.y + from.h
        const bus = to.y - 30
        out.push({
          key,
          diamond: `M${sx},${sy} L${sx + 5},${sy + 8} L${sx},${sy + 16} L${sx - 5},${sy + 8} Z`,
          path: `M${sx},${sy + 16} V${bus} H${cx} V${to.y}`,
          head: '',
          // Labels sit on the outer side of the branch, so the rightmost one stays inside the drawing.
          label: cx > from.x + from.w / 2 ? { x: cx - 6, y: to.y - 8, text, anchor: 'end' } : { x: cx + 6, y: to.y - 8, text, anchor: 'start' },
        })
      } else if (to === from) {
        const x1 = from.x + 28
        const x2 = from.x + 72
        const y0 = from.y + from.h
        out.push({
          key,
          path: `M${x1},${y0} V${y0 + 24} H${x2} V${y0}`,
          head: arrow(x2, y0, 0, -1),
          label: { x: x2 + 8, y: y0 + 20, text, anchor: 'start' },
        })
      } else {
        const y = Math.max(from.y, to.y) + HEAD + 14 + rowRefs * 24
        rowRefs += 1
        const rightward = to.x > from.x
        const sx = rightward ? from.x + from.w : from.x
        const tx = rightward ? to.x : to.x + to.w
        out.push({
          key,
          path: `M${sx},${y} H${tx}`,
          head: arrow(tx, y, rightward ? 1 : -1, 0),
          label: { x: (sx + tx) / 2, y: y - 6, text, anchor: 'middle' },
        })
      }
    }
  }
  return out
}

const allEdges = edges()

/** The source file model as an Ecore-style class diagram. */
export function DataModelDiagram({ onSelect }: DataModelDiagramProps) {
  return (
    <div className="shrink-0 overflow-x-auto rounded-sm border bg-background">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ minWidth: Math.round(width * 0.8) }}
        className="block font-mono text-[11px]"
        role="img"
        aria-label="Class diagram: a SourceFile contains one Source, which contains SpecialRules, Rosters and Profiles. A Profile refers to its Roster and its SpecialRules by id, and a SpecialRule can exclude other SpecialRules."
      >
        {allEdges.map((e) => (
          <g key={e.key} className="text-muted-foreground">
            <path d={e.path} fill="none" stroke="currentColor" strokeWidth={1.25} />
            {e.head && <path d={e.head} fill="none" stroke="currentColor" strokeWidth={1.25} />}
            {e.diamond && <path d={e.diamond} fill="currentColor" />}
            <text x={e.label.x} y={e.label.y} textAnchor={e.label.anchor} fill="currentColor">
              {e.label.text}
            </text>
          </g>
        ))}
        {boxes.map((b) => (
          <a
            key={b.cls.name}
            href={`#model-${b.cls.name}`}
            className="group"
            onClick={(e) => {
              e.preventDefault()
              onSelect(b.cls.name)
            }}
          >
            <title>{`${b.cls.name}: ${b.cls.description}`}</title>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4} className="fill-card stroke-border group-hover:stroke-primary group-focus-visible:stroke-ring" strokeWidth={1.5} />
            <rect x={b.x} y={b.y} width={b.w} height={HEAD} rx={4} className="fill-primary/15" />
            <line x1={b.x} x2={b.x + b.w} y1={b.y + HEAD} y2={b.y + HEAD} className="stroke-border" />
            <text x={b.x + b.w / 2} y={b.y + 17} textAnchor="middle" className="fill-foreground text-xs font-semibold">
              {b.cls.name}
            </text>
            {b.lines.map((line, i) => (
              <text key={line} x={b.x + PAD} y={b.y + HEAD + 14 + i * LINE} className="fill-muted-foreground">
                {line}
              </text>
            ))}
          </a>
        ))}
      </svg>
    </div>
  )
}
