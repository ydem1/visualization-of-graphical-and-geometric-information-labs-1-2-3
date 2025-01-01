function get(name) {
    return document.getElementById(name).value;
}

function fx(u, t, a, c, h) {
    return (a + t * Math.cos(h) + c * (t ** 2) * Math.sin(h)) * Math.cos(u);
}

function fy(u, t, a, c, h) {
   return (a + t * Math.cos(h) + c * (t ** 2) * Math.sin(h)) * Math.sin(u);
}

function fz(t, c, h) {
   return -t * Math.sin(h) + c * (t ** 2) * Math.cos(h);
}

function partialFx_u(u, t, a, c, h) {
    const base = a + t * Math.cos(h) + c * (t ** 2) * Math.sin(h);
    return -base * Math.sin(u);
}

function partialFy_u(u, t, a, c, h) {
    const base = a + t * Math.cos(h) + c * (t ** 2) * Math.sin(h);
    return base * Math.cos(u);
}

function partialFz_u() {
    return 0;
}

function partialFx_t(u, t, a, c, h) {
    const base = Math.cos(h) + 2 * c * t * Math.sin(h);
    return Math.cos(u) * base;
}

function partialFy_t(u, t, a, c, h) {
    const base = Math.cos(h) + 2 * c * t * Math.sin(h);
    return Math.sin(u) * base;
}

function partialFz_t(t, c, h) {
    return -Math.sin(h) + 2 * c * t * Math.cos(h);
}

function calculateHeight(vMin, vMax, c, h) {
    const criticalV = Math.sin(h) / (2 * c * Math.cos(h));

    const values = [
        -vMin * Math.sin(h) + c * (vMin ** 2) * Math.cos(h), 
        -vMax * Math.sin(h) + c * (vMax ** 2) * Math.cos(h), 
    ];

    if (criticalV >= vMin && criticalV <= vMax) {
        values.push(-criticalV * Math.sin(h) + c * (criticalV ** 2) * Math.cos(h)); 
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return Math.abs(maxValue - minValue);
}

function normalizeUV(value, min, max) {
    return (value - min) / (max - min);
}

function generateSurface(a, c, h) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const tangents = [];
    const uvs = [];

    const uSteps = 150;
    const vSteps = 150;

    const uMin = 0.0;
    const uMax = Math.PI * 2;
    const vMin = -Math.PI / 2.0;
    const vMax = Math.PI / 2.0;

    const du = (uMax - uMin) / uSteps;
    const dv = (vMax - vMin) / vSteps;
    
    const halfHeight = calculateHeight(vMin, vMax, c, h) / 2.0;

    for (let i = 0; i <= uSteps; i++) {
        const u = uMin + i * du;
        for (let j = 0; j <= vSteps; j++) {
            const v = vMin + j * dv;

            const x = fx(u, v, a, c, h);
            const y = fy(u, v, a, c, h);
            const z = fz(v, c, h) - halfHeight;

            vertices.push(x, y, z);

            const tangent_u = m4.normalize([
                partialFx_u(u, v, a, c, h),
                partialFy_u(u, v, a, c, h),
                partialFz_u()
            ], [1, 0, 0]);

            const tangent_v = m4.normalize([
                partialFx_t(u, v, a, c, h),
                partialFy_t(u, v, a, c, h),
                partialFz_t(v, c, h)
            ], []);

            normals.push(...m4.normalize(m4.cross(tangent_u, tangent_v, []), [0, 0, 1]));
            tangents.push(...tangent_u);
            uvs.push(normalizeUV(u, uMin, uMax), normalizeUV(v, vMin, vMax));
        }
    }

    for (let i = 0; i < uSteps; i++) {
        for (let j = 0; j < vSteps; j++) {
            const topLeft = i * (vSteps + 1) + j;
            const topRight = i * (vSteps + 1) + (j + 1);
            const bottomLeft = (i + 1) * (vSteps + 1) + j;
            const bottomRight = (i + 1) * (vSteps + 1) + (j + 1);

            indices.push(topLeft, bottomLeft, bottomRight);
            indices.push(topLeft, bottomRight, topRight);
        }
    }

    return { vertices, normals, tangents, uvs, indices };
}

export default function Model(gl, shProgram) {
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTangentBuffer = gl.createBuffer();
    this.iUVBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();

    this.idTextureDiffuse = LoadTexture(gl, "./textures/diffuse.jpg");
    this.idTextureNormal = LoadTexture(gl, "./textures/normal.jpg");
    this.idTextureSpecular = LoadTexture(gl, "./textures/specular.jpg");

    this.point = [0.5, 0.5];
    this.uvBuffer = [];
    this.indexBuffer = [];

    this.count = 0;

    this.BufferData = function(vertices, normals, tangents, uvs, indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iUVBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.uvBuffer = uvs;
        this.indexBuffer = indices;

        this.count = indices.length;
    };

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTangent);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iUVBuffer);
        gl.vertexAttribPointer(shProgram.iAttribUV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribUV);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureDiffuse);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureNormal);
        
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureSpecular);

        gl.uniform2fv(shProgram.iPoint, this.point);
        gl.uniform2fv(shProgram.iScale, [get('SU'), get('SV')]);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.CreateSurfaceData = function() {
        const a = parseFloat(get('A'));
        const c = parseFloat(get('C'));
        const phi = parseFloat(get('PHI'))

        const { vertices, normals, tangents, uvs, indices } = generateSurface(a, c, phi);
        this.BufferData(vertices, normals, tangents, uvs, indices);
    }
}
