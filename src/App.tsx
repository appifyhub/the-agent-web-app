import { useState } from "react";
import { Button } from "@/components/ui/button";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <Button onClick={() => setCount((count) => count + 1)}>
        I've been clicked {count} times!
      </Button>
    </div>
  );
}

export default App;
