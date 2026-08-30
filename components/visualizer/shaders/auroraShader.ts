export const TRAIL_STEPS = 4;

export const auroraVertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMorphT;
  uniform float uBass;
  uniform float uMid;
  uniform float uAudioLevel;
  uniform int uTrailSteps;

  attribute float trailStep;
  attribute vec3 aPosSphere;
  attribute vec3 aPosTorus;
  attribute vec3 aPosCube;
  attribute vec3 aRand;

  varying float vFreq;
  varying float vNoise;
  varying float vTrailStep;
  varying float vRand;

  void main() {
    float trailT = 1.0 - trailStep / float(uTrailSteps);
    float trailOffset = uTime - trailStep * 0.07 - aRand.x * 0.03;

    // Shape Morph Interpolation (Sphere -> Torus -> Cube -> Sphere)
    float morphId = mod(floor(uMorphT), 3.0);
    float morphFrac = fract(uMorphT);

    vec3 posA, posB;
    if (morphId < 0.5) {
      posA = aPosSphere;
      posB = aPosTorus;
    } else if (morphId < 1.5) {
      posA = aPosTorus;
      posB = aPosCube;
    } else {
      posA = aPosCube;
      posB = aPosSphere;
    }
    vec3 pos = mix(posA, posB, morphFrac);

    // Dynamic undulation along trail and time
    float undulation = sin(trailOffset * 2.0 + aRand.y * 6.28) * 0.15;
    pos += normalize(pos + vec3(0.001)) * undulation;

    // Audio Responsiveness
    float freq = uBass * 0.7 + uAudioLevel * 0.3;
    float chaos = 1.0 + 2.0 * uBass * abs(sin(trailOffset * 3.0 + aRand.x * 25.0));
    pos *= (1.0 + 0.25 * freq * chaos);

    if (uBass > 0.6) {
      pos += vec3(
        sin(trailOffset * 8.0 + aRand.x * 16.0) * uBass * 0.6,
        cos(trailOffset * 7.0 + aRand.y * 15.0) * uBass * 0.6,
        sin(trailOffset * 6.0 + aRand.z * 17.0) * uBass * 0.6
      );
    }

    vFreq = freq;
    vNoise = chaos;
    vTrailStep = trailT;
    vRand = aRand.x;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(0.5, -mvPosition.z);
    float baseSize = 24.0 + 20.0 * freq + 8.0 * aRand.z + 8.0 * (1.0 - trailT);
    gl_PointSize = clamp((baseSize * uPixelRatio) / dist, 2.0, 28.0);
  }
`;

export const auroraFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uGlowColor;
  uniform float uAlphaBase;
  uniform float uAlphaGlow;
  uniform float uAudioLevel;

  varying float vFreq;
  varying float vNoise;
  varying float vTrailStep;
  varying float vRand;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float edge = smoothstep(0.48, 0.15, d);
    float center = smoothstep(0.12, 0.04, d);

    float a = edge * 0.85 + center * 0.25;

    // Elegant monochrome gradient (Ice Cyan -> Diamond White based on audio frequency)
    vec3 color = mix(uColorA, uColorB, 0.3 + 0.65 * vFreq);

    float glow = smoothstep(0.38, 0.06, d);
    vec3 finalColor = mix(color, uGlowColor, glow * 0.4);
    finalColor *= (1.0 + 0.5 * uAudioLevel);

    float trailAlpha = uAlphaBase * vTrailStep * vTrailStep + uAlphaGlow * glow * (0.5 + 0.6 * vFreq) * vTrailStep;

    float twinkle = 0.8 + 0.2 * sin(uTime * 2.2 + vRand * 8.3 + vTrailStep * 2.6 + vNoise * 5.0);
    float totalAlpha = a * trailAlpha * clamp(twinkle, 0.70, 1.1) * (0.8 + 0.85 * uAudioLevel);

    gl_FragColor = vec4(finalColor, totalAlpha);
    if (gl_FragColor.a < 0.015) discard;
  }
`;

