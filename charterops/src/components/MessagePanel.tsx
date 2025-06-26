'use client'

import { useState } from 'react'
import { supabase, Flight, Message } from '@/lib/supabase'
import { Send, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface MessagePanelProps {
  flight: Flight
  isOpen: boolean
  onClose: () => void
}

const messageTemplates = {
  delay_notice: {
    title: 'Delay Notice',
    template: 'Dear passenger, your flight {tail_number} from {origin} to {destination} has been delayed. We apologize for the inconvenience and will keep you updated on the new departure time.',
    icon: '⏰'
  },
  reroute_update: {
    title: 'Reroute Update',
    template: 'Your flight {tail_number} has been rerouted to {fallback_airport} due to operational requirements. We will provide ground transportation to your original destination.',
    icon: '🔄'
  },
  crew_reassignment: {
    title: 'Crew Reassignment',
    template: 'Your flight {tail_number} will be operated by a different crew due to scheduling changes. All safety standards remain the same.',
    icon: '👥'
  }
}

export default function MessagePanel({ flight, isOpen, onClose }: MessagePanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('delay_notice')
  const [messageText, setMessageText] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [sentMessages, setSentMessages] = useState<Message[]>([])

  const generateMessage = () => {
    const template = messageTemplates[selectedTemplate as keyof typeof messageTemplates]
    const text = template.template
      .replace('{tail_number}', flight.tail_number)
      .replace('{origin}', flight.origin)
      .replace('{destination}', flight.destination)
      .replace('{fallback_airport}', 'KJFK') // This would come from backup plan
    
    setMessageText(text)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || recipients.length === 0) return

    setLoading(true)

    const message: Partial<Message> = {
      flight_id: flight.id,
      type: selectedTemplate as Message['type'],
      text: messageText,
      recipients: recipients,
      sent_at: new Date().toISOString()
    }

    const { data } = await supabase
      .from('messages')
      .insert([message])
      .select()

    if (data) {
      setSentMessages([...sentMessages, data[0]])
      setMessageText('')
      setRecipients([])
    }

    setLoading(false)
  }

  const addRecipient = (email: string) => {
    if (email && !recipients.includes(email)) {
      setRecipients([...recipients, email])
    }
  }

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              <MessageSquare className="h-5 w-5 inline mr-2" />
              Passenger Communication - {flight.tail_number}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message Composition */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Compose Message</h3>
              
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value)
                    generateMessage()
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(messageTemplates).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.icon} {template.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      placeholder="Add email address"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addRecipient(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[type="email"]') as HTMLInputElement
                        if (input) {
                          addRecipient(input.value)
                          input.value = ''
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Message content..."
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={loading || !messageText.trim() || recipients.length === 0}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>

            {/* Message History */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Message History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sentMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages sent yet</p>
                ) : (
                  sentMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {messageTemplates[message.type]?.title || message.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.sent_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{message.text}</p>
                      <div className="text-xs text-gray-500">
                        Sent to: {message.recipients.join(', ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 