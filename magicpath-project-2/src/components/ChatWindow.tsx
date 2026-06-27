import React, { useState } from "react";
import { askAi } from "../api/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const response = await askAi(input);
      const aiMsg: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Message = { role: "assistant", content: "Error communicating with AI." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#1a1a1a] rounded-lg p-4 glass" style={{ height: "500px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === "assistant" ? "text-white" : "text-primary"}`}>
            <strong>{msg.role === "assistant" ? "AI:" : "Вие:"}</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-[#111111] text-white focus:outline-none"
          placeholder="Напишете съобщение…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "Изпращане..." : "Изпрати"}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
