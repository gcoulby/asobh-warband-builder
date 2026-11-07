import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sourceModel, typeLabel, type ModelField } from '@/data/source-model'

interface DataModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const anchor = (className: string) => `model-${className}`

/** The class a field holds or refers to, if any. */
const linkedClass = (field: ModelField) =>
  field.type.kind === 'contains' || field.type.kind === 'ref' ? field.type.className : undefined

/** A read-only view of the source file model: each class, its fields, and how the classes link up. */
export function DataModelDialog({ open, onOpenChange }: DataModelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Source file data model</DialogTitle>
          <DialogDescription>
            Every source file follows this model. Contains means the field holds the items themselves; id means it
            names them by id.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 flex min-h-0 flex-col gap-4 overflow-y-auto px-4 py-1">
          {sourceModel.map((c) => (
            <section key={c.name} id={anchor(c.name)} aria-labelledby={`${anchor(c.name)}-title`} className="rounded-sm border bg-card">
              <header className="border-b px-3 py-2">
                <h3 id={`${anchor(c.name)}-title`} className="font-mono text-sm font-semibold">
                  {c.name}
                </h3>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </header>
              <dl className="divide-y">
                {c.fields.map((f) => {
                  const linked = linkedClass(f)
                  const type = typeLabel(f)
                  return (
                    <div key={f.name} className="grid gap-x-3 gap-y-0.5 px-3 py-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
                      <dt className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-semibold">{f.name}</span>
                        {!f.required && (
                          <Badge variant="outline" className="text-[0.65rem]">
                            optional
                          </Badge>
                        )}
                      </dt>
                      <dd className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs break-words text-primary">
                          {linked ? (
                            <a
                              href={`#${anchor(linked)}`}
                              className="underline underline-offset-2"
                              onClick={(e) => {
                                e.preventDefault()
                                document.getElementById(anchor(linked))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }}
                            >
                              {f.type.kind === 'contains' ? `contains ${type}` : type}
                            </a>
                          ) : (
                            type
                          )}
                        </span>
                        <span className="text-muted-foreground">{f.description}</span>
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
