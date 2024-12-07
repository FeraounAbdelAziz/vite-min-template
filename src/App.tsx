import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";

import KMeansClusterer from "./components/Dashboard";
import { MantineProvider } from "@mantine/core";

export default function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <KMeansClusterer />
    </MantineProvider>
  );
}
