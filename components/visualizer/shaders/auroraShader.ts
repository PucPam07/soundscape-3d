export const TRAIL_STEPS = 4;

export const auroraVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uData[2048];
  uniform int uParticleCount;
  uniform float uMorphT;
  uniform int uTrailSteps;
  attribute float trailStep;
  varying float vFreq;
  varying float vNoise;
  varying float vTrailStep;
  varying float vRand;

  void main() {
    float i = float(gl_VertexID);
    float count = float(uParticleCount);

    float t = i / count;
    float rand1 = fract(sin(i * 127.1) * 43758.5453);
    float rand2 = fract(sin(i * 137.1) * 43758.5453);
    float rand3 = fract(sin(i * 149.7) * 43758.5453);

    float trailT = 1.0 - trailStep / float(uTrailSteps);
    float trailOffset = uTime - trailStep * 0.07 - rand1 * 0.03;

    // 1. Sphere Shape Morph Target
    float thetaS = rand1 * 6.2831853;
    float phiS = acos(2.0 * rand2 - 1.0);
    float rS = 3.1 + 0.36 * sin(trailOffset + rand1 * 6.28);
    float xS = rS * sin(phiS) * cos(thetaS);
    float yS = rS * sin(phiS) * sin(thetaS);
    float zS = rS * cos(phiS);

    // 2. Torus Shape Morph Target
    float u = rand1 * 6.2831853;
    float v = rand2 * 6.2831853;
    float R = 2.15;
    float r = 1.0 + 0.28 * sin(trailOffset + rand2 * 5.23);
    float xT = (R + r * cos(v)) * cos(u);
    float yT = (R + r * cos(v)) * sin(u);
    float zT = r * sin(v);

    // 3. Cube Shape Morph Target
    float side = 3.0;
    float xC = (rand1 - 0.5) * side * 2.0;
    float yC = (rand2 - 0.5) * side * 2.0;
    float zC = (rand3 - 0.5) * side * 2.0;

    // Shape Interpolation
    float morphId = mod(floor(uMorphT), 3.0);
    float morphFrac = fract(uMorphT);

    vec3 posA, posB;
    if (morphId < 0.5) {
      posA = vec3(xS, yS, zS);
      posB = vec3(xT, yT, zT);
    } else if (morphId < 1.5) {
      posA = vec3(xT, yT, zT);
      posB = vec3(xC, yC, zC);
    } else {
      posA = vec3(xC, yC, zC);
      posB = vec3(xS, yS, zS);
    }
    vec3 pos = mix(posA, posB, morphFrac);

    // Audio Responsiveness & Dynamic Chaos
    float freq = uData[int(mod(i, 256.0))] / 255.0;
    float chaos = 1.2 + 2.5 * freq * abs(sin(trailOffset * 3.0 + rand1 * 25.0));
    pos *= (1.0 + 0.2 * freq * chaos);

    if (freq > 0.70) {
      pos += vec3(
        sin(trailOffset * 12.0 + rand1 * 16.0) * freq * 1.2,
        cos(trailOffset * 10.0 + rand2 * 15.0) * freq * 1.2,
        sin(trailOffset * 7.1 + rand3 * 17.0) * freq * 1.2
      );
    }

    vFreq = freq;
    vNoise = chaos;
    vTrailStep = trailT;
    vRand = rand1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = abs(gl_Position.w);
    float baseSize = 30.0 + 25.5 * freq + 7.5 * rand3 + 9.0 * (1.0 - trailT);
    gl_PointSize = clamp(baseSize / dist, 2.5, 24.0);
  }
`;

export const auroraFragmentShader = `
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
    if (gl_FragColor.a < 0.02) discard;
  }
`;
