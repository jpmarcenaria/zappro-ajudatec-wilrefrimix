import React from 'react'
import { render, screen } from '@testing-library/react'
import WebLanding from '../components/WebLanding'

test('renderiza hero e CTA', () => {
  render(<WebLanding onStartTrial={() => {}} onLogin={() => {}} />)
  expect(screen.getByText(/A Inteligência da OpenAI/i)).toBeDefined()
  expect(screen.getByText(/Começar Agora/i)).toBeDefined()
})

test('renderiza mock do iPhone', () => {
  render(<WebLanding onStartTrial={() => {}} onLogin={() => {}} />)
  const elements = screen.getAllByText(/ZapPRO/i)
  expect(elements.length).toBeGreaterThan(0)
})
