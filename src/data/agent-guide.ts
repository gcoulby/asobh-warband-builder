import guide from '@/data/agent-guide.md?raw'
import { sourceJsonSchema } from '@/data/source-model'

/** AGENT.md: instructions for an AI agent extracting a book, with the current JSON Schema at the end. */
export const agentGuideText = (): string => `${guide.trimEnd()}\n\n\`\`\`json\n${JSON.stringify(sourceJsonSchema(), null, 2)}\n\`\`\`\n`
