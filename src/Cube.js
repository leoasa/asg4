class Cube {
    constructor() {
        this.type = 'cube';
        // this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        // this.size = 5.0;
        // this.segments = 10;
        this.matrix = new Matrix4();
        this.textureNum = -2;
    }
    render() {
        // var xy = this.position;
        var rgba = this.color;
        // var size = this.size;
        // var xy = g_points[i];
        // var rgba = g_colors[i];
        
        gl.uniform1i(u_textureChoice, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform4f(u_FragColor, rgba[0] *.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        //Front of cube
        drawTriangle3DUV( [0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0] );
        drawTriangle3DUV( [0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1] );

        // Top face
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 0,1]);
        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);

        // Back face
        drawTriangle3DUV([1,0,1, 1,1,1, 0,0,1], [1,0, 1,1, 0,0]);
        drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

        // Bottom face
        drawTriangle3DUV([0,0,0, 1,0,1, 1,0,0], [0,0, 1,1, 0,1]);
        drawTriangle3DUV([0,0,0, 0,0,1, 1,0,1], [0,0, 0,1, 1,1]);

        // Right face
        drawTriangle3DUV([1,0,0, 1,0,1, 1,1,1], [0,0, 0,1, 1,1]);
        drawTriangle3DUV([1,1,1, 1,1,0, 1,0,0], [1,1, 0,1, 0,0]);

        // Left face
        drawTriangle3DUV([0,0,0, 0,1,1, 0,1,0], [0,0, 1,1, 0,1]);
        drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 0,1, 1,1]);

        // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    }
}