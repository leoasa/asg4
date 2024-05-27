class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        //this.textureNum = -2;
    }
    render() {
        var rgba = this.color;
        
        //gl.uniform1i(u_textureChoice, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        const vertices = [
            // Front face
            0, 0, 0,  1, 1, 0,  1, 0, 0,  
            0, 0, 0,  0, 1, 0,  1, 1, 0,  
            // Top face
            0, 1, 0,  1, 1, 1,  1, 1, 0,  
            0, 1, 0,  0, 1, 1,  1, 1, 1,  
            // Back face
            1, 0, 1,  1, 1, 1,  0, 0, 1,  
            0, 0, 1,  1, 1, 1,  0, 1, 1,  
            // Bottom face
            0, 0, 0,  1, 0, 1,  1, 0, 0,  
            0, 0, 0,  0, 0, 1,  1, 0, 1,  
            // Right face
            1, 0, 0,  1, 0, 1,  1, 1, 1,  
            1, 1, 1,  1, 1, 0,  1, 0, 0,  
            // Left face
            0, 0, 0,  0, 1, 1,  0, 1, 0,  
            0, 0, 0,  0, 0, 1,  0, 1, 1
        ];

        const uvs = [
            // UVs for the front face
            0, 0,  1, 1,  1, 0,
            0, 0,  0, 1,  1, 1,
            // UVs for the top face
            0, 0,  1, 1,  0, 1,
            0, 0,  0, 1,  1, 1,
            // UVs for the back face
            1, 0,  1, 1,  0, 0,
            0, 0,  1, 1,  0, 1,
            // UVs for the bottom face
            0, 0,  1, 1,  0, 1,
            0, 0,  0, 1,  1, 1,
            // UVs for the right face
            0, 0,  0, 1,  1, 1,
            1, 1,  0, 1,  0, 0,
            // UVs for the left face
            0, 0,  1, 1,  0, 1,
            0, 0,  0, 1,  1, 1
        ];

        const normals = [
            // Normals for the front face
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            // Normals for the top face
            0, 1, 0,  0, 1, 0,  0, 1, 0,
            0, 1, 0,  0, 1, 0,  0, 1, 0,
            // Normals for the back face
            0, 0, -1,  0, 0, -1,  0, 0, -1,
            0, 0, -1,  0, 0, -1,  0, 0, -1,
            // Normals for the bottom face
            0, -1, 0,  0, -1, 0,  0, -1, 0,
            0, -1, 0,  0, -1, 0,  0, -1, 0,
            // Normals for the right face
            1, 0, 0,  1, 0, 0,  1, 0, 0,
            1, 0, 0,  1, 0, 0,  1, 0, 0,
            // Normals for the left face
            -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
            -1, 0, 0,  -1, 0, 0,  -1, 0, 0
        ];

        // Draw all triangles at once
        drawTriangle3DUV(vertices, uvs, normals);
    }
}