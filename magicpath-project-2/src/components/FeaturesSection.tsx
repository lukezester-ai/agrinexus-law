import React from "react";
import { motion } from "framer-motion";
import { IcoCheckCircle, IcoXCircle, IcoLeaf, IcoCertificate } from "../icons";

const features = [
  {
    title: "Интелигентно търсене",
    description: "Бърз и точен откриване на земеделски данни.",
    icon: <IcoLeaf size={32} />,
  },
  {
    title: "Сравнение в реално време",
    description: "Сравнявайте AI‑препоръките с ръчното търсене.",
    icon: <IcoCertificate size={32} />,
  },
  {
    title: "Бъдещ AI‑чат",
    description: "Получавайте съвети от AI в момента.",
    icon: <IcoCheckCircle size={32} />,
  },
  {
    title: "Сигурност и контрол",
    description: "Вашите данни са защитени и контролирани.",
    icon: <IcoXCircle size={32} />,
  },
];

export const FeaturesSection: React.FC = () => (
  <section id="features" className="bg-[#111111] py-[80px] px-12">
    <div className="max-w-5xl mx-auto text-center">
      <h2 className="text-4xl font-bold text-white mb-8" style={{fontFamily: "var(--font-secondary)"}}>
        Ключови функции
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={i}
            className="glass p-6 flex flex-col items-center text-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-[#bbbbbb]">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
