import React from 'react';
import { PlusCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionCard } from '../QuestionCard';
import type { Bonus } from '../../../../types/webinar';

interface BonusesQuestionProps {
  question: string;
  bonuses: Bonus[];
  setBonuses: (bonuses: Bonus[]) => void;
}

export function BonusesQuestion({
  question,
  bonuses,
  setBonuses,
}: BonusesQuestionProps) {
  return (
    <QuestionCard question={question}>
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setBonuses([
                ...bonuses,
                { id: Date.now().toString(), name: '', description: '', price: '' },
              ])
            }
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Bonus</span>
          </button>
        </div>
        <AnimatePresence>
          {bonuses.map((bonus, index) => (
            <motion.div
              key={bonus.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-white font-medium">Bonus {index + 1}</h4>
                <button
                  onClick={() => setBonuses(bonuses.filter((b) => b.id !== bonus.id))}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={bonus.name}
                onChange={(e) =>
                  setBonuses(
                    bonuses.map((b) =>
                      b.id === bonus.id ? { ...b, name: e.target.value } : b
                    )
                  )
                }
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
                placeholder="Bonus Name"
              />
              <textarea
                value={bonus.description}
                onChange={(e) =>
                  setBonuses(
                    bonuses.map((b) =>
                      b.id === bonus.id ? { ...b, description: e.target.value } : b
                    )
                  )
                }
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[80px]"
                placeholder="Bonus Description"
              />
              <input
                type="text"
                value={bonus.price}
                onChange={(e) =>
                  setBonuses(
                    bonuses.map((b) =>
                      b.id === bonus.id ? { ...b, price: e.target.value } : b
                    )
                  )
                }
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
                placeholder="Bonus Value"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </QuestionCard>
  );
}