import React from 'react';
import { PlusCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Topic, Product, Bonus } from '../../../types/webinar';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextArea({ value, onChange }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
      placeholder="Type your answer here..."
    />
  );
}

interface TopicsProps {
  topics: Topic[];
  newTopic: string;
  setNewTopic: (value: string) => void;
  addTopic: () => void;
  removeTopic: (id: string) => void;
}

export function Topics({ topics, newTopic, setNewTopic, addTopic, removeTopic }: TopicsProps) {
  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
          placeholder="Enter a topic"
          onKeyPress={(e) => e.key === 'Enter' && addTopic()}
        />
        <button
          onClick={addTopic}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>
      <AnimatePresence>
        {topics.map((topic) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center space-x-2"
          >
            <span className="flex-1 text-white">{topic.name}</span>
            <button
              onClick={() => removeTopic(topic.id)}
              className="text-gray-400 hover:text-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface TopicDetailsProps {
  topics: Topic[];
  currentTopicIndex: number;
  setCurrentTopicIndex: (index: number) => void;
  updateTopicDescription: (id: string, description: string) => void;
}

export function TopicDetails({
  topics,
  currentTopicIndex,
  setCurrentTopicIndex,
  updateTopicDescription,
}: TopicDetailsProps) {
  if (topics.length === 0) {
    return <p className="text-gray-400">Please add topics in the previous step first.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-white mb-2">
        <h4 className="font-medium">{topics[currentTopicIndex].name}</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTopicIndex(Math.max(0, currentTopicIndex - 1))}
            disabled={currentTopicIndex === 0}
            className="disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentTopicIndex(Math.min(topics.length - 1, currentTopicIndex + 1))
            }
            disabled={currentTopicIndex === topics.length - 1}
            className="disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <div className="flex space-x-2">
        <textarea
          value={topics[currentTopicIndex].description}
          onChange={(e) =>
            updateTopicDescription(topics[currentTopicIndex].id, e.target.value)
          }
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
          placeholder="Describe what should be covered in this topic..."
        />
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface ProductFormProps {
  product: Product | null;
  setProduct: (product: Product | null) => void;
  onSkip: () => void;
}

export function ProductForm({ product, setProduct, onSkip }: ProductFormProps) {
  return (
    <div className="space-y-4">
      {!product ? (
        <div className="flex space-x-4">
          <button
            onClick={() =>
              setProduct({
                name: '',
                description: '',
                regularPrice: '',
                specialPrice: '',
              })
            }
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700"
          >
            Add Product
          </button>
          <button
            onClick={onSkip}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Not Selling Anything
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            value={product.name}
            onChange={(e) =>
              setProduct({ ...product, name: e.target.value })
            }
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
            placeholder="Product Name"
          />
          <textarea
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
            placeholder="Product Description"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={product.regularPrice}
              onChange={(e) =>
                setProduct({ ...product, regularPrice: e.target.value })
              }
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
              placeholder="Regular Price"
            />
            <input
              type="text"
              value={product.specialPrice}
              onChange={(e) =>
                setProduct({ ...product, specialPrice: e.target.value })
              }
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
              placeholder="Special Offer Price"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface BonusesFormProps {
  bonuses: Bonus[];
  setBonuses: (bonuses: Bonus[]) => void;
}

export function BonusesForm({ bonuses, setBonuses }: BonusesFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={() =>
            setBonuses([
              ...bonuses,
              { id: Date.now().toString(), name: '', description: '', price: '' },
            ])
          }
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <PlusCircle className="w-5 h-5" />
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
  );
}