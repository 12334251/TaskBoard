import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const BoardSkeleton = () => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  const SkeletonItem = ({
    width,
    height,
    style,
  }: {
    width?: number | string;
    height: number;
    style?: any;
  }) => (
    <Animated.View
      style={[{ opacity, backgroundColor: "#E1E9EE", width, height }, style]}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SkeletonItem width={150} height={34} style={{ borderRadius: 8 }} />
        <SkeletonItem width={60} height={20} style={{ borderRadius: 4 }} />
      </View>

      <View style={styles.inputContainer}>
        <SkeletonItem height={50} style={{ flex: 1, borderRadius: 10 }} />
        <SkeletonItem width={80} height={50} style={{ borderRadius: 10 }} />
      </View>

      <View style={styles.list}>
        {[1, 2, 3, 4].map((key) => (
          <View key={key} style={styles.card}>
            <SkeletonItem
              width="60%"
              height={20}
              style={{ marginBottom: 10, borderRadius: 4 }}
            />
            <SkeletonItem width="30%" height={14} style={{ borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
});
