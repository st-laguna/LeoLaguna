export function initWaterShader() {
    const canvas = document.getElementById("water-shader") as HTMLCanvasElement | null;
    if (!canvas) return () => {};

    const gl = canvas.getContext("webgl");
    if (!gl) return () => {};

    let frameId = 0;
    let disposed = false;
    const mouse = { x: 0, y: 0 };

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = canvas.height - (e.clientY - rect.top);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    const vert = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const frag = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;

        vec3 color1 = vec3(0.463, 0.729, 0.655);
        vec3 color2 = vec3(0.396, 0.624, 0.565);
        vec3 color3 = vec3(0.067, 0.071, 0.078);
        vec3 color4 = vec3(0.067, 0.071, 0.078);

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
            );
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p = p * 1.5 + vec2(1.7, 9.2);
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            uv.y = pow(uv.y, 1.8);
            uv.x = (uv.x - 0.5) * (1.0 + (1.0 - uv.y) * 1.5) + 0.5;

            vec2 p = uv * 1.2;
            float t = u_time * 0.2;

            vec2 mouseUV = u_mouse / u_resolution;
            float mouseDist = length(uv - mouseUV);
            float mouseWave = smoothstep(0.3, 0.0, mouseDist) * 0.3;

            float n1 = fbm(p * 0.8 + vec2(t * 0.2 - p.x * 0.2, t * 0.25));
            float n2 = fbm(p * 0.8 + vec2(-t * 0.2 - p.x * 0.1, t * 0.3) + n1 * 0.4);
            float n3 = fbm((p + vec2(-t * 0.4, 0.0)) * 1.0 + n2 * 0.5 + mouseWave);

            float blend1 = smoothstep(0.35, 0.45, n3);
            float blend2 = smoothstep(0.45, 0.55, n3);
            float blend3 = smoothstep(0.55, 0.65, n3);

            vec3 col = mix(color4, color1, blend1);
            col = mix(col, color3, blend2);
            col = mix(col, color2, blend3);

            col = mix(color4, col, smoothstep(0.0, 0.3, uv.y));

            float grain = hash(uv * (u_resolution * 0.3) + u_time * 50.0) * 0.04;
            col += grain - 0.02;

            float dotSize = 7.0;
            vec2 dotUV = fract(gl_FragCoord.xy / dotSize) - 0.5;
            float brightness = dot(col, vec3(0.299, 0.587, 0.114));
            float midRange = smoothstep(0.0, 0.2, brightness) * (1.0 - smoothstep(0.5, 0.7, brightness));
            float radius = 0.4 * midRange;
            float dot_ = smoothstep(radius, radius - 0.1, length(dotUV));
            vec3 darkColor = vec3(0.067, 0.071, 0.078);

            col = mix(col, darkColor, dot_ * midRange * 0.5);
            gl_FragColor = vec4(col, 1.0);
        }
    `;

    const compile = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    };

    const vertexShader = compile(gl.VERTEX_SHADER, vert);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, frag);

    if (!vertexShader || !fragmentShader) {
        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }

    const program = gl.createProgram();

    if (!program) {
        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
        };
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]),
        gl.STATIC_DRAW,
    );

    const pos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    const start = performance.now();

    const render = () => {
        if (disposed) return;

        const t = (performance.now() - start) / 1000;

        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, t);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        disposed = true;
        cancelAnimationFrame(frameId);

        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);

        gl.deleteBuffer(buffer);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
    };
}