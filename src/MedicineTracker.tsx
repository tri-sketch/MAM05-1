import React from "react"; 
import {useState, useEffect} from "react";
import "./index.css";
import { DateTime } from "luxon";


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
  variables?: Record<string, any>
): Promise<TData> {
  const res = await fetch(hasuraGraphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": "YE1f93reDnXFdRV31eAsxnu4i825TEWR9YdathnOtx63q480VtCLhab7gCfYNogh"
    },
    body: JSON.stringify({query, variables}),
  });

  const json = await res.json();

  if(json.errors) {
    console.error("Graphql errors:", json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}



export const MedicineTracker = () => {
  const [medications, setMedications] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    mutation InsertMedication($medication_name: String!, dose_amount: Int!, dose_unit: String!, amount_per_day: Int!, time_to_take: String[]!) {
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

  {/*Load Medications */}
  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try{
      const data = await graphqlFetch<{medication_table:Medicine[]}>(GET_MEDICATIONS);
      console.log("Graphql habits data:", data);
      setMedications(Array.isArray(data.medication_table) ? data.medication_table : []);
  } catch (e:any) {
    setError(e.message ?? "Failed to load habits");
  } finally {
    setLoading(false);
  }
  }; 

  useEffect(() => {
    loadMedications();
  }, []);

  const createMedication = async () => {
    const medication_name = prompt("Enter medication name");
    const dose_amount_string = prompt("Enter dose amount");
    const dose_unit = prompt("Enter dose unit");
    const amount_per_day_string = prompt("Enter the amount of times per day you take this medicine");
    const time_to_take_string = prompt("Enter the time(s) of day you take your medication");
    if (!medication_name || !dose_amount_string || !dose_unit || !amount_per_day_string || !time_to_take_string) return;

    const dose_amount = parseInt(dose_amount_string, 10);
    const amount_per_day = parseInt(amount_per_day_string, 10);
    const time_to_take = DateTime.fromFormat(time_to_take_string, "HH:mm:ss");
    
  
  try {
    await graphqlFetch<{insert_medication_table: Medicine}>(INSERT_MEDICATION, {medication_name, dose_amount, dose_unit, amount_per_day, time_to_take});
    await loadMedications();
  } catch (e: any) {
    alert(e.message ?? "Failed to create habit");
  };
}

  return( 
  <div className="flex gap-4 items-center p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
    <h1 className="text-2xl font-bold mb-4">Medication Tracker</h1>
    <p className="text-gray-600">This is where you can track your medications and manage your prescriptions.</p>
  
    <button
          onClick={createMedication}
          className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
      >
        Add Medication
      </button>
      {loading && <p>Loading medications...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {/* LIST OF HABITS FROM DB */}
      <ul className="list-disc pl-5 space-y-1">
        {medications.map((medication) => (
          <li key={medication.medication_name}>
            <span className="font-semibold">{medication.medication_name}</span>{" "}
            <span className="font-semibold">{medication.dose_amount}</span>{" "}
            <span className="font-semibold">{medication.dose_unit}</span>{" "}
            <span className="font-semibold">{medication.amount_per_day}</span>{" "}
            <span className="font-semibold">{medication.time_to_take}</span>{" "}
          </li>
        ))}
        {!loading && medications.length === 0 && !error && (
          <li className="text-gray-500">No habits yet.</li>
        )}
      </ul>

  </div>
  );
}

export default MedicineTracker;
