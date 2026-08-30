export const PARTICLE_COUNT = 5500;
export const DATA_SIZE = 256;

export const particleCloudVertexShader = `
  precision mediump float;

  uniform float uTime;
  uniform float uData[256];
  uniform int uParticleCount;
  uniform float uIntensity;

  attribute float idx;
  varying float vFreq;
  varying float vNoise;
  varying vec3 vColor;
  varying float vGlow;
  varying float vDepthFade;

  void main() {
    float id = idx;
    float t = id / float(uParticleCount);

    float angle = t * 6.2831853 * 2.0 + uTime * 0.15;
    float swirl = 0.45 * sin(uTime * 0.3 + t * 10.0);

    float freq = uData[int(mod(id, 256.0))] / 255.0;
    float radius = 2.7 + sin(uTime * 0.5 + id) * 0.25 + freq * (0.8 + 0.5 * sin(uTime * 0.8 + t * 4.0));
    float theta = angle + swirl;

    float rnd = fract(sin(id * 1.13) * 43758.5453);
    float phi = acos(2.0 * rnd - 1.0);

    vec3 pos = vec3(
      radius * sin(phi) * cos(theta),
      radius * sin(phi) * sin(theta),
      radius * cos(phi)
    );

    float chaos = sin(uTime + id * 0.001) * 0.35 + cos(uTime * 0.7 + id * 0.0006) * 0.25;
    pos += vec3(
      chaos * freq * 0.7 * sin(uTime * 1.1 + id * 0.03),
      chaos * freq * 0.7 * cos(uTime * 0.8 + id * 0.03),
      chaos * freq * 0.5 * sin(uTime * 0.9 - id * 0.02)
    );

    float pulse = smoothstep(0.65, 0.95, freq) * 1.0;
    pos *= 1.0 + pulse * 0.4;

    vFreq = freq;
    vNoise = chaos;
    vGlow = pulse;

    // --- MINIMALIST DIAMOND & ICE PALETTE ---
    vec3 deepSlate = vec3(0.25, 0.55, 0.85); // Luminous Ice Blue
    vec3 iceCyan   = vec3(0.65, 0.90, 1.00); // Pale Cyan
    vec3 diamond   = vec3(1.00, 1.00, 1.00); // Diamond White

    vec3 baseColor = mix(deepSlate, iceCyan, smoothstep(0.0, 0.6, freq + t * 0.3));
    baseColor = mix(baseColor, diamond, smoothstep(0.5, 1.0, freq));

    vColor = baseColor;

    // Depth Fade
    float camZ = (modelViewMatrix * vec4(pos, 1.0)).z;
    vDepthFade = smoothstep(-1.5, -8.0, camZ);

    // Dynamic point size
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = abs(gl_Position.w);
    float baseSize = 34.0 + 26.0 * freq + 10.0 * pulse;
    gl_PointSize = clamp(baseSize / dist, 2.0, 24.0);
  }
`;

export const particleCloudFragmentShader = `
  precision mediump float;

  varying float vFreq;
  varying float vNoise;
  varying vec3 vColor;
  varying float vGlow;
  varying float vDepthFade;

  uniform float uTime;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float mainDisc = smoothstep(0.48, 0.12, d);
    float center   = smoothstep(0.12, 0.02, d);

    float a = mainDisc * (0.35 + vFreq * 0.8) + center * 0.25;
    a *= 0.95 * vDepthFade;

    // Gentle twinkle
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.5 + vNoise * 8.0);
    a *= twinkle;

    vec3 color = vColor * 1.15;

    gl_FragColor = vec4(color, a);
    if (gl_FragColor.a < 0.02) discard;
  }
`;
