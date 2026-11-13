import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from "react-native-svg";

const W = Dimensions.get("window").width;
const H = Dimensions.get("window").height;

// Wave 1: Back Deep Tide (Wavelength: 360, Amp: 22, Y: 45)
const PATH_WAVE1 =
  "M 0 45 C 64.8 23, 115.2 23, 180.0 45 C 244.8 67, 295.2 67, 360 45 C 424.8 23, 475.2 23, 540.0 45 C 604.8 67, 655.2 67, 720 45 C 784.8 23, 835.2 23, 900.0 45 C 964.8 67, 1015.2 67, 1080 45 C 1144.8 23, 1195.2 23, 1260.0 45 C 1324.8 67, 1375.2 67, 1440 45 L 1440 520 L 0 520 Z";

// Wave 2: Middle Ocean Swell (Wavelength: 300, Amp: 28, Y: 50)
const PATH_WAVE2 =
  "M 0 50 C 54.0 22, 96.0 22, 150.0 50 C 204.0 78, 246.0 78, 300 50 C 354.0 22, 396.0 22, 450.0 50 C 504.0 78, 546.0 78, 600 50 C 654.0 22, 696.0 22, 750.0 50 C 804.0 78, 846.0 78, 900 50 C 954.0 22, 996.0 22, 1050.0 50 C 1104.0 78, 1146.0 78, 1200 50 L 1200 520 L 0 520 Z";

// Wave 3: Front Crest & Surf (Wavelength: 240, Amp: 18, Y: 40)
const PATH_WAVE3 =
  "M 0 40 C 43.2 22, 76.8 22, 120.0 40 C 163.2 58, 196.8 58, 240 40 C 283.2 22, 316.8 22, 360.0 40 C 403.2 58, 436.8 58, 480 40 C 523.2 22, 556.8 22, 600.0 40 C 643.2 58, 676.8 58, 720 40 C 763.2 22, 796.8 22, 840.0 40 C 883.2 58, 916.8 58, 960 40 C 1003.2 22, 1036.8 22, 1080.0 40 C 1123.2 58, 1156.8 58, 1200 40 L 1200 520 L 0 520 Z";

// Elegant Water Wave Crest Emblem
function WaveEmblem({ size = 110 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7DD3FC" />
          <Stop offset="50%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </SvgGradient>
      </Defs>

      {/* Outer water tide crest */}
      <Path
        d="M 16 54 C 26 38, 44 38, 54 52 C 64 66, 78 64, 84 50"
        stroke="url(#waveGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle water wave swell */}
      <Path
        d="M 24 64 C 34 50, 48 50, 58 62 C 66 72, 74 70, 80 60"
        stroke="#38BDF8"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Crest foam droplet */}
      <Circle cx="84" cy="46" r="3.5" fill="#BAE6FD" />
      <Circle cx="80" cy="56" r="2.5" fill="#38BDF8" />
    </Svg>
  );
}

export function Splash({ onDone }) {
  // Horizontal wave roll animations
  const wave1Roll = useRef(new Animated.Value(0)).current;
  const wave2Roll = useRef(new Animated.Value(0)).current;
  const wave3Roll = useRef(new Animated.Value(0)).current;

  // Tidal surge & bobbing animations
  const tideRise = useRef(new Animated.Value(220)).current;
  const tideSwell = useRef(new Animated.Value(0)).current;
  const floatBob = useRef(new Animated.Value(0)).current;

  // Ripple expand animation
  const ripple = useRef(new Animated.Value(0)).current;

  // Content entrance & screen fade out
  const logoPop = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Continuous Wave Horizontal Rolling (infinite loops)
    const animWave1 = Animated.loop(
      Animated.timing(wave1Roll, {
        toValue: -360,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const animWave2 = Animated.loop(
      Animated.timing(wave2Roll, {
        toValue: 300,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const animWave3 = Animated.loop(
      Animated.timing(wave3Roll, {
        toValue: -240,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 2. Vertical Tidal Swell (water breathing up & down)
    const animSwell = Animated.loop(
      Animated.sequence([
        Animated.timing(tideSwell, {
          toValue: -14,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tideSwell, {
          toValue: 4,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Float Bobbing for emblem (like a buoy on water tides)
    const animBob = Animated.loop(
      Animated.sequence([
        Animated.timing(floatBob, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatBob, {
          toValue: 6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Circular Water Ripple Loop
    const animRipple = Animated.loop(
      Animated.sequence([
        Animated.timing(ripple, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ripple, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );

    // Start wave and swell animations
    animWave1.start();
    animWave2.start();
    animWave3.start();
    animSwell.start();
    animBob.start();
    animRipple.start();

    // 5. Incoming Tidal Surge entrance
    Animated.spring(tideRise, {
      toValue: 0,
      tension: 25,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // 6. Emblem & Text reveal
    Animated.spring(logoPop, {
      toValue: 1,
      friction: 6,
      tension: 60,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(textFade, {
      toValue: 1,
      duration: 700,
      delay: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 7. Splash exit transition
    const timer = setTimeout(() => {
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 450,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => onDone && onDone());
    }, 2600);

    return () => {
      clearTimeout(timer);
      animWave1.stop();
      animWave2.stop();
      animWave3.stop();
      animSwell.stop();
      animBob.stop();
      animRipple.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emblemScale = logoPop.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.8] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.4, 0] });

  return (
    <Animated.View style={[st.container, { opacity: screenFade }]} pointerEvents="none">
      {/* Deep Ocean Midnight Gradient Background */}
      <LinearGradient colors={["#030712", "#0A192F", "#082F49"]} style={StyleSheet.absoluteFill}>
        {/* Floating Water Ripple Rings */}
        <View style={st.centerContent}>
          <Animated.View
            style={[
              st.rippleCircle,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />

          {/* Bobbing Emblem & Wordmark */}
          <Animated.View
            style={{
              alignItems: "center",
              transform: [{ translateY: floatBob }, { scale: emblemScale }],
              opacity: logoPop,
            }}
          >
            <View style={st.emblemGlow}>
              <WaveEmblem size={105} />
            </View>

            <Animated.View
              style={{
                alignItems: "center",
                opacity: textFade,
                transform: [
                  {
                    translateY: textFade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                  },
                ],
              }}
            >
              <Text style={st.brandTitle}>Wavify</Text>
              <Text style={st.brandTagline}>WAVES OF MUSIC</Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Rolling Water Tide Layers */}
        <Animated.View
          style={[
            st.tideContainer,
            {
              transform: [{ translateY: Animated.add(tideRise, tideSwell) }],
            },
          ]}
        >
          {/* Layer 1: Back Ocean Deep Tide */}
          <Animated.View
            style={[
              st.waveLayer,
              {
                bottom: 30,
                opacity: 0.35,
                transform: [{ translateX: wave1Roll }],
              },
            ]}
          >
            <Svg width={1440} height={420} viewBox="0 0 1440 500">
              <Defs>
                <SvgGradient id="backTideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#0284C7" />
                  <Stop offset="100%" stopColor="#082F49" />
                </SvgGradient>
              </Defs>
              <Path d={PATH_WAVE1} fill="url(#backTideGrad)" />
            </Svg>
          </Animated.View>

          {/* Layer 2: Mid Swell Tide (rolling counter-phase) */}
          <Animated.View
            style={[
              st.waveLayer,
              {
                bottom: 12,
                opacity: 0.55,
                transform: [{ translateX: wave2Roll }],
              },
            ]}
          >
            <Svg width={1200} height={420} viewBox="0 0 1200 500">
              <Defs>
                <SvgGradient id="midTideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#38BDF8" />
                  <Stop offset="100%" stopColor="#0369A1" />
                </SvgGradient>
              </Defs>
              <Path d={PATH_WAVE2} fill="url(#midTideGrad)" />
            </Svg>
          </Animated.View>

          {/* Layer 3: Front Crest & Tidal Foam */}
          <Animated.View
            style={[
              st.waveLayer,
              {
                bottom: 0,
                opacity: 0.85,
                transform: [{ translateX: wave3Roll }],
              },
            ]}
          >
            <Svg width={1200} height={420} viewBox="0 0 1200 500">
              <Defs>
                <SvgGradient id="frontTideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#7DD3FC" />
                  <Stop offset="40%" stopColor="#38BDF8" />
                  <Stop offset="100%" stopColor="#0284C7" />
                </SvgGradient>
              </Defs>
              <Path d={PATH_WAVE3} fill="url(#frontTideGrad)" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 110,
  },
  rippleCircle: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: "#38BDF8",
  },
  emblemGlow: {
    shadowColor: "#38BDF8",
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 8,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginTop: 10,
    textShadowColor: "rgba(56, 189, 248, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  brandTagline: {
    color: "#7DD3FC",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 4,
    marginTop: 6,
    opacity: 0.9,
  },
  tideContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -60,
    height: 380,
  },
  waveLayer: {
    position: "absolute",
    left: 0,
    width: 1500,
    height: 420,
  },
});
