import React, { useState, useEffect, useRef, useMemo } from "react";
import { Terminal, MessageCircle } from "lucide-react";

interface Command {
  input: string;
  output?: JSX.Element | string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function App() {
  const [history, setHistory] = useState<Command[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const indexRef1 = useRef(0);
  const indexRef2 = useRef(0);

  const [streamedText1, setStreamedText1] = useState("");
  const [streamedText2, setStreamedText2] = useState("");
  const [showSecondMessage, setShowSecondMessage] = useState(false);

  // ✅ Generate new user ID every time page loads
  const userId = useMemo(() => {
    return "user-" + Math.random().toString(36).substring(2, 10);
  }, []);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    const fullMessage1 = `Your messages will be sent directly to the AI inference. ✅ No logs. No tracking. No IPs. Just clean, private conversation.`;
    const interval1 = setInterval(() => {
      if (indexRef1.current >= fullMessage1.length) {
        clearInterval(interval1);
        return;
      }

      const nextChar = fullMessage1.charAt(indexRef1.current);
      indexRef1.current++;
      setStreamedText1((prev) => prev + nextChar);
    }, 30);

    return () => clearInterval(interval1);
  }, []);

  useEffect(() => {
    const fullMessage1 = `Your messages will be sent directly to the AI inference. ✅ No logs. No tracking. No IPs. Just clean, private conversation.`;
    if (streamedText1 === fullMessage1) {
      setShowSecondMessage(true);
    }
  }, [streamedText1]);

  useEffect(() => {
    if (!showSecondMessage) return;

    const fullMessage2 = `Yes, I know what you're thinking 😂
    But don’t tell Syed — he’s really bad at UI development, still pretending like he knows how to build UIs.
    Truth is, he’s actually a backend developer. Keep it secret 😂`;
    const interval2 = setInterval(() => {
      if (indexRef2.current >= fullMessage2.length) {
        clearInterval(interval2);
        return;
      }

      const nextChar = fullMessage2.charAt(indexRef2.current);
      indexRef2.current++;
      setStreamedText2((prev) => prev + nextChar);
    }, 30);

    return () => clearInterval(interval2);
  }, [showSecondMessage]);

  useEffect(() => {
    const welcomeCommand: Command = {
      input: "",
      output: (
        <div className="mb-4">
          <div className="text-green-500 mb-4">🤖 AI Chat Terminal</div>
          <div className="text-blue-500 mb-2">{streamedText1}</div>
          <div className="text-gray-300 mb-2">{streamedText2 || " "}</div>
          <div className="text-gray-300 mb-10">Let’s talk about Syed!</div>
        </div>
      ),
    };
    setHistory([welcomeCommand]);
  }, [streamedText1, streamedText2]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, streamingOutput]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const sendChatMessage = async (message: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          sender: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const reply = data.ai_response || "No response received";

      const newChatHistory = [
        ...chatHistory,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: reply },
      ];

      setChatHistory(newChatHistory);

      return reply;
    } catch (error) {
      console.error("Chat API error:", error);
      return `Error: Unable to connect to chat service. ${
        error instanceof Error ? error : "Unknown error"
      }`;
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = (message: string) => {
    const userCommand: Command = {
      input: message,
    };
    setHistory((prev) => [...prev, userCommand]);

    sendChatMessage(message).then((response) => {
      setStreamingOutput("");
      setIsStreaming(true);

      let index = 0;

      const streamInterval = setInterval(() => {
        if (index < response.length) {
          setStreamingOutput((prev) => prev + response.charAt(index));
          index++;
        } else {
          clearInterval(streamInterval);
          setIsStreaming(false);

          const responseCommand: Command = {
            input: "",
            output: (
              <div className="text-gray-300 mb-2">
                <div className="flex items-start mb-2">
                  <MessageCircle className="w-4 h-4 mr-2 mt-1 text-green-400 flex-shrink-0" />
                  <div className="whitespace-pre-wrap">{response}</div>
                </div>
              </div>
            ),
          };
          setHistory((prev) => [...prev, responseCommand]);
          setStreamingOutput("");
          focusInput();
        }
      }, 20);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim() && !isLoading && !isStreaming) {
      handleMessage(currentInput);
      setCurrentInput("");
      focusInput();
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-mono">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex items-center ml-4">
          <Terminal className="w-4 h-4 mr-2" />
          <span className="text-sm">ai-chat@terminal</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="p-4 h-[calc(100vh-60px)] overflow-y-auto cursor-text"
        onClick={handleTerminalClick}
      >
        {/* Command History */}
        {history.map((command, index) => (
          <div key={index} className="mb-2">
            {command.input && (
              <div className="flex">
                <span className="text-green-400">
                  chat@ai.terminal:~$&nbsp;
                </span>
                <span className="text-white">{command.input}</span>
              </div>
            )}
            {command.output && (
              <div className="mt-1 mb-3">{command.output}</div>
            )}
          </div>
        ))}

        {/* Streaming Response */}
        {isStreaming && (
          <div className="text-gray-300 mb-2">
            <div className="flex items-start mb-2">
              <MessageCircle className="w-4 h-4 mr-2 mt-1 text-green-400 flex-shrink-0" />
              <div className="whitespace-pre-wrap animate-pulse">
                {streamingOutput}
              </div>
            </div>
          </div>
        )}

        {/* Current Input */}
        <form onSubmit={handleSubmit} className="relative w-full">
          <div className="flex items-center text-white font-mono whitespace-pre">
            <span className="text-green-400">chat@ai.terminal:~$ </span>
            <span>{currentInput}</span>
            {!isLoading && !isStreaming && (
              <div className="w-2 h-5 bg-white animate-pulse ml-1"></div>
            )}
          </div>

          {/* Hidden input field */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="absolute top-0 left-0 w-full h-full opacity-0"
            autoComplete="off"
            disabled={isLoading || isStreaming}
            autoFocus
          />

          {(isLoading || isStreaming) && (
            <div className="mt-2 text-blue-400 text-sm animate-pulse">
              Processing...
            </div>
          )}
        </form>

        {/* AI Mode Footer */}
        <div className="mt-4 p-2 bg-green-900/30 border border-green-700/50 rounded">
          <div className="text-green-400 text-sm flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            AI Chat Mode - Every message connects directly to AI
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
