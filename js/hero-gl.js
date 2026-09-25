// AI WEB hero background — WebGL simplex-noise shader
// Ported (vanilla JS/WebGL, no React/Tailwind/TypeScript — this site has
// none of those) from a supplied "Velaris" reference component. The GLSL
// shaders below are reproduced as given; only the JS host (useEffect →
// plain init function, props → hardcoded config, cn()/JSX → removed) was
// adapted to this site's stack, and the fragment shader gained a
// `u_mouse` uniform + domain warp so the pattern still repels away from
// the cursor — the same magnet-repulsion interaction as every other
// gradient section (js/main.js's initRepelGradient) — instead of the
// original's time-only animation.
// Falls back silently to the static CSS gradient (.intro__art) if WebGL
// is unavailable — see .intro__gl in css/style.css (display:none by
// default, only shown once this script confirms the shader compiled).
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERTEX_SRC =
    'attribute vec2 position;' +
    'varying vec2 vUv;' +
    'void main() {' +
    '  vUv = position * 0.5 + 0.5;' +
    '  gl_Position = vec4(position, 0.0, 1.0);' +
    '}';

  var FRAGMENT_SRC =
    'precision highp float;' +
    'varying vec2 vUv;' +
    'uniform vec2  u_resolution;' +
    'uniform float u_time;' +
    'uniform float u_grain;' +
    'uniform vec3  u_colors[4];' +
    'uniform vec3  u_bg;' +
    'uniform vec2  u_mouse;' +
    'vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }' +
    'float snoise(vec2 v){' +
    '  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);' +
    '  vec2 i  = floor(v + dot(v, C.yy) );' +
    '  vec2 x0 = v -   i + dot(i, C.xx);' +
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);' +
    '  vec4 x12 = x0.xyxy + C.xxzz;' +
    '  x12.xy -= i1;' +
    '  i = mod(i, 289.0);' +
    '  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));' +
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);' +
    '  m = m*m ;' +
    '  m = m*m ;' +
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0;' +
    '  vec3 h = abs(x) - 0.5;' +
    '  vec3 ox = floor(x + 0.5);' +
    '  vec3 a0 = x - ox;' +
    '  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );' +
    '  vec3 g;' +
    '  g.x  = a0.x  * x0.x  + h.x  * x0.y;' +
    '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;' +
    '  return 130.0 * dot(m, g);' +
    '}' +
    'void main() {' +
    '  vec2 uv = vUv;' +
    '  float ratio = u_resolution.x / u_resolution.y;' +
    '  vec2 p = uv - 0.5;' +
    '  p.x *= ratio;' +
    '  float t = u_time * 0.1;' +
    // Magnet-repulsion domain warp: pushes the SAMPLED coordinate away from
    // the (smoothed, section-relative) cursor position within a falloff
    // radius, so the noise pattern itself flees the cursor — the shader
    // equivalent of the CSS blobs' initRepelGradient push.
    '  vec2 toMouse = p - u_mouse;' +
    '  float mDist = length(toMouse);' +
    '  float warpAmt = smoothstep(0.55, 0.0, mDist) * 0.5;' +
    '  vec2 warpedP = p + normalize(toMouse + 1e-4) * warpAmt;' +
    '  float n1 = snoise(warpedP * 0.4 + vec2(t * 0.2, -t * 0.3));' +
    '  float n2 = snoise(warpedP * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);' +
    '  float n3 = snoise(warpedP * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);' +
    '  vec3 col = u_bg;' +
    '  float dist = length(p) * 1.5;' +
    '  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);' +
    '  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);' +
    '  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);' +
    '  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);' +
    '  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);' +
    '  float glow = smoothstep(0.8, 0.0, dist) * 0.3;' +
    '  col += u_colors[1] * glow;' +
    '  col = mix(col * 0.2, col, vignette);' +
    '  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);' +
    '  col += (grain - 0.5) * u_grain * 0.1;' +
    '  gl_FragColor = vec4(col, 1.0);' +
    '}';

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  function initHeroGL() {
    var canvas = document.getElementById('intro-gl');
    var section = document.querySelector('.intro');
    var fallback = document.querySelector('.intro__art');
    if (!canvas || !section) return;

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return; // no WebGL — leave the CSS fallback (.intro__art) visible/interactive

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('hero-gl shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
    var fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('hero-gl link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var locs = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      grain: gl.getUniformLocation(program, 'u_grain'),
      colors: gl.getUniformLocation(program, 'u_colors'),
      bg: gl.getUniformLocation(program, 'u_bg'),
      mouse: gl.getUniformLocation(program, 'u_mouse')
    };

    // Compiled successfully — show the canvas, hide the CSS fallback.
    canvas.style.display = 'block';
    if (fallback) fallback.style.display = 'none';

    var BG = hexToRgb('#08090d');
    // Same 6-hex brand palette used across the site's gradient sections;
    // the shader interface takes exactly 4 colors, so the 4 most visually
    // distinct are used (dropping the two closest-neighbor pastels).
    var COLORS = ['#F45F7A', '#55CEC5', '#D7785D', '#006B70'].map(hexToRgb);
    var flatColors = new Float32Array(COLORS.reduce(function (a, c) { return a.concat(c); }, []));

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(section.clientWidth * dpr));
      var h = Math.max(1, Math.round(section.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    }
    resize();
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(section);
    else window.addEventListener('resize', resize);

    // Mouse tracking, in the shader's own aspect-corrected p-space (p = uv -
    // 0.5, then p.x *= ratio) — same smoothed lerp-toward-cursor pattern as
    // every other gradient section, just feeding a shader uniform instead
    // of a CSS custom property.
    var mouseTarget = [0, 0], mouseCur = [0, 0];
    section.addEventListener('mousemove', function (e) {
      var rect = section.getBoundingClientRect();
      var ratio = rect.width / rect.height;
      var nx = (e.clientX - rect.left) / rect.width - 0.5;
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      mouseTarget[0] = nx * ratio;
      mouseTarget[1] = -ny;
    });
    section.addEventListener('mouseleave', function () {
      mouseTarget[0] = 0;
      mouseTarget[1] = 0;
    });

    function drawFrame(tMs) {
      mouseCur[0] += (mouseTarget[0] - mouseCur[0]) * 0.08;
      mouseCur[1] += (mouseTarget[1] - mouseCur[1]) * 0.08;
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, tMs * 0.001 * 2.0);
      gl.uniform1f(locs.grain, 0.3);
      gl.uniform3f(locs.bg, BG[0], BG[1], BG[2]);
      gl.uniform3fv(locs.colors, flatColors);
      gl.uniform2f(locs.mouse, mouseCur[0], mouseCur[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (reduceMotion) {
      drawFrame(0); // one static frame, no continuous rAF loop
    } else {
      (function loop(t) {
        drawFrame(t);
        requestAnimationFrame(loop);
      })(0);
    }
  }

  initHeroGL();
})();
