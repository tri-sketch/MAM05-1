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
  // const [doseAmountInput, setDoseAmountInput] = useState("");
  // const [doseUnitInput, setDoseUnitInput] = useState("");
  const [amountPerDayInput, setAmountPerDayInput] = useState("");
  const [timeToTakeInput, setTimeToTakeInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMedInfo, setSelectedMedInfo] = useState<{ farmaceutischevorm: string ; toedienningsweg: string} | null>(null);

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
    mutation InsertMedication($medication_name: String!, dose_amount: Int!, dose_unit: String!, amount_per_day: Int!, time_to_take: Time[]!) {
      insert_medication_table(object: {
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
      medicine_db(where: {productnaam: { _like: $search }}
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
      console.log("Graphql habits data:", data);
      setMedications(
        Array.isArray(data.medication_table) ? data.medication_table : [],
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to load habits");
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

  const createMedication = async () => {
    if (!medNameInput|| !amountPerDayInput || !timeToTakeInput) return;
    //const dose_amount = parseInt(doseAmountInput, 5);
    const amount_per_day = parseInt(amountPerDayInput, 5);
    const time_to_take_date = DateTime.fromFormat(timeToTakeInput, "HH:mm");
    const time_to_take = [`${time_to_take_date}`];

    try {
      await graphqlFetch<{ insert_medication_table: Medicine }>(
        INSERT_MEDICATION,
        {
          medication_name: medNameInput,
          //dose_amount,
          //dose_unit: doseUnitInput, 
          amount_per_day,
          time_to_take,
        },
      );
      setMedNameInput("");
      // setDoseAmountInput("");
      // setDoseUnitInput(""); 
      setAmountPerDayInput("");
      setTimeToTakeInput("");
      setSuggestions([]);
      setSelectedMedInfo(null);
      setIsOpen
      await loadMedications();
    } catch (e: any) {
      alert(e.message ?? "Failed to create medication");
    }
  };

  // const createMedication = async () => {
  //   const medication_name = prompt("Enter medication name");
  //   const dose_amount_string = prompt("Enter dose amount");
  //   const dose_unit = prompt("Enter dose unit");
  //   const amount_per_day_string = prompt(
  //     "Enter the amount of times per day you take this medicine",
  //   );
  //   const time_to_take_string = prompt(
  //     "Enter the time(s) of day you take your medication",
  //   );
  //   if (
  //     !medication_name ||
  //     !dose_amount_string ||
  //     !dose_unit ||
  //     !amount_per_day_string ||
  //     !time_to_take_string
  //   )
  //     return;

  //   const dose_amount = parseInt(dose_amount_string, 10);
  //   const amount_per_day = parseInt(amount_per_day_string, 10);
  //   const time_to_take_date = DateTime.fromFormat(time_to_take_string, "HH:mm:ss");
  //   const time_to_take = `[${time_to_take_date}]`;
  //   try {
  //     await graphqlFetch<{ insert_medication_table: Medicine }>(
  //       INSERT_MEDICATION,
  //       {
  //         medication_name,
  //         dose_amount,
  //         dose_unit,
  //         amount_per_day,
  //         time_to_take,
  //       },
  //     );
  //     await loadMedications();
  //   } catch (e: any) {
  //     alert(e.message ?? "Failed to create habit");
  //   }
  // };

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

  return (
    <><div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <div className="flex flex-wrap gap-4 items-center">
          <h1 className="text-2xl font-bold mb-4">Medication Tracker</h1>
          <p className="text-gray-600">
          This is where you can track your medications and manage your
          prescriptions.
          </p>

          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
          Add Medication
          </button>
        </div>

        <div className="flex flex-col mt-2 w-full">
        {loading && <p>Loading medications...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        <ul className="list-disc pl-5 space-y-4">
          {medications.map((medication) => (
            <div key={medication.medication_name} className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
              <div className="flex items-center w-full">
                <p className="flex-1 flex flex-wrap text-xl font-semibold">{medication.medication_name}{", "}{medication.dose_amount}{" "}{medication.dose_unit}</p>
                <button onClick={() => deleteMedication(medication.medication_name)} className="ml-auto px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600">Remove Medication</button>
              </div> 
              <p className="text-lg">Today's Schedule</p>

              <div className="flex flex-row gap-4 items-left p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
                <p className="font-semibold">{medication.time_to_take}</p>
                <input id="default-checkbox self-end" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/>
              </div>
            </div>
          ))}
          {!loading && medications.length === 0 && !error && (
            <li className="text-gray-500">No habits yet.</li>
          )}
        </ul>
      </div>
      <Portal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Add new medication</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Medication name"
            value={medNameInput}
            onChange={(e) => {
              setMedNameInput(e.target.value)
              searchMedication(e.target.value);
              setSelectedMedInfo(null);
            }}
            className="border rounded px-3 py-2 w-full"
          />
          {suggestions.length > 0 && (
            <ul className="absolute bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
              {suggestions.map((med,i) => (
                <li
                  key = {i}
                  onClick={() => {
                    setMedNameInput(med.productnaam);
                    setSelectedMedInfo({ 
                      farmaceutischevorm: med.farmaceutischevorm, 
                      toedienningsweg: med.toedienningsweg 
                    });
                    setSuggestions([]);
                  }}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  <p className="font-medium">{med.productnaam}</p>
                  <p className="text-sm text-gray-500">
                    {med.farmaceutischevorm}, {med.toedienningsweg}
                  </p>
                </li>
              ))}
            </ul> 
          )}
        </div>
          {selectedMedInfo && (
            <div className="bg-blue-500 border border-blue-200 rounded px-3 py-2 text-sm">
              <p><span className="font-semibold">Type:</span>{(selectedMedInfo.farmaceutischevorm)}</p>
              <p><span className="font-semibold">Usage:</span>{(selectedMedInfo.toedienningsweg)}</p>
            </div>
          )}
          {/* <input 
            type="number"
            placeholder="Dose amount"
            value={doseAmountInput}
            onChange={(e) => setDoseAmountInput(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Dose unit (e.g. mg)"
            value={doseUnitInput}
            onChange={(e) => setDoseUnitInput(e.target.value)}
            className="border rounded px-3 py-2"
          /> */}
          <input
            type="number"
            placeholder="Times per day"
            value={amountPerDayInput}
            onChange={(e) => setAmountPerDayInput(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Time to take"
            value={timeToTakeInput}
            onChange={(e) => setTimeToTakeInput(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button onClick={createMedication}
            className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600">
            Add 
          </button>
      </Portal>
    </div></>
  );
};

export default MedicineTracker;
