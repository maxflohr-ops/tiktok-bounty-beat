import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  event?: string
  actor?: string | null
  reference?: string | null
  timestamp?: string
  detailsJson?: string
}

const Email = ({
  event = 'event',
  actor,
  reference,
  timestamp,
  detailsJson,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`BOUNTY SOUNDS · ${event}${reference ? ` · ${reference}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>BOUNTY SOUNDS // action log</Heading>
        <Text style={eventLine}>{event}</Text>

        <Section style={metaBox}>
          {timestamp && (
            <Text style={metaRow}>
              <span style={metaLabel}>when</span> {timestamp}
            </Text>
          )}
          {actor && (
            <Text style={metaRow}>
              <span style={metaLabel}>actor</span> {actor}
            </Text>
          )}
          {reference && (
            <Text style={metaRow}>
              <span style={metaLabel}>ref</span> {reference}
            </Text>
          )}
        </Section>

        {detailsJson && detailsJson !== '{}' && (
          <>
            <Hr style={hr} />
            <Text style={detailsLabel}>details</Text>
            <pre style={pre}>{detailsJson}</pre>
          </>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Auto-logged by the board. Mirrored to Airtable + Google Sheets.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const event = typeof data.event === 'string' ? data.event : 'event'
    const ref = typeof data.reference === 'string' && data.reference ? ` · ${data.reference}` : ''
    return `[BOUNTY SOUNDS] ${event}${ref}`
  },
  displayName: 'Admin action alert',
  to: 'maxflohr@allmylifeproductions.com',
  previewData: {
    event: 'proof.delivered',
    actor: 'clipper@example.com',
    reference: 'No. 007',
    timestamp: new Date().toISOString(),
    detailsJson: JSON.stringify({ submission_id: 'sub_123', view_count: 12400 }, null, 2),
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Chakra Petch", "Helvetica Neue", Arial, sans-serif',
  color: '#0b0f14',
}
const container = { padding: '28px 28px 24px', maxWidth: '560px' }
const h1 = {
  fontFamily: '"Pirata One", "Chakra Petch", serif',
  fontSize: '22px',
  letterSpacing: '0.04em',
  color: '#0b0f14',
  margin: '0 0 8px',
}
const eventLine = {
  fontFamily: '"Share Tech Mono", monospace',
  fontSize: '15px',
  color: '#0891b2',
  margin: '0 0 16px',
}
const metaBox = {
  padding: '14px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  backgroundColor: '#f8fafc',
}
const metaRow = { margin: '2px 0', fontSize: '14px', color: '#111827' }
const metaLabel = {
  fontFamily: '"Share Tech Mono", monospace',
  color: '#6b7280',
  marginRight: '8px',
  textTransform: 'uppercase' as const,
  fontSize: '11px',
}
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const detailsLabel = {
  fontFamily: '"Share Tech Mono", monospace',
  fontSize: '11px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}
const pre = {
  fontFamily: '"Share Tech Mono", monospace',
  fontSize: '12px',
  backgroundColor: '#0b0f14',
  color: '#e5e7eb',
  padding: '12px 14px',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  margin: 0,
}
const footer = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '16px 0 0',
}
