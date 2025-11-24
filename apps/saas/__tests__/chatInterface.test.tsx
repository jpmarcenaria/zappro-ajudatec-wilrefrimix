import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInterface from '../components/ChatInterface'
import { UserPlan } from '../types'

const user = { name: 'Tester', plan: UserPlan.TRIAL }

test('envia mensagem simples', async () => {
  render(<ChatInterface user={user as any} onUpgradeClick={() => {}} />)
  const ta = screen.getByRole('textbox')
  fireEvent.change(ta, { target: { value: 'Olá' } })
  fireEvent.keyDown(ta, { key: 'Enter' })
  expect(screen.getByText(/Olá/)).toBeDefined()
})
