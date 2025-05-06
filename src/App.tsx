import { useState, useEffect } from 'react'
import './App.css'
import TommyImage from './assets/Tommy.png'
import TommyAiHappy from './assets/TommyAi_Happy.png'
import TommyAiSad from './assets/TommyAi_Sad.png'
import TommyAiAngry from './assets/TommyAi_Angry.png'

function App() {
  const [chatResponse, setChatResponse] = useState('')
  const [userInput, setUserInput] = useState('')
  const [userName, setUserName] = useState('') // Store the user's name
  const [isNameSet, setIsNameSet] = useState(false) // Track if the name has been set
  const [tommyImage, setTommyImage] = useState(TommyImage)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]) // Chat history

  type AIResponse = {
    response: string
  }

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setIsNameSet(true) // Mark the name as set
    }
  }

  const aiFunction = async () => {
    if (!userInput.trim()) return // Prevent empty submissions

    // Add the user's message to the chat history
    setMessages((prev) => [...prev, { sender: 'user', text: userInput }])

    // Build the conversation context by concatenating all previous messages
    const conversationContext = messages
      .map((message) => `${message.sender === 'user' ? userName : 'AI'}: ${message.text}`)
      .join('\n')

    const fullMessage = `${conversationContext}\n${userName}: ${userInput}`

    console.log("Sending to API:", fullMessage) // Log the full message being sent to the API

    setUserInput('') // Clear the input field

    setLoading(true)
    await fetch('/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput: fullMessage }),
    })
      .then((res) => res.json() as Promise<{ aiResponse: AIResponse }>)
      .then((data) => {
        const response = data.aiResponse.response
        setChatResponse(response)
        // Add the AI's response to the chat history
        setMessages((prev) => [...prev, { sender: 'ai', text: response }])
      })
      .finally(() => setLoading(false))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  const resetChat = () => {
    setMessages([]) // Clear the chat history
    setTommyImage(TommyImage) // Reset the image to the default
    setChatResponse('') // Clear the AI response
    setUserInput('') // Clear the input field
    setIsNameSet(false) // Allow the user to re-enter their name
    setUserName('') // Clear the user's name
  }

  useEffect(() => {
    if (!chatResponse) return

    // Extract the first word from the AI response
    const [firstWord, ...rest] = chatResponse.split(' ')
    const remainingResponse = rest.join(' ')

    // Determine the image based on the first word
    if (firstWord.toLowerCase().includes('happy')) {
      setTommyImage(TommyAiHappy)
    } else if (firstWord.toLowerCase().includes('sad')) {
      setTommyImage(TommyAiSad)
    } else if (firstWord.toLowerCase().includes('angry')) {
      setTommyImage(TommyAiAngry)
    } else {
      setTommyImage(TommyImage)
    }

    // Update the AI message in the chat history without the first word
    setMessages((prev) =>
      prev.map((message, index) =>
        index === prev.length - 1 && message.sender === 'ai'
          ? { ...message, text: remainingResponse }
          : message
      )
    )
  }, [chatResponse])

  return (
    <>
      <h1 className="app-heading">TommyGPT</h1>
      <div className="app-container">
        {!isNameSet ? (
          <div className="name-container">
            <input
              type="text"
              placeholder="Enter your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="name-input"
            />
            <button onClick={handleNameSubmit} className="name-submit-button">
              Start Chat
            </button>
          </div>
        ) : (
          <>
            <img src={tommyImage} alt="Tommy" className="tommy-image" />
            <div className="chat-container">
              <div className="chat-display">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                  >
                    {message.text}
                  </div>
                ))}
              </div>
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder="Type your message..."
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      aiFunction() // Trigger the submit function when Enter is pressed
                    }
                  }}
                  value={userInput}
                  className="chat-input"
                />
                <button
                  onClick={aiFunction}
                  aria-label="submit input"
                  disabled={loading}
                  className="chat-submit-button"
                >
                  {loading ? '...' : 'Send'}
                </button>
              </div>
              <button
                onClick={resetChat}
                className="reset-chat-button"
                aria-label="reset chat"
              >
                Reset Chat
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
