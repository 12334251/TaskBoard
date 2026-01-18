import { fireEvent, render, screen } from "@testing-library/react-native";
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
  return {
    BoardSkeleton: () => <View testID="board-skeleton" />,
  };
});

// SUPABASE MOCK ---
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
            data: { id: "new-board", title: "New Board" },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

// Mock React Query
const mockInvalidateQueries = jest.fn();
const mockMutate = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    clear: jest.fn(),
  }),
  useMutation: (options: any) => {
    return {
      mutate: mockMutate.mockImplementation((variables) => {
        if (options.onSuccess) options.onSuccess();
      }),
      isLoading: false,
    };
  },
}));

describe("<BoardListScreen />", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it("renders loading skeleton when data is loading", () => {
    jest.spyOn(useBoardsHook, "useBoards").mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<BoardListScreen />);

    expect(screen.getByTestId("board-skeleton")).toBeTruthy();
  });

  it("renders empty message when no boards exist", () => {
    jest.spyOn(useBoardsHook, "useBoards").mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<BoardListScreen />);
    expect(screen.getByText("No boards yet. Create one!")).toBeTruthy();
  });

  it("renders a list of boards", () => {
    const mockBoards = [
      {
        id: "1",
        title: "Project Alpha",
        created_at: new Date().toISOString(),
        owner_id: "u1",
      },
      {
        id: "2",
        title: "Marketing Launch",
        created_at: new Date().toISOString(),
        owner_id: "u1",
      },
    ];

    jest.spyOn(useBoardsHook, "useBoards").mockReturnValue({
      data: mockBoards,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<BoardListScreen />);
    expect(screen.getByText("Project Alpha")).toBeTruthy();
    expect(screen.getByText("Marketing Launch")).toBeTruthy();
  });

  it("navigates to board details when clicked", () => {
    jest.useFakeTimers();

    const mockBoards = [
      {
        id: "123",
        title: "Clickable Board",
        created_at: new Date().toISOString(),
        owner_id: "u1",
      },
    ];

    jest.spyOn(useBoardsHook, "useBoards").mockReturnValue({
      data: mockBoards,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<BoardListScreen />);

    const boardItem = screen.getByText("Clickable Board");
    fireEvent.press(boardItem);

    jest.runAllTimers();

    expect(mockPush).toHaveBeenCalledWith("/board/123");

    jest.useRealTimers();
  });

  it("allows creating a new board", () => {
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

    // 1. Invalid input
    fireEvent.changeText(input, "Hi");
    fireEvent.press(addBtn);
    expect(mockMutate).not.toHaveBeenCalled();

    // 2. Valid input
    fireEvent.changeText(input, "New Project Board");
    fireEvent.press(addBtn);

    expect(mockMutate).toHaveBeenCalledWith("New Project Board");
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["boards"],
    });

    expect(input.props.value).toBe("");
  });
});
