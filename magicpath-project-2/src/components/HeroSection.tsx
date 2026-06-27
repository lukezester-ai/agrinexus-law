import React from "react";
import { motion } from "framer-motion";

export const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="bg-[#111111] py-[120px] px-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{fontFamily: "var(--font-secondary)"}}>
          Добре дошли в AgriNexus
        </h1>
        <p className="text-lg text-[#bbbbbb] mb-8">
          Интелигентно търсене, сравнение и помощ за вашето земеделие.
        </p>
        <button className="bg-primary text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-primary/90 transition" style={{background: "var(--gradient-primary)"}}>
          Започни сега
        </button>
      </motion.div>
    </section>
  );
};

export default HeroSection;
