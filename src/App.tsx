import { useState, useEffect, useRef } from 'react'
import './App.css'
import TommyImage from './assets/Tommy.png'
import TommyAiHappy from './assets/TommyAi_Happy.png'
import TommyAiSad from './assets/TommyAi_Sad.png'
import TommyAiAngry from './assets/TommyAi_Angry.png'
import TommyAiShocked from './assets/TommyAI_Shocked.png'
import TommyAiFlirty from './assets/TommyAi_Flirty.png'
import html2canvas from 'html2canvas'; // Import html2canvas

function App() {
  const [chatResponse, setChatResponse] = useState('')
  const [userInput, setUserInput] = useState('')
  const [userName, setUserName] = useState('') // Store the user's name
  const [isNameSet, setIsNameSet] = useState(false) // Track if the name has been set
  const [tommyImage, setTommyImage] = useState(TommyImage)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string; image?: string }[]>([]) // Chat history

  const messageInputRef = useRef<HTMLInputElement>(null) // Ref for the message input box

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setIsNameSet(true) // Mark the name as set
      setTimeout(() => {
        messageInputRef.current?.focus() // Automatically focus the message input box
      }, 0)
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
      .then((res) => res.json() as Promise<{ aiResponse: { response: string } }>)
      .then((data) => {
      const response = data.aiResponse.response;

      // Extract the first word from the AI response
      const [firstWord, ...rest] = response.split(' ');
      const remainingResponse = rest.join(' ');

      // Determine the image based on the first word
      let currentImage = TommyImage;
      if (firstWord.toLowerCase().includes('happy')) {
        currentImage = TommyAiHappy;
      } else if (firstWord.toLowerCase().includes('sad')) {
        currentImage = TommyAiSad;
      } else if (firstWord.toLowerCase().includes('angry')) {
        currentImage = TommyAiAngry;
      } else if (firstWord.toLowerCase().includes('shocked')) {
        currentImage = TommyAiShocked;
      } else if (firstWord.toLowerCase().includes('flirty')) {
        currentImage = TommyAiFlirty;
      }

      // Add the AI's response to the chat history with the corresponding image
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: remainingResponse, image: currentImage },
      ]);

      setChatResponse(response);
      })
      .catch((error) => {
      console.error("Error fetching AI response:", error)
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

  const downloadConversation = async () => {
    const chatContainer = document.querySelector('.chat-display'); // Select the chat container
    if (!chatContainer) return;
  
    // Temporarily remove the scrollable behavior and set the background color
    const originalOverflow = (chatContainer as HTMLElement).style.overflow;
    const originalBackgroundColor = (chatContainer as HTMLElement).style.backgroundColor;
    (chatContainer as HTMLElement).style.overflow = 'visible';
    (chatContainer as HTMLElement).style.backgroundColor = getComputedStyle(chatContainer).backgroundColor || '#ffffff'; // Ensure the background color is set
  
    // Use html2canvas to capture the entire chat container
    const canvas = await html2canvas(chatContainer as HTMLElement, {
      scrollX: 0,
      scrollY: 0,
      width: chatContainer.scrollWidth, // Ensure full width is captured
      height: chatContainer.scrollHeight, // Ensure full height is captured
      backgroundColor: "#2e2e3e", // Let the element's background color be used
    });
  
    // Restore the original styles
    (chatContainer as HTMLElement).style.overflow = originalOverflow;
    (chatContainer as HTMLElement).style.backgroundColor = originalBackgroundColor;
  
    const dataURL = canvas.toDataURL('image/png'); // Convert the canvas to a PNG image
  
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = dataURL;
    const date = new Date();
    link.download = userName + '-conversation-' + date.toISOString() + '.png'; // Set the file name
    link.click(); // Trigger the download
  };

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
    } else if (firstWord.toLowerCase().includes('shocked')) {
      setTommyImage(TommyAiShocked)
    } else if (firstWord.toLowerCase().includes('flirty')) {
      setTommyImage(TommyAiFlirty)
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit(); // Trigger the submit function when Enter is pressed
                }
              }}
              className="name-input theme-input" // Add a class for consistent styling
            />
            <button
              onClick={handleNameSubmit}
              className="name-submit-button theme-button" // Add a class for consistent styling
            >
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
                    className={`chat-message-container ${
                      message.sender === 'user' ? 'user-message-container' : 'ai-message-container'
                    }`}
                  >
                    {message.sender === 'ai' && message.image && (
                      <img
                        src={message.image}
                        alt="Tommy"
                        className="profile-photo"
                      />
                    )}
                    <div
                      className={`chat-message ${
                        message.sender === 'user' ? 'user-message' : 'ai-message'
                      }`}
                    >
                      {message.text}
                    </div>
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
                  ref={messageInputRef} // Attach the ref to the message input box
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
              <button
                onClick={downloadConversation}
                className="download-chat-button"
                aria-label="download chat"
              >
                Download Chat
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
