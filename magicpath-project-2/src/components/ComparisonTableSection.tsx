import React from "react";
import { motion } from "framer-motion";
import { IcoCheckCircle, IcoXCircle } from "../icons";

export const ComparisonTableSection: React.FC = () => {
  const rows = [
    {
      feature: "Точност на резултатите",
      agri: "Висока (✔)",
      manual: "Средна (✖)"
    },
    {
      feature: "Време за отговор",
      agri: "Милсекунди",
      manual: "Секунди"
    },
    {
      feature: "Поддръжка 24/7",
      agri: "Да (✔)",
      manual: "Не (✖)"
    },
    {
      feature: "Интеграция с API",
      agri: "Лесна (✔)",
      manual: "Ръчно (✖)"
    }
  ];

  return (
    <section id="compare" className="bg-[#111111] py-[80px] px-12">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-4xl font-bold text-white text-center mb-8"
          style={{fontFamily: "var(--font-secondary)"}}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Сравнение: AgriNexus vs. ръчно търсене
        </motion.h2>
        <motion.table
          className="w-full glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <thead>
            <tr className="bg-[#222222]">
              <th className="p-4 text-white">Функция</th>
              <th className="p-4 text-white text-center">AgriNexus</th>
              <th className="p-4 text-white text-center">Ръчно</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#1a1a1a]" : ""}>
                <td className="p-4 text-white">{r.feature}</td>
                <td className="p-4 text-center text-white">
                  {r.agri.includes("✔") ? <IcoCheckCircle /> : r.agri}
                </td>
                <td className="p-4 text-center text-white">
                  {r.manual.includes("✔") ? <IcoCheckCircle /> : <IcoXCircle />}
                </td>
              </tr>
            ))}
          </tbody>
        </motion.table>
      </div>
    </section>
  );
};

export default ComparisonTableSection;
