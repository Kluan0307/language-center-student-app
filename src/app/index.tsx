import { Redirect } from "expo-router";
import { SessionGate } from "../components/SessionGate";
export default function Index() {
  return (
    <SessionGate>
      <Redirect href="/(tabs)" />
    </SessionGate>
  );
}
