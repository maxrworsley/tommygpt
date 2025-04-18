import { useState, useEffect } from 'react'
import './App.css'
import TommyImage from './assets/Tommy.png'
import TommyAiHappy from './assets/TommyAi_Happy.png'
import TommyAiSad from './assets/TommyAi_Sad.png'
import TommyAiAngry from './assets/TommyAi_Angry.png'

function App() {
  const [chatResponse, setChatResponse] = useState('')
  const [displayedResponse, setDisplayedResponse] = useState('') // For typewriter effect
  const [userInput, setUserInput] = useState('')
  const [tommyImage, setTommyImage] = useState(TommyImage)
  const [loading, setLoading] = useState(false)

  type AIResponse = {
    response: string
  }

  const aiFunction = async () => {
    setLoading(true)
    setDisplayedResponse('') // Reset displayedResponse before starting the typewriter effect
    await fetch('/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    })
      .then((res) => res.json() as Promise<{ aiResponse: AIResponse }>)
      .then((data) => setChatResponse(data.aiResponse.response))
      .finally(() => setLoading(false))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  useEffect(() => {
    switch (true) {
      case chatResponse.startsWith('[Happy]'):
        setTommyImage(TommyAiHappy)
        break
      case chatResponse.startsWith('[Sad]'):
        setTommyImage(TommyAiSad)
        break
      case chatResponse.startsWith('[Angry]'):
        setTommyImage(TommyAiAngry)
        break
      default:
        setTommyImage(TommyImage)
    }
  }, [chatResponse])

  // Typewriter effect
  useEffect(() => {
    if (!chatResponse) return // Prevent running the effect if chatResponse is empty

    let index = 0
    const trimmedResponse = chatResponse.split(' ').slice(1).join(' ')
    setDisplayedResponse('') // Reset displayedResponse when chatResponse changes
    const interval = setInterval(() => {
      if (index < trimmedResponse.length) {
        setDisplayedResponse((prev) => prev + trimmedResponse[index-1])
        index++
      } else {
        clearInterval(interval)
      }
    }, 50) // Adjust typing speed here (50ms per character)

    return () => clearInterval(interval) // Cleanup interval on unmount or new response
  }, [chatResponse])

  return (
    <>
      <h1 className="app-heading">TommyGPT</h1> {/* Keep the heading at the top */}
      <div className="app-container">
        <img src={tommyImage} alt="Tommy" className="tommy-image" />
        <div className="chat-container">
          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type your message..."
              onChange={handleInputChange}
              value={userInput}
              aria-label="user input"
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
          <div className="chat-display">
            <p>TommyGPT: {displayedResponse}</p> {/* Chat response display */}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
