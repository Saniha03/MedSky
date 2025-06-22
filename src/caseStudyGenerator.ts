import axios from "axios";

interface CaseStudy {
  id?: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  diseaseField: string;
}

const PUBMED_API_KEY = "db2d9f4f4775922106c298c208340dd54607";
const PUBMED_API_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

const diseaseFields = {
  cardiology: {
    titlePrefix: "Acute Cardiac Case",
    pubMedQueryBase: "cardiology diagnosis",
    conditionExamples: [
      "Myocardial Infarction",
      "Atrial Fibrillation",
      "Heart Failure",
    ],
    symptomsPool: [
      "chest pain",
      "dyspnea",
      "palpitations",
      "fatigue",
      "sweating",
      "nausea",
    ],
    historyPool: [
      "hypertension",
      "smoking",
      "diabetes",
      "family history of heart disease",
    ],
    vitalsPool: [
      "BP 140/90, HR 100 bpm",
      "BP 130/80, HR 120 bpm (irregular)",
      "BP 150/95, HR 90 bpm",
    ],
    labsPool: [
      "Elevated troponin",
      "Normal electrolytes",
      "ECG: ST elevation",
      "BNP elevated",
    ],
  },
  neurology: {
    titlePrefix: "Acute Neurological Case",
    pubMedQueryBase: "neurology diagnosis",
    conditionExamples: ["Ischemic Stroke", "Epilepsy", "Parkinson’s Disease"],
    symptomsPool: [
      "sudden weakness",
      "slurred speech",
      "seizures",
      "tremors",
      "headache",
      "dizziness",
    ],
    historyPool: [
      "hypertension",
      "previous stroke",
      "family history of seizures",
    ],
    vitalsPool: ["BP 170/100, HR 85 bpm", "BP 120/80, HR 80 bpm"],
    labsPool: ["Normal glucose", "CT: no hemorrhage", "EEG: abnormal"],
  },
  endocrinology: {
    titlePrefix: "Metabolic Emergency Case",
    pubMedQueryBase: "endocrinology diagnosis",
    conditionExamples: [
      "Diabetic Ketoacidosis",
      "Hyperthyroidism",
      "Adrenal Insufficiency",
    ],
    symptomsPool: [
      "polyuria",
      "polydipsia",
      "fatigue",
      "weight loss",
      "tremors",
      "palpitations",
    ],
    historyPool: [
      "Type 1 diabetes",
      "family history of thyroid disease",
      "steroid use",
    ],
    vitalsPool: ["BP 110/70, HR 110 bpm", "BP 130/85, HR 100 bpm"],
    labsPool: ["Glucose 450 mg/dL", "Elevated TSH", "Low cortisol"],
  },
  pharmacology: {
    titlePrefix: "Infectious Disease Case",
    pubMedQueryBase: "infectious disease treatment",
    conditionExamples: ["Antibiotic Resistance", "Sepsis", "Tuberculosis"],
    symptomsPool: [
      "fever",
      "chills",
      "purulent discharge",
      "cough",
      "swelling",
    ],
    historyPool: ["recent hospitalization", "antibiotic use", "travel history"],
    vitalsPool: ["BP 125/80, HR 90 bpm, Temp 38.5°C", "BP 100/60, HR 110 bpm"],
    labsPool: [
      "Culture: MRSA positive",
      "CRP elevated",
      "Sputum: AFB positive",
    ],
  },
  biochemistry: {
    titlePrefix: "Electrolyte Imbalance Case",
    pubMedQueryBase: "electrolyte imbalance diagnosis",
    conditionExamples: ["Hyperkalemia", "Hyponatremia", "Metabolic Acidosis"],
    symptomsPool: ["muscle weakness", "confusion", "palpitations", "nausea"],
    historyPool: ["chronic kidney disease", "diuretic use", "dehydration"],
    vitalsPool: ["BP 135/85, HR 70 bpm", "BP 110/70, HR 95 bpm"],
    labsPool: ["Potassium 6.8 mEq/L", "Sodium 125 mEq/L", "pH 7.2"],
  },
  gastroenterology: {
    titlePrefix: "Gastrointestinal Case",
    pubMedQueryBase: "gastroenterology diagnosis",
    conditionExamples: ["Peptic Ulcer Disease", "Crohn’s Disease", "Hepatitis"],
    symptomsPool: [
      "epigastric pain",
      "nausea",
      "diarrhea",
      "jaundice",
      "heartburn",
    ],
    historyPool: ["NSAID use", "family history of IBD", "alcohol use"],
    vitalsPool: ["BP 120/80, HR 80 bpm", "BP 130/85, HR 90 bpm"],
    labsPool: ["H. pylori positive", "Elevated LFTs", "CRP elevated"],
  },
  obstetrics_gynecology: {
    titlePrefix: "Obstetric Case",
    pubMedQueryBase: "obstetrics diagnosis",
    conditionExamples: [
      "Preeclampsia",
      "Gestational Diabetes",
      "Ectopic Pregnancy",
    ],
    symptomsPool: ["hypertension", "edema", "abdominal pain", "weight gain"],
    historyPool: [
      "first pregnancy",
      "family history of diabetes",
      "previous miscarriage",
    ],
    vitalsPool: ["BP 160/110, HR 90 bpm", "BP 130/80, HR 85 bpm"],
    labsPool: ["Proteinuria", "Glucose 180 mg/dL", "hCG elevated"],
  },
  oncology: {
    titlePrefix: "Oncologic Case",
    pubMedQueryBase: "oncology diagnosis",
    conditionExamples: ["Lung Cancer", "Breast Cancer", "Leukemia"],
    symptomsPool: ["chronic cough", "weight loss", "fatigue", "night sweats"],
    historyPool: [
      "smoking history",
      "family history of cancer",
      "chemotherapy",
    ],
    vitalsPool: ["BP 130/85, HR 88 bpm", "BP 120/80, HR 90 bpm"],
    labsPool: ["Chest CT: lung mass", "CBC: anemia", "Biopsy: malignant"],
  },
  nephrology: {
    titlePrefix: "Renal Case",
    pubMedQueryBase: "nephrology diagnosis",
    conditionExamples: [
      "Acute Kidney Injury",
      "Chronic Kidney Disease",
      "Nephrotic Syndrome",
    ],
    symptomsPool: ["oliguria", "edema", "fatigue", "hypertension"],
    historyPool: ["dehydration", "diabetes", "NSAID use"],
    vitalsPool: ["BP 145/90, HR 95 bpm", "BP 150/100, HR 80 bpm"],
    labsPool: ["Creatinine 2.5 mg/dL", "Proteinuria", "BUN elevated"],
  },
  hematology: {
    titlePrefix: "Hematologic Case",
    pubMedQueryBase: "hematology diagnosis",
    conditionExamples: [
      "Iron Deficiency Anemia",
      "Sickle Cell Disease",
      "Thrombocytopenia",
    ],
    symptomsPool: ["fatigue", "pallor", "bruising", "dyspnea"],
    historyPool: [
      "heavy menstrual bleeding",
      "family history of anemia",
      "recent infection",
    ],
    vitalsPool: ["BP 110/70, HR 100 bpm", "BP 120/80, HR 90 bpm"],
    labsPool: [
      "Hemoglobin 8 g/dL",
      "Sickle cells on smear",
      "Platelets 50,000",
    ],
  },
  pediatrics: {
    titlePrefix: "Pediatric Case",
    pubMedQueryBase: "pediatric diagnosis",
    conditionExamples: ["Asthma Exacerbation", "Croup", "Type 1 Diabetes"],
    symptomsPool: ["wheezing", "cough", "polyuria", "fever"],
    historyPool: [
      "history of asthma",
      "recent viral infection",
      "family history of diabetes",
    ],
    vitalsPool: ["BP 100/60, HR 120 bpm, RR 30", "BP 90/60, HR 110 bpm"],
    labsPool: ["SpO2 92%", "Glucose 300 mg/dL", "Normal CBC"],
  },
  dermatology: {
    titlePrefix: "Dermatologic Case",
    pubMedQueryBase: "dermatology diagnosis",
    conditionExamples: ["Psoriasis", "Eczema", "Melanoma"],
    symptomsPool: ["scaly plaques", "itching", "pigmented lesion", "rash"],
    historyPool: [
      "family history of psoriasis",
      "sun exposure",
      "atopic dermatitis",
    ],
    vitalsPool: ["BP 125/80, HR 75 bpm", "BP 120/80, HR 80 bpm"],
    labsPool: ["Normal ESR", "Biopsy: atypical cells", "Skin swab: negative"],
  },
  immunology: {
    titlePrefix: "Immunologic Case",
    pubMedQueryBase: "immunology diagnosis",
    conditionExamples: [
      "Systemic Lupus Erythematosus",
      "Rheumatoid Arthritis",
      "Allergic Reaction",
    ],
    symptomsPool: ["rash", "joint pain", "fatigue", "swelling"],
    historyPool: [
      "family history of autoimmune disease",
      "recent allergen exposure",
    ],
    vitalsPool: ["BP 130/80, HR 85 bpm", "BP 125/80, HR 90 bpm"],
    labsPool: ["Positive ANA", "Elevated RF", "IgE elevated"],
  },
};

// Define valid disease field keys
type DiseaseField = keyof typeof diseaseFields;

const patients = [
  { age: 60, gender: "male" },
  { age: 45, gender: "female" },
  { age: 30, gender: "male" },
  { age: 50, gender: "female" },
  { age: 25, gender: "female" },
  { age: 15, gender: "male" },
  { age: 8, gender: "female" },
];

const questionTypes = [
  "What is the most likely diagnosis?",
  "What is the most appropriate treatment?",
  "What is the next diagnostic step?",
];

async function fetchPubMedCondition(field: DiseaseField): Promise<string> {
  try {
    console.log(`Fetching PubMed condition for field: ${field}`); // Debug
    const response = await axios.get(
      `${PUBMED_API_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        diseaseFields[field].pubMedQueryBase
      )}&retmode=json&retmax=5&api_key=${PUBMED_API_KEY}`
    );
    console.log("PubMed condition response:", response.data); // Debug
    const ids = response.data.esearchresult?.idlist;
    if (!ids || ids.length === 0) {
      console.warn("No PubMed conditions found for:", field);
      return diseaseFields[field].conditionExamples[0];
    }

    const summaryResponse = await axios.get(
      `${PUBMED_API_URL}/esummary.fcgi?db=pubmed&id=${ids[0]}&retmode=json&api_key=${PUBMED_API_KEY}`
    );
    const title = summaryResponse.data.result[ids[0]]?.title || "";
    const condition =
      title.split(" ")[0] || diseaseFields[field].conditionExamples[0];
    return condition;
  } catch (error) {
    console.error("PubMed condition error:", error);
    return diseaseFields[field].conditionExamples[0];
  }
}

async function fetchPubMedExplanation(condition: string): Promise<string> {
  try {
    console.log(`Fetching PubMed explanation for: ${condition}`); // Debug
    const response = await axios.get(
      `${PUBMED_API_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        condition + " diagnosis"
      )}&retmode=json&retmax=1&api_key=${PUBMED_API_KEY}`
    );
    console.log("PubMed explanation response:", response.data); // Debug
    const id = response.data.esearchresult?.idlist[0];
    if (!id) {
      console.warn("No PubMed explanation found for:", condition);
      return "No relevant PubMed articles found.";
    }

    const summaryResponse = await axios.get(
      `${PUBMED_API_URL}/esummary.fcgi?db=pubmed&id=${id}&retmode=json&api_key=${PUBMED_API_KEY}`
    );
    const title =
      summaryResponse.data.result[id]?.title || "No title available.";
    return `Based on PubMed: ${title}`;
  } catch (error) {
    console.error("PubMed explanation error:", error);
    return "Unable to fetch PubMed explanation.";
  }
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const generateCaseStudy = async (
  field: DiseaseField
): Promise<CaseStudy> => {
  try {
    const fieldData = diseaseFields[field] || diseaseFields.cardiology;
    const condition = await fetchPubMedCondition(field);
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const symptoms = getRandomItems(fieldData.symptomsPool, 3);
    const history = getRandomItems(fieldData.historyPool, 1)[0];
    const vitals = getRandomItems(fieldData.vitalsPool, 1)[0];
    const labs = getRandomItems(fieldData.labsPool, 1)[0];
    const question = getRandomItems(questionTypes, 1)[0];
    const title = `${fieldData.titlePrefix} in a ${patient.age}-Year-Old ${
      patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
    }`;
    const description = `A ${patient.age}-year-old ${
      patient.gender
    } presents with ${symptoms.join(
      ", "
    )}. Patient has a ${history}. Vital signs: ${vitals}. Laboratory findings: ${labs}.`;

    const options = [
      `A. ${condition}`,
      `B. ${
        fieldData.conditionExamples[
          Math.floor(Math.random() * fieldData.conditionExamples.length)
        ] || "Alternative Condition"
      }`,
      "C. Unrelated Condition",
      "D. Normal Finding",
    ];
    const correctAnswer = `A. ${condition}`;
    const pubMedExplanation = await fetchPubMedExplanation(condition);

    const caseStudy = {
      title,
      description,
      question,
      options,
      correctAnswer,
      explanation: `This case is consistent with ${condition}. ${pubMedExplanation}`,
      diseaseField: field,
    };
    console.log("Generated case study:", caseStudy); // Debug
    return caseStudy;
  } catch (error) {
    console.error("Error generating case study:", error);
    return {
      title: "Fallback Case",
      description:
        "A patient presents with unspecified symptoms. Vital signs: normal.",
      question: "What is the diagnosis?",
      options: ["A. Unknown", "B. Unknown", "C. Unknown", "D. Unknown"],
      correctAnswer: "A. Unknown",
      explanation: "Error generating case study. Please check logs.",
      diseaseField: field,
    };
  }
};
