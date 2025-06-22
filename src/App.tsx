import { useState, useEffect } from "react";
import { db, auth, googleProvider } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  DocumentData
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { generateCaseStudy } from "./caseStudyGenerator";

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  diseaseField: string;
}

type DiseaseField = 
  | "cardiology"
  | "neurology"
  | "endocrinology"
  | "pharmacology"
  | "biochemistry"
  | "gastroenterology"
  | "obstetrics_gynecology"
  | "oncology"
  | "nephrology"
  | "hematology"
  | "pediatrics"
  | "dermatology"
  | "immunology";

const App: React.FC = () => {
  console.log("App component rendering"); // Debug
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState<boolean>(false);
  const [diseaseField, setDiseaseField] = useState<DiseaseField>("cardiology");
  const [filterField, setFilterField] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  const diseaseFields: DiseaseField[] = [
    "cardiology",
    "neurology",
    "endocrinology",
    "pharmacology",
    "biochemistry",
    "gastroenterology",
    "obstetrics_gynecology",
    "oncology",
    "nephrology",
    "hematology",
    "pediatrics",
    "dermatology",
    "immunology"
  ];

  // Monitor auth state
  useEffect(() => {
    console.log("Setting up auth state listener"); // Debug
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid); // Debug
      setUser(currentUser);
      setError("");
    }, (err) => {
      console.error("Auth state error:", err); // Debug
      setError("Authentication error. Please try again.");
    });
    return () => {
      console.log("Cleaning up auth listener"); // Debug
      unsubscribe();
    };
  }, []);

  // Fetch case studies for authenticated user
  useEffect(() => {
    const fetchCaseStudies = async () => {
      if (!user) {
        console.log("No user, clearing case studies"); // Debug
        setCaseStudies([]);
        return;
      }
      try {
        console.log("Fetching case studies for user:", user.uid); // Debug
        const caseStudiesRef = collection(db, `users/${user.uid}/caseStudies`);
        const querySnapshot = await getDocs(caseStudiesRef);
        const cases: CaseStudy[] = querySnapshot.docs.map((doc: DocumentData) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched cases:", cases); // Debug
        setCaseStudies(cases);
      } catch (err) {
        console.error("Firestore fetch error:", err);
        setError("Failed to load case studies.");
      }
    };
    fetchCaseStudies();
  }, [user]);

  // Handle sign-up
  const handleSignUp = async () => {
    console.log("Attempting sign-up with email:", email); // Debug
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
      setIsSignUp(false);
    } catch (err: any) {
      console.error("Sign-up error:", err);
      setError(err.message);
    }
  };

  // Handle sign-in
  const handleSignIn = async () => {
    console.log("Attempting sign-in with email:", email); // Debug
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err.message);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    console.log("Attempting Google sign-in"); // Debug
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message);
    }
  };

  // Handle sign-out
  const handleSignOut = async () => {
    console.log("Attempting sign-out"); // Debug
    try {
      await signOut(auth);
      setCaseStudies([]);
      setSelectedCase(null);
    } catch (err: any) {
      console.error("Sign-out error:", err);
      setError(err.message);
    }
  };

  // Handle selecting a case
  const handleSelectCase = (caseStudy: CaseStudy) => {
    console.log("Selecting case:", caseStudy.id); // Debug
    setSelectedCase(caseStudy);
    setSelectedAnswer("");
    setShowResult(false);
  };

  // Handle submitting an answer
  const handleSubmitAnswer = () => {
    console.log("Submitting answer:", selectedAnswer); // Debug
    if (selectedAnswer) {
      setShowResult(true);
    }
  };

  // Handle generating and saving a new case study
  const handleGenerateCase = async () => {
    if (!user) {
      console.log("No user, cannot generate case"); // Debug
      setError("Please sign in to generate case studies.");
      return;
    }
    console.log("Generating case for field:", diseaseField); // Debug
    setIsGenerating(true);
    setError("");
    try {
      const newCase = await generateCaseStudy(diseaseField);
      const caseStudiesRef = collection(db, `users/${user.uid}/caseStudies`);
      const docRef = await addDoc(caseStudiesRef, newCase);
      setCaseStudies([...caseStudies, { id: docRef.id, ...newCase }]);
    } catch (err) {
      console.error("Error generating case study:", err);
      setError("Failed to generate case study. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle deleting a case study
  const handleDeleteCase = async (id: string) => {
    if (!user) {
      console.log("No user, cannot delete case"); // Debug
      setError("Please sign in to delete case studies.");
      return;
    }
    console.log("Deleting case:", id); // Debug
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      await deleteDoc(doc(db, `users/${user.uid}/caseStudies`, id));
      setCaseStudies(caseStudies.filter((caseStudy) => caseStudy.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting case study:", err);
      setError("Failed to delete case study.");
    }
  };

  // Filter and sort case studies
  const filteredCaseStudies = filterField === "all"
    ? caseStudies
    : caseStudies.filter((caseStudy) => caseStudy.diseaseField === filterField);
  const sortedCaseStudies = [...filteredCaseStudies].sort((a, b) =>
    sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  );

  // Fallback UI for error state
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 to-blue-400 flex flex-col items-center justify-center p-6 font-inter">
        <h1 className="text-4xl font-bold text-white mb-8">MedSky</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-white">Please check console logs and try refreshing.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 to-blue-400 flex flex-col items-center justify-center p-6 font-inter">
        <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-md">MedSky</h1>
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
          {error && <p className="text-red-500 mb-4 animate-pulse">{error}</p>}
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            aria-label="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            aria-label="Password"
          />
          <button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all duration-300 mb-4"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-all duration-300 mb-4"
          >
            Sign In with Google
          </button>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-500 hover:underline"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-blue-400 flex flex-col items-center p-6 font-inter">
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-white drop-shadow-md">MedSky</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all duration-300"
        >
          Sign Out
        </button>
      </div>

      {/* Generate Case Study Controls */}
      {!selectedCase && (
        <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-lg mb-6 transform transition-all hover:scale-105">
          {error && (
            <p className="text-red-500 mb-4 animate-pulse">{error}</p>
          )}
          <label className="block text-gray-800 font-semibold mb-2">
            Generate Case Study
          </label>
          <select
            value={diseaseField}
            onChange={(e) => setDiseaseField(e.target.value as DiseaseField)}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            aria-label="Generate Disease Field"
          >
            {diseaseFields.map((field) => (
              <option key={field} value={field}>
                {field.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerateCase}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate New Case Study"
            )}
          </button>
        </div>
      )}

      {/* Filter and Sort Controls */}
      {!selectedCase && (
        <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-lg mb-6 transform transition-all hover:scale-105">
          <label className="block text-gray-800 font-semibold mb-2">
            Filter by Disease Field
          </label>
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            aria-label="Filter Disease Field"
          >
            <option value="all">All</option>
            {diseaseFields.map((field) => (
              <option key={field} value={field}>
                {field.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="w-full bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition-all duration-300"
          >
            Sort by Title {sortAsc ? "↑" : "↓"}
          </button>
        </div>
      )}

      {/* Case Study List */}
      {!selectedCase && (
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-semibold text-white mb-4 drop-shadow-md">
            Choose a Case Study
          </h2>
          {sortedCaseStudies.length === 0 ? (
            <p className="text-gray-200">No case studies yet. Generate one!</p>
          ) : (
            sortedCaseStudies.map((caseStudy) => (
              <div
                key={caseStudy.id}
                className="bg-white p-6 mb-4 rounded-xl shadow-lg transform transition-all hover:scale-105"
              >
                <div className="flex justify-between items-center">
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => handleSelectCase(caseStudy)}
                  >
                    <h3 className="text-lg font-semibold text-blue-800">
                      {caseStudy.title}
                    </h3>
                    <p className="text-gray-600">
                      {caseStudy.description.slice(0, 100)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      Field: {caseStudy.diseaseField.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCase(caseStudy.id)}
                    className={`ml-2 p-2 rounded ${
                      deleteConfirm === caseStudy.id
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    } transition-all duration-300`}
                    aria-label={`Delete ${caseStudy.title}`}
                  >
                    {deleteConfirm === caseStudy.id ? "Confirm Delete" : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Case Study Details */}
      {selectedCase && (
        <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-lg transform transition-all hover:scale-105">
          <button
            onClick={() => setSelectedCase(null)}
            className="text-blue-500 hover:underline mb-4 transition-all duration-300"
          >
            Back to Cases
          </button>
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            {selectedCase.title}
          </h2>
          <p className="text-gray-600 mb-4">{selectedCase.description}</p>
          <h3 className="text-lg font-semibold text-blue-700 mb-2">
            {selectedCase.question}
          </h3>

          {/* Answer Options */}
          <div className="space-y-2 mb-4">
            {selectedCase.options.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="mr-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitAnswer}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300"
            disabled={!selectedAnswer}
          >
            Submit Answer
          </button>

          {/* Result and Explanation */}
          {showResult && (
            <div className="mt-4">
              <p
                className={`font-semibold ${
                  selectedAnswer === selectedCase.correctAnswer
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {selectedAnswer === selectedCase.correctAnswer
                  ? "Correct!"
                  : "Incorrect."}
              </p>
              <p className="text-gray-600 mt-2">{selectedCase.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;