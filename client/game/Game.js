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


  // Player objects
  this.player = null;
  this.opponents = null;

  // Keys
  this.cursors = null;
  this.wasdKeys = null;

  // Line of sight vars
  this.markGraphics = null;
  this.aimLine = null;

  // Line of sight constants
  this.lightAngle = Math.PI / 2;
  this.numberOfRays = 40;
  this.rayLength = 300;

  // Shooting values
  this.fireRate = 200;
  this.nextFire = 0;
  this.bullets = null;

  // Explosion
  this.explosionGroup = null;

  // Terrain
  this.map = null;
  this.backgroundlayer = null;
  this.blockedLayer = null;

  // Status
  this.RUNNING = 0;
  this.OVER = 1;
  this.status = this.RUNNING;
};

BasicGame.Game.prototype = {
  create: function () {
    // Setup physics
    this.physics.startSystem(Phaser.Physics.ARCADE);

    // Setup tilemap
    this.map = this.game.add.tilemap('level1');
    console.log(this.map.tileWidth);
//    this.map.addTilesetImage('commando', 'gameTiles');
    this.map.addTilesetImage('tilee', 'gameTiles1');
    this.map.addTilesetImage('TileC', 'gameTiles2');
    this.map.addTilesetImage('walls1', 'gameTiles3');

    this.backgroundlayer = this.map.createLayer('backgroundLayer');
    this.blockedLayer = this.map.createLayer('blockedLayer');
    this.map.setCollisionBetween(1, 2000, true, this.blockedLayer);

    this.backgroundlayer.resizeWorld();

    // Aim
    this.maskGraphics = this.game.add.graphics(0, 0);
    this.worldDimmer = this.game.add.graphics(0, 0);
    this.aimLine = this.game.add.graphics(0, 0);

    // Setup bullets
    this.bullets = this.game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;

    this.bullets.createMultiple(50, 'bullet');
    this.bullets.setAll('checkWorldBounds', true);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.children.forEach(function (bullet) {
      bullet.anchor.setTo(0.5);
    });

    // Setup player
//    const result = this.findObjectsByType('player', this.map, 'players');
    this.player = new Player(80, 80, this.game, true, 1);
//    this.player = this.add.sprite(80, 80, 'player');
//    this.player = this.add.sprite(result[0].x, result[0].y, 'player');
//    this.player.anchor.setTo(0.5, 0.5);
//    this.game.physics.arcade.enable(this.player);

    this.game.camera.follow(this.player.player);

    this.opponents = new Array();
    for (let i = 0; i < 1; i++) {
      this.opponents.push(new Player(230, 230, this.game, false, 0));
    }

    // Setup explosion
    this.explosionGroup = this.game.add.group();

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
    if (this.status == this.OVER) {
      const txt = this.game.add.bitmapText(40, 40, "pixel", "GAME OVER");
      return;
    }

    // Do collision
    this.game.physics.arcade.collide(this.player.player, this.blockedLayer);

    this.game.physics.arcade.collide(this.bullets, this.blockedLayer, function(bullet, ground) {
      this.getExplosion(bullet.x, bullet.y);
      bullet.kill();
    }, null, this);

    var self = this;
    let deadCount = 0;
    this.opponents.forEach(function(opponent) {
      if (opponent.dead()) {
        deadCount++;
      }

      opponent.setAlpha(0.4);
      self.game.physics.arcade.collide(opponent.player, self.blockedLayer);

      var opponentOuter = opponent;

      self.game.physics.arcade.overlap(self.bullets, opponent.player, function(opponent, bullet) {
        opponentOuter.hit();
        self.getExplosion(bullet.x, bullet.y);
        bullet.kill();
      });

      opponent.update(self.cursors);
    });

    if (deadCount == this.opponents.length) {
      this.gameOver();
    }

    this.player.update(this.wasdKeys);

    if (this.input.activePointer.leftButton.isDown) {
      this.shoot(this.player.player);
    }

    this.setupLineOfSight();

    // Orient player
    const mouseAngle = Math.atan2(this.player.player.y - this.input.y, this.player.player.x - this.input.x);
    this.player.player.angle = (mouseAngle * 180) / Math.PI - 90;
  },

  setupLineOfSight: function() {
    const mouseAngle = Math.atan2(this.player.player.y - this.input.y, this.player.player.x - this.input.x);
    this.worldDimmer.clear();
    this.worldDimmer.beginFill(0x000, 0.6);
    this.worldDimmer.drawRect(0, 0, 800, 640);
    this.worldDimmer.endFill();

    this.maskGraphics.clear();
    this.maskGraphics.lineStyle(2, 0xffffff, 0.3);
    this.maskGraphics.beginFill(0xffffff, 0.3);

    this.maskGraphics.moveTo(this.player.player.x, this.player.player.y);

    for (var i = 0; i < this.numberOfRays; i++) {
      var rayAngle = mouseAngle - (this.lightAngle / 2) + (this.lightAngle / this.numberOfRays) * i;
      var lastX = this.player.player.x;
      var lastY = this.player.player.y;
      for (let j = 1; j <= this.rayLength; j += 1) {
        let landingX = Math.round(this.player.player.x - (2 * j) * Math.cos(rayAngle));
        let landingY = Math.round(this.player.player.y - (2 * j) * Math.sin(rayAngle));

        if (this.blockedLayer.getTiles(landingX, landingY, 2, 2, true).length == 0) {
	  lastX = landingX;
	  lastY = landingY;	
	} else {
	  this.maskGraphics.lineTo(lastX, lastY);
	  break;
	}

        this.opponents.forEach(function(opponent) {
          if (opponent.player.body.hitTest(landingX, landingY)) {
            opponent.setAlpha(1);
          }
        }, this);
      }
      this.maskGraphics.lineTo(lastX, lastY);
    }
    this.maskGraphics.lineTo(this.player.player.x, this.player.player.y); 
    this.maskGraphics.endFill();

    this.aimLine.clear();
    this.aimLine.lineStyle(2, 0xFF2121, 1);
    const sX = this.player.player.x;
    const sY = this.player.player.y;
    let finalRay = 0;

    for (let j = 1; j <= this.rayLength; j += 1) {
      let landingX = Math.round(this.player.player.x - (2 * j) * Math.cos(mouseAngle));
      let landingY = Math.round(this.player.player.y - (2 * j) * Math.sin(mouseAngle));

      if (this.blockedLayer.getTiles(landingX, landingY, 2, 2, true).length == 0) {
        finalRay = j;
      } else {
	break;
      }
    }

    this.aimLine.moveTo(sX, sY);
    for (let j = 1; j <= finalRay; j += 1) {
      let landingX = Math.round(this.player.player.x - (2 * j) * Math.cos(mouseAngle));
      let landingY = Math.round(this.player.player.y - (2 * j) * Math.sin(mouseAngle));

      if (j % 6 > 2) {
        this.aimLine.lineTo(landingX, landingY);
      } else {
        this.aimLine.moveTo(landingX, landingY);
      }
    }
    this.aimLine.endFill();
  },

  shoot: function(player) {
    if (this.time.now > this.nextFire && this.bullets.countDead() > 0)
    {
      this.nextFire = this.time.now + this.fireRate;

      const mouseAngle = Math.atan2(player.y - this.input.y, player.x - this.input.x);
      var bullet = this.bullets.getFirstDead();
      bullet.reset(player.x, player.y);
      bullet.rotation = mouseAngle + Math.PI / 2;

      this.physics.arcade.moveToPointer(bullet, 1000);
    }
  },

  getExplosion: function (x, y) {
    var explosion = this.explosionGroup.getFirstDead();

    if (explosion === null) {
      explosion = this.game.add.sprite(0, 0, 'explosion');
      explosion.anchor.setTo(0.5, 0.5);
      explosion.alpha = 0.6;

      var animation = explosion.animations.add('boom', [0,1,2], 60, false);
      animation.killOnComplete = true;

      this.explosionGroup.add(explosion);
    }

    explosion.revive();

    explosion.x = x;
    explosion.y = y;

    explosion.angle = this.game.rnd.integerInRange(0, 360);

    explosion.animations.play('boom');
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

  gameOver: function () {
    this.status = this.OVER;
  },

  quitGame: function (pointer) {
    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');
  }
};
