function fx(u, t, a, c, h) {
     return (a + t * Math.cos(h) + c * (t ** 2) * Math.sin(h)) * Math.cos(u);
}

function fy(u, t, a, c, h) {
    return (a + t * Math.cos(h) + c * (t ** 2) * Math.sin(h)) * Math.sin(u);
}

function fz(t, c, h) {
    return -t * Math.sin(h) + c * (t ** 2) * Math.cos(h);
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

function generateSurface(a, c, h) {
    const vertices = [];
    const indices = [];

    const uSteps = 100;
    const vSteps = 100;

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
        }
    }

    for (let i = 0; i <= uSteps; i++) {
        for (let j = 0; j <= vSteps; j++) {
            const currentIndex = i * (vSteps + 1) + j;
            const prevUIndex = (i - 1) * (vSteps + 1) + j;
            const prevVIndex = i * (vSteps + 1) + (j - 1);

            if(i > 0) {
                indices.push(currentIndex, prevUIndex);
            }

            if(j > 0) {
                indices.push(currentIndex, prevVIndex);
            }
        }
    }
    
    return { vertices, indices };
}


function Model() {
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.count = indices.length;
    };

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);

        gl.drawElements(gl.LINES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.CreateSurfaceData = function() {
        function get(name) {
            return document.getElementById(name).value;
        }

        const a = parseFloat(get('A'));
        const c = parseFloat(get('C'));
        const phi = parseFloat(get('PHI'))
        
        const { vertices, indices } = generateSurface(a, c, phi);
        this.BufferData(vertices, indices);
    }
}
