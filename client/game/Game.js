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

  // Objects
  this.floor = null;
  this.wallsBitmap = null;
  this.player = null;

  // Keys
  this.cursors = null;
  this.wasdKeys = null;

  // Line of sight vars
  this.markGraphics = null;

  // Line of sight constants
  this.lightAngle = Math.PI / 3;
  this.numberOfRays = 30;
  this.rayLength = 200;

  // Terrain
  this.map = null;
};

BasicGame.Game.prototype = {
  create: function () {
    // Setup physics
    this.physics.startSystem(Phaser.Physics.ARCADE);

    // Setup tilemap
    this.map = this.game.add.tilemap('level1');
    console.log(this.map.tileWidth);
    this.map.addTilesetImage('commando', 'gameTiles');

    this.backgroundlayer = this.map.createLayer('backgroundLayer');
    this.blockedLayer = this.map.createLayer('blockedLayer');

    this.map.setCollisionBetween(1, 2000, true, 'blockedLayer');

    this.backgroundlayer.resizeWorld();

/*    this.floor = this.add.sprite(0, 0, "floor");
    this.wallsBitmap = this.make.bitmapData(640, 480);
    this.wallsBitmap.draw("walls");
    this.wallsBitmap.update();
    this.add.sprite(0, 0, this.wallsBitmap);*/

    this.maskGraphics = this.game.add.graphics(0, 0);
    this.worldDimmer = this.game.add.graphics(0, 0);

    // Setup player
//    const result = this.findObjectsByType('player', this.map, 'players');
    this.player = this.add.sprite(80, 80, 'player');
//    this.player = this.add.sprite(result[0].x, result[0].y, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.player);

    this.game.camera.follow(this.player);

    // Input setup
    this.input.mouse.capture = true;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = { 
      up: this.input.keyboard.addKey(Phaser.Keyboard.W),
      down: this.input.keyboard.addKey(Phaser.Keyboard.S),
      left: this.input.keyboard.addKey(Phaser.Keyboard.A),
      right: this.input.keyboard.addKey(Phaser.Keyboard.D)
    };
  },

  update: function () {
    // Do collision
    this.game.physics.arcade.collide(this.player, this.blockedLayer);

    this.player.body.velocity.x = 0;

    if (this.cursors.up.isDown || this.wasdKeys.up.isDown) {
      if (this.player.body.velocity.y == 0)
        this.player.body.velocity.y -= 50;
    } else if (this.cursors.down.isDown || this.wasdKeys.down.isDown) {
      if (this.player.body.velocity.y == 0)
        this.player.body.velocity.y += 50;
    } else {
      this.player.body.velocity.y = 0;
    }

    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      this.player.body.velocity.x -= 50;
    } else if(this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      this.player.body.velocity.x += 50;
    }

    /* legacy code

     var xSpeed = 0;
    var ySpeed = 0;

    if (this.cursors.up.isDown || this.wasdKeys.up.isDown) {
      ySpeed -= 2;
    }

    if (this.cursors.down.isDown || this.wasdKeys.down.isDown) {
      ySpeed += 2;
    }

    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      xSpeed -= 2;
    }

    if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      xSpeed += 2;
    }

    let color = this.wallsBitmap.getPixel32(this.player.x + xSpeed + this.player.width / 2, this.player.y + ySpeed + this.player.height / 2);
    color += this.wallsBitmap.getPixel32(this.player.x + xSpeed - this.player.width / 2, this.player.y + ySpeed + this.player.height / 2);
    color += this.wallsBitmap.getPixel32(this.player.x + xSpeed - this.player.width / 2, this.player.y + ySpeed - this.player.height / 2);
    color += this.wallsBitmap.getPixel32(this.player.x + xSpeed + this.player.width / 2, this.player.y + ySpeed - this.player.height / 2);

    if (color == 0) {
      this.player.x += xSpeed;
      this.player.y += ySpeed;
    }*/


    if (this.input.activePointer.leftButton.isDown) {
      this.shoot();
    }

    this.setupLineOfSight();


    // Orient player
    const mouseAngle = Math.atan2(this.player.y - this.input.y, this.player.x - this.input.x);
    this.player.angle = (mouseAngle * 180) / Math.PI - 90;
  },

  setupLineOfSight: function() {
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
        if (true){//this.wallsBitmap.getPixel32(landingX, landingY) == 0) {
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

  shoot: function() {
    if (this.time.now > this.nextFire && this.bullets.countDead() > 0)
    {
      this.nextFire = this.time.now + this.fireRate;

      var bullet = this.bullets.getFirstDead();
      bullet.reset(this.player.x - 8, this.plyer.y - 8);

      this.physics.arcade.moveToPointer(bullet, 300);
    }
  },

  findObjectsByType: function(type, map, layer) {
    var result = new Array();
    map.objects[layer].forEach(function(element) {
      if(element.properties.type === type) {
        element.y -= map.tileHeight;
        result.push(element);
      }      
    });
    return result;
  },

  quitGame: function (pointer) {
    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');
  }
};
