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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for shepi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>shepi</Text>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for creating your{' '}
          <Link href={siteUrl} style={link}>
            shepi
          </Link>{' '}
          account.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
