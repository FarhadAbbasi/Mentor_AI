import { useState } from 'react';
import type { Topic, Product, Bonus } from '../../../types/webinar';

export function useKnowledgeBaseState() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [description, setDescription] = useState('');
  const [avoidTopics, setAvoidTopics] = useState('');
  const [value, setValue] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addTopic = () => {
    if (newTopic.trim()) {
      setTopics([
        ...topics,
        { id: Date.now().toString(), name: newTopic, description: '' },
      ]);
      setNewTopic('');
    }
  };

  const removeTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  const updateTopicDescription = (id: string, description: string) => {
    setTopics(
      topics.map((t) => (t.id === id ? { ...t, description } : t))
    );
  };

  return {
    state: {
      topics,
      product,
      bonuses,
      description,
      avoidTopics,
      value,
      newTopic,
      currentTopicIndex,
      error,
    },
    handlers: {
      setTopics,
      setProduct,
      setBonuses,
      setDescription,
      setAvoidTopics,
      setValue,
      setNewTopic,
      setCurrentTopicIndex,
      addTopic,
      removeTopic,
      updateTopicDescription,
      setError,
    },
  };
}