import React from "react";
import ChatWindow from "./ChatWindow";

export const AIChatCTA: React.FC = () => (
  <section className="bg-[#111111] py-[60px] px-12 text-center">
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-4" style={{fontFamily: "var(--font-secondary)"}}>
        AI‑чат (реален)
      </h2>
      <ChatWindow />
    </div>
  </section>
);

export default AIChatCTA;
