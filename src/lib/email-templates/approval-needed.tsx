import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  kind?: 'delivery' | 'payout'
  bountyTitle?: string
  contractNo?: string | number | null
  handle?: string
  clipUrl?: string | null
  amountLabel?: string | null
  autoCheckNotes?: string | null
  adminUrl?: string
}

function summary(p: Props) {
  const at = `@${String(p.handle ?? 'editor').replace(/^@/, '')}`
  const no = `#${p.contractNo ?? '—'}`
  const title = p.bountyTitle ? ` "${p.bountyTitle}"` : ''
  return p.kind === 'payout'
    ? `Payout of ${p.amountLabel ?? '—'} requested for ${at} on ${no}${title}`
    : `${at} delivered a clip on ${no}${title}`
}

const Email = (props: Props) => {
  const kind = props.kind ?? 'delivery'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`BOUNTY SOUNDS · approval needed · ${summary(props)}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>BOUNTY SOUNDS // approval needed</Heading>
          <Text style={eventLine}>{summary(props)}</Text>

          {props.clipUrl ? (
            <Section style={metaBox}>
              <Text style={metaRow}>
                <span style={metaLabel}>clip</span>{' '}
                <Link href={props.clipUrl} style={link}>
                  {props.clipUrl}
                </Link>
              </Text>
            </Section>
          ) : null}

          {props.autoCheckNotes ? (
            <>
              <Text style={detailsLabel}>auto-check</Text>
              <Text style={notes}>{props.autoCheckNotes}</Text>
            </>
          ) : null}

          <Section style={{ margin: '24px 0 4px' }}>
            <Button href={props.adminUrl ?? 'https://www.bountysounds.com/admin'} style={button}>
              {kind === 'payout' ? 'Review payout' : 'Review delivery'}
            </Button>
          </Section>

          {kind === 'payout' ? (
            <Text style={warn}>
              Approving in the admin console sends the Stripe transfer — real money.
            </Text>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>Auto-logged by the board.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const handle = `@${String((data.handle as string) ?? 'editor').replace(/^@/, '')}`
    const no = `#${(data.contractNo as string | number) ?? '—'}`
    const title = typeof data.bountyTitle === 'string' ? data.bountyTitle : ''
    return data.kind === 'payout'
      ? `[APPROVE] payout ${data.amountLabel ?? '—'} · ${handle} · ${no}`
      : `[APPROVE] clip from ${handle} · ${no} ${title}`.trim()
  },
  displayName: 'Approval needed',
  to: 'max@florra.net',
  previewData: {
    kind: 'delivery',
    bountyTitle: 'biting bullets by ridgeclub / Grand Theft Auto — Clipping Campaign',
    contractNo: '012',
    handle: 'clipper',
    clipUrl: 'https://www.tiktok.com/@clipper/video/123',
    autoCheckNotes: 'Posted from linked account @clipper, using the contract\u2019s sound.',
    adminUrl: 'https://www.bountysounds.com/admin?focus=sub_123&tab=deliveries',
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
const link = { color: '#0891b2', wordBreak: 'break-all' as const }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const detailsLabel = {
  fontFamily: '"Share Tech Mono", monospace',
  fontSize: '11px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '16px 0 4px',
}
const notes = { fontSize: '14px', color: '#111827', margin: 0 }
const button = {
  backgroundColor: '#0b0f14',
  color: '#ffffff',
  fontFamily: '"Share Tech Mono", monospace',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  padding: '14px 26px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
}
const warn = { fontSize: '12px', color: '#b45309', margin: '10px 0 0' }
const footer = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0' }
