class Camera{
    constructor(){
        this.fov = 90;
        this.eye = new Vector3([0,0,5]);
        this.at  = new Vector3([0,0,-100]);
        this.up  = new Vector3([0,1,0]);
        this.viewMat = new Matrix4();
        this.projMat = new Matrix4();

        this.viewMat.setLookAt(
            this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
            this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
            this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)


        this.viewMat.rotate(180, 0, 1, 0);
        this.projMat.setPerspective(50, canvas.width/canvas.height, 0.1, 1000);
    }
 
    moveForward(speed){
        var f = new Vector3([0,0,0]);
        f.set(this.at);
        f.sub(this.eye);
        f = f.normalize();
        this.at = this.at.add(f.mul(speed));
        this.eye = this.eye.add(f.mul(speed));
        this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)

        this.viewMat.rotate(180, 0, 1, 0);
    }
 
    moveBack(speed){
        var f = new Vector3([0,0,0]);
        f.set(this.at);
        f.sub(this.eye);
        f = f.normalize();
        this.at = this.at.sub(f.mul(speed));
        this.eye = this.eye.sub(f.mul(speed));
        this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)

        this.viewMat.rotate(180, 0, 1, 0);

    }
 
    moveLeft(speed){
        var f = new Vector3([0,0,0]);
        f.set(this.eye);
        f.sub(this.at);
        var s = new Vector3([0,0,0]);
        s.set(f);
        s = Vector3.cross(f, this.up);
        s = s.normalize();
        this.at = this.at.add(s.mul(speed));
        this.eye = this.eye.add(s.mul(speed));
        this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
 
        this.viewMat.rotate(180, 0, 1, 0);
    }
 
    moveRight(speed){
        var f = new Vector3([0,0,0]);
        f.set(this.at);
        f.sub(this.eye);
        var s = new Vector3([0,0,0]);
        s.set(f);
        s = Vector3.cross(f, this.up);
        s = s.normalize();
        this.at = this.at.add(s.mul(speed));
        this.eye = this.eye.add(s.mul(speed));
        this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
 
        this.viewMat.rotate(180, 0, 1, 0);
    }
 
    panLeft(degrees){
       var f = new Vector3([0,0,0]);
       f.set(this.at);
       f.sub(this.eye);
       var rotationMatrix = new Matrix4();
       rotationMatrix.setRotate(degrees, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
       var f_prime = new Vector3([0,0,0]);
       f_prime = rotationMatrix.multiplyVector3(f);
       var tempEye = new Vector3([0,0,0]);
       tempEye.set(this.eye);
       this.at = tempEye.add(f_prime);

       this.viewMat.setLookAt(
          this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
          this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
          this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
          
       this.viewMat.rotate(180, 0, 1, 0);
    }
 
    panRight(degrees){
       var f = new Vector3([0,0,0]);
       f.set(this.at);
       f.sub(this.eye);
       var rotationMatrix = new Matrix4();
       rotationMatrix.setRotate(-degrees, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
       var f_prime = new Vector3([0,0,0]);
       f_prime = rotationMatrix.multiplyVector3(f);
       var tempEye = new Vector3([0,0,0]);
       tempEye.set(this.eye);
       this.at = tempEye.add(f_prime);

       this.viewMat.setLookAt(
          this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
          this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
          this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)

       this.viewMat.rotate(180, 0, 1, 0);
    }

    getLookVector() {
        return new Vector3(this.at.elements).sub(this.eye).normalize();
    }

    getPosition() {
        return this.eye;
    }

 }