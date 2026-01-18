import { fireEvent, render, screen } from "@testing-library/react-native";

import * as usePresenceHook from "../../hooks/useBoardPresence";
import * as useTasksHook from "../../hooks/useTasks";
import { BoardDetailScreen } from "../BoardDetailScreen";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// --- MOCK EXTERNAL LIBRARIES ---

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));

jest.mock("../../../../context/DragDropContext", () => ({
  DragDropProvider: ({ children }: any) => <>{children}</>,
}));

// --- MOCK CHILD COMPONENTS ---

// Mock BoardColumn
jest.mock("../../components/BoardColumn", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require("react-native");
  return {
    BoardColumn: ({ title, tasks }: any) => (
      <View testID={`column-${title}`}>
        <Text>{title}</Text>
        <Text testID={`count-${title}`}>{tasks.length}</Text>
      </View>
    ),
  };
});

// Mock TaskDetailModal
jest.mock("../../components/TaskDetailModal", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    TaskDetailModal: ({ visible }: any) =>
      visible ? <View testID="task-modal" /> : null,
  };
});

// Mock InviteMemberModal
jest.mock("../../components/InviteMemberModal", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    InviteMemberModal: ({ visible }: any) =>
      visible ? <View testID="invite-modal" /> : null,
  };
});

// --- TEST SUITE ---

describe("<BoardDetailScreen />", () => {
  const mockCreateTask = jest.fn();
  const mockUpdateTask = jest.fn();
  const mockDeleteTask = jest.fn();
  const mockSetEditing = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(usePresenceHook, "useBoardPresence").mockReturnValue({
      activeUsers: [
        {
          userId: "1",
          email: "alice@test.com",
          onlineAt: "",
          editingTaskId: null,
        },
        {
          userId: "2",
          email: "bob@test.com",
          onlineAt: "",
          editingTaskId: null,
        },
      ],
      setEditingTask: mockSetEditing,
    });
  });

  it("renders loading indicator when fetching tasks", () => {
    jest.spyOn(useTasksHook, "useTasks").mockReturnValue({
      data: [],
      isLoading: true,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    } as any);

    render(<BoardDetailScreen boardId="123" />);

    expect(screen.queryByTestId("column-To Do")).toBeNull();
  });

  it("renders columns and active users when data loads", () => {
    const mockTasks = [
      { id: "1", title: "Fix Bug", status: "TODO", priority: "HIGH" },
      { id: "2", title: "Design", status: "IN_PROGRESS", priority: "MEDIUM" },
    ];

    jest.spyOn(useTasksHook, "useTasks").mockReturnValue({
      data: mockTasks,
      isLoading: false,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    } as any);

    render(<BoardDetailScreen boardId="123" />);

    expect(screen.getByText("AL")).toBeTruthy();
    expect(screen.getByText("BO")).toBeTruthy();

    expect(screen.getByTestId("column-To Do")).toBeTruthy();
    expect(screen.getByTestId("column-Progress")).toBeTruthy();
    expect(screen.getByTestId("column-Done")).toBeTruthy();

    expect(screen.getByTestId("count-To Do")).toHaveTextContent("1");
    expect(screen.getByTestId("count-Progress")).toHaveTextContent("1");
  });

  it("filters tasks when search text is typed", () => {
    const mockTasks = [
      { id: "1", title: "Fix Bug", status: "TODO" },
      { id: "2", title: "Write Tests", status: "TODO" },
    ];

    jest.spyOn(useTasksHook, "useTasks").mockReturnValue({
      data: mockTasks,
      isLoading: false,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    } as any);

    render(<BoardDetailScreen boardId="123" />);

    expect(screen.getByTestId("count-To Do")).toHaveTextContent("2");

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    fireEvent.changeText(searchInput, "Fix");

    expect(screen.getByTestId("count-To Do")).toHaveTextContent("1");
  });

  it("filters tasks when priority chip is selected", () => {
    const mockTasks = [
      { id: "1", title: "Urgent Task", status: "TODO", priority: "HIGH" },
      { id: "2", title: "Chill Task", status: "TODO", priority: "LOW" },
    ];

    jest.spyOn(useTasksHook, "useTasks").mockReturnValue({
      data: mockTasks,
      isLoading: false,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    } as any);

    render(<BoardDetailScreen boardId="123" />);

    expect(screen.getByTestId("count-To Do")).toHaveTextContent("2");

    const highFilter = screen.getByText("HIGH");
    fireEvent.press(highFilter);

    expect(screen.getByTestId("count-To Do")).toHaveTextContent("1");
  });

  it("opens modals when buttons are pressed", () => {
    jest.spyOn(useTasksHook, "useTasks").mockReturnValue({
      data: [],
      isLoading: false,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    } as any);

    render(<BoardDetailScreen boardId="123" />);

    expect(screen.queryByTestId("task-modal")).toBeNull();
    fireEvent.press(screen.getByText("+ New Task"));
    expect(screen.getByTestId("task-modal")).toBeTruthy();

    expect(screen.queryByTestId("invite-modal")).toBeNull();
    fireEvent.press(screen.getByText("👤+"));
    expect(screen.getByTestId("invite-modal")).toBeTruthy();
  });
});
