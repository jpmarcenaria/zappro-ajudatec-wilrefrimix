import { Attachment } from '../types'
export const sendMessage = async (text: string, attachments: Attachment[], useSearch: boolean = false) => {
  const res = await fetch(`/api/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, attachments, useSearch })
  })
  if (!res.ok) throw new Error('Falha ao consultar o modelo')
  const data = await res.json()
  return { text: data.text, groundingUrls: data.groundingUrls || [] }
}

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const res = await fetch(`/api/openai/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Audio, mimeType })
  })
  if (!res.ok) return ""
  const data = await res.json()
  return typeof data.text === 'string' ? data.text.trim() : ""
}

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text || text.length < 2) return null
  const res = await fetch(`/api/openai/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.audioBase64 || null
}
