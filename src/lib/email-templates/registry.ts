import type { ComponentType } from 'react'
import { template as actionAlertTemplate } from './action-alert'
import { template as approvalNeededTemplate } from './approval-needed'
import { template as editorStatusTemplate } from './editor-status'


export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'action-alert': actionAlertTemplate,
  'approval-needed': approvalNeededTemplate,
  'editor-status': editorStatusTemplate,
}

