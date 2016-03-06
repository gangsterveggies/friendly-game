Player = function (x, y, game, healthVisible, alpha = 0) {
  this.game = game;

  this.player = this.game.add.sprite(x, y, 'player');
  this.player.anchor.setTo(0.5, 0.5);
  this.game.physics.arcade.enable(this.player);
  this.player.animations.add('walk', [0, 1, 2], 10, true);

  this.player.alpha = alpha;

  this.healthVisible = healthVisible;
  this.healthBar = this.game.add.graphics(0, 0);

  this.health = 100;
};

Player.prototype = {
  update: function (cursors, signal = 0) {
    this.player.body.velocity.x = 0;

    if (cursors.up.isDown) {
      if (this.player.body.velocity.y == 0)
        this.player.body.velocity.y -= 150;
    } else if (cursors.down.isDown) {
      if (this.player.body.velocity.y == 0)
        this.player.body.velocity.y += 150;
    } else {
      this.player.body.velocity.y = 0;
    }

    if (cursors.left.isDown) {
      this.player.body.velocity.x -= 150;
    } else if (cursors.right.isDown) {
      this.player.body.velocity.x += 150;
    }

    if (Math.abs(this.player.body.velocity.x) + Math.abs(this.player.body.velocity.y) > 0) {
      this.player.animations.play("walk");
    } else {
      this.player.animations.stop();
    }

    if (this.healthVisible) {
      let signal = 1;
      if (this.game.input.y > this.player.y) {
        signal = -1;
      }

      let perc = this.health / 100 * this.player.width;

      this.healthBar.clear();
      this.healthBar.lineStyle(4, 0x00D326, 0.4);
      this.healthBar.moveTo(this.player.x - this.player.width / 2, this.player.y + signal * (this.player.height / 2 + 10));
      this.healthBar.lineTo(this.player.x + this.player.width / 2 - (this.player.width - perc), this.player.y + signal * (this.player.height / 2 + 10));

      this.healthBar.lineStyle(4, 0xFF0000, 0.4);
      this.healthBar.moveTo(this.player.x - this.player.width / 2 + perc, this.player.y + signal * (this.player.height / 2 + 10));
      this.healthBar.lineTo(this.player.x + this.player.width / 2, this.player.y + signal * (this.player.height / 2 + 10));
      this.healthBar.endFill();
    }
  },

  hit: function () {
    this.health -= 20;
  },

  dead: function () {
    return this.health <= 0;
  },

  setAlpha: function (alpha) {
    this.player.alpha = alpha;
  }
};
