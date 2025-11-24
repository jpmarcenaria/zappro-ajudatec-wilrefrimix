"use client"
import ChatInterface from '../../components/ChatInterface'
import { UserPlan, User } from '../../types'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()
  const user: User = { id: 'local', name: 'Técnico', email: '', plan: UserPlan.TRIAL }
  const onUpgradeClick = () => {
    router.push('/')
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <ChatInterface user={user} onUpgradeClick={onUpgradeClick} />
    </div>
  )
}
