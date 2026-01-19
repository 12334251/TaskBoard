import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useRouter } from "expo-router";
import * as useBoardsHook from "../../hooks/useBoards";
import { BoardListScreen } from "../BoardListScreen";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20 }),
}));

jest.mock("../../components/Skeleton/BoardSkeleton", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return { BoardSkeleton: () => <View testID="board-skeleton" /> };
});

jest.mock("../../../../api/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: "new", title: "New" },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

const mockInvalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    clear: jest.fn(),
  }),
  useMutation: (options: any) => {
    return {
      mutate: jest.fn((variables) => {
        if (options.onSuccess) options.onSuccess(variables);
      }),
      isLoading: false,
    };
  },
}));

describe("<BoardListScreen />", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it("allows creating a new board", async () => {
    jest.spyOn(useBoardsHook, "useBoards").mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<BoardListScreen />);

    const input = screen.getByPlaceholderText(
      "New Board Name (min 3 chars)...",
    );
    const addBtn = screen.getByText("+ Add");

    fireEvent.changeText(input, "New Project Board");

    fireEvent.press(addBtn);

    await waitFor(() => {
      expect(input.props.value).toBe("");
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["boards"],
    });
  });
});
