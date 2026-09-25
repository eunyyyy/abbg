// AI WEB hero background — WebGL simplex-noise shader
// Velaris simplex-noise background, adapted to this site's vanilla JS stack
// (no React/Tailwind/TypeScript — this site has none of those). Time-based
// flow only — no cursor tracking (this section is exempt from the
// mouse-repel treatment used elsewhere; see js/main.js's initRepelGradient
// comment). Falls back silently to the static CSS gradient (.intro__art)
// if WebGL is unavailable — see .intro__gl in css/style.css (display:none
// by default, only shown once this script confirms the shader compiled).
(function () {
  'use strict';

  var VERTEX_SRC = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
  var FRAGMENT_SRC = `
precision highp float;
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[4];
uniform vec3  u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;

  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;

  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

  float glow = (1.0 - smoothstep(0.0, 0.8, dist)) * 0.3;
  col += u_colors[1] * glow;

  col = mix(col * 0.2, col, vignette);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

  var section = document.querySelector('.intro');
  var canvas = document.getElementById('intro-gl');
  var fallback = document.querySelector('.intro__art');
  if (!section || !canvas) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return; // no WebGL — leave the CSS fallback (.intro__art) visible

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Background shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vertex = compile(gl.VERTEX_SHADER, VERTEX_SRC);
  var fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return;
  }
  var program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return;
  }
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  function uniform(name) { return gl.getUniformLocation(program, name); }
  var locs = {
    resolution: uniform('u_resolution'), time: uniform('u_time'),
    grain: uniform('u_grain'), colors: uniform('u_colors[0]'),
    bg: uniform('u_bg')
  };
  function hexToRgb(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16) / 255; });
  }
  // Same 6-hex brand palette used across the site's gradient sections; the
  // shader interface takes exactly 4 colors, so the 4 most visually
  // distinct are used (dropping the two closest-neighbor pastels).
  var bg = hexToRgb('#08090d');
  var palette = ['#F45F7A', '#55CEC5', '#D7785D', '#006B70'];
  gl.uniform3fv(locs.bg, bg);
  gl.uniform3fv(locs.colors, new Float32Array(palette.flatMap(hexToRgb)));
  gl.uniform1f(locs.grain, 0.3);

  var raf = null, previous = null, elapsed = 0;
  var visible = true, contextLost = false;

  function draw() {
    gl.uniform2f(locs.resolution, canvas.width, canvas.height);
    gl.uniform1f(locs.time, elapsed * 2.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    previous = null;
  }
  function frame(now) {
    raf = null;
    if (!visible || document.hidden || motion.matches || contextLost) return;
    var dt = previous === null ? 1 / 60 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += dt;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf === null && visible && !document.hidden && !motion.matches && !contextLost) {
      raf = requestAnimationFrame(frame);
    }
  }
  function resize() {
    if (contextLost) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(section.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(section.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }
  function onMotion() {
    stop();
    if (!contextLost) draw();
    start();
  }
  document.addEventListener('visibilitychange', onVisibility);
  motion.addEventListener('change', onMotion);
  var resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(section);
  var intersectionObserver = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else stop();
  });
  intersectionObserver.observe(section);

  // Reveal only after a full frame; keep the original CSS art on GPU failure.
  resize();
  canvas.style.display = 'block';
  if (fallback) fallback.style.display = 'none';
  canvas.addEventListener('webglcontextlost', function () {
    contextLost = true;
    stop();
    canvas.style.display = 'none';
    if (fallback) fallback.style.display = '';
  });
  start();
})();
