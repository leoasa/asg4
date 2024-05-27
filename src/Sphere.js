class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.verts32 = new Float32Array([]);
        //this.textureNum = -2;
    }
    render() {
        var rgba = this.color;
        
        //gl.uniform1i(u_textureChoice, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        var d = Math.PI / 10;
        var dd = Math.PI / 10;

        for (var t = 0; t < Math.PI; t += d) {
            for (var r = 0; r < (2 * Math.PI); r += d) {
                var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
                var p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
                var p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
                var p4 = [Math.sin(t + dd) * Math.cos(r + dd), Math.sin(t + dd) * Math.sin(r + dd), Math.cos(t + dd)];
        
                var uv1 = [t/Math.PI, r/(2*Math.PI)];
                var uv2 = [(t+dd)/Math.PI, r/(2*Math.PI)];
                var uv3 = [t/Math.PI, (r+dd)/(2*Math.PI)];
                var uv4 = [(t+dd)/Math.PI, (r+dd)/(2*Math.PI)];

                var v = [];
                var uv = [];
                v = v.concat(p1); 
                uv = uv.concat(uv1);
                v = v.concat(p2); 
                uv = uv.concat(uv2);
                v = v.concat(p4); 
                uv = uv.concat(uv4);
                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                drawTriangle3DUV(v, uv, v);
        
                v = []; 
                uv = [];
                v = v.concat(p1); 
                uv = uv.concat(uv1);
                v = v.concat(p4); 
                uv = uv.concat(uv4);
                v = v.concat(p3); 
                uv = uv.concat(uv3);
                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                drawTriangle3DUV(v, uv, v);
            }
        }
        
    }
}