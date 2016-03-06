Player = function (x, y, game) {
  this.game = game;

  this.player = this.game.add.sprite(x, y, 'player');
  this.player.anchor.setTo(0.5, 0.5);
  this.game.physics.arcade.enable(this.player);

  this.health = 100;
};

Player.prototype = {
  update: function (cursors) {
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
  },

  hit: function () {
    this.health -= 20; 
  }
};
