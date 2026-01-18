import React, { createContext, useContext, useRef, useState } from "react";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TaskCard } from "../features/board/components/TaskCard";
import { Task } from "../features/board/hooks/useTasks";

type DropZone = {
  id: string;
  layout: { x: number; y: number; width: number; height: number };
  callback: (item: any) => void;
};

type DragDropContextType = {
  activeDragItem: Task | null;
  startDrag: (item: Task) => void;
  endDrag: (x: number, y: number) => void;
  registerDropZone: (
    id: string,
    layout: any,
    callback: (item: any) => void,
  ) => void;
  unregisterDropZone: (id: string) => void;

  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
};

const DragDropContext = createContext<DragDropContextType | null>(null);

export const DragDropProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeDragItem, setActiveDragItem] = useState<Task | null>(null);
  const dropZones = useRef<DropZone[]>([]);

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const registerDropZone = (
    id: string,
    layout: any,
    callback: (item: any) => void,
  ) => {
    const newZones = dropZones.current.filter((z) => z.id !== id);
    newZones.push({ id, layout, callback });
    dropZones.current = newZones;
  };

  const unregisterDropZone = (id: string) => {
    dropZones.current = dropZones.current.filter((z) => z.id !== id);
  };

  const startDrag = (item: Task) => {
    setActiveDragItem(item);
  };

  const endDrag = (dropX: number, dropY: number) => {
    const zone = dropZones.current.find((z) => {
      return (
        dropX >= z.layout.x &&
        dropX <= z.layout.x + z.layout.width &&
        dropY >= z.layout.y &&
        dropY <= z.layout.y + z.layout.height
      );
    });

    if (zone && activeDragItem) {
      zone.callback(activeDragItem);
    }
    setActiveDragItem(null);
    dragX.value = -9999;
    dragY.value = -9999;
  };

  const overlayStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: 200,
      transform: [
        { translateX: dragX.value },
        { translateY: dragY.value },
        { translateX: -100 },
        { translateY: -20 },
        { scale: 1.05 },
      ],
      zIndex: 9999,
      elevation: 9999,
    };
  });

  return (
    <DragDropContext.Provider
      value={{
        activeDragItem,
        startDrag,
        endDrag,
        registerDropZone,
        unregisterDropZone,
        dragX,
        dragY,
      }}
    >
      {children}

      {activeDragItem && (
        <Animated.View style={[overlayStyle, { width: "45%" }]}>
          <TaskCard
            task={activeDragItem}
            onPress={() => {}}
            activeUsers={[]}
            isOverlay={true}
          />
        </Animated.View>
      )}
    </DragDropContext.Provider>
  );
};

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context)
    throw new Error("useDragDrop must be used within DragDropProvider");
  return context;
};
