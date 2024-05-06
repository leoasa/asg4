class Cylinder {
    constructor() {
        this.type = 'cylinder';
        this.color = [1.0, 1.0, 1.0, 1.0]; // RGBA color
        this.size = 10.0; // Size of the cylinder
        this.segments = 10; // Number of segments in the cylinder's base
        this.height = this.size / 200.0; // Height of the cylinder
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;
        var d = this.size / 400.0; // Diameter to radius conversion for circle calculations
        var angleStep = 360 / this.segments; // Degree step per segment

        // Set the uniform color for all parts of the cylinder
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Set the model matrix for transformations
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


        let bottomCenter = [0, 0, 0];
        let topCenter = [0, 0, this.height];        
        // Iterate through the height and angle to compute vertices for the side triangles
        for (var y = 0; y < this.height; y += this.height) { // Iterate from base to top
            for (var angle = 0; angle < 360; angle += angleStep) {
                let angle1 = angle * Math.PI / 180;
                let angle2 = (angle + angleStep) * Math.PI / 180;
                let vec1 = [Math.cos(angle1) * d, Math.sin(angle1) * d, y];
                let vec2 = [Math.cos(angle2) * d, Math.sin(angle2) * d, y];
                let vec3 = [Math.cos(angle1) * d, Math.sin(angle1) * d, y + this.height];
                let vec4 = [Math.cos(angle2) * d, Math.sin(angle2) * d, y + this.height];

                // Convert angles to UV coordinates
                let u1 = angle / 360;
                let u2 = (angle + angleStep) / 360;
                let v1 = y / this.height;
                let v2 = (y + this.height) / this.height;

                // Sides
                drawTriangle3DUV([vec1[0], vec1[1], vec1[2], vec2[0], vec2[1], vec2[2], vec3[0], vec3[1], vec3[2]], [u1, v1, u2, v1, u1, v2]);
                drawTriangle3DUV([vec3[0], vec3[1], vec3[2], vec2[0], vec2[1], vec2[2], vec4[0], vec4[1], vec4[2]], [u1, v2, u2, v1, u2, v2]);

                // Bottom cap
                drawTriangle3DUV([bottomCenter[0], bottomCenter[1], bottomCenter[2], vec1[0], vec1[1], vec1[2], vec2[0], vec2[1], vec2[2]], [0.5, 0.5, u1, 0, u2, 0]);

                // Top cap
                drawTriangle3DUV([topCenter[0], topCenter[1], topCenter[2], vec3[0], vec3[1], vec3[2], vec4[0], vec4[1], vec4[2]], [0.5, 0.5, u1, 1, u2, 1]);
            }
        }
    }
}
