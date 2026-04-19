/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to shepi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>shepi</Text>
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            shepi
          </Link>
          . Click the button below to accept the invitation and create your
          account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px' }
const logo = {
  fontFamily: "'Lora', Georgia, serif",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#4A7C9B',
  margin: '0 0 30px',
  textTransform: 'lowercase' as const,
}
const h1 = {
  fontFamily: "'Lora', Georgia, serif",
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#264A61',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#476A82',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: '#4A7C9B', textDecoration: 'underline' }
const button = {
  backgroundColor: '#4A7C9B',
  color: '#F0E8DA',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#8BA5B8', margin: '30px 0 0' }
