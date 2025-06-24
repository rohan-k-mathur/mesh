// Fragment Shader

uniform float iTime;
uniform vec2 iResolution;

varying vec2 vUv;

#define PI 3.14159265359

vec2 rotate(vec2 p, float a) {
    return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
}

float rand(float n) {
    return fract(sin(n) * 43758.5453123);
}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(591.32, 391.32))));
}

float rand(vec3 n) {
    return fract(sin(dot(n, vec3(591.32, 391.32, 623.54))));
}

vec2 rand2(in vec2 p) {
    return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
}

const float voronoiRandK = 0.9;

vec3 voronoi3(in vec2 x, out vec4 cellCenters) {
    vec2 p = ceil(x);
    vec2 f = fract(x);

    vec2 i1 = vec2(0.0);
    vec2 i2 = vec2(0.0);
    vec3 res = vec3(12.0);
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 b = vec2(i, j);
            vec2 r = vec2(b) - f + rand2(p + b) * voronoiRandK;

            float d = (abs(r.x) + abs(r.y));

            if (d < res.x) {
                res.z = res.y;
                res.y = res.x;
                res.x = d;
                i2 = i1;
                i1 = p + b;
            } else if (d < res.y) {
                res.z = res.y;
                res.y = d;
                i2 = p + b;
            } else if (d < res.z) {
                res.z = d;
            }
        }
    }
    cellCenters = vec4(i1, i2);
    return res;
}

float cubicPulse(float c, float w, float x) {
    x = abs(x - c);
    if (x > w) return 0.0;
    x /= w;
    return 1.0 - x * x * (3.0 - 2.0 * x);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord / iResolution.xy - 0.5) * 2.0;
    vec2 suv = uv;
    uv.x *= iResolution.x / iResolution.y;

    uv = rotate(uv, cos(iTime * 0.040));
    uv.x += iTime * 0.04;

    float scale = 4.0;
    float width = 0.1;
    vec4 cellCenters;
    vec3 vr = voronoi3(uv * scale + 20.0, cellCenters);
    float d = vr.y - vr.x;
    if (vr.z - vr.y < width && vr.y - vr.x < width) d = max(width - (vr.z - vr.y), d);
    vec2 cellHashes = vec2(rand(cellCenters.xy), rand(cellCenters.zw));
    float wire = cubicPulse(width, 0.06, d);

    float lightX = (rotate(uv, PI / 8.0).x + iTime * 0.5) * 5.0;
    float lightHash1 = rand(floor(lightX));
    float lightValue1 = fract(lightX);
    lightX = (rotate(uv, PI * 5.0 / 8.0).x + iTime * 0.2) * 5.0;
    float lightHash2 = rand(floor(lightX) + 0.5);
    float lightValue2 = fract(lightX);
    lightX = (rotate(uv, PI * 9.0 / 8.0).x + iTime * 0.2) * 5.0;
    float lightHash3 = rand(floor(lightX) + 0.5);
    float lightValue3 = fract(lightX);
    lightX = (rotate(uv, PI * 13.0 / 8.0).x + iTime * 0.2) * 5.0;
    float lightHash4 = rand(floor(lightX) + 0.5);
    float lightValue4 = fract(lightX);
    float light = 0.0;
    float lightFrequency = 0.000075;
    if (rand(vec3(cellHashes.xy, lightHash1)) < lightFrequency) light = wire * cubicPulse(0.5, 0.25, lightValue1) * 3.0;
    if (rand(vec3(cellHashes.xy, lightHash2)) < lightFrequency) light += wire * cubicPulse(0.5, 0.25, lightValue2) * 3.0;
    if (rand(vec3(cellHashes.xy, lightHash3)) < lightFrequency) light += wire * cubicPulse(0.5, 0.25, lightValue3) * 3.0;
    if (rand(vec3(cellHashes.xy, lightHash4)) < lightFrequency) light += wire * cubicPulse(0.5, 0.25, lightValue4) * 3.0;

    if ((cellHashes.x - cellHashes.y) > 0.0) {
        float w = cubicPulse(width - 0.1, 0.06, d);
        wire += w;
    }

   
    
    //  background wire layer 2
	scale *=.1;
	vec3 vr3 = voronoi3(uv * scale + 60.0, cellCenters);
	d = vr3.y - vr3.x;
	if (vr3.z - vr3.y < width && vr3.y - vr3.x < width)    //connections between cell corners
		d = max(width - (vr3.z - vr3.y), d);
	cellHashes = vec2(rand(cellCenters.xy), rand(cellCenters.zw));
	float backWire2 = cubicPulse(width, 0.06, d);
	if ((cellHashes.x - cellHashes.y) > 0.0)  {
		float w = cubicPulse(width-0.5, 0.06, d);
		backWire2 += w;
	}
	wire = max(wire, backWire2 * .2);



	//  apply light
	wire = wire * 0.8 + light;
	vec3 col = clamp(vec3(0.24, 0.48, .80) * wire, vec3(0.), vec3(1.));
	col *= 0.99;

	fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}

