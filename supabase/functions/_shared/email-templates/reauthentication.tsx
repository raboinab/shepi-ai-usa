/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your shepi verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>shepi</Text>
        <Heading style={h1}>Verify your identity</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Space Mono', Courier, monospace",
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#264A61',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#8BA5B8', margin: '30px 0 0' }
