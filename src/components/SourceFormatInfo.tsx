import { useState } from 'react'
import { Bot, Braces, Download, FileCode, Network, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { DataModelDialog } from '@/components/DataModelDialog'
import { Button } from '@/components/ui/button'
import { agentGuideText } from '@/data/agent-guide'
import { sourceEcore, sourceJsonSchema, sourceTemplate } from '@/data/source-model'
import { jsonFileType, saveFile, type FilePickerType } from '@/lib/file-access'

const markdownType: FilePickerType = { description: 'Markdown', accept: { 'text/markdown': ['.md'] } }
const ecoreType: FilePickerType = { description: 'Ecore model', accept: { 'application/xml': ['.ecore'] } }

const download = (text: string, name: string, type: FilePickerType, mime: string) => {
  saveFile(new Blob([text], { type: mime }), name, type).catch(() => toast.error(`${name} could not be saved. Try again.`))
}

const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`

/** How book sources are made, the files to make your own, and the promise that book data is never shared. */
export function SourceFormatInfo() {
  const [modelOpen, setModelOpen] = useState(false)
  return (
    <section aria-labelledby="source-format" className="flex flex-col gap-3 rounded-sm border bg-card p-4">
      <h2 id="source-format" className="font-display text-xl font-semibold">
        Making source files
      </h2>
      <p className="max-w-prose text-sm">
        The book source files were extracted from their PDFs with AI, following the data model you can view and download
        here. You can do the same with books you own: give an AI agent your PDF and the AGENT.md guide, then import the
        file it makes.
      </p>
      <p className="flex max-w-prose gap-2 rounded-sm border border-primary/40 bg-primary/5 p-3 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          <strong>Book data is never shared, under any circumstances.</strong> The builder includes only rule names and
          point costs. Rule text and profiles taken from the books are never given to anyone. Anything you import stays in
          this browser: the builder has no server or accounts and uploads nothing.
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setModelOpen(true)}>
          <Network /> View data model
        </Button>
        <Button variant="outline" onClick={() => download(agentGuideText(), 'AGENT.md', markdownType, 'text/markdown')}>
          <Bot /> Download AGENT.md
        </Button>
        <Button
          variant="outline"
          onClick={() => download(json(sourceJsonSchema()), 'warband-source.schema.json', jsonFileType, 'application/json')}
        >
          <Braces /> JSON Schema
        </Button>
        <Button variant="outline" onClick={() => download(json(sourceTemplate), 'source-template.json', jsonFileType, 'application/json')}>
          <Download /> Template
        </Button>
        <Button variant="outline" onClick={() => download(sourceEcore(), 'warband-source.ecore', ecoreType, 'application/xml')}>
          <FileCode /> model.ecore
        </Button>
      </div>
      <DataModelDialog open={modelOpen} onOpenChange={setModelOpen} />
    </section>
  )
}
