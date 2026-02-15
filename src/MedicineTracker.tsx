import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";

type Medicine = {
  medication_name: string;
  dose_amount: number;
  dose_unit: string;
  amount_per_day: number;
  time_to_take: string[];
};
const hasuraGraphqlUrl = "https://elegant-kitten-75.hasura.app/v1/graphql";

async function graphqlFetch<TData>(
  query: string,
  variables?: Record<string, any>,
): Promise<TData> {
  const res = await fetch(hasuraGraphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret":
        "YE1f93reDnXFdRV31eAsxnu4i825TEWR9YdathnOtx63q480VtCLhab7gCfYNogh",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error("Graphql errors:", json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

const PRODUCTNAAM_REGEX= /^(.+?)\s+(\d+)\s*(mg|g|mcg|µg|ml|IU)\b,?\s*(.+)$/;

function parseMedicationName(productnaam: string) {
  const match = productnaam.match(PRODUCTNAAM_REGEX);
  if (!match) return null;
  return{
    name: match[1].trim(),
    doseAmount: parseInt(match[2], 10),
    doseUnit: match[3],
    form: match[4].trim()
  }
}

function getTimeLabel(time: string) {
  let hour: number;
  const simpleMatch = time.match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (simpleMatch) {
    hour = parseInt(simpleMatch[1], 10);
  } else {
    return"failed to parse time";
  }

  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 19) return "Evening";
  return "Night";
}

function formatTime(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (!match) return timeStr; // Return original if format is unexpected
  const hour = parseInt(match[1], 10);
  const minute = match[2];
  return `${hour}:${minute}`;
}

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function Portal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "350px",
        }}
      >
        {children}
        <button onClick={onClose} className="mt-3 text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </div>,
    document.body,
  );
}

export const MedicineTracker = () => {
  const [medications, setMedications] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [medNameInput, setMedNameInput] = useState("");
  const [amountPerDayInput, setAmountPerDayInput] = useState("");
  const [timeInputs, setTimeInputs] = useState<string[]>([]);
  const [timeToTakeInput, setTimeToTakeInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMedInfo, setSelectedMedInfo] = useState<{ farmaceutischevorm: string ; toedienningsweg: string} | null>(null);

  const [extractDose, setExtractedDose] = useState<{doseAmount: number; doseUnit: string} | null>(null);

  const GET_MEDICATIONS = `
    query GetMedications {
      medication_table {
        medication_name
        dose_amount
        dose_unit
        amount_per_day
        time_to_take
      }
    }
  `;

  const INSERT_MEDICATION = `
    mutation InsertMedication(
      $medication_name: String!, 
      $dose_amount: Int!, 
      $dose_unit: String!, 
      $amount_per_day: Int!, 
      $time_to_take: [time!]) {
      insert_medication_table_one(object: {
        medication_name: $medication_name,
        dose_amount: $dose_amount,
        dose_unit: $dose_unit,
        amount_per_day: $amount_per_day,
        time_to_take: $time_to_take,
      }) {
        medication_name
        dose_amount
        dose_unit
        amount_per_day
        time_to_take
      }
    }
  `;

  const DELETE_MEDICATION = `
  mutation DeleteHabit($medication_name: String!) {
    delete_medication_table_by_pk(medication_name: $medication_name) {
      medication_name
    }
  }
  `;

  const SEARCH_MEDICATION_DB = `
    query SearchMedication($search: String!) {
      medicine_db(where: {productnaam: { _ilike: $search }}
      limit: 5) {
        productnaam
        registratienummer
        farmaceutischevorm
        toedienningsweg
      }
    }
  `;

  {
    /*Load Medications */
  }
  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlFetch<{ medication_table: Medicine[] }>(
        GET_MEDICATIONS,
      );
      console.log("Graphql medications data:", data);
      setMedications(
        Array.isArray(data.medication_table) ? data.medication_table : [],
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  // we can also filter it on time if yes check UvA AI chat!!
  const searchMedication = async (search: string) => {
    if (search.length < 3) { 
      setSuggestions([]);
      return;
    }
    try {
      const data = await graphqlFetch<{ medicine_db: any[] }>(SEARCH_MEDICATION_DB, 
        { search: `%${search}%` });
      setSuggestions(data.medicine_db || []);
    }
    catch (e) {
      console.error("Failed to search medication:", e);
      setSuggestions([]);
    }
  }

  const handleAmountPerDayChange = (value: string) => {
    setAmountPerDayInput(value);
    const amount = parseInt(value, 10);
    if (!isNaN(amount) && amount > 0 && amount <= 10) {
       //create empty time slots
      const timeSlots =  Array.from({ length: amount }, (_, i) => 
        timeInputs[i] || "",);
      setTimeInputs(timeSlots);
    } else {
      setTimeInputs([]);
    }
  };

  // update timpe input
  const handleTimeChange = (index: number, value: string) => {
    const updated = [...timeInputs];
    updated[index] = value;
    setTimeInputs(updated);
  }

  const createMedication = async () => {
    if (!medNameInput|| !amountPerDayInput || !extractDose) return;
    const allTimeInputsFilled = timeInputs.length > 0 && timeInputs.every((t) => t !== "");
    if (!allTimeInputsFilled) return;

    const amount_per_day = parseInt(amountPerDayInput, 10);

    //format time hh:mm:ss
    const time_to_take = timeInputs.map((t) => {
      return t.length === 5 ? `${t}:00` : t; // add seconds if not provided
    });

    try {
      await graphqlFetch<{ insert_medication_table: Medicine }>(
        INSERT_MEDICATION,
        {
          medication_name: medNameInput,
          dose_amount: extractDose.doseAmount,
          dose_unit: extractDose.doseUnit,
          amount_per_day,
          time_to_take: time_to_take, 
        },
      );
      // reset all fields
      setMedNameInput("");
      setAmountPerDayInput("");
      setTimeInputs([]);
      setSuggestions([]);
      setSelectedMedInfo(null);
      setExtractedDose(null);
      setIsOpen(false);
      await loadMedications();
    } catch (e: any) {
      alert(e.message ?? "Failed to create medication");
    }
  };


  const deleteMedication = async (medication_name: string) => {
    setLoading(true);
    setError(null);
    try {
      await graphqlFetch
      <{ delete_medication_table_by_pk: {medication_name: string} | null;}>(DELETE_MEDICATION, {medication_name});
      await loadMedications();
    } catch (e: any) {
      setError(e.message ?? "Failed to delete habit");
    } finally {
      setLoading(false);
    }
  };

  //handle selecting a suggestion from autocomplete
  const handleSelectSuggestion = (med: any) => {
    setMedNameInput(med.productnaam);
    setSelectedMedInfo({
      farmaceutischevorm: med.farmaceutischevorm,
      toedienningsweg: med.toedienningsweg,
    });
    setSuggestions([]);

    //use regex to extract dose from productnaam
    const extracted = parseMedicationName(med.productnaam);
    if (extracted) {
      setExtractedDose({ doseAmount: extracted.doseAmount, doseUnit: extracted.doseUnit });
    } else {
      setExtractedDose(null);
    }
  };
   

  return (
    <><div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <div className="flex justify-between gap-4 items-center">
          <h1 className="text-2xl font-bold">Medication Tracker</h1>
          <div className="flex- gap-2">
            <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600">
              Add Medication
            </button>
          </div>
        </div>
      <p className="text-gray-600">
        This is where you can track your medications and manage your
        prescriptions.
      </p>
          
        <div className="flex flex-col mt-2 w-full">
          {loading && <p>Loading medications...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          <div className="space-y-4">
            {medications.map((medication) => (
              <div 
                key={medication.medication_name}
                className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm"
              >
                {/*header: name and doasge + remove button */}
                <div className=" flex items-center w-full">
                  <p className="flex-1 text-xl font-semibold">
                    {medication.medication_name}
                  </p>
                  <button
                    onClick={() => deleteMedication(medication.medication_name)}
                    className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>

                {/* dosage info extracted by regexp*/}
                <p className="text-sm text-gray-500">
                  {medication.dose_amount} {medication.dose_unit} {medication.amount_per_day}x per day at
                </p>
                
                {/* time of intake per row */}
                <p className="text-lg font -medium"> Today&apos;s Schedule</p>
                <div className="flex flex-col gap-2">
                  {Array.isArray(medication.time_to_take) &&
                    medication.time_to_take.map((time, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 bg-white border-2 border-blue-200 rounded-xl shadow-sm"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {getTimeLabel(time)}
                          </p>
                          <p className="font-semibold">{formatTime(time)}</p>
                        </div>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {!loading && medications.length === 0 && !error && (
              <p className="text-gray-500">No medications added yet. Click "Add Medication" to get started.</p>
            )}
          </div>
      </div>

      {/* ─── Add Medication Modal ─── */}
        <Portal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Add new medication</h2>
          <div className="flex flex-col gap-3">
            {/* Medicine name input with autocomplete */}
            <label className="text-sm font-medium text-gray-700">
              Medicine name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Start typing a medicine name..."
                value={medNameInput}
                onChange={(e) => {
                  setMedNameInput(e.target.value);
                  searchMedication(e.target.value);
                  setSelectedMedInfo(null);
                  setExtractedDose(null);
                }}
                className="border rounded px-3 py-2 w-full"
              />
              {suggestions.length > 0 && (
                <ul className="absolute bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
                  {suggestions.map((med, i) => (
                    <li
                      key={i}
                      onClick={() => handleSelectSuggestion(med)}
                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      <p className="font-medium">{med.productnaam}</p>
                      <p className="text-sm text-gray-500">
                        {med.farmaceutischevorm} — {med.toedienningsweg}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Show auto-extracted dose + medicine info */}
            {selectedMedInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm">
                <p>
                  <span className="font-semibold">Type: </span>
                  {selectedMedInfo.farmaceutischevorm}
                </p>
                <p>
                  <span className="font-semibold">Usage: </span>
                  {selectedMedInfo.toedienningsweg}
                </p>
                {extractDose && (
                  <p>
                    <span className="font-semibold">Dosage (auto): </span>
                    {extractDose.doseAmount} {extractDose.doseUnit}
                  </p>
                )}
              </div>
            )}

            {/* Times per day */}
            <label className="text-sm font-medium text-gray-700">
              How many times per day?
            </label>
            <input
              type="number"
              min="1"
              max="10"
              placeholder="e.g. 3"
              value={amountPerDayInput}
              onChange={(e) => handleAmountPerDayChange(e.target.value)}
              className="border rounded px-3 py-2"
            />

            {/* Dynamic time inputs — one per dose */}
            {timeInputs.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  What time for each dose?
                </label>
                {timeInputs.map((time, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-16">
                      Dose {i + 1}:
                    </span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(i, e.target.value)}
                      className="border rounded px-3 py-2 flex-1"
                    />
                    {time && (
                      <span className="text-xs text-gray-400">
                        {getTimeLabel(time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={createMedication}
              disabled={
                !medNameInput ||
                !extractDose ||
                !amountPerDayInput ||
                timeInputs.some((t) => t === "")
              }
              className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </Portal>
      </div>
    </>
  );
};

export default MedicineTracker;

