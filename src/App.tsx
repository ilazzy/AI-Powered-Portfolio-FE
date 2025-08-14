import React, { useState, useEffect, useRef, useMemo } from "react";
import { Terminal, Sparkles } from "lucide-react";

interface Command {
  input: string;
  output?: JSX.Element | string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 🔗 Helper function to turn plain text links into JSX links
function linkifyText(text: string): JSX.Element[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          className="text-blue-400 underline hover:text-blue-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      );
    } else {
      return <span key={i}>{part}</span>;
    }
  });
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

  const userId = useMemo(() => {
    return "user-" + Math.random().toString(36).substring(2, 14);
  }, []);

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const [streamedText2] = useState(
    `Think the UI’s bad? Don’t tell Syed 😂 He’s a backend dev still pretending he knows how to build UI. Keep it secret! 😂`
  );

  useEffect(() => {
    const welcomeCommand: Command = {
      input: "",
      output: (
        <div className="mb-4">
          <div className="text-green-500 mb-4">
            ✨ Welcome to Amicia Terminal
          </div>
          <div className="text-gray-300 mb-2">
            Hi there — I'm Amicia, your AI-powered assistant. Let’s talk about
            Syed?
          </div>
          <div className="text-gray-300 mb-10">{streamedText2 || " "}</div>
        </div>
      ),
    };
    setHistory([welcomeCommand]);
  }, [streamedText2]);

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
      const response = await fetch(import.meta.env.VITE_BE_URL, {
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
    setCurrentInput("");
    setIsStreaming(true);
    setStreamingOutput("");

    // Add user message to history
    setHistory((prev) => [...prev, { input: message }]);

    let streamedResponse = "";
    sendChatMessage(message).then((response) => {
      let index = 0;
      let responseInserted = false;

      const streamInterval = setInterval(() => {
        if (index < response.length) {
          streamedResponse += response.charAt(index);
          setStreamingOutput(streamedResponse);
          index++;

          if (!responseInserted && streamedResponse.length > 0) {
            // Insert AI response block for the first time
            setHistory((prev) => [
              ...prev,
              {
                input: "",
                output: (
                  <div className="text-gray-300 mb-2">
                    <div className="flex items-start mb-2">
                      <Sparkles className="w-6 h-6 mr-3 mt-1 flex-shrink-0 text-cyan-100 drop-shadow-[0_0_6px_rgba(34,145,218,0.7)]" />
                      <div className="whitespace-pre-wrap animate-pulse">
                        {linkifyText(streamedResponse)}
                      </div>
                    </div>
                  </div>
                ),
              },
            ]);
            responseInserted = true;
          } else if (responseInserted) {
            // Update last response block
            setHistory((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                input: "",
                output: (
                  <div className="text-gray-300 mb-2">
                    <div className="flex items-start mb-2">
                      <Sparkles className="w-6 h-6 mr-3 mt-1 flex-shrink-0 text-cyan-100 drop-shadow-[0_0_6px_rgba(34,145,218,0.7)]" />
                      <div className="whitespace-pre-wrap animate-pulse">
                        {linkifyText(streamedResponse)}
                      </div>
                    </div>
                  </div>
                ),
              };
              return updated;
            });
          }
        } else {
          clearInterval(streamInterval);
          setIsStreaming(false);

          // Final update: remove pulse animation
          setHistory((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              input: "",
              output: (
                <div className="text-gray-300 mb-2">
                  <div className="flex items-start mb-2">
                    <Sparkles className="w-6 h-6 mr-3 mt-1 flex-shrink-0 text-cyan-100 drop-shadow-[0_0_6px_rgba(34,145,218,0.7)]" />
                    <div className="whitespace-pre-wrap">
                      {linkifyText(streamedResponse)}
                    </div>
                  </div>
                </div>
              ),
            };
            return updated;
          });

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
    inputRef.current?.focus();
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
          <span className="text-sm">
            syed_ahamed_portfolio@terminal | powered by ✨
          </span>
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
                  chat@amicia.terminal:~$&nbsp;
                </span>
                <span className="text-white">{command.input}</span>
              </div>
            )}
            {command.output && (
              <div className="mt-1 mb-3">{command.output}</div>
            )}
          </div>
        ))}

        {/* Thinking... */}
        {isStreaming && streamingOutput === "" && (
          <div className="flex items-center mt-2 text-blue-400 text-sm animate-pulse">
            <Sparkles className="w-6 h-6 mr-3 mt-1 flex-shrink-0 text-cyan-100" />
            Thinking...
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative w-full">
          {!isStreaming && (
            <div className="flex items-center text-white font-mono whitespace-pre">
              <span className="text-green-400">chat@amicia.terminal:~$ </span>
              <span>{currentInput}</span>
              {!isLoading && (
                <div className="w-2 h-5 bg-white animate-pulse ml-1"></div>
              )}
            </div>
          )}

          {/* Invisible input field */}
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
        </form>

        {/* AI Mode Footer */}
        <div className="absolute bottom-4 left-4 right-4 p-2 bg-green-900/30 border border-green-700/50 rounded">
          <div className="text-green-400 text-sm flex items-center">
            <Sparkles className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-cyan-100 drop-shadow-[0_0_6px_rgba(34,145,218,0.7)]" />
            AI Chat Mode - Every message connects directly to AI
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
