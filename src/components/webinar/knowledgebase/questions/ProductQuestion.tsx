import React from 'react';
import { QuestionCard } from '../QuestionCard';
import type { Product } from '../../../../types/webinar';

interface ProductQuestionProps {
  question: string;
  product: Product | null;
  setProduct: (product: Product | null) => void;
  onSkip: () => void;
}

export function ProductQuestion({
  question,
  product,
  setProduct,
  onSkip,
}: ProductQuestionProps) {
  return (
    <QuestionCard question={question}>
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
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
              placeholder="Product Name"
            />
            <textarea
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
              placeholder="Product Description"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={product.regularPrice}
                onChange={(e) => setProduct({ ...product, regularPrice: e.target.value })}
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
                placeholder="Regular Price"
              />
              <input
                type="text"
                value={product.specialPrice}
                onChange={(e) => setProduct({ ...product, specialPrice: e.target.value })}
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
                placeholder="Special Offer Price"
              />
            </div>
          </div>
        )}
      </div>
    </QuestionCard>
  );
}