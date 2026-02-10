import React from "react";
import HabitTracker from "./HabitTracker";
import { useState } from "react"; 

import "./index.css";
import logoImage from './icons/logo-transparent.png';
import iconImage from './icons/beat.png';
import { MedicineTracker } from "./MedicineTracker";

type ActiveApp = "habitTracker" | "medicineTracker" | "heartRateMonitor";
function NavigationMenu({
  activeApp,
  setActiveApp,
}: {
  activeApp: ActiveApp;
  setActiveApp: (app: ActiveApp) => void;
}) {
  return (
    <div className="flex gap-4 p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mt-6 mx-4 md:mx-6 lg:mx-8">
      <button
        onClick={() => setActiveApp("habitTracker")}
        className={`flex-1 font-bold py-2 px-4 rounded-full transition-colors ${
          activeApp === "habitTracker"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}>
        Habit Tracker
      </button>

      <button
        onClick={() => setActiveApp("medicineTracker")}
        className={`flex-1 font-bold py-2 px-4 rounded-full transition-colors ${
          activeApp === "medicineTracker" 
          ? "bg-blue-500 text-white" 
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
        Medication
      </button>

      <button
        onClick={() => setActiveApp("heartRateMonitor")}
        className={`flex-1 font-bold py-2 px-4 rounded-full transition-colors ${
          activeApp === "heartRateMonitor" 
          ? "bg-blue-500 text-white" 
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
        Heart Rate
      </button>
    </div>    
  );
};

const Header = () => {
  const [activeApp, setActiveApp] = useState<ActiveApp>("habitTracker");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-100">
      <div className="flex justify-between items-center p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mt-6 mx-4 md:mx-6 lg:mx-8">
          {/* Logo on the left */}
          <div className="flex gap-4 items">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img src={logoImage} alt="CardiacCare logo" className="w-full h-full object-cover"/>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-1">CardiacCare</h1>
              <p className="text-gray-600 text-lg">Your heart's best friend</p>  
            </div>
          </div>
          <NavigationMenu activeApp={activeApp} setActiveApp={setActiveApp} />
        </div>

        <div className="flex gap-4 items-center p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm mx-4 md:mx-6 lg:mx-8 mt-4">
          <img src={iconImage} alt="Heartbeat icon" className="w-10 h-10 self-center"/>
          <div>
            <h2 className="font-semibold text-gray-700 text-lg">Managing Cardiac Arrhythmia</h2>
            <p className="text-gray-600 mt-1">Track your habits, medication, and heart rate to better manage your heart health.</p>
          </div>
        </div>

        <main className="p-5 mx-4 md:mx-6 lg:mx-8 mt-4">
        {activeApp === "habitTracker" && <HabitTracker />}
        {activeApp === "medicineTracker" && <MedicineTracker />}
        {activeApp === "heartRateMonitor" && (
          <div>Heart rate monitor UI goes here…</div>
        )}
      </main>
    </div>

  );
};



export default Header;

