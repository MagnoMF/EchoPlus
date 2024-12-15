import { createRoot } from "react-dom/client";
import '@mantine/tiptap/styles.css';
import '@mantine/core/styles.css';
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
