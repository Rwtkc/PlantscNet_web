import nodemailer from 'nodemailer'

const contactMailConfig = {
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  user: '1691467419@qq.com',
  pass: 'dfkydcbabbnmcjhb',
  recipient: '1691467419@qq.com',
}

const transporter = nodemailer.createTransport({
  host: contactMailConfig.host,
  port: contactMailConfig.port,
  secure: contactMailConfig.secure,
  auth: {
    user: contactMailConfig.user,
    pass: contactMailConfig.pass,
  },
})

function normalizeField(value, maxLength) {
  const normalized = String(value ?? '').trim()
  return normalized.slice(0, maxLength)
}

export function validateContactRequest(payload) {
  const name = normalizeField(payload?.name, 120)
  const email = normalizeField(payload?.email, 160)
  const message = normalizeField(payload?.message, 5000)

  if (!name) {
    return { error: 'Name is required.' }
  }

  if (!email) {
    return { error: 'Email is required.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Email format is invalid.' }
  }

  if (!message) {
    return { error: 'Message is required.' }
  }

  return {
    error: null,
    data: {
      name,
      email,
      message,
    },
  }
}

export async function sendContactRequestMail({ name, email, message }) {
  const subject = `PlantscNet Contact Request | ${name}`
  const text = [
    'A new contact request was submitted from the PlantscNet website.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Message:',
    message,
  ].join('\n')

  const html = [
    '<section style="font-family:Arial,sans-serif;line-height:1.6;color:#173825;">',
    '<h2 style="margin:0 0 12px;">PlantscNet Contact Request</h2>',
    `<p style="margin:0 0 8px;"><strong>Name:</strong> ${name}</p>`,
    `<p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>`,
    `<p style="margin:16px 0 8px;"><strong>Message:</strong></p>`,
    `<pre style="margin:0;padding:12px;border-radius:8px;background:#f4f8ef;white-space:pre-wrap;font-family:inherit;">${message}</pre>`,
    '</section>',
  ].join('')

  await transporter.sendMail({
    from: `"PlantscNet Contact" <${contactMailConfig.user}>`,
    to: contactMailConfig.recipient,
    replyTo: email,
    subject,
    text,
    html,
  })
}
