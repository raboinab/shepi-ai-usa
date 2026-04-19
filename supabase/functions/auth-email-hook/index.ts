import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = 'shepi-ai'
const ROOT_DOMAIN = 'shepi.ai'
const FROM_ADDRESS = `${SITE_NAME} <noreply@${ROOT_DOMAIN}>`

async function sendViaResend(opts: {
  apiKey: string
  to: string
  subject: string
  html: string
  text: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }
  return await res.json() as { id?: string }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
    const rawBody = await req.text()

    let payload: any
    if (hookSecret) {
      // Verify standard webhook signature from Supabase Auth
      try {
        const wh = new Webhook(hookSecret.replace(/^v1,whsec_/, '').replace(/^whsec_/, ''))
        const headers = {
          'webhook-id': req.headers.get('webhook-id') ?? '',
          'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
          'webhook-signature': req.headers.get('webhook-signature') ?? '',
        }
        payload = wh.verify(rawBody, headers)
      } catch (err) {
        console.error('Webhook signature verification failed', err)
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Dev mode: accept unsigned payloads
      console.warn('SEND_EMAIL_HOOK_SECRET not set — accepting unsigned payload')
      payload = JSON.parse(rawBody)
    }

    // Supabase Send Email Hook payload shape:
    // { user: { email, ... }, email_data: { token, token_hash, redirect_to, email_action_type, site_url, new_email } }
    const user = payload.user ?? {}
    const data = payload.email_data ?? {}
    const emailType: string = data.email_action_type ?? data.action_type ?? 'magiclink'
    const recipient: string = user.email ?? data.email ?? data.new_email

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'Missing recipient email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const EmailTemplate = EMAIL_TEMPLATES[emailType]
    if (!EmailTemplate) {
      console.error('Unknown email type', { emailType })
      return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build confirmation URL from token_hash + redirect_to (Supabase pattern)
    const siteUrl: string = data.site_url ?? `https://${ROOT_DOMAIN}`
    const redirectTo: string = data.redirect_to ?? siteUrl
    const confirmationUrl = data.token_hash
      ? `${siteUrl.replace(/\/$/, '')}/auth/v1/verify?token=${data.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`
      : redirectTo

    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: `https://${ROOT_DOMAIN}`,
      recipient,
      confirmationUrl,
      token: data.token,
      email: recipient,
      newEmail: data.new_email,
    }

    const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })

    const result = await sendViaResend({
      apiKey: resendKey,
      to: recipient,
      subject: EMAIL_SUBJECTS[emailType] ?? 'Notification',
      html,
      text,
    })

    console.log('Auth email sent', { id: result.id, emailType, recipient })
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('auth-email-hook error', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
