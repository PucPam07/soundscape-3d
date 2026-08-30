export const PARTICLE_COUNT = 6500;

export const particleCloudVertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uAudioLevel;
  uniform float uPixelRatio;

  attribute vec3 aRandom;
  attribute float aScale;
  attribute float aFreq;
  attribute float aSpeed;

  varying float vFreq;
  varying float vNoise;
  varying vec3 vColor;
  varying float vGlow;
  varying float vDepthFade;

  void main() {
    vFreq = aFreq;
    vNoise = aRandom.x;

    // 1. Orbital 3D Rotation and Swirling motion
    float speed = aSpeed * 0.15 + 0.05;
    float currentAngle = uTime * speed + aRandom.y * 6.2831853;
    float cosA = cos(currentAngle);
    float sinA = sin(currentAngle);

    // Rotate position around Y axis
    vec3 basePos = position;
    vec3 rotPos = vec3(
      basePos.x * cosA - basePos.z * sinA,
      basePos.y,
      basePos.x * sinA + basePos.z * cosA
    );

    // 2. Audio Responsiveness (Bass breathing pulse, Mid ripple, Treble sparkle)
    float baseDist = length(rotPos);
    float pulse = uBass * 0.45 + uAudioLevel * 0.25;
    
    // Wave ripple along radius and latitude
    float ripple = sin(uTime * 2.5 + baseDist * 3.0 + aRandom.z * 6.28) * 0.12 * (1.0 + uMid * 1.5);
    float trebleShimmer = sin(uTime * 5.0 + aRandom.x * 12.0) * 0.08 * uTreble;

    // Expanded position with audio dynamics
    vec3 pos = rotPos * (1.0 + pulse + ripple) + aRandom * trebleShimmer;

    // Gentle orbital vortex drift along Y
    pos.y += sin(uTime * 0.8 + baseDist * 1.5 + aRandom.y * 3.14) * 0.18 * (1.0 + uBass * 0.5);

    // 3. Color Palette: Elegant Ice Cyan -> Diamond White
    vec3 deepSlate = vec3(0.15, 0.45, 0.75); // Deep Luminous Arctic Blue
    vec3 iceCyan   = vec3(0.48, 0.85, 1.00); // Brilliant Ice Cyan
    vec3 diamond   = vec3(1.00, 1.00, 1.00); // Pure Diamond White

    float colorMix = smoothstep(0.0, 0.7, aFreq * 0.6 + uAudioLevel * 0.4 + aRandom.x * 0.2);
    vec3 baseColor = mix(deepSlate, iceCyan, colorMix);

    // Highlight high energy and bass peaks with pure white
    float peakGlow = smoothstep(0.5, 0.95, uBass * 0.7 + aFreq * 0.3 + aRandom.z * 0.2);
    baseColor = mix(baseColor, diamond, peakGlow);

    vColor = baseColor;
    vGlow = pulse + peakGlow * 0.5;

    // 4. Model-View projection and Depth Fade
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Camera depth fade for volumetric atmosphere
    vDepthFade = smoothstep(-1.0, -12.0, mvPosition.z);

    // Dynamic point size (responsive to pixel ratio, audio, and camera distance)
    float pDist = max(0.5, -mvPosition.z);
    float baseSize = aScale * (22.0 + uBass * 18.0 + uAudioLevel * 14.0 + peakGlow * 12.0);
    gl_PointSize = clamp((baseSize * uPixelRatio) / pDist, 1.5, 32.0);
  }
`;

export const particleCloudFragmentShader = `
  precision highp float;

  varying float vFreq;
  varying float vNoise;
  varying vec3 vColor;
  varying float vGlow;
  varying float vDepthFade;

  uniform float uTime;

  void main() {
    // Distance from center of point sprite [0, 0.5]
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Soft gaussian-like falloff disc with luminous core
    float mainDisc = smoothstep(0.48, 0.10, d);
    float starlightCore = smoothstep(0.12, 0.0, d);

    float alpha = mainDisc * 0.65 + starlightCore * 0.55;
    alpha *= vDepthFade;

    // Delicate starlight twinkle
    float twinkle = 0.8 + 0.2 * sin(uTime * 3.0 + vNoise * 31.415);
    alpha *= twinkle;

    vec3 finalColor = vColor * (1.0 + vGlow * 0.4);

    gl_FragColor = vec4(finalColor, alpha);
    if (gl_FragColor.a < 0.015) discard;
  }
`;

