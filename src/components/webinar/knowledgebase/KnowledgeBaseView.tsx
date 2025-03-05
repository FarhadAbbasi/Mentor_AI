import React, { useState } from 'react';
import { useWebinarStore } from '../../../stores/webinarStore';
import { KnowledgeBaseCard } from './KnowledgeBaseCard';
import { Pen } from 'lucide-react';

export function KnowledgeBaseView() {
  const { knowledgeBase, updateKnowledgeBase } = useWebinarStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!knowledgeBase) return null;

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = (section: string, field: string) => {
    if (!editingField) return;

    const updatedKnowledgeBase = { ...knowledgeBase };
    let target = updatedKnowledgeBase[section as keyof typeof knowledgeBase];

    if (typeof target === 'object' && target !== null) {
      (target as any)[field] = editValue;
    }

    updateKnowledgeBase(updatedKnowledgeBase);
    setEditingField(null);
  };

  const renderEditableField = (section: string, field: string, value: string) => {
    const isEditing = editingField === `${section}.${field}`;

    return (
      <div className="flex items-start justify-between group">
        <div className="flex-1">
          {isEditing ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-gray-700 text-white border border-teal-500 rounded-lg p-2 min-h-[80px]"
              autoFocus
            />
          ) : (
            <span>{value}</span>
          )}
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              handleSave(section, field);
            } else {
              handleEdit(`${section}.${field}`, value);
            }
          }}
          className="ml-2 text-teal-400 hover:text-teal-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pen className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <KnowledgeBaseCard title="Campaign Outline">
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Product:</span>
            <div className="flex-1">{renderEditableField('campaignOutline', 'productName', knowledgeBase.campaignOutline.productName)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Regular Price:</span>
            <div className="flex-1">{renderEditableField('campaignOutline', 'regularPrice', knowledgeBase.campaignOutline.regularPrice)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Special Price:</span>
            <div className="flex-1">{renderEditableField('campaignOutline', 'productPrice', knowledgeBase.campaignOutline.productPrice)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Value Proposition:</span>
            <div className="flex-1">{renderEditableField('campaignOutline', 'valueProposition', knowledgeBase.campaignOutline.valueProposition)}</div>
          </div>
        </div>
      </KnowledgeBaseCard>

      <KnowledgeBaseCard title="Audience Data">
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Niche:</span>
            <div className="flex-1">{renderEditableField('audienceData', 'niche', knowledgeBase.audienceData.niche)}</div>
          </div>
          <div>
            <span className="text-gray-400 block mb-2">Target Audience:</span>
            <ul className="list-disc list-inside space-y-2 ml-4">
              {knowledgeBase.audienceData.targetAudience.map((audience, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <div className="flex-1">
                    {renderEditableField('audienceData', `targetAudience.${index}`, audience)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </KnowledgeBaseCard>

      <KnowledgeBaseCard title="Ultimate Client Goals">
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Pain Point:</span>
            <div className="flex-1">{renderEditableField('ultimateClientGoals', 'painPoint', knowledgeBase.ultimateClientGoals.painPoint)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Short Term Goal:</span>
            <div className="flex-1">{renderEditableField('ultimateClientGoals', 'shortTermGoal', knowledgeBase.ultimateClientGoals.shortTermGoal)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Long Term Goal:</span>
            <div className="flex-1">{renderEditableField('ultimateClientGoals', 'longTermGoal', knowledgeBase.ultimateClientGoals.longTermGoal)}</div>
          </div>
        </div>
      </KnowledgeBaseCard>

      <KnowledgeBaseCard title="Webinar Value Proposition">
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Secret Information:</span>
            <div className="flex-1">{renderEditableField('webinarValueProposition', 'secretInformation', knowledgeBase.webinarValueProposition.secretInformation)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Benefits:</span>
            <div className="flex-1">{renderEditableField('webinarValueProposition', 'benefits', knowledgeBase.webinarValueProposition.benefits)}</div>
          </div>
          <div>
            <span className="text-gray-400 block mb-2">Pain Points to Address:</span>
            <ul className="list-disc list-inside space-y-2 ml-4">
              {knowledgeBase.webinarValueProposition.painPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <div className="flex-1">
                    {renderEditableField('webinarValueProposition', `painPoints.${index}`, point)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Solution:</span>
            <div className="flex-1">{renderEditableField('webinarValueProposition', 'solution', knowledgeBase.webinarValueProposition.solution)}</div>
          </div>
        </div>
      </KnowledgeBaseCard>

      <KnowledgeBaseCard title="Webinar Summary">
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Name:</span>
            <div className="flex-1">{renderEditableField('webinarSummary', 'name', knowledgeBase.webinarSummary.name)}</div>
          </div>
          <div>
            <span className="text-gray-400 block mb-2">Topics:</span>
            <ul className="list-disc list-inside space-y-2 ml-4">
              {knowledgeBase.webinarSummary.topics.map((topic, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <div className="flex-1">
                    {renderEditableField('webinarSummary', `topics.${index}`, topic)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Target Audience:</span>
            <div className="flex-1">{renderEditableField('webinarSummary', 'targetAudience', knowledgeBase.webinarSummary.targetAudience)}</div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 w-32">Benefits:</span>
            <div className="flex-1">{renderEditableField('webinarSummary', 'benefits', knowledgeBase.webinarSummary.benefits)}</div>
          </div>
        </div>
      </KnowledgeBaseCard>
    </div>
  );
}