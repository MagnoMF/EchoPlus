import { MantineProvider } from "@mantine/core";
import Speech from "./pages/SpeechPage/Speech";

function App() {
  return (
    <>
    <MantineProvider>
      <Speech/>
    </MantineProvider>
    </>
  );
}

export default App;
