import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polyline, Circle } from "react-native-svg";

const CYAN = "#4BEAF6";

// one piece: W flowing into an EKG pulse — same geometry as assets/logo.svg
// viewBox hugs the glyph's bounding box so it can never look cropped or off-center
function Mark({ width }) {
  const h = Math.round(width * (216 / 438));
  return (
    <Svg width={width} height={h} viewBox="61 197 438 216">
      <Polyline
        points="84,220 158,390 232,262 306,390 380,234"
        stroke="#FFFFFF"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Polyline
        points="382,238 404,284 426,220 452,326 470,262 480,262"
        stroke="#FFFFFF"
        strokeWidth="19"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="488" cy="262" r="11" fill="#FFFFFF" />
    </Svg>
  );
}

export function Splash({ onDone }) {
  const w = Dimensions.get("window").width;
  const size = Math.min(w * 0.6, 310);

  const pop = useRef(new Animated.Value(0)).current; // mark entrance
  const beat = useRef(new Animated.Value(0)).current; // heartbeat lift
  const word = useRef(new Animated.Value(0)).current; // wordmark rise
  const fade = useRef(new Animated.Value(1)).current; // whole-screen exit

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
    Animated.timing(word, { toValue: 1, duration: 650, delay: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

    // heartbeat: soft double-thump, loops a few times like a live monitor
    const hb = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(beat, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 0, duration: 190, useNativeDriver: true }),
        Animated.delay(90),
        Animated.timing(beat, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.delay(520),
      ]),
      { iterations: 2 }
    );
    hb.start();

    const done = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 420, useNativeDriver: true }).start(() => onDone && onDone());
    }, 2500);
    return () => {
      clearTimeout(done);
      hb.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const lift = beat.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <View style={st.fill}>
      <LinearGradient colors={["#1D50FF", "#0B38EF"]} style={st.fill}>
        <Animated.View style={{ opacity: fade, width: "100%" }}>
          <View style={st.center} pointerEvents="none">
            <Animated.View style={{ opacity: pop, transform: [{ translateY: lift }, { scale }] }}>
              <Mark width={size} />
            </Animated.View>
            <Animated.View
              style={{
                opacity: word,
                transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              }}
            >
              <Text style={[st.word, { fontSize: Math.round(size * 0.2) }]}>Wavify</Text>
            </Animated.View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "18%",
  },
  word: {
    color: CYAN,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 18,
  },
});
