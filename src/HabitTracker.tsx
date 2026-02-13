import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
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
        }}
      >
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body,
  );
}

type Habit = {
  id: number;
  habit_title: string;
  goal: number;
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

const HabitTracker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [habitTitle, setHabitTitle] = useState("");
  const [goalInput, setGoalInput] = useState("");

  const GET_HABITS = `
    query GetHabits {
      habit_table {
        id
        habit_title
        goal
      }
    }
  `;

  const INSERT_HABIT = `
    mutation InsertHabit($habit_title: String!, $goal: Int!) {
      insert_habit_table_one(object: {
        habit_title: $habit_title,
        goal: $goal
      }) {
        id
        habit_title
        goal
      }
    }
  `;

  const DELETE_HABIT = `
    mutation DeleteHabit($id: Int!) {
      delete_habit_table_by_pk(id: $id) {
        id
      }
    }
  `;

  {
    /*Load habits */
  }
  const loadHabits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlFetch<{ habit_table: Habit[] }>(GET_HABITS);
      console.log("Graphql habits data:", data);
      setHabits(Array.isArray(data.habit_table) ? data.habit_table : []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const createHabit = async () => {
    if (!habitTitle || !goalInput) return;
      const goal = parseInt(goalInput, 10);
      if (Number.isNaN(goal)) {
        alert("Goal must be a number!")
        return;
      }
    
    try {
      await graphqlFetch<{ insert_habit_table_one: Habit }>(INSERT_HABIT, {
        habit_title: habitTitle,
        goal,
      });
      setHabitTitle("");
      setGoalInput("");
      setIsOpen(false);
      await loadHabits();
    }
    catch (e: any) {
      setError(e.message ?? "Failed to create habit");
    }
  };

  const deleteHabit = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await graphqlFetch
      <{ delete_habit_table_by_pk: {id: number} | null;}>(DELETE_HABIT, {id});
      await loadHabits();
    } catch (e: any) {
      setError(e.message ?? "Failed to delete habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <><div className="flex flex-col gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
        <div className="flex justify-between gap-4 items-center">
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600">
              Add Habit
            </button>
          </div>
        </div>
      <p className="text-gray-600">
        This is where you can track manage your habits.
      </p>
      <Portal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Add new habit</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Habit title"
            value={habitTitle}
            onChange={(e) => setHabitTitle(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Goal (times per week)"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createHabit}
            className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
            Create Habit
          </button>
        </div>
      </Portal>
    
    <div className="flex flex-col mt-2 w-full">
        {loading && <p>Loading habits...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        <ul className="list-disc pl-5 space-y-4">
          {habits.map((habit) => (
            <div key={habit.id} className="flex flex-col items-center gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
              <div className="flex items-center w-full">
                <p className="flex-1 flex flex-wrap text-xl font-semibold">{habit.habit_title}</p>
                <button onClick={() => deleteHabit(habit.id)} className="ml-auto px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600">Remove Habit</button>
              </div>
              <p className="flex-2 flex flex-wrap self-left items-left ml-2 text-gray-600">Goal: {habit.goal} times per week</p>

              <div className="table w-2xl mt-2">
                <div className="table-header-group">
                  <div className="table-row">
                    <div className="table-cell text-center">Monday</div>
                    <div className="table-cell text-center">Tuesday</div>
                    <div className="table-cell text-center">Wednesday</div>
                    <div className="table-cell text-center">Thursday</div>
                    <div className="table-cell text-center">Friday</div>
                    <div className="table-cell text-center">Saturday</div>
                    <div className="table-cell text-center">Sunday</div>
                  </div>
                </div>
                <div className="table-row-group">
                  <div className="table-row">
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                    <div className="table-cell text-center"><input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"/></div>
                  </div>
                </div>
              </div>
          </div>
          ))}
          {!loading && habits.length === 0 && !error && (
            <li className="text-gray-500">No habits yet.</li>
          )}
        </ul>
      </div>
      </div></>

    
  );
};

export default HabitTracker;
