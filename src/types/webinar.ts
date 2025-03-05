export interface Topic {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  name: string;
  description: string;
  regularPrice: string;
  specialPrice: string;
}

export interface Bonus {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface WebinarData {
  description: string;
  topics: Topic[];
  product: Product | null;
  bonuses: Bonus[];
  avoidTopics: string;
  value: string;
}

export interface WebinarKnowledgeBase {
  campaignOutline: {
    productName: string;
    productPrice: string;
    regularPrice: string;
    valueProposition: string;
  };
  audienceData: {
    niche: string;
    targetAudience: string[];
  };
  ultimateClientGoals: {
    painPoint: string;
    shortTermGoal: string;
    longTermGoal: string;
  };
  webinarValueProposition: {
    secretInformation: string;
    benefits: string;
    painPoints: string[];
    solution: string;
  };
  webinarSummary: {
    name: string;
    topics: string[];
    targetAudience: string;
    benefits: string;
  };
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  type: 'intro' | 'agenda' | 'content';
  notes: string;
}