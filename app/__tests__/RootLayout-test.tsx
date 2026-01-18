import { render, waitFor } from "@testing-library/react-native";
import { useSegments } from "expo-router";

import * as useSupabaseAuthHook from "../../src/hooks/useSupabaseAuth";
import RootLayout from "../_layout";

jest.mock("../../ReactotronConfig", () => ({}));

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// --- MOCKS ---

// Mock Expo Router
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: jest.fn(),
  Slot: () => null,
}));

// Mock Splash Screen
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

// Mock Providers
jest.mock("@tanstack/react-query-persist-client", () => ({
  PersistQueryClientProvider: ({ children }: any) => children,
}));
jest.mock("react-native-drax", () => ({
  DraxProvider: ({ children }: any) => children,
}));
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardProvider: ({ children }: any) => children,
}));

describe("<RootLayout /> Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- SCENARIO 1: USER IS LOGGED OUT ---
  it("redirects to (auth) when user is NOT authenticated", async () => {
    jest.spyOn(useSupabaseAuthHook, "useSupabaseAuth").mockReturnValue({
      isLoaded: true,
      isAuthenticated: false,
      session: null,
    });

    (useSegments as jest.Mock).mockReturnValue(["(main)"]);

    render(<RootLayout />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)");
    });
  });

  // --- SCENARIO 2: USER IS LOGGED IN ---
  it("redirects to (main) when user IS authenticated", async () => {
    jest.spyOn(useSupabaseAuthHook, "useSupabaseAuth").mockReturnValue({
      isLoaded: true,
      isAuthenticated: true,
      session: { user: { id: "123" } } as any,
    });

    (useSegments as jest.Mock).mockReturnValue(["(auth)"]);

    render(<RootLayout />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(main)");
    });
  });

  // --- SCENARIO 3: LOADING STATE ---
  it("renders nothing (or splash) while auth is loading", () => {
    jest.spyOn(useSupabaseAuthHook, "useSupabaseAuth").mockReturnValue({
      isLoaded: false,
      isAuthenticated: false,
      session: null,
    });

    render(<RootLayout />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
