BasicGame.Game = function (game) {
  this.game;      //  a reference to the currently running game (Phaser.Game)
  this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
  this.camera;    //  a reference to the game camera (Phaser.Camera)
  this.cache;     //  the game cache (Phaser.Cache)
  this.input;     //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
  this.load;      //  for preloading assets (Phaser.Loader)
  this.math;      //  lots of useful common math operations (Phaser.Math)
  this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
  this.stage;     //  the game stage (Phaser.Stage)
  this.time;      //  the clock (Phaser.Time)
  this.tweens;    //  the tween manager (Phaser.TweenManager)
  this.state;     //  the state manager (Phaser.StateManager)
  this.world;     //  the game world (Phaser.World)
  this.particles; //  the particle manager (Phaser.Particles)
  this.physics;   //  the physics manager (Phaser.Physics)
  this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)

  this.floor = null;
  this.wallsBitmap = null;
  this.player = null;
  this.cursors = null;

  // Line of sight vars
  this.markGraphics = null;

  // Line of sight constants
  this.lightAngle = Math.PI / 3;
  this.numberOfRays = 30;
  this.rayLength = 200;
};

BasicGame.Game.prototype = {
  create: function () {
    this.floor = this.add.sprite(0, 0, "floor");
    this.wallsBitmap = this.make.bitmapData(640, 480);
    this.wallsBitmap.draw("walls");
    this.wallsBitmap.update();
    this.add.sprite(0, 0, this.wallsBitmap);

    this.maskGraphics = this.game.add.graphics(0, 0);
    this.worldDimmer = this.game.add.graphics(0, 0);

    this.player = this.add.sprite(80, 80, "player");
    this.player.anchor.setTo(0.5, 0.5);

    this.cursors = this.input.keyboard.createCursorKeys();
  },

  update: function () {
    var xSpeed = 0;
    var ySpeed = 0;

    if (this.cursors.up.isDown) {
      ySpeed -= 2;
    }

    if (this.cursors.down.isDown) {
      ySpeed += 2;
    }

    if (this.cursors.left.isDown) {
      xSpeed -= 2;
    }

    if (this.cursors.right.isDown) {
      xSpeed += 2;
    }

    let color = this.wallsBitmap.getPixel32(this.player.x + xSpeed + this.player.width / 2, this.player.y + ySpeed + this.player.height / 2);
    color += this.wallsBitmap.getPixel32(this.player.x + xSpeed - this.player.width / 2, this.player.y + ySpeed + this.player.height / 2);
    color += this.wallsBitmap.getPixel32(this.player.x + xSpeed - this.player.width / 2, this.player.y + ySpeed - this.player.height / 2);
    color += this.wallsBitmap.getPixel32(this.player.x + xSpeed + this.player.width / 2, this.player.y + ySpeed - this.player.height / 2);

    if (color == 0) {
      this.player.x += xSpeed;
      this.player.y += ySpeed;
    }

    const mouseAngle = Math.atan2(this.player.y - this.input.y, this.player.x - this.input.x);
    this.worldDimmer.clear();
    this.worldDimmer.beginFill(0x000, 0.6);
    this.worldDimmer.drawRect(0, 0, 800, 640);
    this.worldDimmer.endFill();

    this.maskGraphics.clear();
    this.maskGraphics.lineStyle(2, 0xffffff, 0.3);
    this.maskGraphics.beginFill(0xffffff, 0.3);

    this.maskGraphics.moveTo(this.player.x, this.player.y);

    for (var i = 0; i < this.numberOfRays; i++) {
      var rayAngle = mouseAngle - (this.lightAngle / 2) + (this.lightAngle / this.numberOfRays) * i;
      var lastX = this.player.x;
      var lastY = this.player.y;
      for (var j = 1; j <= this.rayLength; j += 1) {
        var landingX = Math.round(this.player.x - (2 * j) * Math.cos(rayAngle));
        var landingY = Math.round(this.player.y - (2 * j) * Math.sin(rayAngle));
        if (this.wallsBitmap.getPixel32(landingX, landingY) == 0) {
	  lastX = landingX;
	  lastY = landingY;	
	} else {
	  this.maskGraphics.lineTo(lastX, lastY);
	  break;
	}
      }
      this.maskGraphics.lineTo(lastX, lastY);
    }
    this.maskGraphics.lineTo(this.player.x, this.player.y); 
    this.maskGraphics.endFill();
  },

  quitGame: function (pointer) {
    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');
  }
};
