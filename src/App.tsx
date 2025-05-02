import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Routes, Route } from "react-router-dom";
import ChatSettingsPage from "./pages/ChatSettingsPage";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      {/* Define the main settings route */}
      <Route
        path="/:lang_iso_code/chat/:chat_id/settings"
        element={<ChatSettingsPage />}
      />
      {/* Add other routes here if needed */}
      <Route path="*" element={<div>404 Not Found</div>} /> {/* Basic 404 */}
      <Route
        path="/"
        element={
          <div className="flex flex-col items-center justify-center min-h-svh">
            <Button onClick={() => setCount((count) => count + 1)}>
              I've been clicked {count} times!
            </Button>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
