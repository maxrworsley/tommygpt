import { useState } from 'react'
import './App.css'
import TommyImage from './assets/Tommy.png'

function App() {
  const [chatResponse, setChatResponse] = useState('')
  const [userInput, setUserInput] = useState('')

  type AIResponse = {
    response: string
  }

  const aiFunction = async () => {
    await fetch('/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    })
      .then((res) => res.json() as Promise<{ aiResponse: AIResponse }>)
      .then((data) => setChatResponse(data.aiResponse.response))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  return (
    <>
      <h1>TommyGPT</h1>
      <img src={TommyImage} alt="Tommy" className="tommy-image" />
      <div className='card'>
        <input
          type='text'
          placeholder='Type something...'
          onChange={handleInputChange}
          value={userInput}
          aria-label='user input'
        />
        <button onClick={aiFunction} aria-label='submit input'>
          Submit
        </button>
        <p>TommyGPT: {chatResponse}</p>
      </div>
    </>
  )
}

export default App
