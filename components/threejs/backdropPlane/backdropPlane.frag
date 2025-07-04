// Fragment Shader


uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;
// srtuss 2014

vec2 rotate(vec2 p, float a)
{
	return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
}

#define ITS 8

vec2 circuit(vec3 p)
{
	p = mod(p, 2.0) - 1.0;
	float w = 1e38;
	vec3 cut = vec3(1.0, 0.0, 0.0);
	vec3 e1 = vec3(-1.0);
	vec3 e2 = vec3(1.0);
	float rnd = .23;
	float pos, plane, cur;
	float fact = .09;
	float j = 0.0;
	for(int i = 0; i < ITS; i ++)
	{
		pos = mix(dot(e1, cut), dot(e2, cut), (rnd - 0.5) * fact + 0.5);
		plane = dot(p, cut) - pos;
		if(plane > 0.0)
		{
			e1 = mix(e1, vec3(pos), cut);
			rnd = fract(rnd * 9827.5719);
			cut = cut.xyz;
		}
		else
		{
			e2 = mix(e2, vec3(pos), cut);
			rnd = fract(rnd * 15827.5719);
			cut = cut.zxy;
		}
		j += step(rnd, 0.2);
		w = min(w, abs(plane));
	}
	return vec2(j / float(ITS - 1), w);
}

float scene(vec3 p)
{
	vec2 cir = circuit(p);
	return exp(-100.0 * cir.y); //+ pow(cir.y * 1.8 * (sin(p.z * 10.0 + iTime * 5.0 + cir.y * 10.0) * 0.5 + 0.5), 12.0);
}

float nse(float x)
{
    return fract(fract(sin(x * 297.9712) * 90872.2961)*2100.);
}

float nseI(float x)
{
    float fl = floor(x);
    return mix(nse(fl), nse(fl + 1.0), smoothstep(0.0, 1.0, fract(x)));
}

float fbm(float x)
{
    return nseI(x) * 0.5 + nseI(x * 2.0) * 0.25 + nseI(x * 4.0) * 0.425;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec2 suv = uv;
	uv = 2.0 * uv - 1.0;
	uv.x *= iResolution.x / iResolution.y;
  vec3 ro = vec3( 1.,1.,1.);
	vec3 rd = normalize(vec3(uv, 1.4));
	ro.xz = rotate(ro.yz, iTime * .4);
    ro.xy = rotate(ro.xy, iTime * .24);
    //ro.yz = rotate(ro.xz, -iTime * .14);

	//ro.xy = rotate(ro.xy, 0.2);
	//rd.xy = rotate(rd.xy, -iTime * .04);
    	//rd.xy = rotate(rd.xy, iTime * .30);
            //	rd.xy = rotate(rd.xz, -iTime * .40);


	//rd.xy = rotate(rd.xy, 0.2);
	float acc = 0.0;
	vec3 r = ro + rd * (.5);
	for(int i = 0; i < 50; i ++)
	{
		acc += scene(r + nse(r.y) * 0.1);
            r += rd * 0.025;
	}
	vec3 col = pow(vec3(acc * 0.007), vec3(0.5, 0.3, .20) * 4.0) * 3.0;
	//col -= exp(length(suv - sin(iTime)) * -4.5 - 0.52);
    //col = clamp(col, vec3(0.0), vec3(1.0));
    //col *= fbm(iTime * 6.0) * 2.0;
	//col = pow(col, vec3(1.0 / 1.2));
	//col = clamp(col, vec3(0.0), vec3(1.0));
	fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
}