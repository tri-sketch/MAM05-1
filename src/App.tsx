import ReactDOM from "react-dom/client";
import Header from "./Header";
import "./index.css";

const App = () => {
  return <Header />;
};

const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);

root.render(<App />);