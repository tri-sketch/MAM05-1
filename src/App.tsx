import ReactDOM from "react-dom/client";

import "./index.css";

const App = () => (
  <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="bg-white p-8 rounded-2xl shadow-2xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Tailwind is working! ✅
      </h1>
      <p className="text-gray-600">
        You can see colors, gradients, shadows, and rounded corners and alll with
      </p>
    </div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);

root.render(<App />);

