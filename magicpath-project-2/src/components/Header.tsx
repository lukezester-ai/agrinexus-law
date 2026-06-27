import React from "react";
import { motion } from "framer-motion";
import { IcoChevronRight } from "../icons"; // placeholder import, you may adjust path

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-[#111111] bg-opacity-80 backdrop-blur-md z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        <h1 className="text-2xl font-bold text-white" style={{fontFamily: "var(--font-secondary)"}>AgriNexus</h1>
        <nav className="space-x-6">
          <a href="#hero" className="text-white hover:text-primary transition-colors">Начало</a>
          <a href="#features" className="text-white hover:text-primary transition-colors">Функции</a>
          <a href="#compare" className="text-white hover:text-primary transition-colors">Сравнение</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
