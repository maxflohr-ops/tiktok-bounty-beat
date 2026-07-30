import * as React from 'react'
import { Body, Container, Head, Hr, Html, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

// Status updates sent to editors (clip approved / sent back / payout sent).
// Recipient is the editor's sign-in email, passed by the caller.
interface Props {
  title?: string
  body?: string
}

const Email = ({ title = 'Update', body = '' }: Props) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Text style={h1}>Bounty Sounds</Text>
        <Text style={heading}>{title}</Text>
        <Text style={paragraph}>{body}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Track every claim at bountysounds.com — sign in and open your dashboard.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    `[BOUNTY SOUNDS] ${typeof data.title === 'string' ? data.title : 'Update'}`,
  displayName: 'Editor status update',
  previewData: {
    title: 'Clip approved',
    body: 'Your clip was approved — payout follows at the close of its counting window.',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#f5f3ee',
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  color: '#0d0d0d',
}
const container = { padding: '28px', maxWidth: '520px' }
const h1 = { fontSize: '14px', letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#8a8578' }
const heading = { fontSize: '22px', fontWeight: 700 as const, margin: '8px 0 0' }
const paragraph = { fontSize: '15px', lineHeight: '1.6', color: '#3d3a33' }
const hr = { borderColor: '#e3dfd5', margin: '20px 0 12px' }
const footer = { fontSize: '12px', color: '#8a8578' }
